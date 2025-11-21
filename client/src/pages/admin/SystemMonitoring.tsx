import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Database, HardDrive, Server, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";

export default function SystemMonitoring() {
  const { user, isAuthenticated } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (isAuthenticated && user?.role !== "admin") {
      window.location.href = "/";
    }
  }, [isAuthenticated, user]);

  // Fetch monitoring data
  const { data: healthData, isLoading: healthLoading } = trpc.monitoring.getSystemHealth.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: poolData, isLoading: poolLoading } = trpc.monitoring.getConnectionPoolStatus.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: user?.role === "admin",
  });

  const { data: dbMetrics, isLoading: dbLoading } = trpc.monitoring.getDatabaseMetrics.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
    enabled: user?.role === "admin",
  });

  const { data: userMetrics, isLoading: userLoading } = trpc.monitoring.getUserMetrics.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: user?.role === "admin",
  });

  const { data: investmentMetrics, isLoading: investmentLoading } = trpc.monitoring.getInvestmentMetrics.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: user?.role === "admin",
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            You must be an administrator to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground">Real-time system health and performance metrics</p>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Overall system status and uptime</CardDescription>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={healthData.status === "healthy" ? "default" : "destructive"}>
                  {healthData.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Uptime</div>
                <div className="text-lg font-semibold">{healthData.application.uptimeFormatted}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Memory Usage</div>
                <div className="text-lg font-semibold">
                  {healthData.application.memory.heapUsedMB} / {healthData.application.memory.heapTotalMB} MB
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Database Connection Pool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Database Connection Pool
          </CardTitle>
          <CardDescription>Current connection pool utilization</CardDescription>
        </CardHeader>
        <CardContent>
          {poolLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : poolData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Pool Size</div>
                  <div className="text-2xl font-bold">{poolData.poolSize}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Connections</div>
                  <div className="text-2xl font-bold">{poolData.activeConnections}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Queries</div>
                  <div className="text-2xl font-bold">{poolData.activeQueries}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Utilization</div>
                  <div className="text-2xl font-bold">{poolData.utilizationPercent.toFixed(1)}%</div>
                </div>
              </div>
              
              {/* Utilization bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Connection Pool Utilization</span>
                  <span>{poolData.activeConnections} / {poolData.poolSize}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      poolData.utilizationPercent > 80 ? 'bg-destructive' :
                      poolData.utilizationPercent > 60 ? 'bg-yellow-500' :
                      'bg-primary'
                    }`}
                    style={{ width: `${Math.min(poolData.utilizationPercent, 100)}%` }}
                  />
                </div>
              </div>

              {poolData.utilizationPercent > 80 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    ⚠️ High connection pool utilization detected. Consider increasing the pool size or optimizing queries.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Database Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Metrics
          </CardTitle>
          <CardDescription>Database size and table statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {dbLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : dbMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Database Size</div>
                  <div className="text-2xl font-bold">{dbMetrics.database.sizeMB} MB</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Tables</div>
                  <div className="text-2xl font-bold">{dbMetrics.database.tableCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                  <div className="text-2xl font-bold">{dbMetrics.database.totalRows.toLocaleString()}</div>
                </div>
              </div>

              {/* Top tables */}
              <div>
                <h4 className="font-semibold mb-2">Largest Tables</h4>
                <div className="space-y-2">
                  {dbMetrics.topTables.slice(0, 5).map((table: any) => (
                    <div key={table.table_name} className="flex justify-between items-center text-sm">
                      <span>{table.table_name}</span>
                      <span className="text-muted-foreground">
                        {table.table_rows.toLocaleString()} rows • {table.size_mb} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* User Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Metrics
          </CardTitle>
          <CardDescription>User registration and verification statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : userMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-2xl font-bold">{userMetrics.summary.totalUsers}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Verified</div>
                  <div className="text-2xl font-bold">{userMetrics.summary.verifiedUsers}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Unverified</div>
                  <div className="text-2xl font-bold">{userMetrics.summary.unverifiedUsers}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Verification Rate</div>
                  <div className="text-2xl font-bold">{userMetrics.summary.verificationRate}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Registered Today</div>
                  <div className="text-xl font-semibold">{userMetrics.growth.today}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">This Week</div>
                  <div className="text-xl font-semibold">{userMetrics.growth.thisWeek}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                  <div className="text-xl font-semibold">{userMetrics.growth.thisMonth}</div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Investment Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Investment Metrics
          </CardTitle>
          <CardDescription>Investment and property statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {investmentLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : investmentMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Investments</div>
                <div className="text-2xl font-bold">{investmentMetrics.investments.total}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold">{investmentMetrics.investments.active}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold">{investmentMetrics.investments.completed}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Properties</div>
                <div className="text-2xl font-bold">{investmentMetrics.properties.total}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available</div>
                <div className="text-2xl font-bold">{investmentMetrics.properties.available}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Funded</div>
                <div className="text-2xl font-bold">{investmentMetrics.properties.funded}</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Capacity Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Capacity Recommendations
          </CardTitle>
          <CardDescription>System scaling guidance based on current metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">✅</div>
              <div>
                <strong>Current Capacity:</strong> System can handle 100-200 concurrent users with current configuration (20 database connections).
              </div>
            </div>
            
            {poolData && poolData.utilizationPercent > 60 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <div>
                  <strong>Action Recommended:</strong> Connection pool utilization is above 60%. Consider increasing to 30-40 connections if traffic continues to grow.
                </div>
              </div>
            )}
            
            {dbMetrics && dbMetrics.database.sizeMB > 4000 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <div>
                  <strong>Storage Warning:</strong> Database size approaching 4GB. Plan upgrade to paid tier or implement data archival strategy.
                </div>
              </div>
            )}
            
            {userMetrics && userMetrics.summary.totalUsers > 1000 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">📈</div>
                <div>
                  <strong>Growth Stage:</strong> User base exceeding 1,000 users. Consider implementing Redis caching and monitoring response times closely.
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <a 
                href="/docs/CAPACITY_ANALYSIS.md" 
                target="_blank"
                className="text-primary hover:underline"
              >
                View full capacity analysis and scaling recommendations →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
