import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First, try JWT authentication from Authorization header
  const authHeader = opts.req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    try {
      const decoded = jwt.verify(token, ENV.jwtSecret) as {
        userId: number;
        email: string;
        role: string;
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
