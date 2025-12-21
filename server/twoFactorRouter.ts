import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { generate2FASecret, verify2FACode, generateBackupCodes, hashBackupCode, verifyBackupCode, removeUsedBackupCode } from "./_core/twoFactorAuth";
import { getDb } from "./db";
import { users, user2fa } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { logSecurityEvent } from "./securityDb";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

// Helper function to get 2FA record for a user
async function get2FARecord(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [record] = await db
    .select()
    .from(user2fa)
    .where(eq(user2fa.userId, userId))
    .limit(1);
  
  return record || null;
}

// Helper function to upsert 2FA record
async function upsert2FARecord(userId: number, data: {
  secret?: string;
  enabled?: boolean;
  backupCodes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await get2FARecord(userId);
  
  if (existing) {
    await db
      .update(user2fa)
      .set(data)
      .where(eq(user2fa.userId, userId));
  } else {
    await db.insert(user2fa).values({
      userId,
      secret: data.secret || "",
      enabled: data.enabled ?? false,
      backupCodes: data.backupCodes || null,
    });
  }
}

export const twoFactorRouter = router({
  /**
   * Setup 2FA for the current user
   * Returns QR code and backup codes
   */
  setup: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Generate 2FA secret and QR code
    const setup = await generate2FASecret(ctx.user.email || ctx.user.name || "User");

    // Hash backup codes for storage
    const hashedBackupCodes = setup.backupCodes.map(hashBackupCode);

    // Store secret and backup codes in user_2fa table
    await upsert2FARecord(ctx.user.id, {
      secret: setup.secret,
      backupCodes: JSON.stringify(hashedBackupCodes),
      enabled: false, // Not enabled until verified
    });

    return {
      qrCode: setup.qrCode,
      backupCodes: setup.backupCodes, // Return plain codes for user to save
    };
  }),

  /**
   * Verify and enable 2FA
   * User must provide a valid TOTP code to confirm setup
   */
  enable: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user's 2FA record
      const twoFactorRecord = await get2FARecord(ctx.user.id);

      if (!twoFactorRecord || !twoFactorRecord.secret) {
        throw new Error("2FA not set up. Please run setup first.");
      }

      // Verify the code
      const isValid = verify2FACode(twoFactorRecord.secret, input.code);

      if (!isValid) {
        // Log failed attempt
        await logSecurityEvent({
          eventType: "2fa_failed",
          severity: "medium",
          userId: ctx.user.id,
          email: ctx.user.email,
          details: { action: "enable", reason: "Invalid code" },
        });

        throw new Error("Invalid verification code");
      }

      // Enable 2FA
      await upsert2FARecord(ctx.user.id, { enabled: true });

      // Log successful enable - using existing event type
      await logSecurityEvent({
        eventType: "2fa_failed", // Reusing existing enum value
        severity: "low",
        userId: ctx.user.id,
        email: ctx.user.email,
        details: { action: "2fa_enabled" },
      });

      return { success: true };
    }),

  /**
   * Verify 2FA code during login or sensitive operations
   * Also handles remember device functionality
   */
  verifyLogin: protectedProcedure
    .input(z.object({
      code: z.string(),
      rememberDevice: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user info
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      // Get user's 2FA settings
      const twoFactorRecord = await get2FARecord(ctx.user.id);

      if (!twoFactorRecord || !twoFactorRecord.enabled || !twoFactorRecord.secret) {
        throw new Error("2FA not enabled");
      }

      // Try TOTP code first
      const isValidTOTP = verify2FACode(twoFactorRecord.secret, input.code);

      if (isValidTOTP) {
        // Create full session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        
        // Set full session cookie
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        // Clear temporary cookies
        ctx.res.clearCookie("temp_session", cookieOptions);
        ctx.res.clearCookie("requires_2fa", cookieOptions);

        return {
          success: true,
          method: "totp",
          rememberDevice: input.rememberDevice || false,
        };
      }

      // Try backup code
      const backupCodes = twoFactorRecord.backupCodes
        ? JSON.parse(twoFactorRecord.backupCodes)
        : [];

      const isValidBackup = verifyBackupCode(input.code, backupCodes);

      if (isValidBackup) {
        // Remove used backup code
        const updatedCodes = removeUsedBackupCode(input.code, backupCodes);

        await upsert2FARecord(ctx.user.id, {
          backupCodes: JSON.stringify(updatedCodes),
        });

        // Log backup code usage
        await logSecurityEvent({
          eventType: "2fa_failed", // Reusing existing enum
          severity: "medium",
          userId: ctx.user.id,
          email: ctx.user.email,
          details: { action: "2fa_backup_used", remainingCodes: updatedCodes.length },
        });

        // Create full session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        
        // Set full session cookie
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        // Clear temporary cookies
        ctx.res.clearCookie("temp_session", cookieOptions);
        ctx.res.clearCookie("requires_2fa", cookieOptions);

        return {
          success: true,
          method: "backup",
          remainingBackupCodes: updatedCodes.length,
          rememberDevice: input.rememberDevice || false,
        };
      }

      // Log failed verification
      await logSecurityEvent({
        eventType: "2fa_failed",
        severity: "high",
        userId: ctx.user.id,
        email: ctx.user.email,
        details: { action: "verify_login" },
      });

      throw new Error("Invalid verification code");
    }),

  /**
   * Verify 2FA code during login or sensitive operations
   */
  verify: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user's 2FA settings
      const twoFactorRecord = await get2FARecord(ctx.user.id);

      if (!twoFactorRecord || !twoFactorRecord.enabled || !twoFactorRecord.secret) {
        throw new Error("2FA not enabled");
      }

      // Try TOTP code first
      const isValidTOTP = verify2FACode(twoFactorRecord.secret, input.code);

      if (isValidTOTP) {
        return { success: true, method: "totp" };
      }

      // Try backup code
      const backupCodes = twoFactorRecord.backupCodes
        ? JSON.parse(twoFactorRecord.backupCodes)
        : [];

      const isValidBackup = verifyBackupCode(input.code, backupCodes);

      if (isValidBackup) {
        // Remove used backup code
        const updatedCodes = removeUsedBackupCode(input.code, backupCodes);

        await upsert2FARecord(ctx.user.id, {
          backupCodes: JSON.stringify(updatedCodes),
        });

        // Log backup code usage
        await logSecurityEvent({
          eventType: "2fa_failed", // Reusing existing enum
          severity: "medium",
          userId: ctx.user.id,
          email: ctx.user.email,
          details: { action: "2fa_backup_used", remainingCodes: updatedCodes.length },
        });

        return { success: true, method: "backup", remainingBackupCodes: updatedCodes.length };
      }

      // Log failed verification
      await logSecurityEvent({
        eventType: "2fa_failed",
        severity: "high",
        userId: ctx.user.id,
        email: ctx.user.email,
        details: { action: "verify" },
      });

      throw new Error("Invalid verification code");
    }),

  /**
   * Disable 2FA
   * Requires current password or 2FA code for security
   */
  disable: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user's 2FA settings
      const twoFactorRecord = await get2FARecord(ctx.user.id);

      if (!twoFactorRecord || !twoFactorRecord.enabled || !twoFactorRecord.secret) {
        throw new Error("2FA not enabled");
      }

      // Verify code before disabling
      const isValid = verify2FACode(twoFactorRecord.secret, input.code);

      if (!isValid) {
        throw new Error("Invalid verification code");
      }

      // Disable 2FA and clear secrets
      await upsert2FARecord(ctx.user.id, {
        enabled: false,
        secret: "",
        backupCodes: undefined,
      });

      // Log disable action
      await logSecurityEvent({
        eventType: "2fa_failed", // Reusing existing enum
        severity: "medium",
        userId: ctx.user.id,
        email: ctx.user.email,
        details: { action: "2fa_disabled" },
      });

      return { success: true };
    }),

  /**
   * Regenerate backup codes
   * Requires 2FA code for security
   */
  regenerateBackupCodes: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user's 2FA settings
      const twoFactorRecord = await get2FARecord(ctx.user.id);

      if (!twoFactorRecord || !twoFactorRecord.enabled || !twoFactorRecord.secret) {
        throw new Error("2FA not enabled");
      }

      // Verify code before regenerating
      const isValid = verify2FACode(twoFactorRecord.secret, input.code);

      if (!isValid) {
        throw new Error("Invalid verification code");
      }

      // Generate new backup codes
      const newBackupCodes = generateBackupCodes();
      const hashedBackupCodes = newBackupCodes.map(hashBackupCode);

      // Update backup codes
      await upsert2FARecord(ctx.user.id, {
        backupCodes: JSON.stringify(hashedBackupCodes),
      });

      // Log regeneration
      await logSecurityEvent({
        eventType: "2fa_failed", // Reusing existing enum
        severity: "low",
        userId: ctx.user.id,
        email: ctx.user.email,
        details: { action: "backup_codes_regenerated" },
      });

      return {
        success: true,
        backupCodes: newBackupCodes, // Return plain codes for user to save
      };
    }),

  /**
   * Get 2FA status for current user
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const twoFactorRecord = await get2FARecord(ctx.user.id);

    if (!twoFactorRecord) {
      return {
        enabled: false,
        hasBackupCodes: false,
        remainingBackupCodes: 0,
      };
    }

    const backupCodes = twoFactorRecord.backupCodes
      ? JSON.parse(twoFactorRecord.backupCodes)
      : [];

    return {
      enabled: twoFactorRecord.enabled,
      hasBackupCodes: backupCodes.length > 0,
      remainingBackupCodes: backupCodes.length,
    };
  }),

  /**
   * Admin: Toggle 2FA for a user
   */
  adminToggleUser2FA: protectedProcedure
    .input(z.object({ userId: z.number(), enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      // Check if current user is admin
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      await upsert2FARecord(input.userId, { enabled: input.enabled });

      return {
        success: true,
        message: input.enabled ? '2FA enabled for user' : '2FA disabled for user',
      };
    }),

  /**
   * Admin: Reset 2FA for a user
   */
  adminResetUser2FA: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Check if current user is admin
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      // Reset 2FA completely
      await upsert2FARecord(input.userId, {
        enabled: false,
        secret: "",
        backupCodes: undefined,
      });

      return {
        success: true,
        message: '2FA reset successfully for user',
      };
    }),
});
