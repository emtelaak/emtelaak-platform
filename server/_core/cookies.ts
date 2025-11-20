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
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const isSecure = isSecureRequest(req);
  
  // Don't set domain for preview/development environments
  // This includes Manus preview URLs (*.manus.computer) and localhost
  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIpAddress(hostname) &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1" &&
    !hostname.includes("manus.computer"); // Skip domain for preview URLs

  // Extract base domain for subdomain sharing
  // e.g., admin.emtelaak.co -> .emtelaak.co
  let domain: string | undefined = undefined;
  if (shouldSetDomain) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // Get the last two parts (e.g., emtelaak.co)
      const baseDomain = parts.slice(-2).join('.');
      // Add leading dot for subdomain sharing
      domain = `.${baseDomain}`;
    }
  }

  // Always use 'lax' for better compatibility and reliability
  // 'lax' works for same-site applications and is more widely supported
  // 'none' is only needed for cross-site contexts (e.g., embedded iframes)
  const sameSite: "lax" | "none" | "strict" = "lax";

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite,
    secure: isSecure,
  };
}
