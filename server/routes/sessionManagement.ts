import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getUserSessions,
  getSessionById,
  revokeSession,
  revokeAllUserSessions,
} from "../db";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import jwt from "jsonwebtoken";
import { ENV } from "../_core/env";

/**
 * Session Management Router
 * 
 * Provides endpoints for users to view and manage their active sessions.
 * Features:
 * - List all active sessions with device/location info
 * - Identify current session
 * - Revoke specific sessions
 * - Revoke all other sessions (keep current)
 */
export const sessionManagementRouter = router({
  /**
   * Get all active sessions for the current user
   */
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await getUserSessions(ctx.user.id);
    
    // Get current session ID from cookie
    const token = ctx.req.cookies[COOKIE_NAME];
    let currentSessionId: string | null = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.jwtSecret) as any;
        currentSessionId = decoded.sessionId || token;
      } catch (error) {
        // Token invalid, ignore
      }
    }
    
    // Mark current session and format response
    return sessions.map((session: any) => ({
      id: session.id,
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo || "Unknown Device",
      browser: session.browser || "Unknown Browser",
      ipAddress: session.ipAddress || "Unknown IP",
      location: session.location || "Unknown Location",
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      isCurrent: session.sessionId === currentSessionId,
    }));
  }),

  /**
   * Get details of a specific session
   */
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const session = await getSessionById(input.sessionId);
      
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }
      
      // Verify session belongs to current user
      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this session",
        });
      }
      
      return session;
    }),

  /**
   * Revoke a specific session
   */
  revokeSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to current user
      const session = await getSessionById(input.sessionId);
      
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }
      
      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to revoke this session",
        });
      }
      
      // Revoke the session
      await revokeSession(input.sessionId);
      
      return {
        success: true,
        message: "Session revoked successfully",
      };
    }),

  /**
   * Revoke all other sessions (keep current session active)
   */
  revokeAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    // Get current session ID from cookie
    const token = ctx.req.cookies[COOKIE_NAME];
    let currentSessionId: string | undefined;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV.jwtSecret) as any;
        currentSessionId = decoded.sessionId || token;
      } catch (error) {
        // Token invalid, revoke all sessions
      }
    }
    
    // Revoke all sessions except current
    await revokeAllUserSessions(ctx.user.id, currentSessionId);
    
    return {
      success: true,
      message: "All other sessions revoked successfully",
    };
  }),

  /**
   * Get session statistics
   */
  getSessionStats: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await getUserSessions(ctx.user.id);
    
    // Count by device type
    const deviceTypes = sessions.reduce((acc: Record<string, number>, session: any) => {
      const device = session.deviceInfo || "Unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count by browser
    const browsers = sessions.reduce((acc: Record<string, number>, session: any) => {
      const browser = session.browser || "Unknown";
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalSessions: sessions.length,
      deviceTypes,
      browsers,
      oldestSession: sessions[sessions.length - 1]?.loginTime,
      newestSession: sessions[0]?.loginTime,
    };
  }),
});
