import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { getDb } from "./db";
import { securityEvents, users, InsertSecurityEvent } from "../drizzle/schema";

/**
 * Log a security event
 */
export async function logSecurityEvent(event: InsertSecurityEvent) {
  const db = await getDb();
  if (!db) {
    console.warn("[Security] Cannot log event: database not available");
    return null;
  }

  try {
    const [result] = await db.insert(securityEvents).values(event);
    const eventId = result.insertId;

    // Broadcast critical/high severity events to admins via WebSocket
    if (event.severity === "critical" || event.severity === "high") {
      try {
        const { broadcastSecurityEvent } = await import("./_core/socket");
        broadcastSecurityEvent({
          id: eventId,
          eventType: event.eventType,
          severity: event.severity,
          ipAddress: event.ipAddress,
          email: event.email,
          userAgent: event.userAgent,
          endpoint: event.endpoint,
          details: event.details,
          createdAt: event.createdAt || new Date(),
        });
      } catch (broadcastError) {
        console.error("[Security] Failed to broadcast event:", broadcastError);
      }
    }

    // Check automatic IP blocking rules for relevant event types
    if (event.ipAddress && [
      "failed_login",
      "rate_limit_hit",
      "suspicious_activity",
    ].includes(event.eventType)) {
      try {
        const { checkAutoBlockRules } = await import("./autoIPBlocking");
        await checkAutoBlockRules(event.ipAddress);
      } catch (autoBlockError) {
        console.error("[Security] Failed to check auto-block rules:", autoBlockError);
      }
    }

    return eventId;
  } catch (error) {
    console.error("[Security] Failed to log event:", error);
    return null;
  }
}

/**
 * Get security events with optional filters
 */
export async function getSecurityEvents(filters: {
  eventType?: string;
  userId?: number;
  ipAddress?: string;
  severity?: string;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [];

    if (filters.eventType) {
      conditions.push(eq(securityEvents.eventType, filters.eventType as any));
    }
    if (filters.userId) {
      conditions.push(eq(securityEvents.userId, filters.userId));
    }
    if (filters.ipAddress) {
      conditions.push(eq(securityEvents.ipAddress, filters.ipAddress));
    }
    if (filters.severity) {
      conditions.push(eq(securityEvents.severity, filters.severity as any));
    }
    if (filters.resolved !== undefined) {
      conditions.push(eq(securityEvents.resolved, filters.resolved));
    }
    if (filters.startDate) {
      conditions.push(gte(securityEvents.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(securityEvents.createdAt, filters.endDate));
    }

    let query = db
      .select({
        event: securityEvents,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(securityEvents)
      .leftJoin(users, eq(securityEvents.userId, users.id))
      .orderBy(desc(securityEvents.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  } catch (error) {
    console.error("[Security] Failed to get events:", error);
    return [];
  }
}

/**
 * Get security event statistics
 */
export async function getSecurityStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  try {
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(gte(securityEvents.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(securityEvents.createdAt, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        totalEvents: count(),
        failedLogins: sql<number>`SUM(CASE WHEN ${securityEvents.eventType} = 'failed_login' THEN 1 ELSE 0 END)`,
        accountLockouts: sql<number>`SUM(CASE WHEN ${securityEvents.eventType} = 'account_lockout' THEN 1 ELSE 0 END)`,
        rateLimitHits: sql<number>`SUM(CASE WHEN ${securityEvents.eventType} = 'rate_limit_hit' THEN 1 ELSE 0 END)`,
        suspiciousActivities: sql<number>`SUM(CASE WHEN ${securityEvents.eventType} = 'suspicious_activity' THEN 1 ELSE 0 END)`,
        criticalEvents: sql<number>`SUM(CASE WHEN ${securityEvents.severity} = 'critical' THEN 1 ELSE 0 END)`,
        unresolvedEvents: sql<number>`SUM(CASE WHEN ${securityEvents.resolved} = FALSE THEN 1 ELSE 0 END)`,
      })
      .from(securityEvents)
      .where(whereClause);

    return stats;
  } catch (error) {
    console.error("[Security] Failed to get stats:", error);
    return null;
  }
}

/**
 * Get failed login attempts for a specific user or IP
 */
export async function getFailedLoginAttempts(params: {
  userId?: number;
  email?: string;
  ipAddress?: string;
  since?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [eq(securityEvents.eventType, "failed_login" as any)];

    if (params.userId) {
      conditions.push(eq(securityEvents.userId, params.userId));
    }
    if (params.email) {
      conditions.push(eq(securityEvents.email, params.email));
    }
    if (params.ipAddress) {
      conditions.push(eq(securityEvents.ipAddress, params.ipAddress));
    }
    if (params.since) {
      conditions.push(gte(securityEvents.createdAt, params.since));
    }

    return await db
      .select()
      .from(securityEvents)
      .where(and(...conditions))
      .orderBy(desc(securityEvents.createdAt));
  } catch (error) {
    console.error("[Security] Failed to get failed login attempts:", error);
    return [];
  }
}

/**
 * Resolve a security event
 */
export async function resolveSecurityEvent(eventId: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(securityEvents)
      .set({
        resolved: true,
        resolvedBy,
      })
      .where(eq(securityEvents.id, eventId));

    return true;
  } catch (error) {
    console.error("[Security] Failed to resolve event:", error);
    return false;
  }
}

/**
 * Get top IP addresses with most security events
 */
export async function getTopOffendingIPs(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select({
        ipAddress: securityEvents.ipAddress,
        eventCount: count(),
        lastEvent: sql<Date>`MAX(${securityEvents.createdAt})`,
      })
      .from(securityEvents)
      .where(sql`${securityEvents.ipAddress} IS NOT NULL`)
      .groupBy(securityEvents.ipAddress)
      .orderBy(desc(count()))
      .limit(limit);
  } catch (error) {
    console.error("[Security] Failed to get top IPs:", error);
    return [];
  }
}

/**
 * Get security events by IP address (for auto-blocking checks)
 */
export async function getSecurityEventsByIP(filters: {
  ipAddress: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [eq(securityEvents.ipAddress, filters.ipAddress)];

    if (filters.eventType) {
      conditions.push(eq(securityEvents.eventType, filters.eventType as any));
    }
    if (filters.startDate) {
      conditions.push(gte(securityEvents.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(securityEvents.createdAt, filters.endDate));
    }

    const events = await db
      .select()
      .from(securityEvents)
      .where(and(...conditions))
      .orderBy(desc(securityEvents.createdAt));

    return events;
  } catch (error) {
    console.error("[Security] Failed to get events by IP:", error);
    return [];
  }
}
