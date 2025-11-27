import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Monitoring router for system health and capacity metrics
 * Provides endpoints for tracking database connections, performance, and system health
 */
export const monitoringRouter = router({
  /**
   * Get current database connection pool status
   * Returns information about active connections and pool utilization
   */
  getConnectionPoolStatus: protectedProcedure.query(async ({ ctx }) => {
    // Only allow admin users to access monitoring data
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can access monitoring data",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get current connection statistics
      const [processlist] = await db.execute(`
        SELECT 
          COUNT(*) as active_connections,
          SUM(CASE WHEN command != 'Sleep' THEN 1 ELSE 0 END) as active_queries
        FROM information_schema.processlist
        WHERE db = DATABASE()
      `);

      const stats = (processlist as unknown as unknown as any[])[0];

      return {
        success: true,
        poolSize: 20, // Current connection pool limit
        activeConnections: stats.active_connections || 0,
        activeQueries: stats.active_queries || 0,
        utilizationPercent: ((stats.active_connections || 0) / 20) * 100,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Monitoring] Failed to get connection pool status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve connection pool status",
      });
    }
  }),

  /**
   * Get database performance metrics
   * Returns query performance statistics and slow query information
   */
  getDatabaseMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can access monitoring data",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get database size
      const [sizeResult] = await db.execute(`
        SELECT 
          table_schema as 'database_name',
          COUNT(*) as 'table_count',
          SUM(table_rows) as 'total_rows',
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'size_mb'
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        GROUP BY table_schema
      `);

      const dbSize = (sizeResult as unknown as unknown as any[])[0] || {
        database_name: "unknown",
        table_count: 0,
        total_rows: 0,
        size_mb: 0,
      };

      // Get table statistics
      const [tableStats] = await db.execute(`
        SELECT 
          table_name,
          table_rows,
          ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb,
          ROUND(data_length / 1024 / 1024, 2) as data_mb,
          ROUND(index_length / 1024 / 1024, 2) as index_mb
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        ORDER BY (data_length + index_length) DESC
        LIMIT 10
      `);

      return {
        success: true,
        database: {
          name: dbSize.database_name,
          tableCount: dbSize.table_count,
          totalRows: dbSize.total_rows,
          sizeMB: dbSize.size_mb,
        },
        topTables: tableStats as unknown as unknown as any[],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Monitoring] Failed to get database metrics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve database metrics",
      });
    }
  }),

  /**
   * Get system health status
   * Returns overall system health including database, memory, and uptime
   */
  getSystemHealth: publicProcedure.query(async () => {
    const db = await getDb();
    const dbAvailable = db !== null;

    // Get Node.js process metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      success: true,
      status: dbAvailable ? "healthy" : "degraded",
      database: {
        available: dbAvailable,
        type: "TiDB Cloud (MySQL-compatible)",
      },
      application: {
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        memory: {
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        nodeVersion: process.version,
      },
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get user activity metrics
   * Returns statistics about user registrations, logins, and activity
   */
  getUserMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can access monitoring data",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get user statistics
      const [userStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN emailVerified = 1 THEN 1 ELSE 0 END) as verified_users,
          SUM(CASE WHEN emailVerified = 0 THEN 1 ELSE 0 END) as unverified_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
          SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) as registered_today,
          SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as registered_this_week,
          SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as registered_this_month
        FROM users
      `);

      const stats = (userStats as unknown as any[])[0];

      // Get recent registrations
      const [recentUsers] = await db.execute(`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM users
        WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `);

      return {
        success: true,
        summary: {
          totalUsers: stats.total_users || 0,
          verifiedUsers: stats.verified_users || 0,
          unverifiedUsers: stats.unverified_users || 0,
          adminUsers: stats.admin_users || 0,
          verificationRate: stats.total_users > 0 
            ? Math.round((stats.verified_users / stats.total_users) * 100) 
            : 0,
        },
        growth: {
          today: stats.registered_today || 0,
          thisWeek: stats.registered_this_week || 0,
          thisMonth: stats.registered_this_month || 0,
        },
        recentRegistrations: recentUsers as unknown as any[],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Monitoring] Failed to get user metrics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve user metrics",
      });
    }
  }),

  /**
   * Get investment activity metrics
   * Returns statistics about property investments and transactions
   */
  getInvestmentMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can access monitoring data",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get investment statistics
      const [investmentStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_investments,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_investments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_investments,
          SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END) as investments_today,
          SUM(CASE WHEN DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as investments_this_week
        FROM investments
      `);

      const stats = (investmentStats as unknown as any[])[0] || {
        total_investments: 0,
        active_investments: 0,
        completed_investments: 0,
        investments_today: 0,
        investments_this_week: 0,
      };

      // Get property statistics
      const [propertyStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_properties,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_properties,
          SUM(CASE WHEN status = 'funded' THEN 1 ELSE 0 END) as funded_properties
        FROM properties
      `);

      const propStats = (propertyStats as unknown as any[])[0] || {
        total_properties: 0,
        available_properties: 0,
        funded_properties: 0,
      };

      return {
        success: true,
        investments: {
          total: stats.total_investments,
          active: stats.active_investments,
          completed: stats.completed_investments,
          today: stats.investments_today,
          thisWeek: stats.investments_this_week,
        },
        properties: {
          total: propStats.total_properties,
          available: propStats.available_properties,
          funded: propStats.funded_properties,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Monitoring] Failed to get investment metrics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve investment metrics",
      });
    }
  }),
});

/**
 * Helper function to format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(" ") : "< 1m";
}
