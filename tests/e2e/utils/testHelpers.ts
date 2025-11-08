import { beforeEach, afterEach } from 'vitest';

/**
 * Test user fixtures for different roles
 */
export const testUsers = {
  superAdmin: {
    id: 1,
    openId: 'test-super-admin-openid',
    name: 'Test Super Admin',
    email: 'superadmin@test.com',
    role: 'super_admin' as const,
    status: 'active' as const,
    preferredLanguage: 'en' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignedIn: new Date('2024-01-01'),
  },
  admin: {
    id: 2,
    openId: 'test-admin-openid',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin' as const,
    status: 'active' as const,
    preferredLanguage: 'en' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignedIn: new Date('2024-01-01'),
  },
  regularUser: {
    id: 3,
    openId: 'test-user-openid',
    name: 'Test User',
    email: 'user@test.com',
    role: 'user' as const,
    status: 'active' as const,
    preferredLanguage: 'en' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignedIn: new Date('2024-01-01'),
  },
  pendingUser: {
    id: 4,
    openId: 'test-pending-openid',
    name: 'Test Pending User',
    email: 'pending@test.com',
    role: 'user' as const,
    status: 'pending_verification' as const,
    preferredLanguage: 'en' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignedIn: new Date('2024-01-01'),
  },
};

/**
 * Mock permissions for testing
 */
export const mockPermissions = {
  fullAccess: {
    // User Management
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    // Investment Management
    canViewInvestments: true,
    canCreateInvestments: true,
    canEditInvestments: true,
    canDeleteInvestments: true,
    canProcessDistributions: true,
    // Property Management
    canViewProperties: true,
    canCreateProperties: true,
    canEditProperties: true,
    canDeleteProperties: true,
    canManagePropertyDocuments: true,
    // KYC Management
    canViewKYC: true,
    canApproveKYC: true,
    canRejectKYC: true,
    // Financial Management
    canViewFinancialReports: true,
    canExportFinancialData: true,
    canManagePayments: true,
    // Content Management
    canEditContent: true,
    canManageMedia: true,
  },
  readOnly: {
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewInvestments: true,
    canCreateInvestments: false,
    canEditInvestments: false,
    canDeleteInvestments: false,
    canProcessDistributions: false,
    canViewProperties: true,
    canCreateProperties: false,
    canEditProperties: false,
    canDeleteProperties: false,
    canManagePropertyDocuments: false,
    canViewKYC: true,
    canApproveKYC: false,
    canRejectKYC: false,
    canViewFinancialReports: true,
    canExportFinancialData: false,
    canManagePayments: false,
    canEditContent: false,
    canManageMedia: false,
  },
  noAccess: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewInvestments: false,
    canCreateInvestments: false,
    canEditInvestments: false,
    canDeleteInvestments: false,
    canProcessDistributions: false,
    canViewProperties: false,
    canCreateProperties: false,
    canEditProperties: false,
    canDeleteProperties: false,
    canManagePropertyDocuments: false,
    canViewKYC: false,
    canApproveKYC: false,
    canRejectKYC: false,
    canViewFinancialReports: false,
    canExportFinancialData: false,
    canManagePayments: false,
    canEditContent: false,
    canManageMedia: false,
  },
};

/**
 * Create a mock tRPC context with authenticated user
 */
export function createMockContext(user: typeof testUsers.superAdmin | null = null) {
  return {
    user,
    req: {} as any,
    res: {} as any,
  };
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random test data
 */
export function generateTestUser(overrides: Partial<typeof testUsers.regularUser> = {}) {
  const randomId = Math.floor(Math.random() * 10000) + 100;
  return {
    id: randomId,
    openId: `test-user-${randomId}`,
    name: `Test User ${randomId}`,
    email: `user${randomId}@test.com`,
    role: 'user' as const,
    status: 'active' as const,
    preferredLanguage: 'en' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

/**
 * Mock audit log entry
 */
export function createMockAuditLog(action: string, userId: number, details: any = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    userId,
    action,
    details: JSON.stringify(details),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date(),
  };
}

/**
 * Setup function to run before each test
 */
export function setupTest() {
  beforeEach(() => {
    // Reset any global state if needed
  });

  afterEach(() => {
    // Cleanup after each test
  });
}
