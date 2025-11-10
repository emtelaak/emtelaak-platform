import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();

  // Get auth token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  // Verify token and get user data
  const verifyQuery = trpc.standardAuth.verifyToken.useQuery(
    { token: token || "" },
    {
      enabled: Boolean(token),
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Fallback to old OAuth method if no token
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Clear JWT token
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Clear JWT token
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // Determine user from either JWT verification or OAuth
    const user = token && verifyQuery.data?.valid 
      ? verifyQuery.data.user 
      : meQuery.data;

    const loading = token 
      ? verifyQuery.isLoading || logoutMutation.isPending
      : meQuery.isLoading || logoutMutation.isPending;

    const error = token
      ? verifyQuery.error ?? logoutMutation.error ?? null
      : meQuery.error ?? logoutMutation.error ?? null;

    // Store user info in localStorage for compatibility
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(user)
      );
    }

    return {
      user: user ?? null,
      loading,
      error,
      isAuthenticated: Boolean(user),
    };
  }, [
    token,
    verifyQuery.data,
    verifyQuery.error,
    verifyQuery.isLoading,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
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
    refresh: () => {
      if (token) {
        verifyQuery.refetch();
      } else {
        meQuery.refetch();
      }
    },
    logout,
  };
}
