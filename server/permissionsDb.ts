/**
 * Database helpers for permissions and roles management
 */

import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  permissions,
  roles,
  rolePermissions,
  userPermissions,
  auditLogs,
  users,
} from "../drizzle/schema";

// Permissions
export async function getAllPermissions() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(permissions);
}

export async function getPermissionsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(permissions).where(eq(permissions.category, category));
}

// Roles
export async function getAllRoles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(roles);
}

export async function getRoleById(roleId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getRoleByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createRole(name: string, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(roles).values({
    name,
    description,
    isSystem: false,
  });
  
  return Number(result[0].insertId);
}

export async function updateRole(roleId: number, data: { name?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(roles).set(data).where(eq(roles.id, roleId));
}

export async function deleteRole(roleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if role is system role
  const role = await getRoleById(roleId);
  if (role?.isSystem) {
    throw new Error("Cannot delete system role");
  }
  
  await db.delete(roles).where(eq(roles.id, roleId));
}

// Role Permissions
export async function getRolePermissions(roleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      permission: permissions,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  
  return result.map(r => r.permission);
}

export async function assignPermissionToRole(roleId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(rolePermissions).values({
    roleId,
    permissionId,
  });
}

export async function removePermissionFromRole(roleId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(rolePermissions).where(
    and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId)
    )
  );
}

export async function setRolePermissions(roleId: number, permissionIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove all existing permissions
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  
  // Add new permissions
  if (permissionIds.length > 0) {
    await db.insert(rolePermissions).values(
      permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      }))
    );
  }
}

// User Permissions
export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      permission: permissions,
    })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));
  
  return result.map(r => r.permission);
}

export async function assignPermissionToUser(userId: number, permissionId: number, grantedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(userPermissions).values({
    userId,
    permissionId,
    grantedBy,
  });
}

export async function removePermissionFromUser(userId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(userPermissions).where(
    and(
      eq(userPermissions.userId, userId),
      eq(userPermissions.permissionId, permissionId)
    )
  );
}

// Check if user has permission
export async function userHasPermission(userId: number, permissionName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Get user's direct permissions
  const directPerms = await db
    .select({ name: permissions.name })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(eq(userPermissions.userId, userId));
  
  if (directPerms.some(p => p.name === permissionName)) {
    return true;
  }
  
  // Check if user has super_admin or admin role (they have all permissions)
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length > 0 && (user[0].role === "admin" || user[0].role === "super_admin")) {
    return true;
  }
  
  return false;
}

// Get all user permissions (direct + role-based)
export async function getAllUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const perms = new Set<string>();
  
  // Get direct permissions
  const directPerms = await getUserPermissions(userId);
  directPerms.forEach(p => perms.add(p.name));
  
  // If user is admin or super_admin, they have all permissions
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length > 0 && (user[0].role === "admin" || user[0].role === "super_admin")) {
    const allPerms = await getAllPermissions();
    allPerms.forEach(p => perms.add(p.name));
  }
  
  return Array.from(perms);
}

// Audit Logs
export async function createAuditLog(data: {
  userId: number;
  performedBy?: number; // The admin/user who performed the action
  action: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      log: auditLogs,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(auditLogs.createdAt)
    .limit(limit)
    .offset(offset);
  
  return result;
}

export async function getUserAuditLogs(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(auditLogs.createdAt)
    .limit(limit);
}

export async function getInvoiceAuditLogs(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      log: auditLogs,
      affectedUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      performedByUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(
      and(
        eq(auditLogs.targetType, "invoice"),
        eq(auditLogs.targetId, invoiceId)
      )
    )
    .orderBy(auditLogs.createdAt);
  
  // Manually fetch performedBy user details
  const logsWithPerformedBy = await Promise.all(
    result.map(async (item) => {
      let performedByUser = null;
      if (item.log.performedBy) {
        const performedBy = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, item.log.performedBy))
          .limit(1);
        performedByUser = performedBy[0] || null;
      }
      return {
        ...item,
        performedByUser,
      };
    })
  );
  
  return logsWithPerformedBy;
}
