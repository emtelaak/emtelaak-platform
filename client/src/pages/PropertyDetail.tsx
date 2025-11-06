import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, APP_LOGO, APP_TITLE } from "@/const";
import { 
  Building2, MapPin, TrendingUp, Calendar, DollarSign, FileText, 
  Image as ImageIcon, ArrowLeft, CheckCircle2, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import ROICalculator from "@/components/ROICalculator";

export default function PropertyDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [distributionFrequency, setDistributionFrequency] = useState<"monthly" | "quarterly" | "annual">("monthly");

  const propertyId = parseInt(id || "0");
  const { data: property, isLoading } = trpc.properties.getById.useQuery(
    { id: propertyId },
    { enabled: propertyId > 0 }
  );

  const createInvestmentMutation = trpc.investments.create.useMutation({
    onSuccess: () => {
      toast.success("Investment created successfully! Awaiting payment confirmation.");
      setInvestModalOpen(false);
      setInvestmentAmount("");
      setLocation("/portfolio");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create investment");
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatPercentage = (value: number) => {
    return `${(value / 100).toFixed(2)}%`;
  };

  const calculateShares = (amount: number) => {
    if (!property) return 0;
    return Math.floor(amount / property.sharePrice);
  };

  const calculateOwnership = (amount: number) => {
    if (!property) return 0;
    const shares = calculateShares(amount);
    return ((shares / property.totalShares) * 100).toFixed(4);
  };

  const handleInvest = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    const amount = parseInt(investmentAmount) * 100; // Convert to cents
    if (!property || amount < property.minimumInvestment) {
      toast.error(`Minimum investment is ${formatCurrency(property?.minimumInvestment || 0)}`);
      return;
    }

    const shares = calculateShares(amount);
    if (shares > property.availableShares) {
      toast.error("Not enough shares available");
      return;
    }

    createInvestmentMutation.mutate({
      propertyId: property.id,
      amount,
      shares,
      sharePrice: property.sharePrice,
      distributionFrequency,
      paymentMethod,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Property Not Found</CardTitle>
            <CardDescription>The property you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/properties">
              <Button className="w-full">Browse Properties</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fundingProgress = ((property.totalValue - property.availableValue) / property.totalValue) * 100;
  const yieldValue = property.investmentType === "buy_to_let" 
    ? property.projectedNetYield || property.rentalYield 
    : property.expectedAppreciation;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-auto cursor-pointer" />
              </Link>
              <Link href="/properties">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Properties
                </Button>
              </Link>
            </div>
            <Button onClick={() => setInvestModalOpen(true)} size="lg">
              Invest Now
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Property Image */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-24 w-24 text-muted-foreground/30" />
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-primary text-primary-foreground">
                {property.investmentType === "buy_to_let" ? "High Yield" : "Capital Growth"}
              </Badge>
              <Badge variant="outline" className="bg-background">
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Key Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{property.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                {property.city}, {property.country}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="text-2xl font-bold">{formatCurrency(property.totalValue)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Minimum Investment</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(property.minimumInvestment)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expected Yield</p>
                  <p className="text-xl font-bold text-primary flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {formatPercentage(yieldValue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Share Price</p>
                  <p className="text-xl font-bold">{formatCurrency(property.sharePrice)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Funding Progress</span>
                  <span className="font-medium">{fundingProgress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${fundingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatCurrency(property.totalValue - property.availableValue)} raised</span>
                  <span>{property.availableShares.toLocaleString()} shares left</span>
                </div>
              </div>

              {property.fundingDeadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {new Date(property.fundingDeadline).toLocaleDateString()}</span>
                </div>
              )}

              <Button onClick={() => setInvestModalOpen(true)} className="w-full" size="lg">
                <DollarSign className="mr-2 h-5 w-5" />
                Invest in This Property
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="calculator">ROI Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium capitalize">{property.propertyType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Investment Type</span>
                    <span className="font-medium capitalize">{property.investmentType.replace('_', ' ')}</span>
                  </div>
                  {property.propertySize && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{property.propertySize.toLocaleString()} m²</span>
                    </div>
                  )}
                  {property.numberOfUnits && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Units</span>
                      <span className="font-medium">{property.numberOfUnits}</span>
                    </div>
                  )}
                  {property.constructionYear && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Built</span>
                      <span className="font-medium">{property.constructionYear}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Shares</span>
                    <span className="font-medium">{property.totalShares.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {property.investmentType === "buy_to_let" && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">Rental Yield</span>
                        <span className="font-semibold text-primary">{formatPercentage(property.rentalYield || 0)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">Management Fee</span>
                        <span className="font-medium">{formatPercentage(property.managementFee || 0)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">Other Costs</span>
                        <span className="font-medium">{formatPercentage(property.otherCosts || 0)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b bg-primary/5 px-4 -mx-4">
                        <span className="font-semibold">Projected Net Yield</span>
                        <span className="font-bold text-primary text-lg">
                          {formatPercentage(property.projectedNetYield || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-muted-foreground">Distribution Frequency</span>
                        <span className="font-medium capitalize">{property.distributionFrequency}</span>
                      </div>
                    </>
                  )}
                  {property.investmentType === "buy_to_sell" && (
                    <>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">Fund Term</span>
                        <span className="font-medium">{property.fundTermMonths} months</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">Projected Sale Price</span>
                        <span className="font-semibold">{formatCurrency(property.projectedSalePrice || 0)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b bg-primary/5 px-4 -mx-4">
                        <span className="font-semibold">Expected Appreciation</span>
                        <span className="font-bold text-primary text-lg">
                          {formatPercentage(property.expectedAppreciation || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Documents</CardTitle>
                <CardDescription>Legal, financial, and technical documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>Documents will be available after investment</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="mt-6">
            <ROICalculator
              defaultPropertyType={property.propertyType}
              defaultPropertyValue={property.totalValue / 100}
              defaultInvestmentAmount={property.minimumInvestment / 100}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Investment Modal */}
      <Dialog open={investModalOpen} onOpenChange={setInvestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest in {property.name}</DialogTitle>
            <DialogDescription>
              Enter your investment amount and payment details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Min: $${property.minimumInvestment / 100}`}
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                min={property.minimumInvestment / 100}
                step={100}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: {formatCurrency(property.minimumInvestment)}
              </p>
            </div>

            {investmentAmount && parseInt(investmentAmount) >= property.minimumInvestment / 100 && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-medium">{calculateShares(parseInt(investmentAmount) * 100)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ownership</span>
                  <span className="font-medium">{calculateOwnership(parseInt(investmentAmount) * 100)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Share Price</span>
                  <span className="font-medium">{formatCurrency(property.sharePrice)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="frequency">Distribution Frequency</Label>
              <Select value={distributionFrequency} onValueChange={(v: any) => setDistributionFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">KYC Verification Required</p>
                <p className="text-blue-700 dark:text-blue-200">
                  You must complete KYC verification before investing. Payment instructions will be sent after submission.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvest}
              disabled={!investmentAmount || parseInt(investmentAmount) < property.minimumInvestment / 100 || createInvestmentMutation.isPending}
            >
              {createInvestmentMutation.isPending ? "Processing..." : "Confirm Investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
