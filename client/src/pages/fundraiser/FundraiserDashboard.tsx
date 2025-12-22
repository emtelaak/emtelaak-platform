import { useAuth } from "@/_core/hooks/useAuth";
import FundraiserLayout from "@/components/layout/FundraiserLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Edit,
  Plus,
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function FundraiserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = trpc.fundraiser.getDashboardStats.useQuery();
  const { data: properties, isLoading: propertiesLoading } = trpc.fundraiser.getPropertyPerformance.useQuery();
  const { data: recentInvestors, isLoading: investorsLoading } = trpc.fundraiser.getRecentInvestors.useQuery();

  // Check authorization
  if (authLoading) {
    return (
      <FundraiserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </FundraiserLayout>
    );
  }

  if (!user || (user.role !== "fund_manager" && user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <FundraiserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need fundraiser privileges to access this page.</p>
            <Button onClick={() => setLocation("/")}>Go to Homepage</Button>
          </div>
        </div>
      </FundraiserLayout>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      available: "default",
      funded: "secondary",
      pending: "outline",
      closed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <FundraiserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your properties and investment performance
            </p>
          </div>
          <Button onClick={() => setLocation("/fundraiser/properties/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardStats?.totalProperties || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardStats?.activeProperties || 0} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{dashboardStats?.totalInvestments || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardStats?.completedInvestments || 0} completed
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{dashboardStats?.totalInvestors || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardStats?.totalRevenue || 0)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Property Performance Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Property Performance</CardTitle>
                <CardDescription>Track funding progress and investor engagement</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setLocation("/fundraiser/properties")}>
                View All Properties
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {propertiesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : properties && properties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Funding Progress</TableHead>
                    <TableHead>Shares Sold</TableHead>
                    <TableHead>Investors</TableHead>
                    <TableHead>Total Invested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.slice(0, 5).map((property) => (
                    <TableRow key={property.propertyId}>
                      <TableCell className="font-medium">{property.propertyName}</TableCell>
                      <TableCell>{getStatusBadge(property.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{property.fundingProgress.toFixed(1)}%</span>
                          </div>
                          <Progress value={property.fundingProgress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{property.sharesSold} / {property.totalShares}</span>
                          </div>
                          <Progress value={property.sharesProgress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>{property.investorCount}</TableCell>
                      <TableCell>{formatCurrency(property.totalInvested)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/property/${property.propertyId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/fundraiser/properties/${property.propertyId}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by submitting your first property for review
                </p>
                <Button onClick={() => setLocation("/fundraiser/properties/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Property
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Investors */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Investors</CardTitle>
            <CardDescription>Latest investment activity across your properties</CardDescription>
          </CardHeader>
          <CardContent>
            {investorsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentInvestors && recentInvestors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvestors.map((investor) => (
                    <TableRow key={investor.investmentId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{investor.userName}</p>
                          <p className="text-sm text-muted-foreground">{investor.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{investor.propertyName}</TableCell>
                      <TableCell>{investor.numberOfShares}</TableCell>
                      <TableCell>{formatCurrency(investor.investmentAmount)}</TableCell>
                      <TableCell>{getStatusBadge(investor.status)}</TableCell>
                      <TableCell>
                        {new Date(investor.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No investments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FundraiserLayout>
  );
}
