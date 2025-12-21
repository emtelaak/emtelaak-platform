import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * CREATE OFFERING WIZARD
 * Multi-step form for creating new property offerings
 * 
 * Steps:
 * 1. Offering Type & Structure
 * 2. Share & Investment Details
 * 3. Ownership & Exit Strategy
 * 4. Timeline & Funding
 * 5. Review & Submit
 */

type OfferingFormData = {
  propertyId: number;
  offeringType: string;
  totalOfferingAmount: number;
  minimumOfferingAmount?: number;
  maximumOfferingAmount?: number;
  shareType?: string;
  totalShares: number;
  pricePerShare: number;
  minimumSharePurchase: number;
  maximumSharePurchase?: number;
  ownershipStructure: string;
  ownershipStructureDetails?: string;
  holdingPeriodMonths?: number;
  lockupPeriodMonths?: number;
  exitStrategy?: string;
  exitStrategyDetails?: string;
  expectedExitDate?: Date;
  fundingStartDate?: Date;
  fundingEndDate?: Date;
  expectedClosingDate?: Date;
  maximumInvestors?: number;
};

const STEPS = [
  { id: 1, title: "Offering Type", description: "Select offering structure" },
  { id: 2, title: "Share Details", description: "Configure shares and pricing" },
  { id: 3, title: "Ownership", description: "Define ownership structure" },
  { id: 4, title: "Timeline", description: "Set key dates" },
  { id: 5, title: "Review", description: "Review and submit" },
];

export default function CreateOffering() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OfferingFormData>>({
    minimumSharePurchase: 1,
  });

  const createOfferingMutation = trpc.offerings.create.useMutation({
    onSuccess: (data) => {
      toast.success("Offering created successfully!");
      navigate(`/offerings/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create offering: ${error.message}`);
    },
  });

  const updateFormData = (field: keyof OfferingFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await createOfferingMutation.mutateAsync(formData as any);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1OfferingType formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2ShareDetails formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Ownership formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4Timeline formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <Step5Review formData={formData} />;
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.propertyId && formData.offeringType;
      case 2:
        return (
          formData.totalOfferingAmount &&
          formData.totalShares &&
          formData.pricePerShare
        );
      case 3:
        return formData.ownershipStructure;
      case 4:
        return true; // Timeline is optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Breadcrumb />
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep > step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={nextStep} disabled={!isStepValid()}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createOfferingMutation.isPending || !isStepValid()}
          >
            {createOfferingMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Create Offering
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

function Step1OfferingType({
  formData,
  updateFormData,
}: {
  formData: Partial<OfferingFormData>;
  updateFormData: (field: keyof OfferingFormData, value: any) => void;
}) {
  const { data: properties, isLoading } = trpc.properties.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="propertyId">Property *</Label>
        <Select
          value={formData.propertyId?.toString()}
          onValueChange={(value) => updateFormData("propertyId", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Loading properties...
              </SelectItem>
            ) : (
              properties?.map((property: any) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name || property.nameAr || `Property #${property.id}`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="offeringType">Offering Type *</Label>
        <Select
          value={formData.offeringType}
          onValueChange={(value) => updateFormData("offeringType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select offering type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regulation_d_506b">Regulation D 506(b)</SelectItem>
            <SelectItem value="regulation_d_506c">Regulation D 506(c)</SelectItem>
            <SelectItem value="regulation_a_tier1">Regulation A - Tier 1</SelectItem>
            <SelectItem value="regulation_a_tier2">Regulation A - Tier 2</SelectItem>
            <SelectItem value="regulation_cf">Regulation Crowdfunding</SelectItem>
            <SelectItem value="private_placement">Private Placement</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Select the regulatory framework for this offering
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalOfferingAmount">Total Offering Amount (USD) *</Label>
        <Input
          id="totalOfferingAmount"
          type="number"
          placeholder="1000000"
          value={formData.totalOfferingAmount ? formData.totalOfferingAmount / 100 : ""}
          onChange={(e) =>
            updateFormData("totalOfferingAmount", parseInt(e.target.value) * 100)
          }
        />
        <p className="text-sm text-muted-foreground">
          Total amount to be raised through this offering
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minimumOfferingAmount">Minimum Amount (USD)</Label>
          <Input
            id="minimumOfferingAmount"
            type="number"
            placeholder="500000"
            value={formData.minimumOfferingAmount ? formData.minimumOfferingAmount / 100 : ""}
            onChange={(e) =>
              updateFormData("minimumOfferingAmount", parseInt(e.target.value) * 100)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maximumOfferingAmount">Maximum Amount (USD)</Label>
          <Input
            id="maximumOfferingAmount"
            type="number"
            placeholder="2000000"
            value={formData.maximumOfferingAmount ? formData.maximumOfferingAmount / 100 : ""}
            onChange={(e) =>
              updateFormData("maximumOfferingAmount", parseInt(e.target.value) * 100)
            }
          />
        </div>
      </div>
    </div>
  );
}

function Step2ShareDetails({
  formData,
  updateFormData,
}: {
  formData: Partial<OfferingFormData>;
  updateFormData: (field: keyof OfferingFormData, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="shareType">Share Type</Label>
        <Input
          id="shareType"
          placeholder="e.g., Common Shares, Preferred Units"
          value={formData.shareType || ""}
          onChange={(e) => updateFormData("shareType", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalShares">Total Shares *</Label>
          <Input
            id="totalShares"
            type="number"
            placeholder="10000"
            value={formData.totalShares || ""}
            onChange={(e) => updateFormData("totalShares", parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerShare">Price Per Share (USD) *</Label>
          <Input
            id="pricePerShare"
            type="number"
            placeholder="100"
            value={formData.pricePerShare ? formData.pricePerShare / 100 : ""}
            onChange={(e) =>
              updateFormData("pricePerShare", parseInt(e.target.value) * 100)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minimumSharePurchase">Minimum Share Purchase *</Label>
          <Input
            id="minimumSharePurchase"
            type="number"
            placeholder="1"
            value={formData.minimumSharePurchase || 1}
            onChange={(e) =>
              updateFormData("minimumSharePurchase", parseInt(e.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maximumSharePurchase">Maximum Share Purchase</Label>
          <Input
            id="maximumSharePurchase"
            type="number"
            placeholder="1000"
            value={formData.maximumSharePurchase || ""}
            onChange={(e) =>
              updateFormData("maximumSharePurchase", parseInt(e.target.value))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maximumInvestors">Maximum Number of Investors</Label>
        <Input
          id="maximumInvestors"
          type="number"
          placeholder="500"
          value={formData.maximumInvestors || ""}
          onChange={(e) => updateFormData("maximumInvestors", parseInt(e.target.value))}
        />
        <p className="text-sm text-muted-foreground">
          Leave blank for no limit
        </p>
      </div>
    </div>
  );
}

function Step3Ownership({
  formData,
  updateFormData,
}: {
  formData: Partial<OfferingFormData>;
  updateFormData: (field: keyof OfferingFormData, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ownershipStructure">Ownership Structure *</Label>
        <Select
          value={formData.ownershipStructure}
          onValueChange={(value) => updateFormData("ownershipStructure", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select ownership structure" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="llc_membership">LLC Membership Interest</SelectItem>
            <SelectItem value="corporation_stock">Corporation Stock</SelectItem>
            <SelectItem value="limited_partnership">Limited Partnership</SelectItem>
            <SelectItem value="reit_shares">REIT Shares</SelectItem>
            <SelectItem value="tokenized_ownership">Tokenized Ownership</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownershipStructureDetails">Structure Details</Label>
        <Textarea
          id="ownershipStructureDetails"
          placeholder="Provide additional details about the ownership structure..."
          rows={4}
          value={formData.ownershipStructureDetails || ""}
          onChange={(e) =>
            updateFormData("ownershipStructureDetails", e.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holdingPeriodMonths">Holding Period (Months)</Label>
          <Input
            id="holdingPeriodMonths"
            type="number"
            placeholder="60"
            value={formData.holdingPeriodMonths || ""}
            onChange={(e) =>
              updateFormData("holdingPeriodMonths", parseInt(e.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lockupPeriodMonths">Lock-up Period (Months)</Label>
          <Input
            id="lockupPeriodMonths"
            type="number"
            placeholder="12"
            value={formData.lockupPeriodMonths || ""}
            onChange={(e) =>
              updateFormData("lockupPeriodMonths", parseInt(e.target.value))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exitStrategy">Exit Strategy</Label>
        <Select
          value={formData.exitStrategy}
          onValueChange={(value) => updateFormData("exitStrategy", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select exit strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="property_sale">Property Sale</SelectItem>
            <SelectItem value="refinance">Refinance</SelectItem>
            <SelectItem value="buyback">Buyback</SelectItem>
            <SelectItem value="secondary_market">Secondary Market</SelectItem>
            <SelectItem value="ipo">IPO</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exitStrategyDetails">Exit Strategy Details</Label>
        <Textarea
          id="exitStrategyDetails"
          placeholder="Describe the planned exit strategy..."
          rows={4}
          value={formData.exitStrategyDetails || ""}
          onChange={(e) => updateFormData("exitStrategyDetails", e.target.value)}
        />
      </div>
    </div>
  );
}

function Step4Timeline({
  formData,
  updateFormData,
}: {
  formData: Partial<OfferingFormData>;
  updateFormData: (field: keyof OfferingFormData, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fundingStartDate">Funding Start Date</Label>
        <Input
          id="fundingStartDate"
          type="date"
          value={
            formData.fundingStartDate
              ? formData.fundingStartDate.toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            updateFormData("fundingStartDate", new Date(e.target.value))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fundingEndDate">Funding End Date</Label>
        <Input
          id="fundingEndDate"
          type="date"
          value={
            formData.fundingEndDate
              ? formData.fundingEndDate.toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            updateFormData("fundingEndDate", new Date(e.target.value))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedClosingDate">Expected Closing Date</Label>
        <Input
          id="expectedClosingDate"
          type="date"
          value={
            formData.expectedClosingDate
              ? formData.expectedClosingDate.toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            updateFormData("expectedClosingDate", new Date(e.target.value))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedExitDate">Expected Exit Date</Label>
        <Input
          id="expectedExitDate"
          type="date"
          value={
            formData.expectedExitDate
              ? formData.expectedExitDate.toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            updateFormData("expectedExitDate", new Date(e.target.value))
          }
        />
      </div>
    </div>
  );
}

function Step5Review({ formData }: { formData: Partial<OfferingFormData> }) {
  const formatCurrency = (cents?: number) => {
    if (!cents) return "Not set";
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Offering Details</h3>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Offering Type:</dt>
            <dd className="font-medium">{formData.offeringType}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total Amount:</dt>
            <dd className="font-medium">{formatCurrency(formData.totalOfferingAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total Shares:</dt>
            <dd className="font-medium">{formData.totalShares?.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Price Per Share:</dt>
            <dd className="font-medium">{formatCurrency(formData.pricePerShare)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Ownership Structure</h3>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Structure:</dt>
            <dd className="font-medium">{formData.ownershipStructure}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Holding Period:</dt>
            <dd className="font-medium">
              {formData.holdingPeriodMonths
                ? `${formData.holdingPeriodMonths} months`
                : "Not set"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Exit Strategy:</dt>
            <dd className="font-medium">{formData.exitStrategy || "Not set"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Timeline</h3>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Funding Start:</dt>
            <dd className="font-medium">{formatDate(formData.fundingStartDate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Funding End:</dt>
            <dd className="font-medium">{formatDate(formData.fundingEndDate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Expected Closing:</dt>
            <dd className="font-medium">{formatDate(formData.expectedClosingDate)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
