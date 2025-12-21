import { eq, and, or, isNull, lt } from "drizzle-orm";
import { getDb } from "./db";
import { blockedIPs, InsertBlockedIP } from "../drizzle/schema";

/**
 * Check if an IP address is currently blocked
 */
export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[IP Blocking] Cannot check IP: database not available");
    return false;
  }

  try {
    const now = new Date();
    const result = await db
      .select()
      .from(blockedIPs)
      .where(
        and(
          eq(blockedIPs.ipAddress, ipAddress),
          eq(blockedIPs.isActive, 1),
          or(
            isNull(blockedIPs.expiresAt),
            // @ts-expect-error - Drizzle ORM Date comparison type issue
            lt(now, blockedIPs.expiresAt)
          )
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[IP Blocking] Failed to check IP:", error);
    return false;
  }
}

/**
 * Block an IP address
 */
export async function blockIP(data: InsertBlockedIP) {
  const db = await getDb();
  if (!db) {
    console.warn("[IP Blocking] Cannot block IP: database not available");
    return null;
  }

  try {
    const [result] = await db.insert(blockedIPs).values(data);
    return result.insertId;
  } catch (error) {
    console.error("[IP Blocking] Failed to block IP:", error);
    return null;
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIP(ipAddress: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[IP Blocking] Cannot unblock IP: database not available");
    return false;
  }

  try {
    await db
      .update(blockedIPs)
      .set({ isActive: 0 })
      .where(eq(blockedIPs.ipAddress, ipAddress));
    return true;
  } catch (error) {
    console.error("[IP Blocking] Failed to unblock IP:", error);
    return false;
  }
}

/**
 * Get all blocked IPs with optional filters
 */
export async function getBlockedIPs(filters?: {
  isActive?: boolean;
  blockType?: "manual" | "automatic";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[IP Blocking] Cannot get blocked IPs: database not available");
    return [];
  }

  try {
    let query = db.select().from(blockedIPs);

    const conditions = [];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(blockedIPs.isActive, filters.isActive ? 1 : 0));
    }
    if (filters?.blockType) {
      conditions.push(eq(blockedIPs.blockType, filters.blockType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  } catch (error) {
    console.error("[IP Blocking] Failed to get blocked IPs:", error);
    return [];
  }
}

/**
 * Get blocked IP by IP address
 */
export async function getBlockedIPByAddress(ipAddress: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[IP Blocking] Cannot get blocked IP: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(blockedIPs)
      .where(eq(blockedIPs.ipAddress, ipAddress))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[IP Blocking] Failed to get blocked IP:", error);
    return null;
  }
}

/**
 * Delete expired IP blocks
 */
export async function cleanupExpiredBlocks() {
  const db = await getDb();
  if (!db) {
    console.warn("[IP Blocking] Cannot cleanup: database not available");
    return 0;
  }

  try {
    const now = new Date();
    const result = await db
      .update(blockedIPs)
      .set({ isActive: 0 })
      .where(
        and(
          eq(blockedIPs.isActive, 1),
          lt(blockedIPs.expiresAt, now)
        )
      );

    // @ts-expect-error - Drizzle ORM type definition issue
    return result.rowsAffected || 0;
  } catch (error) {
    console.error("[IP Blocking] Failed to cleanup expired blocks:", error);
    return 0;
  }
}
