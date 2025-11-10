/**
 * Offering Approvals Dashboard
 * 
 * Admin interface for reviewing and approving offerings through multi-stage workflow
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Clock, Eye } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function OfferingApprovals() {
  const [, setLocation] = useLocation();
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "request_changes" | null>(null);
  const [comments, setComments] = useState("");
  const [changesRequested, setChangesRequested] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending approvals
  const { data: approvals, isLoading, refetch } = trpc.approvals.getPendingApprovals.useQuery();

  // Review approval mutation
  const reviewMutation = trpc.approvals.reviewApproval.useMutation({
    onSuccess: () => {
      toast.success("Approval reviewed successfully");
      setSelectedApproval(null);
      setReviewAction(null);
      setComments("");
      setChangesRequested("");
      setRejectionReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to review approval: ${error.message}`);
    },
  });

  const handleReview = () => {
    if (!selectedApproval || !reviewAction) return;

    reviewMutation.mutate({
      approvalId: selectedApproval.approval.id,
      action: reviewAction,
      comments,
      changesRequested: reviewAction === "request_changes" ? changesRequested : undefined,
      rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
    });
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      initial_review: "Initial Review",
      financial_review: "Financial Review",
      legal_review: "Legal Review",
      compliance_review: "Compliance Review",
      executive_approval: "Executive Approval",
    };
    return labels[stage] || stage;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      initial_review: "bg-blue-100 text-blue-800",
      financial_review: "bg-green-100 text-green-800",
      legal_review: "bg-purple-100 text-purple-800",
      compliance_review: "bg-orange-100 text-orange-800",
      executive_approval: "bg-red-100 text-red-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Breadcrumb />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading approvals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Offering Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve offerings through the multi-stage approval workflow
        </p>
      </div>

      {/* Pending Approvals List */}
      <div className="grid gap-4">
        {approvals && approvals.length > 0 ? (
          approvals.map((item) => (
            <Card key={item.approval.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {item.offering?.title || `Offering #${item.offering?.id}`}
                    </CardTitle>
                    <CardDescription>
                      Submitted by {item.fundraiser?.name || item.fundraiser?.email || "Unknown"}
                    </CardDescription>
                  </div>
                  <Badge className={getStageColor(item.approval.approvalStage)}>
                    {getStageLabel(item.approval.approvalStage)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Offering Amount</p>
                    <p className="text-lg font-semibold">
                      ${((item.offering?.totalOfferingAmount || 0) / 100).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Offering Type</p>
                    <p className="text-lg font-semibold capitalize">
                      {item.offering?.offeringType?.replace(/_/g, " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="text-sm">
                      {item.offering?.submittedAt
                        ? new Date(item.offering.submittedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/offerings/${item.offering?.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setSelectedApproval(item);
                      setReviewAction("approve");
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setSelectedApproval(item);
                      setReviewAction("request_changes");
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedApproval(item);
                      setReviewAction("reject");
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no pending approvals at this time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={() => {
        setReviewAction(null);
        setSelectedApproval(null);
        setComments("");
        setChangesRequested("");
        setRejectionReason("");
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" && "Approve Offering"}
              {reviewAction === "reject" && "Reject Offering"}
              {reviewAction === "request_changes" && "Request Changes"}
            </DialogTitle>
            <DialogDescription>
              {selectedApproval?.offering?.title || `Offering #${selectedApproval?.offering?.id}`}
              {" - "}
              {getStageLabel(selectedApproval?.approval?.approvalStage || "")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === "approve" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Approval Notes (Optional)
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={4}
                />
              </div>
            )}

            {reviewAction === "request_changes" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Changes Requested <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={changesRequested}
                  onChange={(e) => setChangesRequested(e.target.value)}
                  placeholder="Describe the changes that need to be made..."
                  rows={6}
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  The offering will be returned to draft status for the fundraiser to make changes.
                </p>
              </div>
            )}

            {reviewAction === "reject" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this offering is being rejected..."
                  rows={6}
                  required
                />
                <p className="text-sm text-red-600 mt-2">
                  This action will permanently reject the offering. The fundraiser will need to create a new offering.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewAction(null);
                setSelectedApproval(null);
                setComments("");
                setChangesRequested("");
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={
                reviewMutation.isPending ||
                (reviewAction === "request_changes" && !changesRequested) ||
                (reviewAction === "reject" && !rejectionReason)
              }
              className={
                reviewAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : reviewAction === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {reviewMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
