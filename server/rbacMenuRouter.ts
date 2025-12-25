import { Router } from 'express';
import { db } from './db';
import { requireAuth, requireSuperAdmin } from './middleware/auth';

const router = Router();

// =====================================================
// Super Admin Menu Management Endpoints
// =====================================================

/**
 * GET /api/admin/menu-items
 * Get all menu items with role visibility matrix
 * Requires: Super Admin
 */
router.get('/admin/menu-items', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    // Get all menu items
    const menuItems = await db.query(`
      SELECT 
        id,
        name,
        label_en as labelEn,
        label_ar as labelAr,
        path,
        icon,
        parent_id as parentId,
        order_index as orderIndex,
        is_visible as isVisible,
        permission_required as permissionRequired
      FROM menu_items
      ORDER BY order_index ASC
    `);

    // Get all roles
    const roles = await db.query(`
      SELECT id, name, description
      FROM roles
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
    const visibilityMatrix = await db.query(`
      SELECT 
        role_id as roleId,
        menu_item_id as menuItemId,
        is_visible as isVisible
      FROM role_menu_visibility
    `);

    // Build visibility map
    const visibilityMap: Record<number, Record<number, boolean>> = {};
    visibilityMatrix.forEach((row: any) => {
      if (!visibilityMap[row.menuItemId]) {
        visibilityMap[row.menuItemId] = {};
      }
      visibilityMap[row.menuItemId][row.roleId] = row.isVisible;
    });

    // Build role name map
    const roleMap: Record<number, string> = {};
    roles.forEach((role: any) => {
      roleMap[role.id] = role.name;
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

    res.json({
      success: true,
      menuItems: menuItemsWithVisibility,
      roles: roles.map((r: any) => ({ id: r.id, name: r.name, description: r.description }))
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items'
    });
  }
});

/**
 * PUT /api/admin/menu-items/:menuItemId/roles/:roleId/visibility
 * Update menu visibility for a specific role
 * Requires: Super Admin
 */
router.put(
  '/admin/menu-items/:menuItemId/roles/:roleId/visibility',
  requireAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { menuItemId, roleId } = req.params;
      const { isVisible } = req.body;
      const userId = req.user?.id;

      // Validate input
      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isVisible must be a boolean'
        });
      }

      // Check if menu item exists
      const menuItem = await db.query(
        'SELECT id, name FROM menu_items WHERE id = ?',
        [menuItemId]
      );

      if (menuItem.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Check if role exists
      const role = await db.query(
        'SELECT id, name FROM roles WHERE id = ?',
        [roleId]
      );

      if (role.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Update or insert visibility setting
      await db.query(`
        INSERT INTO role_menu_visibility (role_id, menu_item_id, is_visible, updated_by)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          is_visible = VALUES(is_visible),
          updated_by = VALUES(updated_by),
          updated_at = CURRENT_TIMESTAMP
      `, [roleId, menuItemId, isVisible, userId]);

      // Log the change in audit table
      await db.query(`
        INSERT INTO menu_visibility_audit 
        (role_id, menu_item_id, is_visible, changed_by, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        roleId,
        menuItemId,
        isVisible,
        userId,
        req.ip,
        req.get('user-agent') || 'unknown'
      ]);

      res.json({
        success: true,
        message: `Menu visibility updated successfully for ${role[0].name}`,
        data: {
          menuItem: menuItem[0].name,
          role: role[0].name,
          isVisible
        }
      });
    } catch (error) {
      console.error('Error updating menu visibility:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update menu visibility'
      });
    }
  }
);

/**
 * PUT /api/admin/menu-items/bulk-visibility
 * Bulk update menu visibility for multiple role-menu combinations
 * Requires: Super Admin
 */
router.put(
  '/admin/menu-items/bulk-visibility',
  requireAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { updates } = req.body;
      const userId = req.user?.id;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'updates must be a non-empty array'
        });
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const update of updates) {
        const { menuItemId, roleId, isVisible } = update;

        if (typeof isVisible !== 'boolean') {
          errors.push(`Invalid isVisible for menuItemId ${menuItemId}, roleId ${roleId}`);
          continue;
        }

        try {
          await db.query(`
            INSERT INTO role_menu_visibility (role_id, menu_item_id, is_visible, updated_by)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              is_visible = VALUES(is_visible),
              updated_by = VALUES(updated_by),
              updated_at = CURRENT_TIMESTAMP
          `, [roleId, menuItemId, isVisible, userId]);

          // Log in audit
          await db.query(`
            INSERT INTO menu_visibility_audit 
            (role_id, menu_item_id, is_visible, changed_by, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            roleId,
            menuItemId,
            isVisible,
            userId,
            req.ip,
            req.get('user-agent') || 'unknown'
          ]);

          successCount++;
        } catch (error) {
          errors.push(`Failed to update menuItemId ${menuItemId}, roleId ${roleId}`);
        }
      }

      res.json({
        success: true,
        message: `Bulk update completed: ${successCount} successful, ${errors.length} failed`,
        updated: successCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk update'
      });
    }
  }
);

/**
 * GET /api/admin/menu-visibility-audit
 * Get audit log of menu visibility changes
 * Requires: Super Admin
 */
router.get('/admin/menu-visibility-audit', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const auditLogs = await db.query(`
      SELECT 
        mva.id,
        r.name as roleName,
        m.name as menuItemName,
        m.label_en as menuItemLabel,
        mva.is_visible as isVisible,
        u.email as changedByEmail,
        mva.changed_at as changedAt,
        mva.ip_address as ipAddress
      FROM menu_visibility_audit mva
      JOIN roles r ON mva.role_id = r.id
      JOIN menu_items m ON mva.menu_item_id = m.id
      JOIN users u ON mva.changed_by = u.id
      ORDER BY mva.changed_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit as string), parseInt(offset as string)]);

    const totalCount = await db.query(`
      SELECT COUNT(*) as total FROM menu_visibility_audit
    `);

    res.json({
      success: true,
      auditLogs,
      pagination: {
        total: totalCount[0].total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
});

// =====================================================
// User Menu Endpoints
// =====================================================

/**
 * GET /api/menu-items
 * Get menu items visible to the current user based on their role
 * Requires: Authentication
 */
router.get('/menu-items', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get user's role
    const userRole = await db.query(`
      SELECT role_id FROM users WHERE id = ?
    `, [userId]);

    if (userRole.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const roleId = userRole[0].role_id;

    // Get user's permissions
    const userPermissions = await db.query(`
      SELECT p.name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [roleId]);

    const permissionSet = new Set(userPermissions.map((p: any) => p.name));

    // Get visible menu items for this role
    const menuItems = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.label_en as labelEn,
        m.label_ar as labelAr,
        m.path,
        m.icon,
        m.parent_id as parentId,
        m.order_index as orderIndex,
        m.permission_required as permissionRequired,
        COALESCE(rmv.is_visible, m.is_visible) as isVisible
      FROM menu_items m
      LEFT JOIN role_menu_visibility rmv 
        ON m.id = rmv.menu_item_id AND rmv.role_id = ?
      WHERE COALESCE(rmv.is_visible, m.is_visible) = TRUE
      ORDER BY m.order_index ASC
    `, [roleId]);

    // Filter by permissions
    const accessibleMenuItems = menuItems.filter((item: any) => {
      // If no permission required, it's accessible
      if (!item.permissionRequired) {
        return true;
      }
      // Check if user has the required permission
      return permissionSet.has(item.permissionRequired);
    });

    res.json({
      success: true,
      menuItems: accessibleMenuItems
    });
  } catch (error) {
    console.error('Error fetching user menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items'
    });
  }
});

/**
 * GET /api/auth/check-permission/:permission
 * Check if current user has a specific permission
 * Requires: Authentication
 */
router.get('/auth/check-permission/:permission', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { permission } = req.params;

    // Get user's role
    const userRole = await db.query(`
      SELECT role_id FROM users WHERE id = ?
    `, [userId]);

    if (userRole.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const roleId = userRole[0].role_id;

    // Check if role has the permission
    const hasPermission = await db.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND p.name = ?
    `, [roleId, permission]);

    res.json({
      success: true,
      hasPermission: hasPermission[0].count > 0,
      permission
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check permission'
    });
  }
});

/**
 * GET /api/auth/user-permissions
 * Get all permissions for the current user
 * Requires: Authentication
 */
router.get('/auth/user-permissions', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get user's role
    const userRole = await db.query(`
      SELECT r.id, r.name, r.description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userId]);

    if (userRole.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const role = userRole[0];

    // Get all permissions for this role
    const permissions = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.resource,
        p.action
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `, [role.id]);

    res.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description
      },
      permissions
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions'
    });
  }
});

export default router;
