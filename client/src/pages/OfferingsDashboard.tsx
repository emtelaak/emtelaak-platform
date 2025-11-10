import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * OFFERINGS DASHBOARD
 * Main interface for fundraisers to view and manage their offerings
 */

type OfferingStatus = "draft" | "under_review" | "approved" | "active" | "funding" | "fully_funded" | "closed" | "cancelled";

const STATUS_COLORS: Record<OfferingStatus, string> = {
  draft: "bg-gray-500",
  under_review: "bg-yellow-500",
  approved: "bg-green-500",
  active: "bg-blue-500",
  funding: "bg-purple-500",
  fully_funded: "bg-emerald-500",
  closed: "bg-gray-600",
  cancelled: "bg-red-500",
};

const STATUS_LABELS: Record<OfferingStatus, string> = {
  draft: "Draft",
  under_review: "Under Review",
  approved: "Approved",
  active: "Active",
  funding: "Funding",
  fully_funded: "Fully Funded",
  closed: "Closed",
  cancelled: "Cancelled",
};

export default function OfferingsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: offerings, isLoading } = trpc.offerings.getMyOfferings.useQuery();

  const filteredOfferings = offerings?.filter((offering) => {
    const matchesSearch = !searchQuery; // TODO: Implement search
    const matchesStatus = statusFilter === "all" || offering.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: offerings?.length || 0,
    active: offerings?.filter((o) => o.status === "active" || o.status === "funding").length || 0,
    funded: offerings?.filter((o) => o.status === "fully_funded").length || 0,
    totalRaised: offerings?.reduce((sum, o) => sum + o.currentFundedAmount, 0) || 0,
  };

  return (
    <div className="container py-8">
      <Breadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Offerings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your property offerings and track funding progress
          </p>
        </div>
        <Link href="/offerings/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Offering
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Offerings</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fully Funded</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.funded}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalRaised / 100).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search offerings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="funding">Funding</SelectItem>
            <SelectItem value="fully_funded">Fully Funded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Offerings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOfferings && filteredOfferings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredOfferings.map((offering) => (
            <OfferingCard key={offering.id} offering={offering} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {statusFilter !== "all"
                ? "No offerings found with this status"
                : "You haven't created any offerings yet"}
            </p>
            <Link href="/offerings/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Offering
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OfferingCard({ offering }: { offering: any }) {
  const fundingPercentage =
    (offering.currentFundedAmount / offering.totalOfferingAmount) * 100;

  return (
    <Link href={`/offerings/${offering.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={STATUS_COLORS[offering.status as OfferingStatus]}>
                  {STATUS_LABELS[offering.status as OfferingStatus]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {offering.offeringType.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              <CardTitle className="mb-1">Property #{offering.propertyId}</CardTitle>
              <CardDescription>
                Created {new Date(offering.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${(offering.totalOfferingAmount / 100).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Offering</div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Funding Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Funding Progress</span>
              <span className="font-medium">{fundingPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Raised</div>
              <div className="font-semibold">
                ${(offering.currentFundedAmount / 100).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Investors</div>
              <div className="font-semibold">{offering.currentInvestorCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Shares</div>
              <div className="font-semibold">
                {offering.availableShares.toLocaleString()} / {offering.totalShares.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Timeline */}
          {offering.fundingStartDate && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>
                  Start: {new Date(offering.fundingStartDate).toLocaleDateString()}
                </span>
                {offering.fundingEndDate && (
                  <span>
                    End: {new Date(offering.fundingEndDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
