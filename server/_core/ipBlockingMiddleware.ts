import { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { blockedIPs } from "../../drizzle/schema";
import { eq, and, or, gt, isNull } from "drizzle-orm";

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp;
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * Check if an IP address is whitelisted
 */
export function isIPWhitelisted(ip: string): boolean {
  // Whitelist localhost and private IP ranges
  const whitelist = [
    "127.0.0.1",
    "::1",
    "localhost",
  ];
  
  // Check exact matches
  if (whitelist.includes(ip)) {
    return true;
  }
  
  // Check private IP ranges
  if (ip.startsWith("10.") || 
      ip.startsWith("192.168.") || 
      ip.startsWith("172.")) {
    return true;
  }
  
  return false;
}

/**
 * IP blocking middleware
 * Checks if the client IP is blocked before allowing the request
 */
export async function ipBlockingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientIP = getClientIP(req);
    
    // Skip check for whitelisted IPs
    if (isIPWhitelisted(clientIP)) {
      next();
      return;
    }
    
    const db = await getDb();
    if (!db) {
      // If database is unavailable, allow the request
      next();
      return;
    }
    
    // Check if IP is blocked
    const [blockedIP] = await db
      .select()
      .from(blockedIPs)
      .where(
        and(
          eq(blockedIPs.ipAddress, clientIP),
          or(
            isNull(blockedIPs.expiresAt),
            gt(blockedIPs.expiresAt, new Date())
          )
        )
      )
      .limit(1);
    
    if (blockedIP) {
      res.status(403).json({
        error: "Access Denied",
        message: "Your IP address has been blocked. Please contact support if you believe this is an error.",
        blockedAt: blockedIP.blockedAt,
        reason: blockedIP.reason,
      });
      return;
    }
    
    // IP is not blocked, proceed
    next();
  } catch (error) {
    console.error("[IP Blocking] Middleware error:", error);
    // On error, allow the request to proceed
    next();
  }
}
