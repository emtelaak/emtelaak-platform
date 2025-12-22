import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * ADMIN OFFERING APPROVAL INTERFACE
 * Comprehensive interface for admins to review and approve/reject offerings
 * 
 * Features:
 * - List of pending offerings
 * - Detailed offering review
 * - Approval/rejection workflow
 * - Comment and feedback system
 * - Approval history tracking
 */

type OfferingStatus = "draft" | "under_review" | "approved" | "rejected" | "active";

const STATUS_CONFIG: Record<OfferingStatus, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  under_review: { label: "Under Review", color: "bg-yellow-500", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
  active: { label: "Active", color: "bg-blue-500", icon: TrendingUp },
};

export default function AdminOfferingApproval() {
  const [, navigate] = useLocation();
  const [selectedOffering, setSelectedOffering] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [filterStatus, setFilterStatus] = useState<OfferingStatus | "all">("under_review");

  const { data: offerings, isLoading, refetch } = trpc.offerings.getByStatus.useQuery({ status: filterStatus === "all" ? undefined : filterStatus as any });

  const { data: offeringDetail } = trpc.offerings.getComplete.useQuery(
    { id: selectedOffering! },
    { enabled: !!selectedOffering }
  );

  const approveMutation = trpc.offerings.updateApproval.useMutation({
    onSuccess: () => {
      toast.success("Offering approved successfully!");
      setReviewComment("");
      setSelectedOffering(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Approval failed: ${error.message}`);
    },
  });

  const rejectMutation = trpc.offerings.updateApproval.useMutation({
    onSuccess: () => {
      toast.success("Offering rejected");
      setReviewComment("");
      setSelectedOffering(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Rejection failed: ${error.message}`);
    },
  });

  const handleApprove = async () => {
    if (!selectedOffering) return;
    await approveMutation.mutateAsync({
      id: selectedOffering,
      decision: "approved" as const,
      comments: reviewComment,
    });
  };

  const handleReject = async () => {
    if (!selectedOffering || !reviewComment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    await rejectMutation.mutateAsync({
      id: selectedOffering,
      decision: "rejected" as const,
      comments: reviewComment,
    });
  };

  const filteredOfferings = offerings?.filter((offering: any) =>
    filterStatus === "all" ? true : offering.status === filterStatus
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Breadcrumb />
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Offering Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve offerings submitted by fundraisers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">
                  {offerings?.filter((o: any) => o.status === "under_review").length || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {offerings?.filter((o: any) => o.status === "approved").length || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {offerings?.filter((o: any) => o.status === "active").length || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Offerings</p>
                <p className="text-2xl font-bold">{offerings?.length || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Offerings List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Offerings</CardTitle>
            <CardDescription>
              <select
                className="w-full mt-2 p-2 border rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as OfferingStatus | "all")}
              >
                <option value="all">All Statuses</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!filteredOfferings || filteredOfferings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No offerings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOfferings.map((offering: any) => {
                  const StatusIcon = STATUS_CONFIG[offering.status as OfferingStatus].icon;
                  return (
                    <div
                      key={offering.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedOffering === offering.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedOffering(offering.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{offering.propertyTitle}</h4>
                        <Badge
                          variant="outline"
                          className={`${STATUS_CONFIG[offering.status as OfferingStatus].color} text-white`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_CONFIG[offering.status as OfferingStatus].label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{offering.offeringType.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="font-medium">
                          {formatCurrency(offering.totalOfferingAmount)}
                        </p>
                        <p>Submitted {formatDate(offering.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offering Detail & Review */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedOffering ? "Review Offering" : "Select an Offering"}
            </CardTitle>
            <CardDescription>
              {selectedOffering
                ? "Review the offering details and approve or reject"
                : "Click on an offering from the list to review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedOffering ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select an offering from the list to begin review</p>
              </div>
            ) : !offeringDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Offering Type</Label>
                      <p className="font-medium">
                        {offeringDetail.offering.offeringType.replace(/_/g, " ").toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Amount</Label>
                      <p className="font-medium">
                        {formatCurrency(offeringDetail.offering.totalOfferingAmount)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Shares</Label>
                      <p className="font-medium">
                        {offeringDetail.offering.totalShares.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Price Per Share</Label>
                      <p className="font-medium">
                        {formatCurrency(offeringDetail.offering.pricePerShare)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ownership Structure</Label>
                      <p className="font-medium">
                        {offeringDetail.offering.ownershipStructure.replace(/_/g, " ").toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Exit Strategy</Label>
                      <p className="font-medium">
                        {offeringDetail.offering.exitStrategy?.replace(/_/g, " ").toUpperCase() || "N/A"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Financials Tab */}
                <TabsContent value="financials" className="space-y-4">
                  {offeringDetail.financialProjections ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Projected IRR</Label>
                        <p className="font-medium">
                          {offeringDetail.financialProjections.projectedIRR ? (offeringDetail.financialProjections.projectedIRR / 100).toFixed(2) : '0.00'}%
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Projected ROI</Label>
                        <p className="font-medium">
                          {offeringDetail.financialProjections.projectedROI ? (offeringDetail.financialProjections.projectedROI / 100).toFixed(2) : '0.00'}%
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Cash-on-Cash</Label>
                        <p className="font-medium">
                          {offeringDetail.financialProjections.projectedCashOnCash ? (offeringDetail.financialProjections.projectedCashOnCash / 100).toFixed(2) : '0.00'}%
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Equity Multiple</Label>
                        <p className="font-medium">
                          {offeringDetail.financialProjections.projectedEquityMultiple ? (offeringDetail.financialProjections.projectedEquityMultiple / 100).toFixed(2) : '0.00'}x
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No financial projections have been submitted for this offering.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                  {offeringDetail.documents && offeringDetail.documents.length > 0 ? (
                    <div className="space-y-2">
                      {offeringDetail.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">{doc.category}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No documents have been uploaded for this offering.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                  {offeringDetail.statusHistory && offeringDetail.statusHistory.length > 0 ? (
                    <div className="space-y-3">
                      {offeringDetail.statusHistory.map((history: any) => (
                        <div key={history.id} className="border-l-2 border-primary pl-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge>{history.newStatus}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(history.changedAt)}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-muted-foreground">{history.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No status history available</p>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {selectedOffering && offeringDetail && offeringDetail.offering.status === "under_review" && (
              <>
                <Separator className="my-6" />

                {/* Review Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewComment">Review Comments</Label>
                    <Textarea
                      id="reviewComment"
                      placeholder="Enter your review comments, feedback, or reason for rejection..."
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {approveMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Offering
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      {rejectMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Offering
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
