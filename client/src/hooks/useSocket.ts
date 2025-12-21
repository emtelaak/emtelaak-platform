import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { COOKIE_NAME } from "@shared/const";

/**
 * Hook to manage Socket.io connection
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get auth token from cookie
    const token = Cookies.get(COOKIE_NAME);
    
    if (!token) {
      console.log("[Socket.io] No auth token, skipping connection");
      return;
    }

    // Connect to Socket.io server
    const socket = io({
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket.io] Connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket.io] Connection error:", error.message);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

/**
 * Hook to listen for security events (admin only)
 */
export function useSecurityNotifications(
  onEvent: (event: {
    id: number;
    eventType: string;
    severity: string;
    ipAddress?: string;
    email?: string;
    userAgent?: string;
    endpoint?: string;
    details?: any;
    createdAt: Date;
    timestamp: string;
  }) => void
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("security:event", onEvent);

    return () => {
      socket.off("security:event", onEvent);
    };
  }, [socket, isConnected, onEvent]);

  return { isConnected };
}

/**
 * Hook to listen for general notifications
 */
export function useNotifications(
  onNotification: (notification: {
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
    timestamp: string;
  }) => void
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
    };
  }, [socket, isConnected, onNotification]);

  return { isConnected };
}
