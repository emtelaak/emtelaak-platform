import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { KYC_DOCUMENT_TYPES, FILE_UPLOAD_LIMITS } from "@/const";
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { storagePut } from "../../../server/storage";

type KYCStep = "documents" | "questionnaire" | "review" | "complete";

export default function KYCWizard() {
  const [currentStep, setCurrentStep] = useState<KYCStep>("documents");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  const { data: documents, refetch: refetchDocuments } = trpc.kyc.getDocuments.useQuery();
  const { data: questionnaire } = trpc.kyc.getQuestionnaire.useQuery();
  const { data: verificationStatus } = trpc.profile.getVerificationStatus.useQuery();
  
  const uploadDocumentMutation = trpc.kyc.uploadDocument.useMutation({
    onSuccess: () => {
      refetchDocuments();
      toast.success("Document uploaded successfully");
      setUploadingDoc(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setUploadingDoc(null);
    },
  });

  const submitQuestionnaireMutation = trpc.kyc.submitQuestionnaire.useMutation({
    onSuccess: () => {
      toast.success("Questionnaire submitted successfully");
      setCurrentStep("review");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = async (file: File, documentType: keyof typeof KYC_DOCUMENT_TYPES) => {
    if (file.size > FILE_UPLOAD_LIMITS.maxSizeBytes) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    if (!FILE_UPLOAD_LIMITS.allowedDocumentTypes.includes(file.type as any)) {
      toast.error("Invalid file type. Please upload PDF, JPEG, or PNG files.");
      return;
    }

    setUploadingDoc(documentType);

    try {
      // Read file as buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `kyc-documents/${documentType}-${timestamp}-${randomSuffix}${file.name.substring(file.name.lastIndexOf('.'))}`;
      
      // Upload to S3 (this would need to be done server-side in production)
      // For now, we'll simulate the upload
      const fileUrl = URL.createObjectURL(file);
      
      await uploadDocumentMutation.mutateAsync({
        documentType,
        fileUrl,
        fileKey,
        fileName: file.name,
        mimeType: file.type,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
      setUploadingDoc(null);
    }
  };

  const handleQuestionnaireSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    submitQuestionnaireMutation.mutate({
      annualIncome: formData.get("financialCapacity") as string || "",
      netWorth: "",
      liquidAssets: "",
      employmentStatus: "",
      occupation: "",
      investmentExperience: formData.get("investmentExperience") as string || "",
      realEstateExperience: "",
      previousInvestments: "",
      riskTolerance: formData.get("riskTolerance") as string || "",
      isAccredited: formData.get("isAccreditedInvestor") === "yes",
      accreditationType: formData.get("accreditationDetails") as string || "",
      investmentGoals: formData.get("investmentGoals") as string || "",
      investmentHorizon: "",
      expectedReturnRate: "",
      sourceOfFunds: "",
      sourceOfFundsDetails: "",
      politicallyExposed: false,
      pepDetails: "",
      additionalNotes: "",
    });
  };

  const getStepProgress = () => {
    const steps: KYCStep[] = ["documents", "questionnaire", "review", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getDocumentStatus = (docType: keyof typeof KYC_DOCUMENT_TYPES) => {
    const doc = documents?.find(d => d.documentType === docType);
    if (!doc) return null;
    return doc.status;
  };

  const hasRequiredDocuments = () => {
    const hasIdDoc = documents?.some(d => 
      (d.documentType === "id_card" || d.documentType === "passport") && 
      (d.status === "approved" || d.status === "pending")
    );
    const hasAddressDoc = documents?.some(d => 
      d.documentType === "proof_of_address" && 
      (d.status === "approved" || d.status === "pending")
    );
    return hasIdDoc && hasAddressDoc;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
          <CardDescription>
            Complete your identity verification to start investing
          </CardDescription>
          <Progress value={getStepProgress()} className="mt-4" />
        </CardHeader>

        <CardContent>
          {/* Step Indicators */}
          <div className="flex justify-between mb-8">
            {[
              { step: "documents", label: "Documents" },
              { step: "questionnaire", label: "Questionnaire" },
              { step: "review", label: "Review" },
              { step: "complete", label: "Complete" },
            ].map(({ step, label }) => (
              <div
                key={step}
                className={`flex flex-col items-center ${
                  currentStep === step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {step === "complete" && verificationStatus?.documentsVerified ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">
                      {["documents", "questionnaire", "review", "complete"].indexOf(step) + 1}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === "documents" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload Identity Documents</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Please upload clear copies of your identification documents. All documents must be valid and not expired.
                </p>
              </div>

              <div className="space-y-4">
                {/* ID Card or Passport */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-semibold">ID Card or Passport</Label>
                      <p className="text-sm text-muted-foreground">Government-issued identification</p>
                    </div>
                    {(getDocumentStatus("id_card") || getDocumentStatus("passport")) && (
                      <Badge
                        variant={
                          (getDocumentStatus("id_card") === "approved" || getDocumentStatus("passport") === "approved")
                            ? "default"
                            : getDocumentStatus("id_card") === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {getDocumentStatus("id_card") || getDocumentStatus("passport")}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept={FILE_UPLOAD_LIMITS.allowedDocumentTypes.join(",")}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "id_card");
                        }}
                        className="hidden"
                        disabled={uploadingDoc === "id_card"}
                      />
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                        {uploadingDoc === "id_card" ? (
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        ) : (
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium">Upload ID Card</p>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept={FILE_UPLOAD_LIMITS.allowedDocumentTypes.join(",")}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "passport");
                        }}
                        className="hidden"
                        disabled={uploadingDoc === "passport"}
                      />
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                        {uploadingDoc === "passport" ? (
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        ) : (
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium">Upload Passport</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Proof of Address */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-semibold">Proof of Address</Label>
                      <p className="text-sm text-muted-foreground">Utility bill or bank statement (less than 3 months old)</p>
                    </div>
                    {getDocumentStatus("proof_of_address") && (
                      <Badge
                        variant={
                          getDocumentStatus("proof_of_address") === "approved"
                            ? "default"
                            : getDocumentStatus("proof_of_address") === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {getDocumentStatus("proof_of_address")}
                      </Badge>
                    )}
                  </div>
                  <label className="cursor-pointer block">
                    <Input
                      type="file"
                      accept={FILE_UPLOAD_LIMITS.allowedDocumentTypes.join(",")}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "proof_of_address");
                      }}
                      className="hidden"
                      disabled={uploadingDoc === "proof_of_address"}
                    />
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                      {uploadingDoc === "proof_of_address" ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      ) : (
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      )}
                      <p className="text-sm font-medium">Upload Proof of Address</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, or PNG (max 10MB)</p>
                    </div>
                  </label>
                </div>

                {/* Income Verification (Optional) */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-base font-semibold">Income Verification (Optional)</Label>
                      <p className="text-sm text-muted-foreground">Salary slip or tax return</p>
                    </div>
                    {getDocumentStatus("income_verification") && (
                      <Badge variant="secondary">{getDocumentStatus("income_verification")}</Badge>
                    )}
                  </div>
                  <label className="cursor-pointer block">
                    <Input
                      type="file"
                      accept={FILE_UPLOAD_LIMITS.allowedDocumentTypes.join(",")}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "income_verification");
                      }}
                      className="hidden"
                      disabled={uploadingDoc === "income_verification"}
                    />
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                      {uploadingDoc === "income_verification" ? (
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      ) : (
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      )}
                      <p className="text-sm font-medium">Upload Income Document</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setCurrentStep("questionnaire")}
                  disabled={!hasRequiredDocuments()}
                >
                  Continue to Questionnaire
                </Button>
              </div>
            </div>
          )}

          {currentStep === "questionnaire" && (
            <form onSubmit={handleQuestionnaireSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Investment Profile</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Help us understand your investment experience and goals
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="investmentExperience">Investment Experience</Label>
                  <Select name="investmentExperience" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="experienced">Experienced (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select name="riskTolerance" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your risk tolerance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="financialCapacity">Annual Income Range</Label>
                  <Select name="financialCapacity" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your income range" />
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

                <div>
                  <Label htmlFor="investmentGoals">Investment Goals</Label>
                  <Textarea
                    name="investmentGoals"
                    placeholder="Describe your investment goals and objectives..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Are you an accredited investor?</Label>
                  <RadioGroup name="isAccreditedInvestor" defaultValue="no">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="accredited-yes" />
                      <Label htmlFor="accredited-yes" className="font-normal cursor-pointer">
                        Yes, I am an accredited investor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="accredited-no" />
                      <Label htmlFor="accredited-no" className="font-normal cursor-pointer">
                        No, I am not an accredited investor
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="accreditationDetails">Accreditation Details (Optional)</Label>
                  <Textarea
                    name="accreditationDetails"
                    placeholder="If you are an accredited investor, please provide details..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("documents")}
                >
                  Back
                </Button>
                <Button type="submit" disabled={submitQuestionnaireMutation.isPending}>
                  {submitQuestionnaireMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Questionnaire"
                  )}
                </Button>
              </div>
            </form>
          )}

          {currentStep === "review" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Review & Verification</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Your documents and questionnaire have been submitted for review
                </p>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Verification in Progress</h4>
                      <p className="text-sm text-muted-foreground">
                        Our team is reviewing your documents and information. This typically takes 1-2 business days.
                        You will receive an email notification once your verification is complete.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Identity Documents</span>
                  </div>
                  <Badge variant="secondary">Under Review</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Investment Questionnaire</span>
                  </div>
                  <Badge variant="secondary">Submitted</Badge>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("questionnaire")}
                >
                  Back
                </Button>
                <Button onClick={() => setCurrentStep("complete")}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {currentStep === "complete" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Verification Submitted!</h3>
              <p className="text-muted-foreground mb-6">
                Thank you for completing the KYC process. We'll notify you once your verification is approved.
              </p>
              <Button onClick={() => window.location.href = "/dashboard"}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
