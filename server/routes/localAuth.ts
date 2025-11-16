import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, comparePassword, validatePasswordStrength, generateResetToken } from "../utils/password";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ENV } from "../_core/env";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

/**
 * Local Authentication Router
 * Handles email/password authentication alongside Manus OAuth
 */
export const localAuthRouter = router({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(input.password);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.error || "Invalid password",
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
      const passwordHash = await hashPassword(input.password);

      // Create user with a generated openId for compatibility
      const openId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await db.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        password: passwordHash,
        loginMethod: "email_password",
        role: "user",
        status: "active",
        lastSignedIn: new Date(),
      });

      // Get the created user
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      // Create JWT token
      const token = jwt.sign(
        { openId: newUser.openId, userId: newUser.id },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
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
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check if user has a password (local auth)
      if (!user.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This account uses OAuth login. Please use the OAuth login button.",
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(input.password, user.password);
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

      // Create JWT token
      const token = jwt.sign(
        { openId: user.openId, userId: user.id },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  /**
   * Change password for authenticated user
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.error || "Invalid password",
        });
      }

      // Get current user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if user has a password (local auth)
      if (!user.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This account uses OAuth login. Password cannot be changed here.",
        });
      }

      // Verify current password
      const isValidPassword = await comparePassword(input.currentPassword, user.password);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(input.newPassword);

      // Update password
      await db
        .update(users)
        .set({ password: newPasswordHash })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Password changed successfully",
      };
    }),

  /**
   * Request password reset (send reset email)
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
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user || !user.password) {
        return {
          success: true,
          message: "If an account exists with this email, a password reset link will be sent.",
        };
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save reset token to database
      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpiry: resetExpiry,
        })
        .where(eq(users.id, user.id));

      // TODO: Send email with reset link
      // For now, we'll just log it (in production, use email service)
      console.log(`Password reset token for ${user.email}: ${resetToken}`);
      console.log(`Reset link: ${process.env.VITE_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`);

      return {
        success: true,
        message: "If an account exists with this email, a password reset link will be sent.",
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
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

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(input.newPassword);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.error || "Invalid password",
        });
      }

      // Find user with valid reset token
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.passwordResetToken, input.token),
            // Check token hasn't expired
          )
        )
        .limit(1);

      if (!user || !user.passwordResetExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Check if token is expired
      if (new Date() > user.passwordResetExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reset token has expired. Please request a new one.",
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(input.newPassword);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          password: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Password reset successfully. You can now login with your new password.",
      };
    }),
});
