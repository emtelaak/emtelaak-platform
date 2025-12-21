import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { trustedDevices } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate device fingerprint from user agent and other device info
 */
function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const data = `${userAgent}|${ipAddress}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Get device name from user agent
 */
function getDeviceNameFromUserAgent(userAgent: string): string {
  // Simple device detection
  if (/mobile/i.test(userAgent)) {
    if (/iphone/i.test(userAgent)) return "iPhone";
    if (/ipad/i.test(userAgent)) return "iPad";
    if (/android/i.test(userAgent)) return "Android Device";
    return "Mobile Device";
  }
  
  if (/macintosh/i.test(userAgent)) return "Mac";
  if (/windows/i.test(userAgent)) return "Windows PC";
  if (/linux/i.test(userAgent)) return "Linux PC";
  
  return "Unknown Device";
}

export const trustedDevicesRouter = router({
  /**
   * Check if current device is trusted
   */
  checkTrustedDevice: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return { isTrusted: false };
    }

    const userAgent = ctx.req.headers["user-agent"] || "";
    const ipAddress = ctx.req.ip || ctx.req.socket.remoteAddress || "";
    const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);

    const [device] = await db
      .select()
      .from(trustedDevices)
      .where(
        and(
          eq(trustedDevices.userId, ctx.user.id),
          eq(trustedDevices.deviceFingerprint, fingerprint),
          gt(trustedDevices.expiresAt, new Date())
        )
      )
      .limit(1);

    if (device) {
      // Update last used timestamp
      await db
        .update(trustedDevices)
        .set({ lastUsed: new Date() })
        .where(eq(trustedDevices.id, device.id));

      return { isTrusted: true, device };
    }

    return { isTrusted: false };
  }),

  /**
   * Add current device to trusted devices
   */
  addTrustedDevice: protectedProcedure
    .input(
      z.object({
        deviceName: z.string().optional(),
        expiryDays: z.number().default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const userAgent = ctx.req.headers["user-agent"] || "";
      const ipAddress = ctx.req.ip || ctx.req.socket.remoteAddress || "";
      const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);

      const deviceName =
        input.deviceName || getDeviceNameFromUserAgent(userAgent);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiryDays);

      // Check if device already exists
      const [existing] = await db
        .select()
        .from(trustedDevices)
        .where(
          and(
            eq(trustedDevices.userId, ctx.user.id),
            eq(trustedDevices.deviceFingerprint, fingerprint)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing device
        await db
          .update(trustedDevices)
          .set({
            deviceName,
            userAgent,
            ipAddress,
            expiresAt,
            lastUsed: new Date(),
          })
          .where(eq(trustedDevices.id, existing.id));

        return { success: true, deviceId: existing.id };
      }

      // Insert new trusted device
      const result = await db.insert(trustedDevices).values({
        userId: ctx.user.id,
        deviceFingerprint: fingerprint,
        deviceName,
        userAgent,
        ipAddress,
        expiresAt,
      });

      // @ts-expect-error - Drizzle ORM type definition issue
      return { success: true, deviceId: Number(result.insertId) };
    }),

  /**
   * Remove a trusted device
   */
  removeTrustedDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .delete(trustedDevices)
        .where(
          and(
            eq(trustedDevices.id, input.deviceId),
            eq(trustedDevices.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * List all trusted devices for current user
   */
  listTrustedDevices: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const devices = await db
      .select({
        id: trustedDevices.id,
        deviceName: trustedDevices.deviceName,
        ipAddress: trustedDevices.ipAddress,
        lastUsed: trustedDevices.lastUsed,
        createdAt: trustedDevices.createdAt,
        expiresAt: trustedDevices.expiresAt,
      })
      .from(trustedDevices)
      .where(
        and(
          eq(trustedDevices.userId, ctx.user.id),
          gt(trustedDevices.expiresAt, new Date())
        )
      )
      .orderBy(trustedDevices.lastUsed);

    return devices;
  }),

  /**
   * Remove all trusted devices for current user
   */
  removeAllTrustedDevices: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db
      .delete(trustedDevices)
      .where(eq(trustedDevices.userId, ctx.user.id));

    return { success: true };
  }),

  /**
   * Clean up expired trusted devices (admin only)
   */
  cleanupExpiredDevices: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db
      .delete(trustedDevices)
      // @ts-expect-error - Drizzle ORM Date comparison type issue
      .where(gt(new Date(), trustedDevices.expiresAt));

    // @ts-expect-error - Drizzle ORM type definition issue
    return { success: true, deletedCount: result.rowsAffected || 0 };
  }),
});
