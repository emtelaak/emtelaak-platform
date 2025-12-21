import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, Users, Eye, ListChecks, DollarSign, Search, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PropertyAnalytics() {
  const { t, dir } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("fundingPercentage");

  const { data: analytics, isLoading } = trpc.admin.properties.getAllAnalytics.useQuery();

  // Calculate overview stats
  const totalProperties = analytics?.length || 0;
  const totalFunding = analytics?.reduce((sum, p) => sum + p.fundedAmount, 0) || 0;
  const totalInvestors = analytics?.reduce((sum, p) => sum + p.investorCount, 0) || 0;
  const avgFundingRate = analytics && analytics.length > 0
    ? analytics.reduce((sum, p) => sum + p.fundingPercentage, 0) / analytics.length
    : 0;

  // Filter and sort properties
  const filteredProperties = analytics
    ?.filter((property) => {
      const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.nameAr?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "fundingPercentage":
          return b.fundingPercentage - a.fundingPercentage;
        case "views":
          return b.views - a.views;
        case "waitlistCount":
          return b.waitlistCount - a.waitlistCount;
        case "investorCount":
          return b.investorCount - a.investorCount;
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      coming_soon: { variant: "default", label: "Coming Soon" },
      available: { variant: "default", label: "Available" },
      funded: { variant: "default", label: "Funded" },
      exited: { variant: "outline", label: "Exited" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const headers = ["Property Name", "Status", "Funding %", "Funded Amount", "Views", "Waitlist", "Investors"];
    const rows = analytics.map((p) => [
      p.name,
      p.status,
      `${p.fundingPercentage}%`,
      `$${(p.fundedAmount / 100).toLocaleString()}`,
      p.views,
      p.waitlistCount,
      p.investorCount,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Breadcrumb />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8" dir={dir}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Property Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track property performance, views, and funding progress
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalFunding / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvestors}</div>
            <p className="text-xs text-muted-foreground">Unique investors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Funding Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFundingRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fundingPercentage">Funding %</SelectItem>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="waitlistCount">Waitlist</SelectItem>
                <SelectItem value="investorCount">Investors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Performance</CardTitle>
          <CardDescription>Detailed metrics for each property</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Funding Progress</TableHead>
                <TableHead className="text-right">Funded Amount</TableHead>
                <TableHead className="text-right">
                  <Eye className="inline h-4 w-4 mr-1" />
                  Views
                </TableHead>
                <TableHead className="text-right">
                  <ListChecks className="inline h-4 w-4 mr-1" />
                  Waitlist
                </TableHead>
                <TableHead className="text-right">
                  <Users className="inline h-4 w-4 mr-1" />
                  Investors
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties && filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{property.name}</div>
                        {property.nameAr && (
                          <div className="text-sm text-muted-foreground">{property.nameAr}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{property.fundingPercentage.toFixed(1)}%</span>
                          <span className="text-muted-foreground">
                            ${(property.fundedAmount / 100).toLocaleString()} / $
                            {(property.totalValue / 100).toLocaleString()}
                          </span>
                        </div>
                        <Progress value={property.fundingPercentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(property.fundedAmount / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{property.views}</TableCell>
                    <TableCell className="text-right">{property.waitlistCount}</TableCell>
                    <TableCell className="text-right">{property.investorCount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No properties found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
