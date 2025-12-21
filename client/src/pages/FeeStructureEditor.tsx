import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, ArrowLeft, DollarSign, Info, AlertCircle } from "lucide-react";

/**
 * FEE STRUCTURE EDITOR
 * Comprehensive form for creating/editing fee structures for offerings
 * 
 * Fee Types:
 * 1. Platform Fee (% + fixed)
 * 2. Management Fee (% + fixed)
 * 3. Performance Fee (%)
 * 4. Maintenance Fee (% + fixed)
 * 5. Acquisition Fee (% + fixed)
 * 6. Disposition Fee (% + fixed)
 */

type FeeStructureData = {
  offeringId: number;
  platformFeePercentage: number;
  platformFeeFixed?: number;
  platformFeeDescription?: string;
  managementFeePercentage: number;
  managementFeeFixed?: number;
  managementFeeDescription?: string;
  performanceFeePercentage: number;
  performanceFeeDescription?: string;
  maintenanceFeePercentage: number;
  maintenanceFeeFixed?: number;
  maintenanceFeeDescription?: string;
  acquisitionFeePercentage: number;
  acquisitionFeeFixed?: number;
  acquisitionFeeDescription?: string;
  dispositionFeePercentage: number;
  dispositionFeeFixed?: number;
  dispositionFeeDescription?: string;
  totalEstimatedAnnualFees?: number;
  feeImpactOnReturns?: number;
};

export default function FeeStructureEditor() {
  const [, params] = useRoute("/offerings/:id/fee-structure");
  const [, navigate] = useLocation();
  const offeringId = params?.id ? parseInt(params.id) : 0;

  const [formData, setFormData] = useState<Partial<FeeStructureData>>({
    offeringId,
    platformFeePercentage: 0,
    managementFeePercentage: 0,
    performanceFeePercentage: 0,
    maintenanceFeePercentage: 0,
    acquisitionFeePercentage: 0,
    dispositionFeePercentage: 0,
  });

  const { data: existingFees, isLoading } = trpc.offerings.getFeeStructure.useQuery(
    { offeringId },
    { enabled: offeringId > 0 }
  );

  const createMutation = trpc.offerings.createFeeStructure.useMutation({
    onSuccess: () => {
      toast.success("Fee structure saved successfully!");
      navigate(`/offerings/${offeringId}`);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const updateMutation = trpc.offerings.updateFeeStructure.useMutation({
    onSuccess: () => {
      toast.success("Fee structure updated successfully!");
      navigate(`/offerings/${offeringId}`);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingFees) {
      setFormData(existingFees as any);
    }
  }, [existingFees]);

  const updateField = (field: keyof FeeStructureData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (existingFees) {
        await updateMutation.mutateAsync({
          offeringId,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData as FeeStructureData);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Calculate total fees for preview
  const calculateTotalFees = () => {
    const percentageFees = [
      formData.platformFeePercentage || 0,
      formData.managementFeePercentage || 0,
      formData.performanceFeePercentage || 0,
      formData.maintenanceFeePercentage || 0,
      formData.acquisitionFeePercentage || 0,
      formData.dispositionFeePercentage || 0,
    ].reduce((sum, fee) => sum + fee, 0);

    const fixedFees = [
      formData.platformFeeFixed || 0,
      formData.managementFeeFixed || 0,
      formData.maintenanceFeeFixed || 0,
      formData.acquisitionFeeFixed || 0,
      formData.dispositionFeeFixed || 0,
    ].reduce((sum, fee) => sum + fee, 0);

    return {
      totalPercentage: percentageFees / 100,
      totalFixed: fixedFees / 100,
    };
  };

  const totals = calculateTotalFees();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/offerings/${offeringId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offering
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Fee Structure</h1>
        </div>
        <p className="text-muted-foreground">
          Configure all fees associated with this offering. Be transparent about costs to build investor trust.
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          All percentage fees are entered as percentages (e.g., 2.5 for 2.5%). Fixed fees are in USD.
          Provide clear descriptions to help investors understand each fee.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Platform Fee */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Fee</CardTitle>
            <CardDescription>
              Fee charged by the platform for hosting and managing the offering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformFeePercentage">Percentage (%)</Label>
                <Input
                  id="platformFeePercentage"
                  type="number"
                  step="0.01"
                  placeholder="2.00"
                  value={formData.platformFeePercentage ? formData.platformFeePercentage / 100 : ""}
                  onChange={(e) => updateField("platformFeePercentage", parseFloat(e.target.value) * 100)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformFeeFixed">Fixed Fee (USD)</Label>
                <Input
                  id="platformFeeFixed"
                  type="number"
                  placeholder="500"
                  value={formData.platformFeeFixed ? formData.platformFeeFixed / 100 : ""}
                  onChange={(e) => updateField("platformFeeFixed", parseFloat(e.target.value) * 100)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformFeeDescription">Description</Label>
              <Textarea
                id="platformFeeDescription"
                placeholder="Explain what this fee covers..."
                rows={2}
                value={formData.platformFeeDescription || ""}
                onChange={(e) => updateField("platformFeeDescription", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Management Fee */}
        <Card>
          <CardHeader>
            <CardTitle>Management Fee</CardTitle>
            <CardDescription>
              Ongoing fee for property management and operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managementFeePercentage">Percentage (%)</Label>
                <Input
                  id="managementFeePercentage"
                  type="number"
                  step="0.01"
                  placeholder="1.50"
                  value={formData.managementFeePercentage ? formData.managementFeePercentage / 100 : ""}
                  onChange={(e) => updateField("managementFeePercentage", parseFloat(e.target.value) * 100)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="managementFeeFixed">Fixed Fee (USD/year)</Label>
                <Input
                  id="managementFeeFixed"
                  type="number"
                  placeholder="1000"
                  value={formData.managementFeeFixed ? formData.managementFeeFixed / 100 : ""}
                  onChange={(e) => updateField("managementFeeFixed", parseFloat(e.target.value) * 100)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managementFeeDescription">Description</Label>
              <Textarea
                id="managementFeeDescription"
                placeholder="Explain what this fee covers..."
                rows={2}
                value={formData.managementFeeDescription || ""}
                onChange={(e) => updateField("managementFeeDescription", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance Fee */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Fee</CardTitle>
            <CardDescription>
              Fee based on investment performance (typically a percentage of profits)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="performanceFeePercentage">Percentage of Profits (%)</Label>
              <Input
                id="performanceFeePercentage"
                type="number"
                step="0.01"
                placeholder="20.00"
                value={formData.performanceFeePercentage ? formData.performanceFeePercentage / 100 : ""}
                onChange={(e) => updateField("performanceFeePercentage", parseFloat(e.target.value) * 100)}
              />
              <p className="text-xs text-muted-foreground">
                Common structure: 20% of profits above a hurdle rate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceFeeDescription">Description</Label>
              <Textarea
                id="performanceFeeDescription"
                placeholder="Explain the performance fee structure, hurdle rate, and calculation method..."
                rows={3}
                value={formData.performanceFeeDescription || ""}
                onChange={(e) => updateField("performanceFeeDescription", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Fee */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Fee</CardTitle>
            <CardDescription>
              Ongoing maintenance and operational costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceFeePercentage">Percentage (%)</Label>
                <Input
                  id="maintenanceFeePercentage"
                  type="number"
                  step="0.01"
                  placeholder="0.50"
                  value={formData.maintenanceFeePercentage ? formData.maintenanceFeePercentage / 100 : ""}
                  onChange={(e) => updateField("maintenanceFeePercentage", parseFloat(e.target.value) * 100)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceFeeFixed">Fixed Fee (USD/year)</Label>
                <Input
                  id="maintenanceFeeFixed"
                  type="number"
                  placeholder="500"
                  value={formData.maintenanceFeeFixed ? formData.maintenanceFeeFixed / 100 : ""}
                  onChange={(e) => updateField("maintenanceFeeFixed", parseFloat(e.target.value) * 100)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceFeeDescription">Description</Label>
              <Textarea
                id="maintenanceFeeDescription"
                placeholder="Explain what this fee covers..."
                rows={2}
                value={formData.maintenanceFeeDescription || ""}
                onChange={(e) => updateField("maintenanceFeeDescription", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Acquisition Fee */}
        <Card>
          <CardHeader>
            <CardTitle>Acquisition Fee</CardTitle>
            <CardDescription>
              One-time fee for property acquisition and due diligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acquisitionFeePercentage">Percentage (%)</Label>
                <Input
                  id="acquisitionFeePercentage"
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  value={formData.acquisitionFeePercentage ? formData.acquisitionFeePercentage / 100 : ""}
                  onChange={(e) => updateField("acquisitionFeePercentage", parseFloat(e.target.value) * 100)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acquisitionFeeFixed">Fixed Fee (USD)</Label>
                <Input
                  id="acquisitionFeeFixed"
                  type="number"
                  placeholder="5000"
                  value={formData.acquisitionFeeFixed ? formData.acquisitionFeeFixed / 100 : ""}
                  onChange={(e) => updateField("acquisitionFeeFixed", parseFloat(e.target.value) * 100)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionFeeDescription">Description</Label>
              <Textarea
                id="acquisitionFeeDescription"
                placeholder="Explain what this fee covers..."
                rows={2}
                value={formData.acquisitionFeeDescription || ""}
                onChange={(e) => updateField("acquisitionFeeDescription", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Disposition Fee */}
        <Card>
          <CardHeader>
            <CardTitle>Disposition Fee</CardTitle>
            <CardDescription>
              Fee for property sale and transaction management at exit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dispositionFeePercentage">Percentage (%)</Label>
                <Input
                  id="dispositionFeePercentage"
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  value={formData.dispositionFeePercentage ? formData.dispositionFeePercentage / 100 : ""}
                  onChange={(e) => updateField("dispositionFeePercentage", parseFloat(e.target.value) * 100)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispositionFeeFixed">Fixed Fee (USD)</Label>
                <Input
                  id="dispositionFeeFixed"
                  type="number"
                  placeholder="5000"
                  value={formData.dispositionFeeFixed ? formData.dispositionFeeFixed / 100 : ""}
                  onChange={(e) => updateField("dispositionFeeFixed", parseFloat(e.target.value) * 100)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispositionFeeDescription">Description</Label>
              <Textarea
                id="dispositionFeeDescription"
                placeholder="Explain what this fee covers..."
                rows={2}
                value={formData.dispositionFeeDescription || ""}
                onChange={(e) => updateField("dispositionFeeDescription", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fee Summary */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Fee Summary</CardTitle>
            <CardDescription>
              Total fees across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Total Percentage Fees:</span>
                <span className="font-bold">{totals.totalPercentage.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Total Fixed Fees:</span>
                <span className="font-bold">${totals.totalFixed.toLocaleString()}</span>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalEstimatedAnnualFees">
                    Estimated Total Annual Fees (USD)
                  </Label>
                  <Input
                    id="totalEstimatedAnnualFees"
                    type="number"
                    placeholder="25000"
                    value={
                      formData.totalEstimatedAnnualFees
                        ? formData.totalEstimatedAnnualFees / 100
                        : ""
                    }
                    onChange={(e) =>
                      updateField("totalEstimatedAnnualFees", parseFloat(e.target.value) * 100)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeImpactOnReturns">
                    Estimated Impact on Returns (%)
                  </Label>
                  <Input
                    id="feeImpactOnReturns"
                    type="number"
                    step="0.01"
                    placeholder="1.50"
                    value={
                      formData.feeImpactOnReturns
                        ? formData.feeImpactOnReturns / 100
                        : ""
                    }
                    onChange={(e) =>
                      updateField("feeImpactOnReturns", parseFloat(e.target.value) * 100)
                    }
                  />
                </div>
              </div>

              {totals.totalPercentage > 5 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Total percentage fees exceed 5%, which may be considered high by investors.
                    Consider reviewing your fee structure for competitiveness.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(`/offerings/${offeringId}`)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {existingFees ? "Update" : "Save"} Fee Structure
        </Button>
      </div>
    </div>
  );
}
