import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import type { MySql2Database } from "drizzle-orm/mysql2";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  db: MySql2Database<Record<string, unknown>> | null;
};

/**
 * Creates the tRPC context for each request
 * Uses JWT-based authentication only (email/password login)
 * OAuth has been removed - all authentication is via email/password with optional 2FA
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let jwtToken: string | null = null;

  // First, try JWT authentication from Authorization header
  const authHeader = opts.req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    jwtToken = authHeader.substring(7); // Remove "Bearer " prefix
  }

  // If no Authorization header, check for JWT in cookie
  if (!jwtToken && opts.req.cookies) {
    jwtToken = opts.req.cookies[COOKIE_NAME] || null;
  }

  // If we have a JWT token, verify and load user
  if (jwtToken) {
    try {
      // SECURITY FIX: Reduced clock tolerance from 30 days to 5 minutes
      // This prevents expired tokens from remaining valid for extended periods
      const decoded = jwt.verify(jwtToken, ENV.jwtSecret, {
        clockTolerance: 300, // 5 minutes tolerance in seconds (was 30 days)
      }) as {
        openId: string;
        userId: number;
      };

      const db = await getDb();
      if (db) {
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);

        if (userResult.length > 0) {
          user = userResult[0];
          
          // SECURITY ENHANCEMENT: Check if user is suspended or inactive
          if (user.status === 'suspended') {
            console.log("[Auth] Suspended user attempted access:", user.id);
            user = null; // Reject suspended users
          }
        }
      }
    } catch (error) {
      // JWT verification failed - user remains null (not authenticated)
      console.log("[Auth] JWT verification failed:", error instanceof Error ? error.message : "Unknown error");
      
      // SECURITY ENHANCEMENT: Log failed authentication attempts
      if (error instanceof jwt.TokenExpiredError) {
        console.log("[Auth] Token expired for request");
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.log("[Auth] Invalid token signature");
      }
    }
  }

  // No OAuth fallback - authentication is JWT-only
  // User will be null if not authenticated, which is fine for public procedures

  const db = await getDb();

  return {
    req: opts.req,
    res: opts.res,
    user,
    db,
  };
}
