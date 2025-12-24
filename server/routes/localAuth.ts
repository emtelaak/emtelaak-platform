import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb, createUserSession, updateUserLastLogin } from "../db";
import { users } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { hashPassword, comparePassword, validatePasswordStrength, generateResetToken, generateVerificationToken } from "../utils/password";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ENV } from "../_core/env";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import crypto from "crypto";
import { getPlatformAccessMode } from "../db/platformSettingsDb";

/**
 * Local Authentication Router
 * Handles email/password authentication with optional 2FA
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
        invitationCode: z.string().optional(),
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

      // Check platform access mode
      const accessMode = await getPlatformAccessMode();
      
      if (accessMode === "private") {
        // Validate invitation code
        if (!input.invitationCode) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invitation code is required for registration",
          });
        }

        // Check if invitation code is valid
        const invitationResult = await db.execute(sql`
          SELECT * FROM platform_invitations 
          WHERE code = ${input.invitationCode} 
          AND isActive = true 
          AND (maxUses = 0 OR usedCount < maxUses)
          AND (expiresAt IS NULL OR expiresAt > NOW())
          LIMIT 1
        `);

        const invitation = (invitationResult as any)[0]?.[0];
        
        if (!invitation) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid or expired invitation code",
          });
        }

        // If invitation is email-specific, verify email matches
        if (invitation.email && invitation.email !== input.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This invitation code is not valid for your email address",
          });
        }
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

      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Create user with a generated openId for compatibility
      // SECURITY FIX: Use crypto for secure random ID generation
      const openId = `local_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      
      await db.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        password: passwordHash,
        loginMethod: "email_password",
        role: "user",
        status: "pending_verification",
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        lastSignedIn: new Date(),
      });

      // Get the created user
      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      // Update invitation code usage if in private mode
      if (accessMode === "private" && input.invitationCode) {
        await db.execute(sql`
          UPDATE platform_invitations 
          SET usedCount = usedCount + 1, 
              usedAt = NOW(),
              usedBy = ${newUser.id}
          WHERE code = ${input.invitationCode}
        `);
      }

      // Create JWT token
      const token = jwt.sign(
        { openId: newUser.openId, userId: newUser.id, role: newUser.role },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL || "https://emtelaak.com"}/verify-email?token=${verificationToken}`;
      
      try {
        const { sendEmail, generateEmailVerificationEmail } = await import("../_core/emailService");
        const emailContent = generateEmailVerificationEmail({
          userName: newUser.name || newUser.email || "User",
          verificationLink,
        });
        
        await sendEmail({
          to: newUser.email!,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        
        console.log(`[Auth] Verification email sent to ${newUser.email}`);
      } catch (error) {
        console.error(`[Auth] Failed to send verification email:`, error);
        // Don't throw error - user is still registered
      }

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          emailVerified: false,
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
        rememberMe: z.boolean().optional().default(false),
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
          message: "This account does not have a password set. Please contact support.",
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

      // Update last signed in and last login
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));
      
      await updateUserLastLogin(user.id);

      // Create JWT token with extended expiry if rememberMe is true
      const tokenExpiry = input.rememberMe ? "30d" : "7d";
      const token = jwt.sign(
        { openId: user.openId, userId: user.id, role: user.role },
        ENV.jwtSecret,
        { expiresIn: tokenExpiry }
      );
      
      // Extract device and browser information
      const userAgent = ctx.req.headers["user-agent"] || "Unknown";
      const ipAddress = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0] || 
                       (ctx.req.headers["x-real-ip"] as string) || 
                       ctx.req.socket.remoteAddress || "Unknown";
      
      // Parse browser info from user agent
      const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/([\d.]+)/);
      const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : "Unknown Browser";
      
      // Create session record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (input.rememberMe ? 30 : 7));
      
      // Generate a unique session ID from the token (use hash to keep it short)
      const sessionId = crypto.createHash('sha256').update(token).digest('hex').substring(0, 64);
      
      console.log('[Login] Creating session with ID:', sessionId);
      console.log('[Login] Session ID length:', sessionId.length);
      
      await createUserSession({
        sessionId,
        userId: user.id,
        deviceInfo: userAgent,
        ipAddress,
        browser,
        expiresAt,
      });

      // Set cookie with extended maxAge if rememberMe is true
      const cookieOptions = getSessionCookieOptions(ctx.req);
      if (input.rememberMe) {
        // 30 days in milliseconds
        cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
      }
      
      console.log('[Login] Setting cookie:', COOKIE_NAME);
      console.log('[Login] Cookie options:', cookieOptions);
      console.log('[Login] Token (first 20 chars):', token.substring(0, 20));
      
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      
      console.log('[Login] Cookie set successfully');

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
          message: "This account does not have a password set. Please contact support.",
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

      // Send password reset email
      const resetLink = `${process.env.FRONTEND_URL || "https://emtelaak.com"}/reset-password?token=${resetToken}`;
      
      try {
        const { sendEmail, generatePasswordResetEmail } = await import("../_core/emailService");
        const emailContent = generatePasswordResetEmail({
          userName: user.name || user.email || "User",
          resetLink,
        });
        
        await sendEmail({
          to: user.email!,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        
        console.log(`[Auth] Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error(`[Auth] Failed to send password reset email:`, error);
        // Don't throw error to prevent email enumeration
      }

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

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Verification token is required"),
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

      // Find user with valid verification token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, input.token))
        .limit(1);

      if (!user || !user.emailVerificationExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification token",
        });
      }

      // Check if token is expired
      if (new Date() > user.emailVerificationExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification token has expired. Please request a new one.",
        });
      }

      // Update user as verified
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
          status: "active",
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Email verified successfully. You can now access all platform features.",
      };
    }),

  /**
   * Resend verification email
   */
  resendVerificationEmail: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
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

      // Check if already verified
      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is already verified",
        });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Update user with new token
      await db
        .update(users)
        .set({
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
        })
        .where(eq(users.id, user.id));

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL || "https://emtelaak.com"}/verify-email?token=${verificationToken}`;
      
      try {
        const { sendEmail, generateEmailVerificationEmail } = await import("../_core/emailService");
        const emailContent = generateEmailVerificationEmail({
          userName: user.name || user.email || "User",
          verificationLink,
        });
        
        await sendEmail({
          to: user.email!,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        
        console.log(`[Auth] Verification email resent to ${user.email}`);
      } catch (error) {
        console.error(`[Auth] Failed to resend verification email:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email. Please try again later.",
        });
      }

      return {
        success: true,
        message: "Verification email sent. Please check your inbox.",
      };
    }),

});
