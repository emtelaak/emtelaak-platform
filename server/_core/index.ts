// SECURITY FIX: Added explicit CORS configuration
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import net from "net";
import cookieParser from "cookie-parser";
import compression from "compression";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// OAuth removed - using email/password authentication only
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { configureSecurityHeaders, queryRateLimiter } from "./security";
import { runAutoMigrations } from "./autoMigrate";
import { initializeStorage } from "../localStorageService";
import path from "path";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run database migrations before starting server
  await runAutoMigrations();
  
  // Initialize local storage directories
  await initializeStorage();
  
  const app = express();
  const server = createServer(app);
  
  // SECURITY FIX: Configure trust proxy with specific settings
  // Only trust Cloudflare proxy
  app.set('trust proxy', 1);
  
  // SECURITY FIX: Strict CORS configuration for Socket.io
  const allowedOrigins = process.env.NODE_ENV === "development" 
    ? ["http://localhost:3000", "http://localhost:5173"]
    : [
        "https://emtelaak.com",
        "https://www.emtelaak.com",
        "https://admin.emtelaak.com",
        "https://emtelaak.co",
        "https://www.emtelaak.co"
      ];
  
  // Initialize Socket.io with strict CORS
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn('[CORS] Rejected origin:', origin);
          callback(new Error('CORS policy violation'));
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });
  
  // Make io available to other modules
  (global as any).io = io;
  
  // Setup Socket.io handlers
  const { setupSocketHandlers } = await import("./socket");
  setupSocketHandlers(io);
  
  // Security headers
  app.use(configureSecurityHeaders());
  
  // Response compression for better performance
  app.use(compression());
  
  // IP blocking middleware (before all routes)
  const { ipBlockingMiddleware } = await import("./ipBlockingMiddleware");
  app.use(ipBlockingMiddleware);
  
  // Admin subdomain redirect middleware
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    // Check if request is from admin subdomain
    if (host.startsWith('admin.')) {
      // If accessing root, redirect to admin dashboard
      if (req.path === '/') {
        return res.redirect(301, '/admin');
      }
      // If accessing admin path directly, allow it
      if (req.path.startsWith('/admin') || req.path.startsWith('/super-admin') || req.path.startsWith('/api') || req.path.startsWith('/assets')) {
        return next();
      }
      // For any other path, redirect to admin with the path preserved
      return res.redirect(301, '/admin' + req.path);
    }
    next();
  });
  
  // Configure cookie parser (must be before routes that use cookies)
  app.use(cookieParser());
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Health check endpoint for monitoring and load balancers
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });
  
  // Readiness check endpoint
  app.get("/ready", async (req, res) => {
    try {
      // Check database connection
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ status: "not_ready", reason: "database_unavailable" });
      }
      res.status(200).json({ status: "ready", timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({ status: "not_ready", reason: "database_error" });
    }
  });
  
  // Serve uploaded files from /uploads directory
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('[Static Files] Serving uploads from:', uploadsPath);
  
  // Rate limiting for API endpoints
  app.use("/api", queryRateLimiter);
  // Email/password authentication only - OAuth removed
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  server.listen(port, "0.0.0.0", () => {
    const url = `http://localhost:${port}`;
    console.log(`\n🚀 Server running on ${url}`);
    console.log(`📊 Health check: ${url}/health`);
    console.log(`🔐 Security: Enhanced with strict CORS and rate limiting\n`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
