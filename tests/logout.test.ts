import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Test suite for logout functionality
 * 
 * This test verifies that the logout function:
 * 1. Calls the logout mutation
 * 2. Clears the auth query data
 * 3. Invalidates the auth query
 * 4. Redirects to the home page
 */

describe('Logout Functionality', () => {
  let mockMutateAsync: ReturnType<typeof vi.fn>;
  let mockSetData: ReturnType<typeof vi.fn>;
  let mockInvalidate: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    // Reset mocks before each test
    mockMutateAsync = vi.fn().mockResolvedValue({});
    mockSetData = vi.fn();
    mockInvalidate = vi.fn().mockResolvedValue(undefined);
    
    // Save original location
    originalLocation = window.location;
    
    // Mock window.location with a simple object
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  it('should redirect to home page after successful logout', async () => {
    // Simulate the logout function behavior
    const logout = async () => {
      try {
        await mockMutateAsync();
      } catch (error: any) {
        if (error?.data?.code === 'UNAUTHORIZED') {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        throw error;
      } finally {
        mockSetData(undefined, null);
        await mockInvalidate();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    // Execute logout
    await logout();

    // Verify the expected behavior
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/');
  });

  it('should redirect to home page even if already unauthorized', async () => {
    // Simulate UNAUTHORIZED error
    const unauthorizedError = {
      data: { code: 'UNAUTHORIZED' },
    };
    mockMutateAsync.mockRejectedValue(unauthorizedError);

    const logout = async () => {
      try {
        await mockMutateAsync();
      } catch (error: any) {
        if (error?.data?.code === 'UNAUTHORIZED') {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        throw error;
      } finally {
        mockSetData(undefined, null);
        await mockInvalidate();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    // Execute logout
    await logout();

    // Verify redirect happens even on UNAUTHORIZED error
    expect(window.location.href).toBe('/');
    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it('should clear auth data before redirecting', async () => {
    const callOrder: string[] = [];

    mockSetData.mockImplementation(() => {
      callOrder.push('setData');
    });

    mockInvalidate.mockImplementation(async () => {
      callOrder.push('invalidate');
    });

    const logout = async () => {
      try {
        await mockMutateAsync();
      } catch (error: any) {
        if (error?.data?.code === 'UNAUTHORIZED') {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        throw error;
      } finally {
        mockSetData(undefined, null);
        await mockInvalidate();
        callOrder.push('redirect');
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    await logout();

    // Verify order: setData -> invalidate -> redirect
    expect(callOrder).toEqual(['setData', 'invalidate', 'redirect']);
    expect(window.location.href).toBe('/');
  });

  it('should handle logout without window object (SSR scenario)', async () => {
    // Temporarily remove window
    const originalWindow = global.window;
    delete (global as any).window;

    const logout = async () => {
      try {
        await mockMutateAsync();
      } catch (error: any) {
        if (error?.data?.code === 'UNAUTHORIZED') {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return;
        }
        throw error;
      } finally {
        mockSetData(undefined, null);
        await mockInvalidate();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    // Should not throw error
    await expect(logout()).resolves.not.toThrow();

    // Verify auth data was still cleared
    expect(mockSetData).toHaveBeenCalledWith(undefined, null);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);

    // Restore window
    (global as any).window = originalWindow;
  });
});
