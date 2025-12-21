import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  // Use cookie-based authentication (local email/password auth)
  // Session managed by backend JWT cookies
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      // Clear the session cookie on the server
      await logoutMutation.mutateAsync();
      
      // Clear local auth state immediately
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      
      // Wait for browser to process Set-Cookie header before redirecting
      // This ensures the cookie is actually cleared/invalidated before page reload
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force full page reload to ensure cookie is cleared and cache is refreshed
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Already logged out, clear state and redirect
        utils.auth.me.setData(undefined, null);
        await utils.auth.me.invalidate();
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        return;
      }
      throw error;
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const user = meQuery.data;
    
    // Debug logging
    console.log('[useAuth] Debug:', {
      meQuery: {
        data: meQuery.data,
        isLoading: meQuery.isLoading,
        error: meQuery.error,
        fetchStatus: meQuery.fetchStatus
      },
      finalUser: user
    });

    const loading = meQuery.isLoading || logoutMutation.isPending;
    const error = meQuery.error ?? logoutMutation.error ?? null;

    // Store user info in localStorage for compatibility with other components
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ofok-runtime-user-info",
        JSON.stringify(user)
      );
    }

    return {
      user: user ?? null,
      loading,
      error,
      isAuthenticated: Boolean(user),
      role: user?.role,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    meQuery.fetchStatus,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    state.loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
