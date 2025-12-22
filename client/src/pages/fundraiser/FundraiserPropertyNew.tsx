import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import FundraiserLayout from "@/components/layout/FundraiserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon, Building2, MapPin, DollarSign, FileText, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomFieldsForm, useSaveCustomFields } from "@/components/CustomFieldsForm";
import type { CustomFieldValue } from "@/components/CustomFieldRenderer";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageUpload {
  imageData: string;
  mimeType: string;
  caption?: string;
  captionAr?: string;
  isPrimary: boolean;
  preview: string;
}

export default function FundraiserPropertyNew() {
  const { t, dir } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue[]>([]);
  const { saveCustomFields } = useSaveCustomFields();
  const [activeTab, setActiveTab] = useState("basic");

  // Basic Info
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [investmentType, setInvestmentType] = useState<string>("");

  // Location
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  // Property Details
  const [propertySize, setPropertySize] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [constructionYear, setConstructionYear] = useState("");

  // Financial Details
  const [totalValue, setTotalValue] = useState("");
  const [sharePrice, setSharePrice] = useState("");
  const [totalShares, setTotalShares] = useState("");
  const [minimumInvestment, setMinimumInvestment] = useState("10000");

  // Buy to Let
  const [rentalYield, setRentalYield] = useState("");
  const [distributionFrequency, setDistributionFrequency] = useState<string>("");

  // Buy to Sell
  const [fundTermMonths, setFundTermMonths] = useState("");
  const [expectedAppreciation, setExpectedAppreciation] = useState("");

  // Use fundraiser-specific mutation that sets status to pending_approval
  const createPropertyMutation = trpc.fundraiser.submitProperty.useMutation({
    onSuccess: async (data) => {
      if (customFieldValues.length > 0) {
        try {
          await saveCustomFields("properties", data.propertyId, customFieldValues);
        } catch (error) {
          console.error("Failed to save custom fields:", error);
        }
      }
      toast.success("Property submitted for review! You will be notified once it's approved.");
      setLocation("/fundraiser/properties");
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  // Authorization check
  if (authLoading) {
    return (
      <FundraiserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </FundraiserLayout>
    );
  }

  if (!user || (user.role !== "fund_manager" && user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <FundraiserLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need fundraiser privileges to submit properties.</p>
            <Button onClick={() => setLocation("/")}>Go to Homepage</Button>
          </div>
        </div>
      </FundraiserLayout>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload only image files");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imageData = base64.split(",")[1];
        
        setImages((prev) => [
          ...prev,
          {
            imageData,
            mimeType: file.type,
            isPrimary: prev.length === 0,
            preview: base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some((img) => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || !propertyType || !investmentType || !totalValue || !sharePrice || !totalShares) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    const propertyData = {
      name,
      nameAr: nameAr || undefined,
      description,
      descriptionAr: descriptionAr || undefined,
      propertyType,
      investmentType,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      country,
      propertySize: propertySize ? parseInt(propertySize) : undefined,
      numberOfUnits: numberOfUnits ? parseInt(numberOfUnits) : undefined,
      constructionYear: constructionYear ? parseInt(constructionYear) : undefined,
      totalValue: parseInt(totalValue) * 100,
      sharePrice: parseInt(sharePrice) * 100,
      totalShares: parseInt(totalShares),
      minimumInvestment: parseInt(minimumInvestment),
      rentalYield: rentalYield ? parseFloat(rentalYield) : undefined,
      distributionFrequency: distributionFrequency || undefined,
      fundTermMonths: fundTermMonths ? parseInt(fundTermMonths) : undefined,
      expectedAppreciation: expectedAppreciation ? parseFloat(expectedAppreciation) : undefined,
      images: images.map((img) => ({
        imageData: img.imageData,
        mimeType: img.mimeType,
        caption: img.caption,
        captionAr: img.captionAr,
        isPrimary: img.isPrimary,
      })),
    };

    createPropertyMutation.mutate(propertyData);
  };

  const isBasicComplete = name && propertyType && investmentType;
  const isLocationComplete = addressLine1 && city && country;
  const isFinancialComplete = totalValue && sharePrice && totalShares;

  return (
    <FundraiserLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Submit New Property</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the property details below. Your submission will be reviewed by our team.
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Properties submitted through this form will be reviewed by our admin team before being listed on the platform.
            You'll receive a notification once your property is approved.
          </AlertDescription>
        </Alert>

        {/* Progress Indicators */}
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-2 ${isBasicComplete ? "text-green-600" : "text-muted-foreground"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isBasicComplete ? "bg-green-100" : "bg-muted"}`}>
              {isBasicComplete ? "✓" : "1"}
            </div>
            Basic Info
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className={`flex items-center gap-2 ${isLocationComplete ? "text-green-600" : "text-muted-foreground"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isLocationComplete ? "bg-green-100" : "bg-muted"}`}>
              {isLocationComplete ? "✓" : "2"}
            </div>
            Location
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className={`flex items-center gap-2 ${isFinancialComplete ? "text-green-600" : "text-muted-foreground"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isFinancialComplete ? "bg-green-100" : "bg-muted"}`}>
              {isFinancialComplete ? "✓" : "3"}
            </div>
            Financial
          </div>
        </div>

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Location</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Images</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic details about your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name (English) *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Marina Bay Residences"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">Property Name (Arabic)</Label>
                    <Input
                      id="nameAr"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="اسم العقار بالعربية"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (English)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the property, its features, and investment opportunity..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                  <Textarea
                    id="descriptionAr"
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    placeholder="وصف العقار بالعربية..."
                    rows={4}
                    dir="rtl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property Type *</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="mixed_use">Mixed Use</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Investment Type *</Label>
                    <Select value={investmentType} onValueChange={setInvestmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy_to_let">Buy to Let (Rental Income)</SelectItem>
                        <SelectItem value="buy_to_sell">Buy to Sell (Capital Appreciation)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab("location")}>
                    Next: Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Where is the property located?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Apartment, suite, unit, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("basic")}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab("details")}>
                    Next: Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Additional property specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertySize">Property Size (sqm)</Label>
                    <Input
                      id="propertySize"
                      type="number"
                      value={propertySize}
                      onChange={(e) => setPropertySize(e.target.value)}
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfUnits">Number of Units</Label>
                    <Input
                      id="numberOfUnits"
                      type="number"
                      value={numberOfUnits}
                      onChange={(e) => setNumberOfUnits(e.target.value)}
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="constructionYear">Construction Year</Label>
                    <Input
                      id="constructionYear"
                      type="number"
                      value={constructionYear}
                      onChange={(e) => setConstructionYear(e.target.value)}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>

                <CustomFieldsForm
                  entityType="properties"
                  values={customFieldValues}
                  onChange={setCustomFieldValues}
                />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("location")}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab("financial")}>
                    Next: Financial
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>Investment and pricing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalValue">Total Property Value ($) *</Label>
                    <Input
                      id="totalValue"
                      type="number"
                      value={totalValue}
                      onChange={(e) => setTotalValue(e.target.value)}
                      placeholder="e.g., 1000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sharePrice">Share Price ($) *</Label>
                    <Input
                      id="sharePrice"
                      type="number"
                      value={sharePrice}
                      onChange={(e) => setSharePrice(e.target.value)}
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalShares">Total Shares *</Label>
                    <Input
                      id="totalShares"
                      type="number"
                      value={totalShares}
                      onChange={(e) => setTotalShares(e.target.value)}
                      placeholder="e.g., 10000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumInvestment">Minimum Investment (cents)</Label>
                  <Input
                    id="minimumInvestment"
                    type="number"
                    value={minimumInvestment}
                    onChange={(e) => setMinimumInvestment(e.target.value)}
                    placeholder="e.g., 10000 (= $100)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter amount in cents. 10000 = $100
                  </p>
                </div>

                {investmentType === "buy_to_let" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="rentalYield">Expected Rental Yield (%)</Label>
                      <Input
                        id="rentalYield"
                        type="number"
                        step="0.1"
                        value={rentalYield}
                        onChange={(e) => setRentalYield(e.target.value)}
                        placeholder="e.g., 7.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Distribution Frequency</Label>
                      <Select value={distributionFrequency} onValueChange={setDistributionFrequency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {investmentType === "buy_to_sell" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="fundTermMonths">Fund Term (months)</Label>
                      <Input
                        id="fundTermMonths"
                        type="number"
                        value={fundTermMonths}
                        onChange={(e) => setFundTermMonths(e.target.value)}
                        placeholder="e.g., 24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedAppreciation">Expected Appreciation (%)</Label>
                      <Input
                        id="expectedAppreciation"
                        type="number"
                        step="0.1"
                        value={expectedAppreciation}
                        onChange={(e) => setExpectedAppreciation(e.target.value)}
                        placeholder="e.g., 15"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("details")}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab("images")}>
                    Next: Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Property Images</CardTitle>
                <CardDescription>Upload photos of the property (first image will be the primary)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB each
                    </p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview}
                          alt={`Property image ${index + 1}`}
                          className={`w-full h-32 object-cover rounded-lg ${
                            image.isPrimary ? "ring-2 ring-primary" : ""
                          }`}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          {!image.isPrimary && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPrimaryImage(index)}
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {image.isPrimary && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setActiveTab("financial")}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Review"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FundraiserLayout>
  );
}
