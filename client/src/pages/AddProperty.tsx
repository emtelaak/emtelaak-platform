import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomFieldsForm, useSaveCustomFields } from "@/components/CustomFieldsForm";
import type { CustomFieldValue } from "@/components/CustomFieldRenderer";
import { Breadcrumb } from "@/components/Breadcrumb";

interface ImageUpload {
  imageData: string;
  mimeType: string;
  caption?: string;
  captionAr?: string;
  isPrimary: boolean;
  preview: string;
}

export default function AddProperty() {
  const { t, dir } = useLanguage();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue[]>([]);
  const { saveCustomFields } = useSaveCustomFields();

  // Basic Info
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [investmentType, setInvestmentType] = useState<string>("");
  const [status, setStatus] = useState<string>("draft");

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
  const [minimumInvestment, setMinimumInvestment] = useState("10000"); // $100 in cents

  // Buy to Let
  const [rentalYield, setRentalYield] = useState("");
  const [distributionFrequency, setDistributionFrequency] = useState<string>("");

  // Buy to Sell
  const [fundTermMonths, setFundTermMonths] = useState("");
  const [expectedAppreciation, setExpectedAppreciation] = useState("");

  const createPropertyMutation = trpc.admin.properties.create.useMutation({
    onSuccess: async (data) => {
      // Save custom fields if any
      if (customFieldValues.length > 0) {
        try {
          await saveCustomFields("properties", data.propertyId, customFieldValues);
        } catch (error) {
          console.error("Failed to save custom fields:", error);
          // Don't fail the whole operation if custom fields fail
        }
      }
      toast.success("Property created successfully!");
      setLocation(`/properties/${data.propertyId}`);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setImages((prev) => [
          ...prev,
          {
            imageData,
            mimeType: file.type,
            isPrimary: prev.length === 0, // First image is primary by default
            preview: imageData,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // If removed image was primary, make first image primary
      if (prev[index].isPrimary && newImages.length > 0) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name || !propertyType || !investmentType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!totalValue || !sharePrice || !totalShares) {
      toast.error("Please fill in all financial details");
      return;
    }

    setIsSubmitting(true);

    createPropertyMutation.mutate({
      // Basic Info
      name,
      nameAr: nameAr || undefined,
      description: description || undefined,
      descriptionAr: descriptionAr || undefined,
      propertyType: propertyType as any,
      investmentType: investmentType as any,
      status: status as any,

      // Location
      addressLine1: addressLine1 || undefined,
      addressLine2: addressLine2 || undefined,
      city: city || undefined,
      country: country || undefined,

      // Property Details
      propertySize: propertySize ? parseInt(propertySize) : undefined,
      numberOfUnits: numberOfUnits ? parseInt(numberOfUnits) : undefined,
      constructionYear: constructionYear ? parseInt(constructionYear) : undefined,

      // Financial Details
      totalValue: parseInt(totalValue),
      sharePrice: parseInt(sharePrice),
      totalShares: parseInt(totalShares),
      minimumInvestment: parseInt(minimumInvestment),

      // Buy to Let
      rentalYield: rentalYield ? parseInt(rentalYield) : undefined,
      distributionFrequency: (distributionFrequency as "monthly" | "quarterly" | "annual" | undefined) || undefined,

      // Buy to Sell
      fundTermMonths: fundTermMonths ? parseInt(fundTermMonths) : undefined,
      expectedAppreciation: expectedAppreciation ? parseInt(expectedAppreciation) : undefined,

      // Images
      images: images.length > 0 ? images : undefined,
    });
  };

  return (
    <div className="container max-w-5xl py-8" dir={dir}>
      <Breadcrumb />
      <Card>
        <CardHeader>
          <CardTitle>Add New Property</CardTitle>
          <CardDescription>Create a new property listing for investors</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="custom">Additional</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name (English) *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Luxury Apartment in Cairo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">Property Name (Arabic)</Label>
                    <Input
                      id="nameAr"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="شقة فاخرة في القاهرة"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (English)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the property..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                  <Textarea
                    id="descriptionAr"
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    placeholder="وصف العقار..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investmentType">Investment Type *</Label>
                    <Select value={investmentType} onValueChange={setInvestmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy_to_let">Buy to Let</SelectItem>
                        <SelectItem value="buy_to_sell">Buy to Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
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
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Cairo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., Egypt"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertySize">Property Size (m²)</Label>
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
                      placeholder="e.g., 2023"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalValue">Total Value (cents) *</Label>
                    <Input
                      id="totalValue"
                      type="number"
                      value={totalValue}
                      onChange={(e) => setTotalValue(e.target.value)}
                      placeholder="e.g., 50000000 ($500,000)"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {totalValue && `$${(parseInt(totalValue) / 100).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sharePrice">Price Per Share (cents) *</Label>
                    <Input
                      id="sharePrice"
                      type="number"
                      value={sharePrice}
                      onChange={(e) => setSharePrice(e.target.value)}
                      placeholder="e.g., 10000 ($100)"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {sharePrice && `$${(parseInt(sharePrice) / 100).toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalShares">Total Shares *</Label>
                    <Input
                      id="totalShares"
                      type="number"
                      value={totalShares}
                      onChange={(e) => setTotalShares(e.target.value)}
                      placeholder="e.g., 5000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumInvestment">Minimum Investment (cents)</Label>
                    <Input
                      id="minimumInvestment"
                      type="number"
                      value={minimumInvestment}
                      onChange={(e) => setMinimumInvestment(e.target.value)}
                      placeholder="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      ${(parseInt(minimumInvestment) / 100).toLocaleString()}
                    </p>
                  </div>
                </div>

                {investmentType === "buy_to_let" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rentalYield">Rental Yield (% × 100)</Label>
                      <Input
                        id="rentalYield"
                        type="number"
                        value={rentalYield}
                        onChange={(e) => setRentalYield(e.target.value)}
                        placeholder="e.g., 800 (8%)"
                      />
                      <p className="text-xs text-muted-foreground">
                        {rentalYield && `${(parseInt(rentalYield) / 100).toFixed(2)}%`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distributionFrequency">Distribution Frequency</Label>
                      <Select value={distributionFrequency} onValueChange={setDistributionFrequency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {investmentType === "buy_to_sell" && (
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="expectedAppreciation">Expected Appreciation (% × 100)</Label>
                      <Input
                        id="expectedAppreciation"
                        type="number"
                        value={expectedAppreciation}
                        onChange={(e) => setExpectedAppreciation(e.target.value)}
                        placeholder="e.g., 2000 (20%)"
                      />
                      <p className="text-xs text-muted-foreground">
                        {expectedAppreciation && `${(parseInt(expectedAppreciation) / 100).toFixed(2)}%`}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="images">Property Images</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="images" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload images or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={image.isPrimary ? "default" : "secondary"}
                            onClick={() => setPrimaryImage(index)}
                          >
                            {image.isPrimary ? "Primary" : "Set Primary"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Custom Fields Tab */}
              <TabsContent value="custom" className="space-y-4">
                <CustomFieldsForm
                  module="properties"
                  showInContext="admin"
                  onValuesChange={setCustomFieldValues}
                />
              </TabsContent>
            </Tabs>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Property...
                  </>
                ) : (
                  "Create Property"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
