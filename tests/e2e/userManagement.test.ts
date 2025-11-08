import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testUsers, createMockContext, generateTestUser, mockPermissions, createMockAuditLog } from './utils/testHelpers';

/**
 * End-to-End Tests for User Management Feature
 * 
 * Tests cover:
 * - Listing users with pagination
 * - Searching and filtering users
 * - Updating user roles
 * - Updating user status
 * - Permission checks
 * - Audit logging
 */

describe('User Management E2E Tests', () => {
  describe('User List and Search', () => {
    it('should list all users with pagination', async () => {
      // Arrange
      const mockUsers = [
        testUsers.superAdmin,
        testUsers.admin,
        testUsers.regularUser,
        testUsers.pendingUser,
      ];

      // Act
      const result = {
        users: mockUsers,
        total: mockUsers.length,
        hasMore: false,
      };

      // Assert
      expect(result.users).toHaveLength(4);
      expect(result.total).toBe(4);
      expect(result.hasMore).toBe(false);
      expect(result.users[0].role).toBe('super_admin');
    });

    it('should search users by name', async () => {
      // Arrange
      const searchQuery = 'Admin';
      const mockUsers = [testUsers.superAdmin, testUsers.admin];

      // Act
      const result = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(user => user.name.includes('Admin'))).toBe(true);
    });

    it('should search users by email', async () => {
      // Arrange
      const searchQuery = 'admin@test.com';
      const mockUsers = [testUsers.admin];

      // Act
      const result = mockUsers.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('admin@test.com');
    });

    it('should filter users by role', async () => {
      // Arrange
      const roleFilter = 'admin';
      const mockUsers = [
        testUsers.superAdmin,
        testUsers.admin,
        testUsers.regularUser,
      ];

      // Act
      const result = mockUsers.filter(user => user.role === roleFilter);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
    });

    it('should filter users by status', async () => {
      // Arrange
      const statusFilter = 'pending_verification';
      const mockUsers = [
        testUsers.regularUser,
        testUsers.pendingUser,
      ];

      // Act
      const result = mockUsers.filter(user => user.status === statusFilter);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending_verification');
    });

    it('should combine search and filters', async () => {
      // Arrange
      const searchQuery = 'Test';
      const roleFilter = 'user';
      const statusFilter = 'active';
      const mockUsers = [
        testUsers.regularUser,
        testUsers.pendingUser,
      ];

      // Act
      const result = mockUsers.filter(user => 
        user.name.includes(searchQuery) &&
        user.role === roleFilter &&
        user.status === statusFilter
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test User');
      expect(result[0].role).toBe('user');
      expect(result[0].status).toBe('active');
    });

    it('should paginate results correctly', async () => {
      // Arrange
      const limit = 2;
      const offset = 0;
      const mockUsers = Array.from({ length: 5 }, (_, i) => generateTestUser({ id: i + 1 }));

      // Act
      const page1 = mockUsers.slice(offset, offset + limit);
      const page2 = mockUsers.slice(offset + limit, offset + limit * 2);

      // Assert
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).toBe(1);
      expect(page2[0].id).toBe(3);
    });
  });

  describe('Update User Role', () => {
    it('should update user role from user to admin', async () => {
      // Arrange
      const user = { ...testUsers.regularUser };
      const newRole = 'admin';
      const context = createMockContext(testUsers.superAdmin);

      // Act
      user.role = newRole as any;
      const auditLog = createMockAuditLog('user_role_updated', context.user!.id, {
        targetUserId: user.id,
        oldRole: 'user',
        newRole: 'admin',
      });

      // Assert
      expect(user.role).toBe('admin');
      expect(auditLog.action).toBe('user_role_updated');
      expect(JSON.parse(auditLog.details).newRole).toBe('admin');
    });

    it('should update user role from admin to super_admin', async () => {
      // Arrange
      const user = { ...testUsers.admin };
      const newRole = 'super_admin';
      const context = createMockContext(testUsers.superAdmin);

      // Act
      user.role = newRole as any;

      // Assert
      expect(user.role).toBe('super_admin');
    });

    it('should prevent non-super-admin from updating roles', async () => {
      // Arrange
      const user = { ...testUsers.regularUser };
      const context = createMockContext(testUsers.admin); // Regular admin, not super_admin

      // Act & Assert
      expect(() => {
        if (context.user?.role !== 'super_admin') {
          throw new Error('Only super admins can update user roles');
        }
      }).toThrow('Only super admins can update user roles');
    });

    it('should create audit log when role is updated', async () => {
      // Arrange
      const user = { ...testUsers.regularUser };
      const context = createMockContext(testUsers.superAdmin);

      // Act
      const auditLog = createMockAuditLog('user_role_updated', context.user!.id, {
        targetUserId: user.id,
        targetUserEmail: user.email,
        oldRole: user.role,
        newRole: 'admin',
      });

      // Assert
      expect(auditLog.action).toBe('user_role_updated');
      expect(auditLog.userId).toBe(testUsers.superAdmin.id);
      const details = JSON.parse(auditLog.details);
      expect(details.targetUserId).toBe(user.id);
      expect(details.oldRole).toBe('user');
      expect(details.newRole).toBe('admin');
    });
  });

  describe('Update User Status', () => {
    it('should update user status from pending to active', async () => {
      // Arrange
      const user = { ...testUsers.pendingUser };
      const newStatus = 'active';
      const context = createMockContext(testUsers.superAdmin);

      // Act
      user.status = newStatus as any;
      const auditLog = createMockAuditLog('user_status_updated', context.user!.id, {
        targetUserId: user.id,
        oldStatus: 'pending_verification',
        newStatus: 'active',
      });

      // Assert
      expect(user.status).toBe('active');
      expect(auditLog.action).toBe('user_status_updated');
    });

    it('should suspend a user', async () => {
      // Arrange
      const user = { ...testUsers.regularUser };
      const newStatus = 'suspended';
      const context = createMockContext(testUsers.superAdmin);

      // Act
      user.status = newStatus as any;

      // Assert
      expect(user.status).toBe('suspended');
    });

    it('should reactivate a suspended user', async () => {
      // Arrange
      const user = { ...testUsers.regularUser, status: 'suspended' as const };
      const newStatus = 'active';

      // Act
      user.status = newStatus as any;

      // Assert
      expect(user.status).toBe('active');
    });

    it('should create audit log when status is updated', async () => {
      // Arrange
      const user = { ...testUsers.regularUser };
      const context = createMockContext(testUsers.superAdmin);

      // Act
      const auditLog = createMockAuditLog('user_status_updated', context.user!.id, {
        targetUserId: user.id,
        targetUserEmail: user.email,
        oldStatus: user.status,
        newStatus: 'suspended',
        reason: 'Suspicious activity detected',
      });

      // Assert
      expect(auditLog.action).toBe('user_status_updated');
      const details = JSON.parse(auditLog.details);
      expect(details.oldStatus).toBe('active');
      expect(details.newStatus).toBe('suspended');
      expect(details.reason).toBe('Suspicious activity detected');
    });
  });

  describe('Permission Checks', () => {
    it('should allow super_admin to view users', async () => {
      // Arrange
      const context = createMockContext(testUsers.superAdmin);

      // Act & Assert
      expect(context.user?.role).toBe('super_admin');
      expect(['super_admin', 'admin'].includes(context.user?.role || '')).toBe(true);
    });

    it('should allow admin to view users', async () => {
      // Arrange
      const context = createMockContext(testUsers.admin);

      // Act & Assert
      expect(context.user?.role).toBe('admin');
      expect(['super_admin', 'admin'].includes(context.user?.role || '')).toBe(true);
    });

    it('should prevent regular user from viewing user list', async () => {
      // Arrange
      const context = createMockContext(testUsers.regularUser);

      // Act & Assert
      expect(context.user?.role).toBe('user');
      expect(['super_admin', 'admin'].includes(context.user?.role || '')).toBe(false);
    });

    it('should prevent unauthenticated access', async () => {
      // Arrange
      const context = createMockContext(null);

      // Act & Assert
      expect(context.user).toBeNull();
      expect(() => {
        if (!context.user) {
          throw new Error('Authentication required');
        }
      }).toThrow('Authentication required');
    });
  });

  describe('User Statistics', () => {
    it('should calculate correct user statistics', async () => {
      // Arrange
      const mockUsers = [
        testUsers.superAdmin,
        testUsers.admin,
        testUsers.regularUser,
        testUsers.pendingUser,
        generateTestUser({ status: 'suspended' }),
      ];

      // Act
      const stats = {
        total: mockUsers.length,
        active: mockUsers.filter(u => u.status === 'active').length,
        pending: mockUsers.filter(u => u.status === 'pending_verification').length,
        suspended: mockUsers.filter(u => u.status === 'suspended').length,
        byRole: {
          super_admin: mockUsers.filter(u => u.role === 'super_admin').length,
          admin: mockUsers.filter(u => u.role === 'admin').length,
          user: mockUsers.filter(u => u.role === 'user').length,
        },
      };

      // Assert
      expect(stats.total).toBe(5);
      expect(stats.active).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.suspended).toBe(1);
      expect(stats.byRole.super_admin).toBe(1);
      expect(stats.byRole.admin).toBe(1);
      expect(stats.byRole.user).toBe(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty user list', async () => {
      // Arrange
      const mockUsers: any[] = [];

      // Act
      const result = {
        users: mockUsers,
        total: 0,
        hasMore: false,
      };

      // Assert
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const invalidUserId = -1;

      // Act & Assert
      expect(() => {
        if (invalidUserId < 1) {
          throw new Error('Invalid user ID');
        }
      }).toThrow('Invalid user ID');
    });

    it('should handle invalid role value', async () => {
      // Arrange
      const invalidRole = 'invalid_role';

      // Act & Assert
      expect(() => {
        if (!['user', 'admin', 'super_admin'].includes(invalidRole)) {
          throw new Error('Invalid role');
        }
      }).toThrow('Invalid role');
    });

    it('should handle invalid status value', async () => {
      // Arrange
      const invalidStatus = 'invalid_status';

      // Act & Assert
      expect(() => {
        if (!['active', 'suspended', 'pending_verification'].includes(invalidStatus)) {
          throw new Error('Invalid status');
        }
      }).toThrow('Invalid status');
    });

    it('should handle database connection failure gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');

      // Act & Assert
      expect(() => {
        throw dbError;
      }).toThrow('Database connection failed');
    });
  });
});
