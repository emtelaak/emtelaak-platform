/**
 * Admin router for permissions and user management
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllPermissions,
  getAllRoles,
  getRoleById,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole,
  setRolePermissions,
  getUserPermissions,
  assignPermissionToUser,
  removePermissionFromUser,
  getAllUserPermissions,
  userHasPermission,
  createAuditLog,
  getAuditLogs,
} from "./permissionsDb";
import { getDb, getUserByOpenId } from "./db";
import { users } from "../drizzle/schema";
import { eq, like, or, desc } from "drizzle-orm";

// Super admin procedure
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
  }
  return next({ ctx });
});

// Admin procedure (super_admin or admin)
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminPermissionsRouter = router({
  // Dashboard Stats
  dashboard: router({
    getStats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const allUsers = await db.select().from(users);
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(u => u.status === "active").length;
        const pendingKyc = allUsers.filter(u => u.status === "pending_verification").length;

      return {
        totalUsers,
        activeUsers,
        pendingKyc,
      };
    }),
  }),

  // User Management
  users: router({
    list: adminProcedure
      .input(z.object({
        search: z.string().optional(),
        role: z.enum(["user", "investor", "fundraiser", "admin", "super_admin"]).optional(),
        status: z.enum(["active", "suspended", "pending_verification"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let baseQuery = db.select().from(users);

        // Apply filters
        const conditions = [];
        if (input.search) {
          conditions.push(
            or(
              like(users.name, `%${input.search}%`),
              like(users.email, `%${input.search}%`)
            )
          );
        }
        if (input.role) {
          conditions.push(eq(users.role, input.role));
        }
        if (input.status) {
          conditions.push(eq(users.status, input.status));
        }

        let result;
        if (conditions.length > 0) {
          result = await baseQuery
            .where(or(...conditions))
            .orderBy(desc(users.createdAt))
            .limit(input.limit)
            .offset(input.offset);
        } else {
          result = await baseQuery
            .orderBy(desc(users.createdAt))
            .limit(input.limit)
            .offset(input.offset);
        }

        return result;
      }),

    getById: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const result = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        return result[0];
      }),

    updateRole: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "investor", "fundraiser", "admin", "super_admin"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "user.role.changed",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ newRole: input.role }),
        });

        return { success: true };
      }),

    updateStatus: adminProcedure
      .input(z.object({
        userId: z.number(),
        status: z.enum(["active", "suspended", "pending_verification"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        await db.update(users).set({ status: input.status }).where(eq(users.id, input.userId));

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "user.status.changed",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ newStatus: input.status }),
        });

        return { success: true };
      }),

    getPermissions: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getAllUserPermissions(input.userId);
      }),

    assignPermission: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        permissionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assignPermissionToUser(input.userId, input.permissionId, ctx.user.id);

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "user.permission.assigned",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ permissionId: input.permissionId }),
        });

        return { success: true };
      }),

    removePermission: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        permissionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await removePermissionFromUser(input.userId, input.permissionId);

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "user.permission.removed",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ permissionId: input.permissionId }),
        });

        return { success: true };
      }),
  }),

  // Permissions
  permissions: router({
    list: adminProcedure.query(async () => {
      return await getAllPermissions();
    }),
  }),

  // Roles
  roles: router({
    list: adminProcedure.query(async () => {
      return await getAllRoles();
    }),

    getById: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        const role = await getRoleById(input.roleId);
        if (!role) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
        }
        return role;
      }),

    getPermissions: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return await getRolePermissions(input.roleId);
      }),

    create: superAdminProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        description: z.string(),
        permissionIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const roleId = await createRole(input.name, input.description);
        await setRolePermissions(roleId, input.permissionIds);

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "role.created",
          targetType: "role",
          targetId: roleId,
          details: JSON.stringify({ name: input.name, permissionIds: input.permissionIds }),
        });

        return { roleId };
      }),

    update: superAdminProcedure
      .input(z.object({
        roleId: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { roleId, ...updates } = input;
        await updateRole(roleId, updates);

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "role.updated",
          targetType: "role",
          targetId: roleId,
          details: JSON.stringify(updates),
        });

        return { success: true };
      }),

    delete: superAdminProcedure
      .input(z.object({ roleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteRole(input.roleId);

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "role.deleted",
          targetType: "role",
          targetId: input.roleId,
          details: undefined,
        });

        return { success: true };
      }),

    setPermissions: superAdminProcedure
      .input(z.object({
        roleId: z.number(),
        permissionIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        await setRolePermissions(input.roleId, input.permissionIds);

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "role.permissions.updated",
          targetType: "role",
          targetId: input.roleId,
          details: JSON.stringify({ permissionIds: input.permissionIds }),
        });

        return { success: true };
      }),
  }),

  // Audit Logs
  auditLogs: router({
    list: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return await getAuditLogs(input.limit, input.offset);
      }),
  }),
});
