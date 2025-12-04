import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Fetch analytics data
  const { data: overview } = trpc.admin.getAnalyticsOverview.useQuery();
  const { data: investmentTrends } = trpc.admin.getInvestmentTrends.useQuery({ timeRange });
  const { data: propertyPerformance } = trpc.admin.getPropertyPerformance.useQuery();
  const { data: investorGrowth } = trpc.admin.getInvestorGrowth.useQuery({ timeRange });
  const { data: revenueBreakdown } = trpc.admin.getRevenueBreakdown.useQuery();
  const { data: kycMetrics } = trpc.admin.getKYCMetrics.useQuery();
  const { data: recentActivity } = trpc.admin.getRecentActivity.useQuery({ limit: 10 });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(value / 100);
  };

  // Calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Breadcrumb />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive platform metrics and insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.totalInvestments || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`inline-flex items-center ${
                (overview?.investmentChange || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {(overview?.investmentChange || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(overview?.investmentChange || 0).toFixed(1)}%
              </span>
              {" "}from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.activeInvestors || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`inline-flex items-center ${
                (overview?.investorChange || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {(overview?.investorChange || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(overview?.investorChange || 0).toFixed(1)}%
              </span>
              {" "}from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.activeProperties || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.fundedProperties || 0} fully funded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.platformRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`inline-flex items-center ${
                (overview?.revenueChange || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {(overview?.revenueChange || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(overview?.revenueChange || 0).toFixed(1)}%
              </span>
              {" "}from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Investment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Trends</CardTitle>
            <CardDescription>Total investments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={investmentTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Investment Amount"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Number of Investments"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Investor Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Investor Growth</CardTitle>
            <CardDescription>New investors over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={investorGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newInvestors" fill="#8884d8" name="New Investors" />
                <Bar dataKey="totalInvestors" fill="#82ca9d" name="Total Investors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Property Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
            <CardDescription>Top performing properties by investment volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyPerformance || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="totalInvested" fill="#8884d8" name="Total Invested" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by property type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(revenueBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* KYC Metrics & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* KYC Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>KYC Verification Metrics</CardTitle>
            <CardDescription>User verification status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Review</span>
                <span className="text-sm font-medium">{kycMetrics?.pending || 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${((kycMetrics?.pending || 0) / (kycMetrics?.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="text-sm font-medium">{kycMetrics?.approved || 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${((kycMetrics?.approved || 0) / (kycMetrics?.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rejected</span>
                <span className="text-sm font-medium">{kycMetrics?.rejected || 0}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${((kycMetrics?.rejected || 0) / (kycMetrics?.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Approval Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {kycMetrics?.total
                    ? ((kycMetrics.approved / kycMetrics.total) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.createdAt), "PPp")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
