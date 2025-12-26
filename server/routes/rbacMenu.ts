/**
 * RBAC Menu Management tRPC Router
 * Handles role-based menu visibility and permissions
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// Helper function to check if user is super admin
async function isSuperAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const result: any = await db.execute(sql`
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON ur.roleId = r.id
    WHERE ur.userId = ${userId}
  `);

  return result[0]?.some((row: any) => row.name === 'super_admin') ?? false;
}

// Helper function to get user's role ID
async function getUserRoleId(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const result: any = await db.execute(sql`
    SELECT roleId FROM user_roles WHERE userId = ${userId} LIMIT 1
  `);

  return result[0]?.[0]?.roleId ?? null;
}

export const rbacMenuRouter = router({
  // =====================================================
  // Super Admin Menu Management Endpoints
  // =====================================================

  /**
   * Get all menu items with role visibility matrix
   * Requires: Super Admin
   */
  getMenuItemsWithRoles: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
    }

    const isAdmin = await isSuperAdmin(ctx.user.id);
    if (!isAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    // Get all menu items
    const menuItemsResult: any = await db.execute(sql`
      SELECT 
        id,
        name,
        label_en as labelEn,
        label_ar as labelAr,
        path,
        icon,
        order_index as orderIndex,
        is_active as isActive,
        permission_required as permissionRequired
      FROM menu_items
      ORDER BY order_index ASC
    `);

    // Get all roles
    const rolesResult: any = await db.execute(sql`
      SELECT id, name, description
      FROM roles
      WHERE id IN (90001, 90002, 90003, 90004)
      ORDER BY 
        CASE name
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'investor' THEN 3
          WHEN 'guest' THEN 4
          ELSE 5
        END
    `);

    // Get role-menu visibility matrix
    const visibilityResult: any = await db.execute(sql`
      SELECT 
        role_id as roleId,
        menu_item_id as menuItemId,
        is_visible as isVisible
      FROM role_menu_visibility
    `);

    const menuItems = menuItemsResult[0] || [];
    const roles = rolesResult[0] || [];
    const visibilityMatrix = visibilityResult[0] || [];

    // Build visibility map
    const visibilityMap: Record<number, Record<number, boolean>> = {};
    visibilityMatrix.forEach((row: any) => {
      if (!visibilityMap[row.menuItemId]) {
        visibilityMap[row.menuItemId] = {};
      }
      visibilityMap[row.menuItemId][row.roleId] = Boolean(row.isVisible);
    });

    // Attach role visibility to each menu item
    const menuItemsWithVisibility = menuItems.map((item: any) => {
      const roleVisibility: Record<string, boolean> = {};
      roles.forEach((role: any) => {
        roleVisibility[role.name] = visibilityMap[item.id]?.[role.id] ?? true;
      });

      return {
        ...item,
        roleVisibility
      };
    });

    return {
      menuItems: menuItemsWithVisibility,
      roles: roles.map((r: any) => ({ id: r.id, name: r.name, description: r.description }))
    };
  }),

  /**
   * Update menu visibility for a specific role
   * Requires: Super Admin
   */
  updateMenuVisibility: protectedProcedure
    .input(z.object({
      menuItemId: z.number(),
      roleId: z.number(),
      isVisible: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
      }

      const isAdmin = await isSuperAdmin(ctx.user.id);
      if (!isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const { menuItemId, roleId, isVisible } = input;

      // Check if menu item exists
      const menuItemResult: any = await db.execute(sql`
        SELECT id, name FROM menu_items WHERE id = ${menuItemId}
      `);

      if (!menuItemResult[0] || menuItemResult[0].length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Menu item not found" });
      }

      // Check if role exists
      const roleResult: any = await db.execute(sql`
        SELECT id, name FROM roles WHERE id = ${roleId}
      `);

      if (!roleResult[0] || roleResult[0].length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Role not found" });
      }

      // Update or insert visibility setting
      const visibilityValue = isVisible ? 1 : 0;
      await db.execute(sql`
        INSERT INTO role_menu_visibility (role_id, menu_item_id, is_visible)
        VALUES (${roleId}, ${menuItemId}, ${visibilityValue})
        ON DUPLICATE KEY UPDATE 
          is_visible = ${visibilityValue},
          updated_at = CURRENT_TIMESTAMP
      `);

      // Log the change in audit table
      await db.execute(sql`
        INSERT INTO menu_visibility_audit 
        (role_id, menu_item_id, new_visibility, changed_by_user_id)
        VALUES (${roleId}, ${menuItemId}, ${isVisible ? 1 : 0}, ${ctx.user.id})
      `);

      return {
        success: true,
        message: `Menu visibility updated successfully for ${roleResult[0][0].name}`,
        data: {
          menuItem: menuItemResult[0][0].name,
          role: roleResult[0][0].name,
          isVisible
        }
      };
    }),

  /**
   * Get audit log of menu visibility changes
   * Requires: Super Admin
   */
  getMenuVisibilityAudit: protectedProcedure
    .input(z.object({
      limit: z.number().default(100),
      offset: z.number().default(0)
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
      }

      const isAdmin = await isSuperAdmin(ctx.user.id);
      if (!isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const { limit, offset } = input;

      const auditLogsResult: any = await db.execute(sql`
        SELECT 
          mva.id,
          r.name as roleName,
          m.name as menuItemName,
          m.label_en as menuItemLabel,
          mva.new_visibility as isVisible,
          u.email as changedByEmail,
          mva.change_timestamp as changedAt
        FROM menu_visibility_audit mva
        JOIN roles r ON mva.role_id = r.id
        JOIN menu_items m ON mva.menu_item_id = m.id
        JOIN users u ON mva.changed_by_user_id = u.id
        ORDER BY mva.change_timestamp DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const totalCountResult: any = await db.execute(sql`
        SELECT COUNT(*) as total FROM menu_visibility_audit
      `);

      return {
        auditLogs: auditLogsResult[0] || [],
        pagination: {
          total: totalCountResult[0]?.[0]?.total || 0,
          limit,
          offset
        }
      };
    }),

  // =====================================================
  // User Menu Endpoints
  // =====================================================

  /**
   * Get menu items visible to the current user based on their role
   * Requires: Authentication
   */
  getUserMenuItems: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    const userId = ctx.user.id;

    // Get user's role
    const roleId = await getUserRoleId(userId);
    if (!roleId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User role not found" });
    }

    // Get user's permissions
    const userPermissionsResult: any = await db.execute(sql`
      SELECT p.name
      FROM role_permissions rp
      JOIN permissions p ON rp.permissionId = p.id
      WHERE rp.roleId = ${roleId}
    `);

    const permissionSet = new Set(
      (userPermissionsResult[0] || []).map((p: any) => p.name)
    );

    // Get visible menu items for this role
    const menuItemsResult: any = await db.execute(sql`
      SELECT 
        m.id,
        m.name,
        m.label_en as labelEn,
        m.label_ar as labelAr,
        m.path,
        m.icon,
        m.order_index as orderIndex,
        m.permission_required as permissionRequired,
        COALESCE(rmv.is_visible, 1) as isVisible
      FROM menu_items m
      LEFT JOIN role_menu_visibility rmv 
        ON m.id = rmv.menu_item_id AND rmv.role_id = ${roleId}
      WHERE m.is_active = 1 AND COALESCE(rmv.is_visible, 1) = 1
      ORDER BY m.order_index ASC
    `);

    const menuItems = menuItemsResult[0] || [];

    // Filter by permissions
    const accessibleMenuItems = menuItems.filter((item: any) => {
      // If no permission required, it's accessible
      if (!item.permissionRequired) {
        return true;
      }
      // Check if user has the required permission
      return permissionSet.has(item.permissionRequired);
    });

    return {
      menuItems: accessibleMenuItems
    };
  }),

  /**
   * Check if current user has a specific permission
   * Requires: Authentication
   */
  checkPermission: protectedProcedure
    .input(z.object({
      permission: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const userId = ctx.user.id;
      const { permission } = input;

      // Get user's role
      const roleId = await getUserRoleId(userId);
      if (!roleId) {
        return { hasPermission: false, permission };
      }

      // Check if role has the permission
      const hasPermissionResult: any = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM role_permissions rp
        JOIN permissions p ON rp.permissionId = p.id
        WHERE rp.roleId = ${roleId} AND p.name = ${permission}
      `);

      const count = hasPermissionResult[0]?.[0]?.count || 0;

      return {
        hasPermission: count > 0,
        permission
      };
    }),

  /**
   * Get all permissions for the current user
   * Requires: Authentication
   */
  getUserPermissions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    const userId = ctx.user.id;

    // Get user's role
    const userRoleResult: any = await db.execute(sql`
      SELECT r.id, r.name, r.description
      FROM user_roles ur
      JOIN roles r ON ur.roleId = r.id
      WHERE ur.userId = ${userId}
      LIMIT 1
    `);

    if (!userRoleResult[0] || userRoleResult[0].length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User role not found" });
    }

    const role = userRoleResult[0][0];

    // Get all permissions for this role
    const permissionsResult: any = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permissionId = p.id
      WHERE rp.roleId = ${role.id}
      ORDER BY p.category, p.name
    `);

    return {
      role: {
        id: role.id,
        name: role.name,
        description: role.description
      },
      permissions: permissionsResult[0] || []
    };
  })
});
