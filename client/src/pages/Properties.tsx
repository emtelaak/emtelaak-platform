import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PROPERTY_TYPES, INVESTMENT_TYPES, APP_LOGO, APP_TITLE } from "@/const";
import { Building2, MapPin, TrendingUp, Calendar, ArrowRight, Search, Bookmark, Heart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import PropertyImageDisplay from "@/components/PropertyImageDisplay";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import ROICalculator from "@/components/ROICalculator";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Breadcrumb } from "@/components/Breadcrumb";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import MobileBottomNav from "@/components/MobileBottomNav";
import Navigation from "@/components/Navigation";

export default function Properties() {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("available");
  const [filters, setFilters] = useState({
    propertyType: undefined as string | undefined,
    investmentType: undefined as string | undefined,
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
  });

  const { data: allProperties, isLoading } = trpc.properties.list.useQuery(filters);
  const { data: savedProperties } = trpc.properties.getSavedProperties.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  const savePropertyMutation = trpc.properties.saveProperty.useMutation({
    onMutate: async ({ propertyId }) => {
      // Cancel outgoing refetches
      await utils.properties.getSavedProperties.cancel();
      
      // Snapshot the previous value
      const previousSaved = utils.properties.getSavedProperties.getData();
      
      // Optimistically update to the new value
      const property = allProperties?.find(p => p.id === propertyId);
      if (property) {
        utils.properties.getSavedProperties.setData(undefined, (old) => {
          return old ? [...old, property] : [property];
        });
      }
      
      return { previousSaved };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSaved) {
        utils.properties.getSavedProperties.setData(undefined, context.previousSaved);
      }
    },
    onSettled: () => {
      utils.properties.getSavedProperties.invalidate();
    },
  });
  
  const unsavePropertyMutation = trpc.properties.unsaveProperty.useMutation({
    onMutate: async ({ propertyId }) => {
      await utils.properties.getSavedProperties.cancel();
      const previousSaved = utils.properties.getSavedProperties.getData();
      
      utils.properties.getSavedProperties.setData(undefined, (old) => {
        return old ? old.filter(p => p.id !== propertyId) : [];
      });
      
      return { previousSaved };
    },
    onError: (err, variables, context) => {
      if (context?.previousSaved) {
        utils.properties.getSavedProperties.setData(undefined, context.previousSaved);
      }
    },
    onSettled: () => {
      utils.properties.getSavedProperties.invalidate();
    },
  });
  
  const handleToggleSave = (propertyId: number) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = `/login?redirect=/properties`;
      return;
    }
    
    const isSaved = savedProperties?.some(p => p.id === propertyId);
    if (isSaved) {
      unsavePropertyMutation.mutate({ propertyId });
    } else {
      savePropertyMutation.mutate({ propertyId });
    }
  };

  // Filter properties based on status
  const properties = useMemo(() => {
    if (!allProperties) return [];
    
    if (statusFilter === "saved") {
      return savedProperties || [];
    }
    
    return allProperties.filter(property => property.status === statusFilter);
  }, [allProperties, savedProperties, statusFilter]);

  const formatCurrency = (cents: number) => {
    return formatCurrencyUtil(cents / 100, 'EGP', language);
  };

  const formatPercentage = (value: number) => {
    return `${(value / 100).toFixed(2)}%`;
  };

  const calculateFundingProgress = (totalValue: number, availableValue: number) => {
    return ((totalValue - availableValue) / totalValue) * 100;
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container py-4 md:py-6 px-4">
          <Breadcrumb />
          <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
            <Link href="/">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-12 md:h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 truncate">
                {language === "en" ? "Investment Properties" : "العقارات الاستثمارية"}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                {language === "en" 
                  ? "Browse our curated selection of premium real estate opportunities"
                  : "تصفح مجموعتنا المختارة من فرص العقارات المميزة"}
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <LanguageSwitcher />
              <Link href="/" className="hidden md:block">
                <Button variant="outline">{language === "en" ? "Back to Home" : "العودة للرئيسية"}</Button>
              </Link>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-5 md:max-w-3xl">
                <TabsTrigger value="available">
                  {language === "en" ? "Available" : "متاح"}
                </TabsTrigger>
                <TabsTrigger value="funded">
                  {language === "en" ? "Funded" : "ممول"}
                </TabsTrigger>
                <TabsTrigger value="exited">
                  {language === "en" ? "Exited" : "خرج"}
                </TabsTrigger>
                <TabsTrigger value="coming_soon">
                  {language === "en" ? "Coming Soon" : "قريباً"}
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <Bookmark className="h-4 w-4 mr-1" />
                  {language === "en" ? "Saved" : "محفوظ"}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                className="pl-9 h-11 md:h-10"
              />
            </div>

            <Select
              value={filters.propertyType}
              onValueChange={(value) => setFilters({ ...filters, propertyType: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="h-11 md:h-10">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(PROPERTY_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.investmentType}
              onValueChange={(value) => setFilters({ ...filters, investmentType: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="h-11 md:h-10">
                <SelectValue placeholder="Investment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {Object.entries(INVESTMENT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-11 md:h-10 md:col-span-4"
              onClick={() => setFilters({
                propertyType: undefined,
                investmentType: undefined,
                minValue: undefined,
                maxValue: undefined,
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="container py-8">
        <ROICalculator compact />
      </div>

      {/* Property Grid */}
      <div className="container py-4 md:py-8 px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allProperties && allProperties.length > 0 ? (
          <>
            <div className="mb-4 md:mb-6 text-sm text-muted-foreground">
              Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {properties.map((property) => {
                const fundingProgress = calculateFundingProgress(property.totalValue, property.availableValue);
                const yieldValue = property.rentalYield || property.expectedAppreciation || 0;

                return (
                  <Card key={property.id} className="property-card-hover overflow-hidden">
                    <div className="relative h-48 bg-muted">
                      <PropertyImageDisplay propertyId={property.id} className="absolute inset-0" />
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/90 hover:bg-background"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleSave(property.id);
                          }}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              savedProperties?.some(p => p.id === property.id)
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                        <Badge variant="secondary" className="bg-background/90">
                          {PROPERTY_TYPES[property.propertyType as keyof typeof PROPERTY_TYPES]}
                        </Badge>
                      </div>
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {property.status === "coming_soon" && (
                          <Badge className="bg-yellow-500 text-black font-semibold">
                            {language === "en" ? "Coming Soon" : "قريباً"}
                          </Badge>
                        )}
                        <Badge className="bg-primary text-primary-foreground">
                          {property.investmentType === "buy_to_let" 
                            ? (language === "en" ? "High Yield" : "عائد مرتفع") 
                            : (language === "en" ? "Capital Growth" : "نمو رأس المال")}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-1">{property.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.city}, {property.country}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            {language === "en" ? "Total Value" : "القيمة الإجمالية"}
                          </p>
                          <p className="font-semibold">{formatCurrency(property.totalValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {language === "en" ? "Price per Share" : "سعر الحصة"}
                          </p>
                          <p className="font-semibold text-primary">
                            {formatCurrency(property.sharePrice)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            {language === "en" ? "Available Shares" : "الحصص المتاحة"}
                          </p>
                          <p className="font-semibold">{property.availableShares.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {property.investmentType === "buy_to_sell"
                              ? (language === "en" ? "Expected ROI" : "العائد المتوقع على الاستثمار")
                              : (language === "en" ? "Expected Yield" : "العائد المتوقع")}
                          </p>
                          <p className="font-semibold text-primary flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatPercentage(yieldValue)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            {language === "en" ? "Funding Progress" : "تقدم التمويل"}
                          </span>
                          <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${fundingProgress}%` }}
                          />
                        </div>
                      </div>

                      {property.fundingDeadline && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Deadline: {new Date(property.fundingDeadline).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Link href={`/properties/${property.id}`} className="w-full">
                        <Button className="w-full">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            {!isAuthenticated ? (
              <>
                <h3 className="text-xl font-semibold mb-2">
                  {language === "en" ? "Login Required" : "يرجى تسجيل الدخول"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {language === "en" 
                    ? "Please login to view our exclusive investment properties."
                    : "يرجى تسجيل الدخول لعرض عقاراتنا الاستثمارية الحصرية."}
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/login?redirect=/properties">
                    <Button>
                      {language === "en" ? "Login" : "تسجيل الدخول"}
                    </Button>
                  </Link>
                  <Link href="/request-access">
                    <Button variant="outline">
                      {language === "en" ? "Request Access" : "طلب الوصول"}
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">
                  {language === "en" ? "No Properties Found" : "لم يتم العثور على عقارات"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {language === "en"
                    ? "Try adjusting your filters or check back later for new opportunities."
                    : "حاول تعديل الفلاتر أو تحقق لاحقاً من الفرص الجديدة."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    propertyType: undefined,
                    investmentType: undefined,
                    minValue: undefined,
                    maxValue: undefined,
                  })}
                >
                  {language === "en" ? "Clear All Filters" : "مسح جميع الفلاتر"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
