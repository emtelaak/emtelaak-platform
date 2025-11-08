/**
 * Permission Testing Utilities
 * Helper functions for testing granular permission enforcement
 */

import { getDb } from "../../server/db";
import { users, permissions, userPermissions, roles, userRoles, rolePermissions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface TestUser {
  id: number;
  openId: string;
  name: string;
  email: string;
  permissions: string[];
}

/**
 * Create a test user with specific permissions
 */
export async function createTestUser(
  name: string,
  email: string,
  permissionNames: string[]
): Promise<TestUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create user
  const openId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const result = await db.insert(users).values({
    openId,
    name,
    email,
    role: "user",
    status: "approved",
  });

  const userId = Number(result[0].insertId);

  // Assign permissions
  for (const permName of permissionNames) {
    const perm = await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1);
    if (perm.length > 0) {
      await db.insert(userPermissions).values({
        userId,
        permissionId: perm[0].id,
      });
    }
  }

  return {
    id: userId,
    openId,
    name,
    email,
    permissions: permissionNames,
  };
}

/**
 * Check if a user has a specific permission
 */
export async function userHasPermission(userId: number, permissionName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check direct permissions
  const directPerms = await db
    .select({ name: permissions.name })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));

  if (directPerms.some(p => p.name === permissionName)) {
    return true;
  }

  // Check role-based permissions
  const rolePerms = await db
    .select({ name: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  return rolePerms.some(p => p.name === permissionName);
}

/**
 * Clean up test users
 */
export async function cleanupTestUsers(userIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const userId of userIds) {
    // Delete user permissions
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
    
    // Delete user roles
    await db.delete(userRoles).where(eq(userRoles.userId, userId));
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId));
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const directPerms = await db
    .select({ name: permissions.name })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));

  const rolePerms = await db
    .select({ name: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  const allPerms = [...directPerms, ...rolePerms];
  return Array.from(new Set(allPerms.map(p => p.name)));
}
