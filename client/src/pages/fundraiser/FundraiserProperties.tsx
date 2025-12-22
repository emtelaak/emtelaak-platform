import { useAuth } from "@/_core/hooks/useAuth";
import FundraiserLayout from "@/components/layout/FundraiserLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Plus,
  Eye,
  Edit,
  MapPin,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FundraiserProperties() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch fundraiser's properties using the filtered endpoint
  const { data: properties, isLoading } = trpc.fundraiser.getPropertyPerformance.useQuery();

  if (authLoading) {
    return (
      <FundraiserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
      available: "default",
      active: "default",
      funded: "secondary",
      pending: "outline",
      pending_approval: "outline",
      closed: "destructive",
      rejected: "destructive",
    };
    const labels: Record<string, string> = {
      available: "Active",
      active: "Active",
      funded: "Funded",
      pending: "Pending",
      pending_approval: "Pending Approval",
      closed: "Closed",
      rejected: "Rejected",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  // Filter properties
  const filteredProperties = properties?.filter((property) => {
    const matchesSearch = property.propertyName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate summary stats
  const totalProperties = properties?.length || 0;
  const activeProperties = properties?.filter(p => p.status === "available" || p.status === "active").length || 0;
  const fundedProperties = properties?.filter(p => p.status === "funded").length || 0;
  const totalValue = properties?.reduce((sum, p) => sum + (p.totalValue || 0), 0) || 0;

  return (
    <FundraiserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Properties</h1>
            <p className="text-muted-foreground mt-1">
              Manage your property listings and track their performance
            </p>
          </div>
          <Button onClick={() => setLocation("/fundraiser/properties/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Submit New Property
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeProperties}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Funded Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{fundedProperties}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Property Listings</CardTitle>
            <CardDescription>View and manage all your submitted properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Active</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funding Progress</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Investors</TableHead>
                      <TableHead>Total Raised</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.propertyId}>
                        <TableCell>
                          <div className="font-medium">{property.propertyName}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(property.sharePrice)} per share
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{property.fundingProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={property.fundingProgress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {property.sharesSold} / {property.totalShares}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {property.sharesProgress.toFixed(1)}% sold
                          </div>
                        </TableCell>
                        <TableCell>{property.investorCount}</TableCell>
                        <TableCell>{formatCurrency(property.totalInvested)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setLocation(`/property/${property.propertyId}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/fundraiser/properties/${property.propertyId}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Property
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/fundraiser/offerings?propertyId=${property.propertyId}`)}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                View Offerings
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
                {searchQuery || statusFilter !== "all" ? (
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">
                      Start by submitting your first property for review
                    </p>
                    <Button onClick={() => setLocation("/fundraiser/properties/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Submit Property
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FundraiserLayout>
  );
}
