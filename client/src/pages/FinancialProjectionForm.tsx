import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Calculator, TrendingUp, DollarSign, Info } from "lucide-react";

/**
 * FINANCIAL PROJECTION FORM
 * Comprehensive form for creating/editing financial projections for offerings
 * 
 * Sections:
 * 1. Return Metrics (IRR, ROI, Cash-on-Cash, Equity Multiple)
 * 2. Rental Yield Projections (5-year)
 * 3. Appreciation Projections (5-year)
 * 4. Cash Flow Projections (5-year)
 * 5. Distribution Schedule
 * 6. Sensitivity Analysis
 */

type FinancialProjectionData = {
  offeringId: number;
  projectedIRR?: number;
  projectedROI?: number;
  projectedCashOnCash?: number;
  projectedEquityMultiple?: number;
  year1RentalYield?: number;
  year2RentalYield?: number;
  year3RentalYield?: number;
  year4RentalYield?: number;
  year5RentalYield?: number;
  annualYieldGrowthRate?: number;
  year1Appreciation?: number;
  year2Appreciation?: number;
  year3Appreciation?: number;
  year4Appreciation?: number;
  year5Appreciation?: number;
  annualAppreciationRate?: number;
  year1CashFlow?: number;
  year2CashFlow?: number;
  year3CashFlow?: number;
  year4CashFlow?: number;
  year5CashFlow?: number;
  distributionFrequency?: string;
  firstDistributionDate?: Date;
  estimatedAnnualDistribution?: number;
  bestCaseIRR?: number;
  baseCaseIRR?: number;
  worstCaseIRR?: number;
  assumptionsNotes?: string;
};

export default function FinancialProjectionForm() {
  const [, params] = useRoute("/offerings/:id/financial-projections");
  const [, navigate] = useLocation();
  const offeringId = params?.id ? parseInt(params.id) : 0;

  const [formData, setFormData] = useState<Partial<FinancialProjectionData>>({
    offeringId,
  });

  const { data: existingProjection, isLoading } = trpc.offerings.getFinancialProjection.useQuery(
    { offeringId },
    { enabled: offeringId > 0 }
  );

  const createMutation = trpc.offerings.createFinancialProjection.useMutation({
    onSuccess: () => {
      toast.success("Financial projections saved successfully!");
      navigate(`/offerings/${offeringId}`);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const updateMutation = trpc.offerings.updateFinancialProjection.useMutation({
    onSuccess: () => {
      toast.success("Financial projections updated successfully!");
      navigate(`/offerings/${offeringId}`);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  useEffect(() => {
    if (existingProjection) {
      setFormData(existingProjection as any);
    }
  }, [existingProjection]);

  const updateField = (field: keyof FinancialProjectionData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (existingProjection) {
        await updateMutation.mutateAsync({
          offeringId,
          data: formData as any,
        });
      } else {
        await createMutation.mutateAsync(formData as any);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/offerings/${offeringId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offering
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Financial Projections</h1>
        </div>
        <p className="text-muted-foreground">
          Configure financial projections and return metrics for this offering
        </p>
      </div>

      <Tabs defaultValue="returns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="returns">Return Metrics</TabsTrigger>
          <TabsTrigger value="projections">5-Year Projections</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
        </TabsList>

        {/* Return Metrics Tab */}
        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle>Projected Return Metrics</CardTitle>
              <CardDescription>
                Enter projected returns for investors. All percentages should be entered as basis points (e.g., 1200 = 12%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectedIRR">
                    Projected IRR (%)
                    <Info className="inline w-3 h-3 ml-1 text-muted-foreground" />
                  </Label>
                  <Input
                    id="projectedIRR"
                    type="number"
                    step="0.01"
                    placeholder="12.50"
                    value={formData.projectedIRR ? formData.projectedIRR / 100 : ""}
                    onChange={(e) => updateField("projectedIRR", parseFloat(e.target.value) * 100)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal Rate of Return - annualized return over the investment period
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectedROI">Projected ROI (%)</Label>
                  <Input
                    id="projectedROI"
                    type="number"
                    step="0.01"
                    placeholder="45.00"
                    value={formData.projectedROI ? formData.projectedROI / 100 : ""}
                    onChange={(e) => updateField("projectedROI", parseFloat(e.target.value) * 100)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Return on Investment - total return over the investment period
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectedCashOnCash">Cash-on-Cash Return (%)</Label>
                  <Input
                    id="projectedCashOnCash"
                    type="number"
                    step="0.01"
                    placeholder="8.50"
                    value={formData.projectedCashOnCash ? formData.projectedCashOnCash / 100 : ""}
                    onChange={(e) => updateField("projectedCashOnCash", parseFloat(e.target.value) * 100)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual cash return as a percentage of cash invested
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectedEquityMultiple">Equity Multiple</Label>
                  <Input
                    id="projectedEquityMultiple"
                    type="number"
                    step="0.01"
                    placeholder="1.85"
                    value={formData.projectedEquityMultiple ? formData.projectedEquityMultiple / 100 : ""}
                    onChange={(e) => updateField("projectedEquityMultiple", parseFloat(e.target.value) * 100)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total cash returned divided by total cash invested
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5-Year Projections Tab */}
        <TabsContent value="projections">
          <div className="space-y-6">
            {/* Rental Yield Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Rental Yield Projections</CardTitle>
                <CardDescription>
                  Projected rental yields for the next 5 years (as percentages)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <div key={year} className="space-y-2">
                      <Label htmlFor={`year${year}RentalYield`}>Year {year} (%)</Label>
                      <Input
                        id={`year${year}RentalYield`}
                        type="number"
                        step="0.01"
                        placeholder="5.50"
                        value={
                          formData[`year${year}RentalYield` as keyof FinancialProjectionData]
                            ? (formData[`year${year}RentalYield` as keyof FinancialProjectionData] as number) / 100
                            : ""
                        }
                        onChange={(e) =>
                          updateField(`year${year}RentalYield` as keyof FinancialProjectionData, parseFloat(e.target.value) * 100)
                        }
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label htmlFor="annualYieldGrowthRate">Annual Growth Rate (%)</Label>
                    <Input
                      id="annualYieldGrowthRate"
                      type="number"
                      step="0.01"
                      placeholder="2.00"
                      value={formData.annualYieldGrowthRate ? formData.annualYieldGrowthRate / 100 : ""}
                      onChange={(e) => updateField("annualYieldGrowthRate", parseFloat(e.target.value) * 100)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appreciation Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Property Appreciation Projections</CardTitle>
                <CardDescription>
                  Projected property value appreciation for the next 5 years (as percentages)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <div key={year} className="space-y-2">
                      <Label htmlFor={`year${year}Appreciation`}>Year {year} (%)</Label>
                      <Input
                        id={`year${year}Appreciation`}
                        type="number"
                        step="0.01"
                        placeholder="4.00"
                        value={
                          formData[`year${year}Appreciation` as keyof FinancialProjectionData]
                            ? (formData[`year${year}Appreciation` as keyof FinancialProjectionData] as number) / 100
                            : ""
                        }
                        onChange={(e) =>
                          updateField(`year${year}Appreciation` as keyof FinancialProjectionData, parseFloat(e.target.value) * 100)
                        }
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label htmlFor="annualAppreciationRate">Annual Appreciation Rate (%)</Label>
                    <Input
                      id="annualAppreciationRate"
                      type="number"
                      step="0.01"
                      placeholder="3.50"
                      value={formData.annualAppreciationRate ? formData.annualAppreciationRate / 100 : ""}
                      onChange={(e) => updateField("annualAppreciationRate", parseFloat(e.target.value) * 100)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Projections</CardTitle>
                <CardDescription>
                  Projected annual cash flows for the next 5 years (in EGP)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5].map((year) => (
                    <div key={year} className="space-y-2">
                      <Label htmlFor={`year${year}CashFlow`}>Year {year} ($)</Label>
                      <Input
                        id={`year${year}CashFlow`}
                        type="number"
                        placeholder="50000"
                        value={
                          formData[`year${year}CashFlow` as keyof FinancialProjectionData]
                            ? (formData[`year${year}CashFlow` as keyof FinancialProjectionData] as number) / 100
                            : ""
                        }
                        onChange={(e) =>
                          updateField(`year${year}CashFlow` as keyof FinancialProjectionData, parseFloat(e.target.value) * 100)
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Schedule Tab */}
        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Distribution Schedule</CardTitle>
              <CardDescription>
                Configure how and when distributions will be made to investors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="distributionFrequency">Distribution Frequency</Label>
                  <Select
                    value={formData.distributionFrequency}
                    onValueChange={(value) => updateField("distributionFrequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstDistributionDate">First Distribution Date</Label>
                  <Input
                    id="firstDistributionDate"
                    type="date"
                    value={
                      formData.firstDistributionDate
                        ? formData.firstDistributionDate.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => updateField("firstDistributionDate", new Date(e.target.value))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="estimatedAnnualDistribution">
                    Estimated Annual Distribution (EGP)
                  </Label>
                  <Input
                    id="estimatedAnnualDistribution"
                    type="number"
                    placeholder="100000"
                    value={
                      formData.estimatedAnnualDistribution
                        ? formData.estimatedAnnualDistribution / 100
                        : ""
                    }
                    onChange={(e) =>
                      updateField("estimatedAnnualDistribution", parseFloat(e.target.value) * 100)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Total estimated annual distributions to all investors
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sensitivity Analysis Tab */}
        <TabsContent value="sensitivity">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Analysis</CardTitle>
                <CardDescription>
                  Provide best-case, base-case, and worst-case IRR scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bestCaseIRR" className="text-green-600">
                      <TrendingUp className="inline w-4 h-4 mr-1" />
                      Best Case IRR (%)
                    </Label>
                    <Input
                      id="bestCaseIRR"
                      type="number"
                      step="0.01"
                      placeholder="18.00"
                      value={formData.bestCaseIRR ? formData.bestCaseIRR / 100 : ""}
                      onChange={(e) => updateField("bestCaseIRR", parseFloat(e.target.value) * 100)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseCaseIRR">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Base Case IRR (%)
                    </Label>
                    <Input
                      id="baseCaseIRR"
                      type="number"
                      step="0.01"
                      placeholder="12.00"
                      value={formData.baseCaseIRR ? formData.baseCaseIRR / 100 : ""}
                      onChange={(e) => updateField("baseCaseIRR", parseFloat(e.target.value) * 100)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="worstCaseIRR" className="text-red-600">
                      <TrendingUp className="inline w-4 h-4 mr-1 rotate-180" />
                      Worst Case IRR (%)
                    </Label>
                    <Input
                      id="worstCaseIRR"
                      type="number"
                      step="0.01"
                      placeholder="6.00"
                      value={formData.worstCaseIRR ? formData.worstCaseIRR / 100 : ""}
                      onChange={(e) => updateField("worstCaseIRR", parseFloat(e.target.value) * 100)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assumptions & Notes</CardTitle>
                <CardDescription>
                  Document the key assumptions underlying these projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="assumptionsNotes"
                  placeholder="Enter key assumptions, methodology, market conditions, risks, and any other relevant notes..."
                  rows={8}
                  value={formData.assumptionsNotes || ""}
                  onChange={(e) => updateField("assumptionsNotes", e.target.value)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(`/offerings/${offeringId}`)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {existingProjection ? "Update" : "Save"} Financial Projections
        </Button>
      </div>
    </div>
  );
}
