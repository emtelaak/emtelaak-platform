import { z } from "zod";
import { router } from "./_core/trpc";
import { adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { roles, rolePermissions, userRoles, permissions, users } from "../drizzle/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { createAuditLog } from "./permissionsDb";

export const adminRolesRouter = router({
  // List all roles with permission and user counts
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allRoles = await db.select().from(roles);

    // Get permission counts for each role
    const roleCounts = await Promise.all(
      allRoles.map(async (role) => {
        const permCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));

        const userCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(userRoles)
          .where(eq(userRoles.roleId, role.id));

        return {
          ...role,
          permissionCount: Number(permCount[0]?.count || 0),
          userCount: Number(userCount[0]?.count || 0),
        };
      })
    );

    return roleCounts;
  }),

  // Create a new role
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(roles).values({
        name: input.name,
        description: input.description || null,
        isSystem: false,
      });

      const roleId = Number(result[0].insertId);

      // Audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "create_role",
        targetType: "role",
        targetId: roleId,
        details: JSON.stringify({ roleName: input.name }),
      });

      return { id: roleId };
    }),

  // Update role (name, description, and permissions)
  update: adminProcedure
    .input(
      z.object({
        roleId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        permissionIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update role details if provided
      if (input.name || input.description !== undefined) {
        await db
          .update(roles)
          .set({
            name: input.name,
            description: input.description || null,
          })
          .where(eq(roles.id, input.roleId));
      }

      // Update permissions if provided
      if (input.permissionIds) {
        // Delete existing permissions
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));

        // Insert new permissions
        if (input.permissionIds.length > 0) {
          await db.insert(rolePermissions).values(
            input.permissionIds.map((permId) => ({
              roleId: input.roleId,
              permissionId: permId,
            }))
          );
        }
      }

      // Audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "update_role",
        targetType: "role",
        targetId: input.roleId,
        details: JSON.stringify({ permissionCount: input.permissionIds?.length }),
      });

      return { success: true };
    }),

  // Delete a role
  delete: adminProcedure
    .input(z.object({ roleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if role is system role
      const role = await db.select().from(roles).where(eq(roles.id, input.roleId)).limit(1);
      if (role[0]?.isSystem) {
        throw new Error("Cannot delete system roles");
      }

      // Delete role permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));

      // Delete user roles
      await db.delete(userRoles).where(eq(userRoles.roleId, input.roleId));

      // Delete role
      await db.delete(roles).where(eq(roles.id, input.roleId));

      // Audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "delete_role",
        targetType: "role",
        targetId: input.roleId,
        details: `Deleted role: ${role[0]?.name}`,
      });

      return { success: true };
    }),

  // Get permissions for a specific role
  getPermissions: adminProcedure
    .input(z.object({ roleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rolePerms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          category: permissions.category,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, input.roleId));

      return rolePerms;
    }),

  // Get roles assigned to a user
  getUserRoles: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRolesList = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, input.userId));

      return userRolesList;
    }),

  // Assign roles to a user
  assignRolesToUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        roleIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete existing user roles
      await db.delete(userRoles).where(eq(userRoles.userId, input.userId));

      // Insert new user roles
      if (input.roleIds.length > 0) {
        await db.insert(userRoles).values(
          input.roleIds.map((roleId) => ({
            userId: input.userId,
            roleId,
          }))
        );
      }

      // Audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: "assign_roles",
        targetType: "user",
        targetId: input.userId,
        details: JSON.stringify({ roleIds: input.roleIds }),
      });

      return { success: true };
    }),
});
