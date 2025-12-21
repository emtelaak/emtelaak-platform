import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../_core/emailService";

const SALT_ROUNDS = 10;
const JWT_EXPIRY = "7d"; // 7 days

/**
 * Standard Authentication Router
 * Provides email/password authentication without external OAuth dependencies
 */
export const standardAuthRouter = router({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Generate unique openId for compatibility with existing system
      const openId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create user
      const result = await db.insert(users).values({
        email: input.email,
        password: passwordHash,
        name: input.name,
        phone: input.phone,
        openId,
        loginMethod: "email_password",
        role: "user",
        status: "active",
        lastSignedIn: new Date(),
      });

      // Get the created user
      const userId = Number(result[0].insertId);
      const newUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (newUser.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Send welcome email (non-blocking)
      sendWelcomeEmail({
        to: newUser[0].email!,
        userName: newUser[0].name || "User",
      }).catch((error) => {
        console.error("[Auth] Failed to send welcome email:", error);
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser[0].id,
          email: newUser[0].email,
          role: newUser[0].role,
        },
        ENV.jwtSecret,
        { expiresIn: JWT_EXPIRY }
      );

      return {
        success: true,
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          role: newUser[0].role,
        },
        token,
      };
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Find user by email
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const user = userResult[0];

      // Check if user has a password (might be OAuth-only user)
      if (!user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account uses a different login method",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        ENV.jwtSecret,
        { expiresIn: JWT_EXPIRY }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
        token,
      };
    }),

  /**
   * Verify JWT token and get current user
   */
  verifyToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, ENV.jwtSecret) as {
          userId: number;
          email: string;
          role: string;
        };

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Get user from database
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);

        if (userResult.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not found",
          });
        }

        const user = userResult[0];

        return {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
        });
      }
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Find user by email
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      // Always return success to prevent email enumeration
      if (userResult.length === 0) {
        return {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent",
        };
      }

      const user = userResult[0];

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.jwtSecret,
        { expiresIn: "1h" } // Token expires in 1 hour
      );

      // Generate reset link
      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      // Send password reset email
      const emailSent = await sendPasswordResetEmail({
        to: user.email!,
        userName: user.name || "User",
        resetLink,
      });

      if (emailSent) {
        console.log(`[Auth] Password reset email sent to ${input.email}`);
      } else {
        console.warn(`[Auth] Failed to send password reset email to ${input.email}`);
        // Still log token for development/testing if email fails
        console.log(`[Auth] Password reset token: ${resetToken}`);
      }

      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent",
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, ENV.jwtSecret) as {
          userId: number;
          email: string;
        };

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

        // Update password
        await db
          .update(users)
          .set({ password: passwordHash })
          .where(eq(users.id, decoded.userId));

        return {
          success: true,
          message: "Password has been reset successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired reset token",
        });
      }
    }),
});
