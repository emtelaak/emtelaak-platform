import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users, trustedDevices, user2fa } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Check if user has 2FA enabled
      const database = await getDb();
      let requires2FA = false;
      let userId: number | null = null;
      let isTrustedDevice = false;

      if (database) {
        const [user] = await database
          .select({
            id: users.id,
          })
          .from(users)
          .where(eq(users.openId, userInfo.openId))
          .limit(1);

        if (user) {
          userId = user.id;
          
          // Check if 2FA is enabled for this user
          const [twoFactorRecord] = await database
            .select({ enabled: user2fa.enabled })
            .from(user2fa)
            .where(eq(user2fa.userId, user.id))
            .limit(1);
          
          requires2FA = twoFactorRecord?.enabled || false;

          // If 2FA is enabled, check if this device is trusted
          if (requires2FA) {
            // Generate device fingerprint (same logic as in trustedDevicesRouter)
            const userAgent = req.headers["user-agent"] || "unknown";
            const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
                             (req.headers["x-real-ip"] as string) ||
                             req.socket.remoteAddress ||
                             "unknown";
            const deviceFingerprint = crypto
              .createHash("sha256")
              .update(`${userAgent}:${ipAddress}`)
              .digest("hex");

            // Check if device is trusted and not expired
            const [trustedDevice] = await database
              .select()
              .from(trustedDevices)
              .where(
                and(
                  eq(trustedDevices.userId, user.id),
                  eq(trustedDevices.deviceFingerprint, deviceFingerprint),
                  gt(trustedDevices.expiresAt, new Date())
                )
              )
              .limit(1);

            if (trustedDevice) {
              isTrustedDevice = true;
              // Update last used timestamp
              await database
                .update(trustedDevices)
                .set({ lastUsed: new Date() })
                .where(eq(trustedDevices.id, trustedDevice.id));
            }
          }
        }
      }

      // If 2FA is enabled AND device is not trusted, redirect to 2FA verification
      if (requires2FA && userId && !isTrustedDevice) {
        // Create a temporary session token (short-lived, 5 minutes)
        const tempToken = await sdk.createSessionToken(userInfo.openId, {
          name: userInfo.name || "",
          expiresInMs: 5 * 60 * 1000, // 5 minutes
        });

        const cookieOptions = getSessionCookieOptions(req);
        res.cookie("temp_session", tempToken, { ...cookieOptions, maxAge: 5 * 60 * 1000 });
        res.cookie("requires_2fa", "true", { ...cookieOptions, maxAge: 5 * 60 * 1000 });

        res.redirect(302, "/?verify2fa=true");
        return;
      }

      // No 2FA required, create full session
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
