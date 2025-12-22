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
  Layers,
  Search,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FundraiserOfferings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch offerings - this should be filtered by fundraiser
  const { data: offerings, isLoading } = trpc.offerings.list.useQuery();

  if (authLoading) {
    return (
      <FundraiserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </FundraiserLayout>
    );
  }

  if (!user || (user.role !== "fundraiser" && user.role !== "admin" && user.role !== "super_admin")) {
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      open: "default",
      funded: "secondary",
      closed: "secondary",
      pending: "outline",
      pending_approval: "outline",
      draft: "outline",
      rejected: "destructive",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      active: "Active",
      open: "Open",
      funded: "Funded",
      closed: "Closed",
      pending: "Pending",
      pending_approval: "Pending Approval",
      draft: "Draft",
      rejected: "Rejected",
      cancelled: "Cancelled",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  // Filter offerings
  const filteredOfferings = offerings?.filter((offering: any) => {
    const matchesSearch = 
      offering.property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offering.offeringType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || offering.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate summary stats
  const totalOfferings = offerings?.length || 0;
  const activeOfferings = offerings?.filter((o: any) => o.status === "active" || o.status === "open").length || 0;
  const pendingOfferings = offerings?.filter((o: any) => o.status === "pending" || o.status === "pending_approval").length || 0;
  const totalRaised = offerings?.reduce((sum: number, o: any) => {
    const raised = (o.totalShares - (o.availableShares || o.totalShares)) * (o.sharePrice || 0);
    return sum + raised;
  }, 0) || 0;

  return (
    <FundraiserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Offerings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your investment offerings and track their progress
            </p>
          </div>
          <Button onClick={() => setLocation("/offerings/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Offering
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Offerings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOfferings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Offerings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeOfferings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingOfferings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Raised
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRaised)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Offerings</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Offerings</CardTitle>
                <CardDescription>View and manage all your investment offerings</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search offerings..."
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="funded">Funded</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : filteredOfferings.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Share Price</TableHead>
                          <TableHead>Timeline</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOfferings.map((offering: any) => {
                          const soldShares = offering.totalShares - (offering.availableShares || offering.totalShares);
                          const progress = offering.totalShares > 0 ? (soldShares / offering.totalShares) * 100 : 0;
                          
                          return (
                            <TableRow key={offering.id}>
                              <TableCell>
                                <div className="font-medium">{offering.property?.name || "N/A"}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {offering.id}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{offering.offeringType || "Standard"}</Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(offering.status)}</TableCell>
                              <TableCell>
                                <div className="w-32">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span>{progress.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {soldShares} / {offering.totalShares} shares
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(offering.sharePrice || 0)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {offering.startDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(offering.startDate)}
                                    </div>
                                  )}
                                  {offering.endDate && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {formatDate(offering.endDate)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setLocation(`/offerings/${offering.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLocation(`/offerings/${offering.id}/edit`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Offering
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLocation(`/offerings/${offering.id}/financial-projections`)}>
                                      <TrendingUp className="mr-2 h-4 w-4" />
                                      Financial Projections
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Offerings Found</h3>
                    {searchQuery || statusFilter !== "all" ? (
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search or filter criteria
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground mb-4">
                          Create your first investment offering to start raising funds
                        </p>
                        <Button onClick={() => setLocation("/offerings/create")}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Offering
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Offerings</CardTitle>
                <CardDescription>Currently accepting investments</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Similar table filtered for active offerings */}
                <p className="text-muted-foreground text-center py-8">
                  Active offerings will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Offerings</CardTitle>
                <CardDescription>Awaiting admin approval</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Pending offerings will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Offerings</CardTitle>
                <CardDescription>Fully funded or closed offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Completed offerings will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FundraiserLayout>
  );
}
