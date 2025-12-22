import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Settings, DollarSign, Percent, Save, Globe, Lock, Mail, Users } from "lucide-react";
import { Link } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function AdminPlatformSettings() {
  const { data: fees, isLoading, refetch } = trpc.platformSettings.getFees.useQuery();
  const { data: accessSettings, isLoading: accessLoading, refetch: refetchAccess } = trpc.platformSettings.getAccessMode.useQuery();
  const updatePlatformFee = trpc.platformSettings.updatePlatformFee.useMutation();
  const updateProcessingFee = trpc.platformSettings.updateProcessingFee.useMutation();
  const updateAccessMode = trpc.platformSettings.updateAccessMode.useMutation();
  const updateInvitationEmail = trpc.platformSettings.updateInvitationEmail.useMutation();

  const [platformFeePercentage, setPlatformFeePercentage] = useState<string>("");
  const [processingFeeDollars, setProcessingFeeDollars] = useState<string>("");
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(true);
  const [invitationEmail, setInvitationEmail] = useState<string>("noreply@emtelaak.co");

  // Initialize form values when data loads
  useEffect(() => {
    if (fees) {
      setPlatformFeePercentage(fees.platformFeePercentage.toString());
      setProcessingFeeDollars(fees.processingFeeDollars.toString());
    }
  }, [fees]);

  useEffect(() => {
    if (accessSettings) {
      setIsPrivateMode(accessSettings.accessMode === 'private');
      setInvitationEmail(accessSettings.invitationEmail || 'noreply@emtelaak.co');
    }
  }, [accessSettings]);

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

  const handleToggleAccessMode = async () => {
    const newMode = isPrivateMode ? 'public' : 'private';
    try {
      await updateAccessMode.mutateAsync({ mode: newMode });
      setIsPrivateMode(!isPrivateMode);
      toast.success(`Platform access mode changed to ${newMode}`);
      refetchAccess();
    } catch (error) {
      toast.error("Failed to update access mode");
      console.error(error);
    }
  };

  const handleUpdateInvitationEmail = async () => {
    if (!invitationEmail || !invitationEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await updateInvitationEmail.mutateAsync({ email: invitationEmail });
      toast.success(`Invitation email updated to ${invitationEmail}`);
      refetchAccess();
    } catch (error) {
      toast.error("Failed to update invitation email");
      console.error(error);
    }
  };

  if (isLoading || accessLoading) {
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
              <p className="text-gray-600">Configure platform access, fees and charges</p>
            </div>
          </div>
        </div>

        {/* Platform Access Mode */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPrivateMode ? <Lock className="h-5 w-5 text-amber-600" /> : <Globe className="h-5 w-5 text-green-600" />}
              Platform Access Mode
              <Badge variant={isPrivateMode ? "secondary" : "default"} className="ml-2">
                {isPrivateMode ? "Private" : "Public"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Control how users can register on the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Access Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Public Mode</span>
                </div>
                <p className="text-sm text-gray-500">Anyone can register freely</p>
              </div>
              <Switch
                checked={isPrivateMode}
                onCheckedChange={handleToggleAccessMode}
                disabled={updateAccessMode.isPending}
              />
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-medium">Private Mode</span>
                  <Lock className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-sm text-gray-500">Invitation or request only</p>
              </div>
            </div>

            {/* Private Mode Settings */}
            {isPrivateMode && (
              <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Private Mode Settings</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invitationEmail">Registration Request Email</Label>
                  <p className="text-sm text-gray-600">
                    Email address where registration requests will be sent
                  </p>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        id="invitationEmail"
                        type="email"
                        value={invitationEmail}
                        onChange={(e) => setInvitationEmail(e.target.value)}
                        placeholder="investment@emtelaak.com"
                      />
                    </div>
                    <Button
                      onClick={handleUpdateInvitationEmail}
                      disabled={updateInvitationEmail.isPending}
                      className="min-w-[120px]"
                    >
                      {updateInvitationEmail.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Users className="h-4 w-4 text-amber-700" />
                  <Link href="/admin/access-requests">
                    <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                      View Access Requests
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Public Mode Info */}
            {!isPrivateMode && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">Public Registration Active</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Anyone can create an account on the platform. New users will need to complete KYC verification before investing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
