/**
 * Admin router for permissions and user management
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { notifySuperAdmins } from "./_core/emailNotification";
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
import {
  getDb,
  getUserByOpenId,
  getAllRoleTemplates,
  getRoleTemplateById,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
  applyRoleTemplateToUser,
  getAdminPermissions,
  upsertAdminPermissions,
} from "./db";
import { users, permissionRoleTemplates, passwordResetTokens } from "../drizzle/schema";
import { eq, like, or, desc, and, gt } from "drizzle-orm";
import crypto from "crypto";

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

        // Fetch admin permissions for each user
        const usersWithPermissions = await Promise.all(
          result.map(async (user) => {
            const permissions = await getAdminPermissions(user.id);
            return {
              ...user,
              ...permissions,
            };
          })
        );

        return usersWithPermissions;
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

        // Get target user info before update
        const targetUserResult = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        const targetUser = targetUserResult[0];
        if (!targetUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "user.role.changed",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ newRole: input.role }),
        });

        // Send email notification to super admins for critical role changes
        if (input.role === "super_admin" || input.role === "admin") {
          const superAdminEmails = await getSuperAdminEmails();
          await notifySuperAdmins({
            subject: `User Role Changed to ${input.role}`,
            action: "User Role Changed",
            performedBy: {
              name: ctx.user.name || "Unknown",
              email: ctx.user.email || "unknown@emtelaak.com",
            },
            targetUser: {
              name: targetUser.name || "Unknown",
              email: targetUser.email || "unknown@emtelaak.com",
            },
            details: `User role was changed to ${input.role}`,
            superAdminEmails,
          });
        }

        return { success: true };
      }),

    createUser: adminProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        phone: z.string().optional(),
        role: z.enum(["user", "investor", "fundraiser", "admin", "super_admin"]),
        status: z.enum(["active", "suspended", "pending_verification"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Check if email already exists
        const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existingUser.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "User with this email already exists" });
        }

        // Generate a unique openId for the user (using email as base)
        const openId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Create the user
        const result = await db.insert(users).values({
          openId,
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          role: input.role,
          status: input.status,
          loginMethod: "manual",
        });

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "create_user",
          targetType: "user",
          targetId: Number(result[0].insertId),
          details: `Created user ${input.name} (${input.email}) with role ${input.role}`,
        });

        return { success: true, userId: result[0].insertId };
      }),

    sendPasswordReset: adminProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Get user details
        const userResult = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        if (userResult.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        const user = userResult[0];

        if (!user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User does not have an email address" });
        }

        // Generate secure reset token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Invalidate any existing unused tokens for this user
        await db.update(passwordResetTokens)
          .set({ used: true })
          .where(and(
            eq(passwordResetTokens.userId, input.userId),
            eq(passwordResetTokens.used, false)
          ));

        // Store new token
        await db.insert(passwordResetTokens).values({
          userId: input.userId,
          token,
          expiresAt,
          used: false,
        });

        // Send password reset email
        const resetUrl = `${process.env.VITE_APP_URL || "https://emtelaak.com"}/reset-password?token=${token}`;
        
        try {
          const { sendPasswordResetEmail } = await import("./_core/emailService");
          await sendPasswordResetEmail({
            to: user.email,
            userName: user.name || "User",
            resetLink: resetUrl,
          });
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          // Don't throw error, just log it
        }

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "send_password_reset",
          targetType: "user",
          targetId: input.userId,
          details: `Sent password reset email to ${user.email}`,
        });

        return { success: true, message: "Password reset email sent" };
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

    updatePermissions: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        permissions: z.record(z.string(), z.preprocess((val) => {
          if (typeof val === 'string') {
            return val === 'true' || val === '1';
          }
          return val;
        }, z.boolean())),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Update user permissions in admin_permissions table
        const existingPerms = await getAdminPermissions(input.userId);
        const updatedPerms = { ...existingPerms, ...input.permissions };
        
        await upsertAdminPermissions(input.userId, updatedPerms);

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          action: "user.permissions.updated",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ permissions: input.permissions }),
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

  // Role Templates
  roleTemplates: router({
    list: adminProcedure.query(async () => {
      return await getAllRoleTemplates();
    }),

    getById: adminProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        const template = await getRoleTemplateById(input.templateId);
        if (!template) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
        }
        return template;
      }),

    create: superAdminProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        canManageUsers: z.boolean().default(false),
        canBulkUploadUsers: z.boolean().default(false),
        canEditContent: z.boolean().default(false),
        canManageProperties: z.boolean().default(false),
        canReviewKYC: z.boolean().default(false),
        canApproveInvestments: z.boolean().default(false),
        canManageTransactions: z.boolean().default(false),
        canViewFinancials: z.boolean().default(false),
        canAccessCRM: z.boolean().default(false),
        canViewAnalytics: z.boolean().default(false),
        canManageSettings: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await createRoleTemplate(input);
        
        await createAuditLog({
          userId: ctx.user.id,
          action: "role_template.created",
          targetType: "role_template",
          targetId: template?.id || 0,
          details: JSON.stringify({ name: input.name }),
        });

        return template;
      }),

    update: superAdminProcedure
      .input(z.object({
        templateId: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        canManageUsers: z.boolean().optional(),
        canBulkUploadUsers: z.boolean().optional(),
        canEditContent: z.boolean().optional(),
        canManageProperties: z.boolean().optional(),
        canReviewKYC: z.boolean().optional(),
        canApproveInvestments: z.boolean().optional(),
        canManageTransactions: z.boolean().optional(),
        canViewFinancials: z.boolean().optional(),
        canAccessCRM: z.boolean().optional(),
        canViewAnalytics: z.boolean().optional(),
        canManageSettings: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { templateId, ...updates } = input;
        const template = await updateRoleTemplate(templateId, updates);

        await createAuditLog({
          userId: ctx.user.id,
          action: "role_template.updated",
          targetType: "role_template",
          targetId: templateId,
          details: JSON.stringify(updates),
        });

        return template;
      }),

    delete: superAdminProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteRoleTemplate(input.templateId);

        await createAuditLog({
          userId: ctx.user.id,
          action: "role_template.deleted",
          targetType: "role_template",
          targetId: input.templateId,
          details: undefined,
        });

        return { success: true };
      }),

    applyRoleTemplate: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        templateId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Get target user and template info
        const targetUserResult = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        const targetUser = targetUserResult[0];
        if (!targetUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const templateResult = await db.select().from(permissionRoleTemplates).where(eq(permissionRoleTemplates.id, input.templateId)).limit(1);
        const template = templateResult[0];
        if (!template) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
        }

        await applyRoleTemplateToUser(input.userId, input.templateId);

        await createAuditLog({
          userId: ctx.user.id,
          action: "role_template.applied",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ templateId: input.templateId }),
        });

        // Send email notification to super admins for bulk permission changes
        const superAdminEmails = await getSuperAdminEmails();
        await notifySuperAdmins({
          subject: `Bulk Permissions Applied via Template: ${template.name}`,
          action: "Role Template Applied",
          performedBy: {
            name: ctx.user.name || "Unknown",
            email: ctx.user.email || "unknown@emtelaak.com",
          },
          targetUser: {
            name: targetUser.name || "Unknown",
            email: targetUser.email || "unknown@emtelaak.com",
          },
          details: `Applied role template "${template.name}"`,
          superAdminEmails,
        });

        return { success: true };
      }),
  }),

  // Export Data
  export: router({
    users: superAdminProcedure
      .input(z.object({
        role: z.enum(["user", "investor", "fundraiser", "admin", "super_admin"]).optional(),
        status: z.enum(["active", "suspended", "pending_verification"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        let query = db.select().from(users);
        const conditions = [];

        if (input.role) {
          conditions.push(eq(users.role, input.role));
        }
        if (input.status) {
          conditions.push(eq(users.status, input.status));
        }

        let result;
        if (conditions.length > 0) {
          result = await query.where(or(...conditions));
        } else {
          result = await query;
        }

        // Format as CSV
        const headers = ["ID", "Name", "Email", "Phone", "Role", "Status", "Login Method", "Created At", "Last Signed In"];
        const rows = result.map(u => [
          u.id,
          u.name || "",
          u.email || "",
          u.phone || "",
          u.role,
          u.status,
          u.loginMethod || "",
          new Date(u.createdAt).toISOString(),
          new Date(u.lastSignedIn).toISOString(),
        ]);

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
        return { csv, filename: `users-export-${new Date().toISOString().split('T')[0]}.csv` };
      }),

    auditLogs: superAdminProcedure
      .input(z.object({
        limit: z.number().min(1).max(10000).default(1000),
      }))
      .query(async ({ input }) => {
        const logs = await getAuditLogs(input.limit, 0);

        // Format as CSV
        const headers = ["ID", "User ID", "User Name", "User Email", "Action", "Target Type", "Target ID", "Details", "IP Address", "Created At"];
        const rows = logs.map(l => [
          l.log.id,
          l.user.id,
          l.user.name || "",
          l.user.email || "",
          l.log.action,
          l.log.targetType || "",
          l.log.targetId || "",
          l.log.details || "",
          l.log.ipAddress || "",
          new Date(l.log.createdAt).toISOString(),
        ]);

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
        return { csv, filename: `audit-logs-export-${new Date().toISOString().split('T')[0]}.csv` };
      }),
  }),
});


// Helper function to get all super admin emails for notifications
async function getSuperAdminEmails(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  
  const superAdmins = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "super_admin"));
  
  return superAdmins
    .map(admin => admin.email)
    .filter((email): email is string => email !== null && email !== undefined);
}
