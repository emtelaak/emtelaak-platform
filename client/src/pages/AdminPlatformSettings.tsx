import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Settings, DollarSign, Percent, Save } from "lucide-react";
import { Link } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminPlatformSettings() {
  const { data: fees, isLoading, refetch } = trpc.platformSettings.getFees.useQuery();
  const updatePlatformFee = trpc.platformSettings.updatePlatformFee.useMutation();
  const updateProcessingFee = trpc.platformSettings.updateProcessingFee.useMutation();

  const [platformFeePercentage, setPlatformFeePercentage] = useState<string>("");
  const [processingFeeDollars, setProcessingFeeDollars] = useState<string>("");

  // Initialize form values when data loads
  useState(() => {
    if (fees) {
      setPlatformFeePercentage(fees.platformFeePercentage.toString());
      setProcessingFeeDollars(fees.processingFeeDollars.toString());
    }
  });

  const handleUpdatePlatformFee = async () => {
    const percentage = parseFloat(platformFeePercentage);
    
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error("Please enter a valid percentage between 0 and 100");
      return;
    }

    try {
      await updatePlatformFee.mutateAsync({ percentage });
      toast.success(`Platform fee updated to ${percentage}%`);
      refetch();
    } catch (error) {
      toast.error("Failed to update platform fee");
      console.error(error);
    }
  };

  const handleUpdateProcessingFee = async () => {
    const dollars = parseFloat(processingFeeDollars);
    
    if (isNaN(dollars) || dollars < 0) {
      toast.error("Please enter a valid amount (0 or greater)");
      return;
    }

    try {
      await updateProcessingFee.mutateAsync({ dollars });
      toast.success(`Processing fee updated to $${dollars.toFixed(2)}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update processing fee");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/super-admin">
            <Button variant="ghost" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Platform Settings</h1>
              <p className="text-gray-600">Configure platform fees and charges</p>
            </div>
          </div>
        </div>

        {/* Current Settings Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Current Platform Fee
              </CardTitle>
              <CardDescription>Percentage charged on investments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {fees?.platformFeePercentage}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Current Processing Fee
              </CardTitle>
              <CardDescription>Fixed fee per transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${fees?.processingFeeDollars.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Configuration Forms */}
        <div className="space-y-6">
          {/* Platform Fee Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Fee Percentage</CardTitle>
              <CardDescription>
                Set the percentage fee charged on all investment transactions. This fee is calculated
                as a percentage of the investment amount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformFee">Fee Percentage (%)</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      id="platformFee"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={platformFeePercentage}
                      onChange={(e) => setPlatformFeePercentage(e.target.value)}
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <Button
                    onClick={handleUpdatePlatformFee}
                    disabled={updatePlatformFee.isPending}
                    className="min-w-[120px]"
                  >
                    {updatePlatformFee.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Example Calculation:</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Investment Amount: $10,000</p>
                  <p>Platform Fee ({platformFeePercentage || fees?.platformFeePercentage}%): $
                    {((parseFloat(platformFeePercentage || fees?.platformFeePercentage.toString() || "0") / 100) * 10000).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Fee Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Fee Amount</CardTitle>
              <CardDescription>
                Set the fixed processing fee charged per investment transaction. This is a flat fee
                added to every investment regardless of the investment amount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="processingFee">Fee Amount ($)</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      id="processingFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={processingFeeDollars}
                      onChange={(e) => setProcessingFeeDollars(e.target.value)}
                      placeholder="e.g., 5.00"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateProcessingFee}
                    disabled={updateProcessingFee.isPending}
                    className="min-w-[120px]"
                  >
                    {updateProcessingFee.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Example Total Fees:</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Investment Amount: $10,000</p>
                  <p>Platform Fee ({platformFeePercentage || fees?.platformFeePercentage}%): $
                    {((parseFloat(platformFeePercentage || fees?.platformFeePercentage.toString() || "0") / 100) * 10000).toFixed(2)}
                  </p>
                  <p>Processing Fee: ${parseFloat(processingFeeDollars || fees?.processingFeeDollars.toString() || "0").toFixed(2)}</p>
                  <p className="font-semibold border-t pt-1 mt-1">
                    Total Fees: $
                    {(
                      ((parseFloat(platformFeePercentage || fees?.platformFeePercentage.toString() || "0") / 100) * 10000) +
                      parseFloat(processingFeeDollars || fees?.processingFeeDollars.toString() || "0")
                    ).toFixed(2)}
                  </p>
                  <p className="font-semibold">
                    Total Amount to Pay: $
                    {(
                      10000 +
                      ((parseFloat(platformFeePercentage || fees?.platformFeePercentage.toString() || "0") / 100) * 10000) +
                      parseFloat(processingFeeDollars || fees?.processingFeeDollars.toString() || "0")
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Notice */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Changes to fee settings will apply to all new investment
              transactions immediately. Existing pending transactions will use the fees that were active
              when they were created.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
