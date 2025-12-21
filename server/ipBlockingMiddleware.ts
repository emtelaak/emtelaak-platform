import { Request, Response, NextFunction } from "express";
// @ts-expect-error - Module path resolution issue
import { isIPBlocked } from "../ipBlockingDb";

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  // Check X-Forwarded-For header (for proxies/load balancers)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(",")[0].trim();
  }

  // Check X-Real-IP header
  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  // Fallback to socket address
  return req.socket.remoteAddress || "unknown";
}

/**
 * Middleware to block requests from blocked IPs
 */
export async function ipBlockingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const clientIP = getClientIP(req);

  // Skip check for unknown IPs
  if (clientIP === "unknown") {
    return next();
  }

  try {
    const blocked = await isIPBlocked(clientIP);

    if (blocked) {
      console.log(`[IP Blocking] Blocked request from ${clientIP} to ${req.path}`);
      return res.status(403).json({
        error: "Access Denied",
        message: "Your IP address has been blocked. Please contact support if you believe this is an error.",
        code: "IP_BLOCKED",
      });
    }

    next();
  } catch (error) {
    console.error("[IP Blocking] Error checking IP:", error);
    // On error, allow the request to proceed (fail open)
    next();
  }
}

/**
 * Whitelist of IPs that should never be blocked
 * Add your server IPs, monitoring services, etc.
 */
const IP_WHITELIST = new Set([
  "127.0.0.1",
  "::1",
  "localhost",
]);

/**
 * Check if an IP is whitelisted
 */
export function isIPWhitelisted(ip: string): boolean {
  return IP_WHITELIST.has(ip);
}

/**
 * Add IP to whitelist
 */
export function addToWhitelist(ip: string): void {
  IP_WHITELIST.add(ip);
}

/**
 * Remove IP from whitelist
 */
export function removeFromWhitelist(ip: string): void {
  IP_WHITELIST.delete(ip);
}

/**
 * Get all whitelisted IPs
 */
export function getWhitelist(): string[] {
  return Array.from(IP_WHITELIST);
}
