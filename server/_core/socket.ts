import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getUserByOpenId } from "../db";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

/**
 * Setup Socket.io event handlers
 */
export function setupSocketHandlers(io: SocketIOServer) {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, ENV.cookieSecret) as { openId: string };
      const user = await getUserByOpenId(decoded.openId);

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userRole = user.role;

      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[Socket.io] User ${socket.userId} connected (role: ${socket.userRole})`);

    // Join admin room if user is admin or super_admin
    if (socket.userRole === "admin" || socket.userRole === "super_admin") {
      socket.join("admins");
      console.log(`[Socket.io] User ${socket.userId} joined admins room`);
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[Socket.io] User ${socket.userId} disconnected`);
    });

    // Ping-pong for connection health check
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  console.log("[Socket.io] Handlers registered");
}

/**
 * Get Socket.io instance from global
 */
export function getIO(): SocketIOServer | null {
  return (global as any).io || null;
}

/**
 * Broadcast security event to all connected admins
 */
export function broadcastSecurityEvent(event: {
  id: number;
  eventType: string;
  severity: string;
  ipAddress?: string | null;
  email?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  details?: any;
  createdAt: Date;
}) {
  const io = getIO();
  if (!io) {
    console.warn("[Socket.io] Cannot broadcast: Socket.io not initialized");
    return;
  }

  // Only broadcast critical and high severity events
  if (event.severity === "critical" || event.severity === "high") {
    io.to("admins").emit("security:event", {
      id: event.id,
      eventType: event.eventType,
      severity: event.severity,
      ipAddress: event.ipAddress,
      email: event.email,
      userAgent: event.userAgent,
      endpoint: event.endpoint,
      details: event.details,
      createdAt: event.createdAt,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Socket.io] Broadcasted ${event.severity} security event: ${event.eventType}`);
  }
}

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId: number, notification: {
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
}) {
  const io = getIO();
  if (!io) {
    console.warn("[Socket.io] Cannot send notification: Socket.io not initialized");
    return;
  }

  // Find sockets for this user
  const sockets = Array.from(io.sockets.sockets.values()).filter(
    (socket: any) => socket.userId === userId
  );

  sockets.forEach(socket => {
    socket.emit("notification", {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  });

  if (sockets.length > 0) {
    console.log(`[Socket.io] Sent notification to user ${userId} (${sockets.length} connections)`);
  }
}
