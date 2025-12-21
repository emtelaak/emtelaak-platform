import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure" | "maxAge"> {
  const hostname = req.hostname;
  const isSecure = isSecureRequest(req);
  
  console.log('[Cookie Debug] hostname:', hostname);
  console.log('[Cookie Debug] isSecure:', isSecure);
  console.log('[Cookie Debug] protocol:', req.protocol);
  console.log('[Cookie Debug] x-forwarded-proto:', req.headers['x-forwarded-proto']);
  
  // Don't set domain for preview/development environments
  // This includes Manus preview URLs (*.manus.computer) and localhost
  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIpAddress(hostname) &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1" &&
    !hostname.includes("manus.computer"); // Skip domain for preview URLs

  // For production domains, DON'T set domain attribute
  // This allows the cookie to work on the exact domain without subdomain issues
  // Setting domain=undefined makes the cookie work for the current domain only
  let domain: string | undefined = undefined;
  
  // Only set domain if we explicitly need subdomain sharing
  // For most cases, leaving it undefined is more reliable
  if (shouldSetDomain && hostname.split('.').length > 2) {
    // Only for subdomains like admin.emtelaak.co, api.emtelaak.co
    const parts = hostname.split('.');
    const baseDomain = parts.slice(-2).join('.');
    domain = `.${baseDomain}`;
    console.log('[Cookie Debug] Setting domain for subdomain:', domain);
  } else {
    console.log('[Cookie Debug] No domain set (will use current domain)');
  }

  // Always use 'lax' for better compatibility and reliability
  // 'lax' works for same-site applications and is more widely supported
  // 'none' is only needed for cross-site contexts (e.g., embedded iframes)
  const sameSite: "lax" | "none" | "strict" = "lax";

  const cookieOptions = {
    domain,
    httpOnly: true,
    path: "/",
    sameSite,
    secure: isSecure,
  };
  
  console.log('[Cookie Debug] Final cookie options:', cookieOptions);
  
  return cookieOptions;
}
