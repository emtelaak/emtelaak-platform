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
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  Building2, MapPin, TrendingUp, Calendar, DollarSign, FileText, 
  ArrowLeft, CheckCircle2, AlertCircle 
} from "lucide-react";
import PropertyGallery from "@/components/PropertyGallery";
import { toast } from "sonner";
import ROICalculator from "@/components/ROICalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PropertyDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [investModalOpen, setInvestModalOpen] = useState(false);
  const [numberOfShares, setNumberOfShares] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [distributionFrequency, setDistributionFrequency] = useState<"monthly" | "quarterly" | "annual">("monthly");

  const propertyId = parseInt(id || "0");
  const { data: property, isLoading } = trpc.properties.getById.useQuery(
    { id: propertyId },
    { enabled: propertyId > 0 }
  );

  const { data: waitlistStatus } = trpc.properties.checkWaitlistStatus.useQuery(
    { propertyId },
    { enabled: propertyId > 0 && isAuthenticated }
  );

  const joinWaitlistMutation = trpc.properties.joinWaitlist.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Successfully joined the waitlist!" : "تم الانضمام إلى قائمة الانتظار بنجاح!");
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to join waitlist" : "فشل الانضمام إلى قائمة الانتظار"));
    },
  });

  // Check if user has registered interest in this property
  const { data: interestStatus, refetch: refetchInterest } = trpc.propertyInterests.checkInterest.useQuery(
    { propertyId },
    { enabled: propertyId > 0 && isAuthenticated }
  );

  const registerInterestMutation = trpc.propertyInterests.registerInterest.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Your interest has been registered! We'll notify you when this property becomes available." : "تم تسجيل اهتمامك! سنعلمك عندما يصبح هذا العقار متاحاً.");
      refetchInterest();
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to register interest" : "فشل تسجيل الاهتمام"));
    },
  });

  // Calculate investment with fees
  const { data: investmentCalculation } = trpc.investmentTransactions.calculateInvestment.useQuery(
    {
      propertyId,
      numberOfShares: parseInt(numberOfShares) || 0,
    },
    {
      enabled: propertyId > 0 && parseInt(numberOfShares) > 0,
    }
  );

  const createInvestmentMutation = trpc.investmentTransactions.createInvestment.useMutation({
    onSuccess: () => {
      toast.success("Investment created successfully! Awaiting payment confirmation.");
      setInvestModalOpen(false);
      setNumberOfShares("");
      setLocation("/portfolio");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create investment");
    },
  });

  const formatCurrency = (cents: number) => {
    return formatCurrencyUtil(cents / 100, 'EGP', language);
  };

  const formatPercentage = (value: number) => {
    return `${(value / 100).toFixed(2)}%`;
  };

  const calculateAmount = (shares: number) => {
    if (!property) return 0;
    return shares * property.sharePrice;
  };

  const calculateOwnership = (shares: number) => {
    if (!property) return 0;
    return ((shares / property.totalShares) * 100).toFixed(4);
  };

  const handleInvest = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    const shares = parseInt(numberOfShares);
    if (!property || shares < 1) {
      toast.error("Minimum investment is 1 share");
      return;
    }

    if (shares > property.availableShares) {
      toast.error("Not enough shares available");
      return;
    }

    if (!investmentCalculation) {
      toast.error("Calculating investment details...");
      return;
    }

    createInvestmentMutation.mutate({
      propertyId: property.id,
      investmentAmount: investmentCalculation.investmentAmount,
      numberOfShares: investmentCalculation.numberOfShares,
      pricePerShare: investmentCalculation.pricePerShare,
      platformFee: investmentCalculation.platformFee,
      processingFee: investmentCalculation.processingFee,
      totalAmount: investmentCalculation.totalAmount,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Breadcrumb />
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
                <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
              </Link>
              <Link href="/properties">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Properties
                </Button>
              </Link>
            </div>
            {property.status === "coming_soon" ? (
              interestStatus?.hasInterest ? (
                <Button disabled size="lg" variant="outline" className="bg-green-50 border-green-500 text-green-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {language === "en" ? "Interest Registered" : "تم تسجيل الاهتمام"}
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = "/login";
                      return;
                    }
                    registerInterestMutation.mutate({ propertyId });
                  }} 
                  size="lg"
                  disabled={registerInterestMutation.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {registerInterestMutation.isPending 
                    ? (language === "en" ? "Registering..." : "جاري التسجيل...") 
                    : (language === "en" ? "I'm Interested" : "أنا مهتم")}
                </Button>
              )
            ) : (
              <Button onClick={() => {
                if (!isAuthenticated) {
                  window.location.href = "/login";
                  return;
                }
                if (!user?.emailVerified) {
                  toast.error(
                    language === "en" 
                      ? "Please verify your email address before investing. Check your inbox for the verification link."
                      : "يرجى التحقق من عنوان بريدك الإلكتروني قبل الاستثمار. تحقق من صندوق الوارد للحصول على رابط التحقق."
                  );
                  return;
                }
                setInvestModalOpen(true);
              }} size="lg">
                {language === "en" ? "Invest Now" : "استثمر الآن"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Property Gallery */}
          <PropertyGallery 
            propertyId={propertyId} 
            investmentType={property.investmentType}
            status={property.status}
            language={language}
          />

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
                  <span className="text-sm text-muted-foreground">
                    {language === "en" ? "Total Value" : "القيمة الإجمالية"}
                  </span>
                  <span className="text-2xl font-bold">{formatCurrency(property.totalValue)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">
                    {language === "en" ? "Price per Share" : "سعر الحصة"}
                  </span>
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(property.sharePrice)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {property.investmentType === "buy_to_sell"
                      ? (language === "en" ? "Expected ROI" : "العائد المتوقع على الاسثمار")
                      : (language === "en" ? "Expected Yield" : "العائد المتوقع")}
                  </p>
                  <p className="text-xl font-bold text-primary flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {formatPercentage(yieldValue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === "en" ? "Share Price" : "سعر الحصة"}
                  </p>
                  <p className="text-xl font-bold">{formatCurrency(property.sharePrice)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {language === "en" ? "Funding Progress" : "تقدم التمويل"}
                  </span>
                  <span className="font-medium">{fundingProgress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${fundingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    {formatCurrency(property.totalValue - property.availableValue)} {language === "en" ? "raised" : "تم جمعه"}
                  </span>
                  <span>
                    {property.availableShares.toLocaleString()} {language === "en" ? "shares left" : "حصة متبقية"}
                  </span>
                </div>
              </div>

              {property.fundingDeadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {new Date(property.fundingDeadline).toLocaleDateString()}</span>
                </div>
              )}

              {property.status === "coming_soon" ? (
                <Button 
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = "/login";
                      return;
                    }
                    registerInterestMutation.mutate({ propertyId });
                  }} 
                  className={`w-full ${interestStatus?.hasInterest ? 'bg-green-50 border-green-500 text-green-700' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
                  size="lg"
                  disabled={interestStatus?.hasInterest || registerInterestMutation.isPending}
                  variant={interestStatus?.hasInterest ? "outline" : "default"}
                >
                  {interestStatus?.hasInterest 
                    ? (<><CheckCircle2 className="mr-2 h-4 w-4" />{language === "en" ? "Interest Registered" : "تم تسجيل الاهتمام"}</>)
                    : (language === "en" ? "I'm Interested" : "أنا مهتم")
                  }
                </Button>
              ) : (
                <Button onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = "/login";
                    return;
                  }
                  if (!user?.emailVerified) {
                    toast.error(
                      language === "en" 
                        ? "Please verify your email address before investing. Check your inbox for the verification link."
                        : "يرجى التحقق من عنوان بريدك الإلكتروني قبل الاستثمار. تحقق من صندوق الوارد للحصول على رابط التحقق."
                    );
                    return;
                  }
                  setInvestModalOpen(true);
                }} className="w-full" size="lg">
                  {language === "en" ? "Invest in This Property" : "استثمر في هذا العقار"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{language === "en" ? "Overview" : "نظرة عامة"}</TabsTrigger>
            <TabsTrigger value="financials">{language === "en" ? "Financials" : "البيانات المالية"}</TabsTrigger>
            <TabsTrigger value="documents">{language === "en" ? "Documents" : "المستندات"}</TabsTrigger>
            <TabsTrigger value="calculator">{language === "en" ? "ROI Calculator" : "حاسبة العوائد"}</TabsTrigger>
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
            <DialogTitle>
              {language === "en" ? `Invest in ${property.name}` : `استثمر في ${property.name}`}
            </DialogTitle>
            <DialogDescription>
              {language === "en" ? "Enter your investment amount and payment details" : "أدخل مبلغ الاستثمار وتفاصيل الدفع"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shares">{language === "en" ? "Number of Shares" : "عدد الحصص"}</Label>
              <Input
                id="shares"
                type="number"
                placeholder={language === "en" ? "Minimum: 1 share" : "الحد الأدنى: حصة واحدة"}
                value={numberOfShares}
                onChange={(e) => setNumberOfShares(e.target.value)}
                min={1}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                {language === "en" 
                  ? `Minimum: 1 share • Price per share: ${formatCurrency(property.sharePrice)}`
                  : `الحد الأدنى: حصة واحدة • سعر الحصة: ${formatCurrency(property.sharePrice)}`
                }
              </p>
            </div>

            {numberOfShares && parseInt(numberOfShares) >= 1 && investmentCalculation && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{language === "en" ? "Investment Amount" : "مبلغ الاستثمار"}</span>
                  <span className="font-medium">{formatCurrency(investmentCalculation.investmentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === "en" 
                      ? `Platform Fee (${investmentCalculation.platformFeePercentage}%)` 
                      : `رسوم المنصة (${investmentCalculation.platformFeePercentage}%)`
                    }
                  </span>
                  <span className="font-medium">{formatCurrency(investmentCalculation.platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{language === "en" ? "Processing Fee" : "رسوم المعالجة"}</span>
                  <span className="font-medium">{formatCurrency(investmentCalculation.processingFee)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">{language === "en" ? "Total Amount" : "المبلغ الإجمالي"}</span>
                    <span className="font-bold text-lg">{formatCurrency(investmentCalculation.totalAmount)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">{language === "en" ? "Ownership" : "نسبة الملكية"}</span>
                  <span className="font-medium">{investmentCalculation.percentageOfProperty.toFixed(4)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{language === "en" ? "Number of Shares" : "عدد الحصص"}</span>
                  <span className="font-medium">{investmentCalculation.numberOfShares.toLocaleString()}</span>
                </div>
              </div>
            )}
            {numberOfShares && parseInt(numberOfShares) >= 1 && !investmentCalculation && (
              <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground">
                {language === "en" ? "Calculating fees..." : "جاري حساب الرسوم..."}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="frequency">{language === "en" ? "Distribution Frequency" : "تكرار التوزيع"}</Label>
              <Select value={distributionFrequency} onValueChange={(v: any) => setDistributionFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{language === "en" ? "Monthly" : "شهري"}</SelectItem>
                  <SelectItem value="quarterly">{language === "en" ? "Quarterly" : "ربع سنوي"}</SelectItem>
                  <SelectItem value="annual">{language === "en" ? "Annual" : "سنوي"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">{language === "en" ? "Payment Method" : "طريقة الدفع"}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">{language === "en" ? "Bank Transfer" : "تحويل بنكي"}</SelectItem>
                  <SelectItem value="credit_card">{language === "en" ? "Credit Card" : "بطاقة ائتمان"}</SelectItem>
                  <SelectItem value="wire_transfer">{language === "en" ? "Wire Transfer" : "تحويل بنكي دولي"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">
                  {language === "en" ? "KYC Verification Required" : "مطلوب التحقق من الهوية"}
                </p>
                <p className="text-blue-700 dark:text-blue-200">
                  {language === "en" 
                    ? "You must complete KYC verification before investing. Payment instructions will be sent after submission."
                    : "يجب إكمال التحقق من الهوية قبل الاستثمار. سيتم إرسال تعليمات الدفع بعد التقديم."}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestModalOpen(false)}>
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
            <Button 
              onClick={handleInvest}
              disabled={!numberOfShares || parseInt(numberOfShares) < 1 || createInvestmentMutation.isPending}
            >
              {createInvestmentMutation.isPending 
                ? (language === "en" ? "Processing..." : "جاري المعالجة...") 
                : (language === "en" ? "Confirm Investment" : "تأكيد الاستثمار")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
