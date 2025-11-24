import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

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
      // Add clock tolerance to handle server time skew issues
      // This allows tokens to be valid even if server clocks are slightly off
      const decoded = jwt.verify(jwtToken, ENV.jwtSecret, {
        clockTolerance: 30 * 24 * 60 * 60, // 30 days tolerance in seconds
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
        }
      }
    } catch (error) {
      // JWT verification failed, continue to OAuth fallback
      console.log("[Auth] JWT verification failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  // Fallback to OAuth authentication if JWT auth didn't succeed
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
