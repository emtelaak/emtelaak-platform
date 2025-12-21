import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import TimelineManagement from "@/components/TimelineManagement";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * OFFERING DETAIL VIEW
 * Comprehensive view of a single offering with all related information
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

export default function OfferingDetail() {
  const [, params] = useRoute("/offerings/:id");
  const [, navigate] = useLocation();
  const offeringId = params?.id ? parseInt(params.id) : 0;

  const { data: offeringData, isLoading } = trpc.offerings.getComplete.useQuery(
    { id: offeringId },
    { enabled: offeringId > 0 }
  );

  const submitForApprovalMutation = trpc.approvals.submitForApproval.useMutation({
    onSuccess: () => {
      toast.success("Offering submitted for multi-stage approval!");
      // Refetch offering data to show updated status
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Breadcrumb />
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!offeringData) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Offering Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The offering you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/offerings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Offerings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { offering, property, financialProjections, fees, documents, timeline, statusHistory, approvals } = offeringData;
  const fundingPercentage = (offering.currentFundedAmount / offering.totalOfferingAmount) * 100;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/offerings")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offerings
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {property?.name || property?.nameAr || `Offering #${offering.id}`}
              </h1>
              <Badge className={STATUS_COLORS[offering.status as OfferingStatus]}>
                {STATUS_LABELS[offering.status as OfferingStatus]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {offering.offeringType.replace(/_/g, " ").toUpperCase()} • Created {new Date(offering.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            {offering.status === "draft" && (
              <Button
                onClick={() => submitForApprovalMutation.mutate({ offeringId: offering.id })}
                disabled={submitForApprovalMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitForApprovalMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/offerings/${offeringId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Offering</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(offering.totalOfferingAmount / 100).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Raised</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(offering.currentFundedAmount / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fundingPercentage.toFixed(1)}% of goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Investors</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offering.currentInvestorCount}</div>
            {offering.maximumInvestors && (
              <p className="text-xs text-muted-foreground mt-1">
                of {offering.maximumInvestors} max
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Shares</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offering.availableShares.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {offering.totalShares.toLocaleString()} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funding Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Funding Progress</CardTitle>
          <CardDescription>
            ${(offering.currentFundedAmount / 100).toLocaleString()} raised of ${(offering.totalOfferingAmount / 100).toLocaleString()} goal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={fundingPercentage} className="h-4" />
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financial Projections</TabsTrigger>
          <TabsTrigger value="fees">Fee Structure</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Offering Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow label="Offering Type" value={offering.offeringType.replace(/_/g, " ").toUpperCase()} />
                <DetailRow label="Share Type" value={offering.shareType || "Not specified"} />
                <DetailRow label="Total Shares" value={offering.totalShares.toLocaleString()} />
                <DetailRow label="Price Per Share" value={`$${(offering.pricePerShare / 100).toLocaleString()}`} />
                <DetailRow label="Minimum Purchase" value={`${offering.minimumSharePurchase} shares`} />
                {offering.maximumSharePurchase && (
                  <DetailRow label="Maximum Purchase" value={`${offering.maximumSharePurchase} shares`} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ownership & Exit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow label="Ownership Structure" value={offering.ownershipStructure.replace(/_/g, " ").toUpperCase()} />
                {offering.holdingPeriodMonths && (
                  <DetailRow label="Holding Period" value={`${offering.holdingPeriodMonths} months`} />
                )}
                {offering.lockupPeriodMonths && (
                  <DetailRow label="Lock-up Period" value={`${offering.lockupPeriodMonths} months`} />
                )}
                {offering.exitStrategy && (
                  <DetailRow label="Exit Strategy" value={offering.exitStrategy.replace(/_/g, " ").toUpperCase()} />
                )}
                {offering.expectedExitDate && (
                  <DetailRow label="Expected Exit" value={new Date(offering.expectedExitDate).toLocaleDateString()} />
                )}
              </CardContent>
            </Card>

            {offering.ownershipStructureDetails && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Structure Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{offering.ownershipStructureDetails}</p>
                </CardContent>
              </Card>
            )}

            {offering.exitStrategyDetails && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Exit Strategy Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{offering.exitStrategyDetails}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Financial Projections Tab */}
        <TabsContent value="financials">
          {financialProjections ? (
            <FinancialProjectionsView projections={financialProjections} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No financial projections have been added yet
                </p>
                <Button onClick={() => navigate(`/offerings/${offeringId}/financial-projections`)}>Add Financial Projections</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fee Structure Tab */}
        <TabsContent value="fees">
          {fees ? (
            <FeeStructureView fees={fees} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No fee structure has been defined yet
                </p>
                <Button onClick={() => navigate(`/offerings/${offeringId}/fee-structure`)}>Define Fee Structure</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentsView documents={documents || []} offeringId={offering.id} />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <TimelineManagement 
            offeringId={offeringId} 
            timeline={(timeline || []) as any} 
            isEditable={offering.status === "draft" || offering.status === "under_review" || offering.status === "approved"}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <StatusHistoryView history={statusHistory || []} approvals={approvals || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function FinancialProjectionsView({ projections }: { projections: any }) {
  const formatPercentage = (value?: number) => {
    if (!value) return "N/A";
    return `${(value / 100).toFixed(2)}%`;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "N/A";
    return `$${(value / 100).toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Return Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow label="Projected IRR" value={formatPercentage(projections.projectedIRR)} />
          <DetailRow label="Projected ROI" value={formatPercentage(projections.projectedROI)} />
          <DetailRow label="Cash-on-Cash Return" value={formatPercentage(projections.projectedCashOnCash)} />
          <DetailRow label="Equity Multiple" value={projections.projectedEquityMultiple ? `${(projections.projectedEquityMultiple / 100).toFixed(2)}x` : "N/A"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribution Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow label="Frequency" value={projections.distributionFrequency || "Not set"} />
          <DetailRow label="First Distribution" value={projections.firstDistributionDate ? new Date(projections.firstDistributionDate).toLocaleDateString() : "Not set"} />
          <DetailRow label="Estimated Annual" value={formatCurrency(projections.estimatedAnnualDistribution)} />
        </CardContent>
      </Card>

      {(projections.year1RentalYield || projections.year1Appreciation) && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>5-Year Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Year</th>
                    {projections.year1RentalYield && <th className="text-right py-2">Rental Yield</th>}
                    {projections.year1Appreciation && <th className="text-right py-2">Appreciation</th>}
                    {projections.year1CashFlow && <th className="text-right py-2">Cash Flow</th>}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <tr key={year} className="border-b">
                      <td className="py-2">Year {year}</td>
                      {projections.year1RentalYield && (
                        <td className="text-right">{formatPercentage(projections[`year${year}RentalYield` as keyof typeof projections] as number)}</td>
                      )}
                      {projections.year1Appreciation && (
                        <td className="text-right">{formatPercentage(projections[`year${year}Appreciation` as keyof typeof projections] as number)}</td>
                      )}
                      {projections.year1CashFlow && (
                        <td className="text-right">{formatCurrency(projections[`year${year}CashFlow` as keyof typeof projections] as number)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(projections.bestCaseIRR || projections.baseCaseIRR || projections.worstCaseIRR) && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sensitivity Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Best Case</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(projections.bestCaseIRR)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Base Case</div>
                <div className="text-2xl font-bold">
                  {formatPercentage(projections.baseCaseIRR)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Worst Case</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatPercentage(projections.worstCaseIRR)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {projections.assumptionsNotes && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assumptions & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{projections.assumptionsNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeeStructureView({ fees }: { fees: any }) {
  const formatPercentage = (value: number) => `${(value / 100).toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${(value / 100).toLocaleString()}`;

  const feeItems = [
    { label: "Platform Fee", percentage: fees.platformFeePercentage, fixed: fees.platformFeeFixed, description: fees.platformFeeDescription },
    { label: "Management Fee", percentage: fees.managementFeePercentage, fixed: fees.managementFeeFixed, description: fees.managementFeeDescription },
    { label: "Performance Fee", percentage: fees.performanceFeePercentage, fixed: 0, description: fees.performanceFeeDescription },
    { label: "Maintenance Fee", percentage: fees.maintenanceFeePercentage, fixed: fees.maintenanceFeeFixed, description: fees.maintenanceFeeDescription },
    { label: "Acquisition Fee", percentage: fees.acquisitionFeePercentage, fixed: fees.acquisitionFeeFixed, description: fees.acquisitionFeeDescription },
    { label: "Disposition Fee", percentage: fees.dispositionFeePercentage, fixed: fees.dispositionFeeFixed, description: fees.dispositionFeeDescription },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown</CardTitle>
          <CardDescription>All fees associated with this offering</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeItems.map((item, index) => (
              (item.percentage > 0 || item.fixed > 0) && (
                <div key={index}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-right">
                      {item.percentage > 0 && formatPercentage(item.percentage)}
                      {item.percentage > 0 && item.fixed > 0 && " + "}
                      {item.fixed > 0 && formatCurrency(item.fixed)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  {index < feeItems.length - 1 && <Separator className="mt-4" />}
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {fees.totalEstimatedAnnualFees && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Estimated Annual Fees" value={formatCurrency(fees.totalEstimatedAnnualFees)} />
            {fees.feeImpactOnReturns && (
              <DetailRow label="Impact on Returns" value={formatPercentage(fees.feeImpactOnReturns)} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DocumentsView({ documents, offeringId }: { documents: any[]; offeringId: number }) {
  const [, navigate] = useLocation();
  
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
          <Button onClick={() => navigate(`/offerings/${offeringId}/documents`)}>Upload Document</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{doc.title}</CardTitle>
                <CardDescription>
                  {doc.documentCategory} • {doc.documentType.replace(/_/g, " ")}
                </CardDescription>
              </div>
              <Badge variant={doc.isPublic ? "default" : "secondary"}>
                {doc.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {doc.description && (
              <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} • Version {doc.version}
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusHistoryView({ history, approvals }: { history: any[]; approvals: any[] }) {
  return (
    <div className="space-y-6">
      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvals.map((approval) => (
                <div key={approval.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{approval.reviewerRole.replace(/_/g, " ").toUpperCase()}</span>
                    <Badge variant={
                      approval.decision === "approved" ? "default" :
                      approval.decision === "rejected" ? "destructive" :
                      approval.decision === "changes_requested" ? "secondary" :
                      "outline"
                    }>
                      {approval.decision.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  {approval.comments && (
                    <p className="text-sm text-muted-foreground mb-2">{approval.comments}</p>
                  )}
                  {approval.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed {new Date(approval.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  {entry.previousStatus && (
                    <>
                      <Badge variant="outline">{entry.previousStatus.replace(/_/g, " ").toUpperCase()}</Badge>
                      <span className="text-muted-foreground">→</span>
                    </>
                  )}
                  <Badge>{entry.newStatus.replace(/_/g, " ").toUpperCase()}</Badge>
                </div>
                {entry.changeReason && (
                  <p className="text-sm text-muted-foreground mb-1">{entry.changeReason}</p>
                )}
                {entry.changeNotes && (
                  <p className="text-sm text-muted-foreground mb-1">{entry.changeNotes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.changedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
