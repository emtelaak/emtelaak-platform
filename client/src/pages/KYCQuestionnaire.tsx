import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function KYCQuestionnaire() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: questionnaire, isLoading: questionnaireLoading } = trpc.kyc.getQuestionnaire.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const submitQuestionnaireMutation = trpc.kyc.submitQuestionnaire.useMutation({
    onSuccess: () => {
      toast.success(t.kyc.questionnaire.submitSuccess || "Questionnaire Submitted", {
        description: t.kyc.questionnaire.submitSuccessDesc || "Your KYC questionnaire has been submitted for review.",
      });
      setLocation("/profile");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const [formData, setFormData] = useState({
    // Personal Financial Information
    annualIncome: questionnaire?.annualIncome || "",
    netWorth: questionnaire?.netWorth || "",
    liquidAssets: questionnaire?.liquidAssets || "",
    employmentStatus: questionnaire?.employmentStatus || "",
    occupation: questionnaire?.occupation || "",
    
    // Investment Experience
    investmentExperience: questionnaire?.investmentExperience || "",
    realEstateExperience: questionnaire?.realEstateExperience || "",
    previousInvestments: questionnaire?.previousInvestments || "",
    riskTolerance: questionnaire?.riskTolerance || "",
    
    // Investor Accreditation
    isAccredited: questionnaire?.isAccredited || false,
    accreditationType: questionnaire?.accreditationType || "",
    
    // Investment Goals
    investmentGoals: questionnaire?.investmentGoals || "",
    investmentHorizon: questionnaire?.investmentHorizon || "",
    expectedReturnRate: questionnaire?.expectedReturnRate || "",
    
    // Source of Funds
    sourceOfFunds: questionnaire?.sourceOfFunds || "",
    sourceOfFundsDetails: questionnaire?.sourceOfFundsDetails || "",
    
    // Additional Information
    politicallyExposed: questionnaire?.politicallyExposed || false,
    pepDetails: questionnaire?.pepDetails || "",
    additionalNotes: questionnaire?.additionalNotes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestionnaireMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    const requiredFields = [
      'annualIncome', 'netWorth', 'liquidAssets', 'employmentStatus', 'occupation',
      'investmentExperience', 'realEstateExperience', 'riskTolerance',
      'investmentGoals', 'investmentHorizon', 'expectedReturnRate',
      'sourceOfFunds'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value !== '' && value !== null && value !== undefined;
    });
    
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const progress = calculateProgress();

  if (authLoading || questionnaireLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t.nav.login}</CardTitle>
            <CardDescription>
              Please log in to complete your KYC questionnaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={"/login"}>
              <Button className="w-full">{t.nav.login}</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!questionnaire) {
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Not Started</Badge>;
    }
    
    switch (questionnaire.status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{t.kyc.questionnaire.title || "KYC Questionnaire"}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground mt-2">
                {t.kyc.questionnaire.subtitle || "Complete your investor accreditation questionnaire"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
            <Link href="/profile">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </div>
          
          {/* Progress Bar */}
          {questionnaire?.status !== "approved" && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {t.kyc.questionnaire.progress || "Completion Progress"}
                </span>
                <span className="text-muted-foreground font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {progress < 100 && (
                <p className="text-xs text-muted-foreground">
                  {t.kyc.questionnaire.progressHint || "Fill in all required fields to submit your questionnaire"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container py-8 max-w-4xl">
        {questionnaire?.status === "approved" && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Questionnaire Approved</p>
                  <p className="text-sm text-green-700">Your KYC questionnaire has been reviewed and approved.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {questionnaire?.status === "rejected" && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Questionnaire Rejected</p>
                  <p className="text-sm text-red-700">
                    {questionnaire.reviewNotes || "Please update your information and resubmit."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.kyc.questionnaire.financialInfo || "Financial Information"}</CardTitle>
              <CardDescription>
                {t.kyc.questionnaire.financialInfoDesc || "Provide details about your financial situation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualIncome">{t.kyc.questionnaire.annualIncome || "Annual Income"}</Label>
                  <Select value={formData.annualIncome} onValueChange={(v) => handleChange("annualIncome", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_500k">Under 500,000 EGP</SelectItem>
                      <SelectItem value="500k_1m">500,000 - 1,000,000 EGP</SelectItem>
                      <SelectItem value="1m_2m">1,000,000 - 2,000,000 EGP</SelectItem>
                      <SelectItem value="2m_5m">2,000,000 - 5,000,000 EGP</SelectItem>
                      <SelectItem value="over_5m">Over 5,000,000 EGP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netWorth">{t.kyc.questionnaire.netWorth || "Net Worth"}</Label>
                  <Select value={formData.netWorth} onValueChange={(v) => handleChange("netWorth", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_1m">Under 1,000,000 EGP</SelectItem>
                      <SelectItem value="1m_5m">1,000,000 - 5,000,000 EGP</SelectItem>
                      <SelectItem value="5m_10m">5,000,000 - 10,000,000 EGP</SelectItem>
                      <SelectItem value="10m_50m">10,000,000 - 50,000,000 EGP</SelectItem>
                      <SelectItem value="over_50m">Over 50,000,000 EGP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liquidAssets">{t.kyc.questionnaire.liquidAssets || "Liquid Assets"}</Label>
                  <Select value={formData.liquidAssets} onValueChange={(v) => handleChange("liquidAssets", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_500k">Under 500,000 EGP</SelectItem>
                      <SelectItem value="500k_2m">500,000 - 2,000,000 EGP</SelectItem>
                      <SelectItem value="2m_5m">2,000,000 - 5,000,000 EGP</SelectItem>
                      <SelectItem value="over_5m">Over 5,000,000 EGP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">{t.kyc.questionnaire.employmentStatus || "Employment Status"}</Label>
                  <Select value={formData.employmentStatus} onValueChange={(v) => handleChange("employmentStatus", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self_employed">Self-Employed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">{t.kyc.questionnaire.occupation || "Occupation/Industry"}</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  placeholder="e.g., Software Engineer, Business Owner"
                />
              </div>
            </CardContent>
          </Card>

          {/* Investment Experience */}
          <Card>
            <CardHeader>
              <CardTitle>{t.kyc.questionnaire.investmentExp || "Investment Experience"}</CardTitle>
              <CardDescription>
                {t.kyc.questionnaire.investmentExpDesc || "Tell us about your investment background"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.kyc.questionnaire.overallExp || "Overall Investment Experience"}</Label>
                <RadioGroup value={formData.investmentExperience} onValueChange={(v) => handleChange("investmentExperience", v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="exp-none" />
                    <Label htmlFor="exp-none" className="font-normal">No Experience</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limited" id="exp-limited" />
                    <Label htmlFor="exp-limited" className="font-normal">Limited (1-3 years)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="exp-moderate" />
                    <Label htmlFor="exp-moderate" className="font-normal">Moderate (3-7 years)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="extensive" id="exp-extensive" />
                    <Label htmlFor="exp-extensive" className="font-normal">Extensive (7+ years)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>{t.kyc.questionnaire.realEstateExp || "Real Estate Investment Experience"}</Label>
                <RadioGroup value={formData.realEstateExperience} onValueChange={(v) => handleChange("realEstateExperience", v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="re-none" />
                    <Label htmlFor="re-none" className="font-normal">No Experience</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limited" id="re-limited" />
                    <Label htmlFor="re-limited" className="font-normal">Limited (1-2 properties)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="re-moderate" />
                    <Label htmlFor="re-moderate" className="font-normal">Moderate (3-5 properties)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="extensive" id="re-extensive" />
                    <Label htmlFor="re-extensive" className="font-normal">Extensive (6+ properties)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousInvestments">{t.kyc.questionnaire.previousInv || "Previous Investment Types"}</Label>
                <Textarea
                  id="previousInvestments"
                  value={formData.previousInvestments}
                  onChange={(e) => handleChange("previousInvestments", e.target.value)}
                  placeholder="e.g., Stocks, Bonds, Real Estate, Mutual Funds"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.kyc.questionnaire.riskTolerance || "Risk Tolerance"}</Label>
                <RadioGroup value={formData.riskTolerance} onValueChange={(v) => handleChange("riskTolerance", v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="conservative" id="risk-conservative" />
                    <Label htmlFor="risk-conservative" className="font-normal">Conservative (Low Risk)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="risk-moderate" />
                    <Label htmlFor="risk-moderate" className="font-normal">Moderate (Medium Risk)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aggressive" id="risk-aggressive" />
                    <Label htmlFor="risk-aggressive" className="font-normal">Aggressive (High Risk)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Investor Accreditation */}
          <Card>
            <CardHeader>
              <CardTitle>{t.kyc.questionnaire.accreditation || "Investor Accreditation"}</CardTitle>
              <CardDescription>
                {t.kyc.questionnaire.accreditationDesc || "Determine your investor accreditation status"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAccredited"
                  checked={formData.isAccredited}
                  onCheckedChange={(checked) => handleChange("isAccredited", checked)}
                />
                <Label htmlFor="isAccredited" className="font-normal">
                  I am an accredited investor
                </Label>
              </div>

              {formData.isAccredited && (
                <div className="space-y-2">
                  <Label htmlFor="accreditationType">{t.kyc.questionnaire.accreditationType || "Accreditation Type"}</Label>
                  <Select value={formData.accreditationType} onValueChange={(v) => handleChange("accreditationType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income-based ($200k+ individual, $300k+ joint)</SelectItem>
                      <SelectItem value="net_worth">Net Worth-based ($1M+ excluding primary residence)</SelectItem>
                      <SelectItem value="professional">Professional Certification (Series 7, 65, 82)</SelectItem>
                      <SelectItem value="entity">Qualified Entity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Goals */}
          <Card>
            <CardHeader>
              <CardTitle>{t.kyc.questionnaire.goals || "Investment Goals"}</CardTitle>
              <CardDescription>
                {t.kyc.questionnaire.goalsDesc || "Define your investment objectives"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investmentGoals">{t.kyc.questionnaire.primaryGoals || "Primary Investment Goals"}</Label>
                <Textarea
                  id="investmentGoals"
                  value={formData.investmentGoals}
                  onChange={(e) => handleChange("investmentGoals", e.target.value)}
                  placeholder="e.g., Passive income, Capital appreciation, Portfolio diversification"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investmentHorizon">{t.kyc.questionnaire.horizon || "Investment Horizon"}</Label>
                  <Select value={formData.investmentHorizon} onValueChange={(v) => handleChange("investmentHorizon", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select horizon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short-term (1-3 years)</SelectItem>
                      <SelectItem value="medium">Medium-term (3-7 years)</SelectItem>
                      <SelectItem value="long">Long-term (7+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedReturnRate">{t.kyc.questionnaire.expectedReturn || "Expected Annual Return"}</Label>
                  <Select value={formData.expectedReturnRate} onValueChange={(v) => handleChange("expectedReturnRate", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_5">Under 5%</SelectItem>
                      <SelectItem value="5_10">5% - 10%</SelectItem>
                      <SelectItem value="10_15">10% - 15%</SelectItem>
                      <SelectItem value="over_15">Over 15%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source of Funds */}
          <Card>
            <CardHeader>
              <CardTitle>{t.kyc.questionnaire.sourceOfFunds || "Source of Funds"}</CardTitle>
              <CardDescription>
                {t.kyc.questionnaire.sourceOfFundsDesc || "Information about the origin of your investment funds"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sourceOfFunds">{t.kyc.questionnaire.primarySource || "Primary Source of Funds"}</Label>
                <Select value={formData.sourceOfFunds} onValueChange={(v) => handleChange("sourceOfFunds", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary/Employment Income</SelectItem>
                    <SelectItem value="business">Business Income</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="inheritance">Inheritance</SelectItem>
                    <SelectItem value="investments">Investment Returns</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceOfFundsDetails">{t.kyc.questionnaire.additionalDetails || "Additional Details"}</Label>
                <Textarea
                  id="sourceOfFundsDetails"
                  value={formData.sourceOfFundsDetails}
                  onChange={(e) => handleChange("sourceOfFundsDetails", e.target.value)}
                  placeholder="Provide additional information about your source of funds"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.kyc.questionnaire.additional || "Additional Information"}</CardTitle>
              <CardDescription>
                {t.kyc.questionnaire.additionalDesc || "Regulatory compliance information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="politicallyExposed"
                  checked={formData.politicallyExposed}
                  onCheckedChange={(checked) => handleChange("politicallyExposed", checked)}
                />
                <Label htmlFor="politicallyExposed" className="font-normal">
                  I am a Politically Exposed Person (PEP) or related to one
                </Label>
              </div>

              {formData.politicallyExposed && (
                <div className="space-y-2">
                  <Label htmlFor="pepDetails">{t.kyc.questionnaire.pepDetails || "PEP Details"}</Label>
                  <Textarea
                    id="pepDetails"
                    value={formData.pepDetails}
                    onChange={(e) => handleChange("pepDetails", e.target.value)}
                    placeholder="Please provide details about your PEP status"
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">{t.kyc.questionnaire.notes || "Additional Notes"}</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) => handleChange("additionalNotes", e.target.value)}
                  placeholder="Any additional information you'd like to provide"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/profile" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitQuestionnaireMutation.isPending || questionnaire?.status === "approved"}
            >
              {submitQuestionnaireMutation.isPending ? "Submitting..." : "Submit Questionnaire"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
