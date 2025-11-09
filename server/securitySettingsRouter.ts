import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { securitySettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { logSecurityEvent } from "./securityDb";
import { DEFAULT_AUTO_BLOCK_CONFIG } from "./autoIPBlocking";

/**
 * Security Settings Router
 * Allows admins to view and modify automatic IP blocking thresholds
 */
export const securitySettingsRouter = router({
  /**
   * Get all security settings
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    // Admin-only access
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view security settings',
      });
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const settings = await db.select().from(securitySettings);
    
    // Convert array to object for easier frontend consumption
    const settingsObj: Record<string, { value: string; description: string }> = {};
    for (const setting of settings) {
      settingsObj[setting.settingKey] = {
        value: setting.settingValue,
        description: setting.description || '',
      };
    }

    return settingsObj;
  }),

  /**
   * Update a single security setting
   */
  updateSetting: protectedProcedure
    .input(z.object({
      settingKey: z.string(),
      settingValue: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Admin-only access
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can modify security settings',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Validate setting key
      const validKeys = [
        'failed_login_threshold',
        'failed_login_window_minutes',
        'rate_limit_threshold',
        'rate_limit_window_minutes',
        'suspicious_activity_threshold',
        'suspicious_activity_window_minutes',
        'auto_block_expiry_hours',
      ];

      if (!validKeys.includes(input.settingKey)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid setting key',
        });
      }

      // Validate setting value (must be positive integer)
      const value = parseInt(input.settingValue, 10);
      if (isNaN(value) || value <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Setting value must be a positive integer',
        });
      }

      // Update setting
      await db
        .update(securitySettings)
        .set({
          settingValue: input.settingValue,
          updatedBy: ctx.user.id,
        })
        .where(eq(securitySettings.settingKey, input.settingKey));

      // Log security event
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        severity: 'high',
        userId: ctx.user.id,
        ipAddress: 'admin_action',
        userAgent: 'admin_dashboard',
        details: `Admin ${ctx.user.name} (ID: ${ctx.user.id}) updated security setting: ${input.settingKey} = ${input.settingValue}`,
      });

      return {
        success: true,
        message: 'Security setting updated successfully',
      };
    }),

  /**
   * Update multiple security settings at once
   */
  updateSettings: protectedProcedure
    .input(z.object({
      settings: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Admin-only access
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can modify security settings',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Validate all settings
      const validKeys = [
        'failed_login_threshold',
        'failed_login_window_minutes',
        'rate_limit_threshold',
        'rate_limit_window_minutes',
        'suspicious_activity_threshold',
        'suspicious_activity_window_minutes',
        'auto_block_expiry_hours',
      ];

      for (const [key, value] of Object.entries(input.settings)) {
        if (!validKeys.includes(key)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid setting key: ${key}`,
          });
        }

        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid value for ${key}: must be a positive integer`,
          });
        }
      }

      // Update all settings
      for (const [key, value] of Object.entries(input.settings)) {
        await db
          .update(securitySettings)
          .set({
            settingValue: value,
            updatedBy: ctx.user.id,
          })
          .where(eq(securitySettings.settingKey, key));
      }

      // Log security event
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        severity: 'critical',
        userId: ctx.user.id,
        ipAddress: 'admin_action',
        userAgent: 'admin_dashboard',
        details: `Admin ${ctx.user.name} (ID: ${ctx.user.id}) updated ${Object.keys(input.settings).length} security settings`,
      });

      return {
        success: true,
        message: 'Security settings updated successfully',
      };
    }),

  /**
   * Reset all settings to default values
   */
  resetToDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    // Admin-only access
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can reset security settings',
      });
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Reset to default values
    const defaults = {
      failed_login_threshold: DEFAULT_AUTO_BLOCK_CONFIG.failedLoginThreshold.toString(),
      failed_login_window_minutes: DEFAULT_AUTO_BLOCK_CONFIG.failedLoginWindowMinutes.toString(),
      rate_limit_threshold: DEFAULT_AUTO_BLOCK_CONFIG.rateLimitThreshold.toString(),
      rate_limit_window_minutes: DEFAULT_AUTO_BLOCK_CONFIG.rateLimitWindowMinutes.toString(),
      suspicious_activity_threshold: DEFAULT_AUTO_BLOCK_CONFIG.suspiciousActivityThreshold.toString(),
      suspicious_activity_window_minutes: DEFAULT_AUTO_BLOCK_CONFIG.suspiciousActivityWindowMinutes.toString(),
      auto_block_expiry_hours: DEFAULT_AUTO_BLOCK_CONFIG.autoBlockExpiryHours.toString(),
    };

    for (const [key, value] of Object.entries(defaults)) {
      await db
        .update(securitySettings)
        .set({
          settingValue: value,
          updatedBy: ctx.user.id,
        })
        .where(eq(securitySettings.settingKey, key));
    }

    // Log security event
    await logSecurityEvent({
      eventType: 'suspicious_activity',
      severity: 'high',
      userId: ctx.user.id,
      ipAddress: 'admin_action',
      userAgent: 'admin_dashboard',
      details: `Admin ${ctx.user.name} (ID: ${ctx.user.id}) reset all security settings to defaults`,
    });

    return {
      success: true,
      message: 'Security settings reset to defaults',
    };
  }),
});
