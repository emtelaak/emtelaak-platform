import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, FileText, User, Building2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { APP_LOGO } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminKYCReview() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: pendingQuestionnaires, refetch: refetchQuestionnaires } = trpc.admin.kyc.getPendingQuestionnaires.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin") }
  );

  const { data: pendingDocuments, refetch: refetchDocuments } = trpc.admin.kyc.getPendingDocuments.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin") }
  );

  const approveQuestionnaireMutation = trpc.admin.kyc.approveQuestionnaire.useMutation({
    onSuccess: () => {
      toast.success("Questionnaire Approved");
      refetchQuestionnaires();
      setReviewNotes("");
      setSelectedUser(null);
    },
  });

  const rejectQuestionnaireMutation = trpc.admin.kyc.rejectQuestionnaire.useMutation({
    onSuccess: () => {
      toast.success("Questionnaire Rejected");
      refetchQuestionnaires();
      setReviewNotes("");
      setSelectedUser(null);
    },
  });

  const approveDocumentMutation = trpc.admin.kyc.approveDocument.useMutation({
    onSuccess: () => {
      toast.success("Document Approved");
      refetchDocuments();
    },
  });

  const rejectDocumentMutation = trpc.admin.kyc.rejectDocument.useMutation({
    onSuccess: () => {
      toast.success("Document Rejected");
      refetchDocuments();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the admin panel</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src={APP_LOGO} alt="Emtelaak" className="h-10" />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/admin/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: "Admin", labelAr: "الإدارة", href: "/admin/dashboard" },
            { label: "KYC Review", labelAr: "مراجعة التحقق من الهوية" }
          ]} 
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">KYC Review</h1>
          <p className="text-muted-foreground">Review and approve pending KYC submissions</p>
        </div>

        <Tabs defaultValue="questionnaires" className="space-y-6">
          <TabsList>
            <TabsTrigger value="questionnaires" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Questionnaires
              {pendingQuestionnaires && pendingQuestionnaires.length > 0 && (
                <Badge variant="destructive">{pendingQuestionnaires.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Documents
              {pendingDocuments && pendingDocuments.length > 0 && (
                <Badge variant="destructive">{pendingDocuments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Questionnaires Tab */}
          <TabsContent value="questionnaires" className="space-y-4">
            {!pendingQuestionnaires || pendingQuestionnaires.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending questionnaires to review</p>
                </CardContent>
              </Card>
            ) : (
              pendingQuestionnaires.map((q: any) => (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">User ID: {q.userId}</CardTitle>
                          <CardDescription>
                            Submitted: {new Date(q.submittedAt).toLocaleDateString()}
                            {q.updatedAt && new Date(q.updatedAt).getTime() !== new Date(q.submittedAt).getTime() && (
                              <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                                • Updated: {new Date(q.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {q.updatedAt && new Date(q.updatedAt).getTime() !== new Date(q.submittedAt).getTime() && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Updated
                          </Badge>
                        )}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Financial Information */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Financial Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Annual Income:</span>
                          <span className="ml-2 font-medium">{q.annualIncome || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net Worth:</span>
                          <span className="ml-2 font-medium">{q.netWorth || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Liquid Assets:</span>
                          <span className="ml-2 font-medium">{q.liquidAssets || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Employment:</span>
                          <span className="ml-2 font-medium">{q.employmentStatus || "N/A"}</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Occupation:</span>
                          <span className="ml-2 font-medium">{q.occupation || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Investment Experience */}
                    <div>
                      <h3 className="font-semibold mb-3">Investment Experience</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Overall Experience:</span>
                          <span className="ml-2 font-medium">{q.investmentExperience || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Real Estate Experience:</span>
                          <span className="ml-2 font-medium">{q.realEstateExperience || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risk Tolerance:</span>
                          <span className="ml-2 font-medium">{q.riskTolerance || "N/A"}</span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Previous Investments:</span>
                          <span className="ml-2 font-medium">{q.previousInvestments || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Accreditation */}
                    <div>
                      <h3 className="font-semibold mb-3">Investor Accreditation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Accredited:</span>
                          <span className="ml-2">
                            {q.isAccredited ? (
                              <Badge variant="default">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium">{q.accreditationType || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Investment Goals */}
                    <div>
                      <h3 className="font-semibold mb-3">Investment Goals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Goals:</span>
                          <p className="mt-1 font-medium">{q.investmentGoals || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Horizon:</span>
                          <span className="ml-2 font-medium">{q.investmentHorizon || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expected Return:</span>
                          <span className="ml-2 font-medium">{q.expectedReturnRate || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Source of Funds */}
                    <div>
                      <h3 className="font-semibold mb-3">Source of Funds</h3>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Primary Source:</span>
                          <span className="ml-2 font-medium">{q.sourceOfFunds || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Details:</span>
                          <p className="mt-1 font-medium">{q.sourceOfFundsDetails || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {(q.politicallyExposed || q.additionalNotes) && (
                      <div>
                        <h3 className="font-semibold mb-3">Additional Information</h3>
                        <div className="space-y-3 text-sm">
                          {q.politicallyExposed && (
                            <div>
                              <Badge variant="destructive">Politically Exposed Person (PEP)</Badge>
                              {q.pepDetails && (
                                <p className="mt-2 text-muted-foreground">{q.pepDetails}</p>
                              )}
                            </div>
                          )}
                          {q.additionalNotes && (
                            <div>
                              <span className="text-muted-foreground">Notes:</span>
                              <p className="mt-1 font-medium">{q.additionalNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Review Section */}
                    {selectedUser === q.id && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                          <Textarea
                            id="reviewNotes"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add any notes about this review..."
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      {selectedUser === q.id ? (
                        <>
                          <Button
                            onClick={() => approveQuestionnaireMutation.mutate({ 
                              questionnaireId: q.id,
                              reviewNotes 
                            })}
                            disabled={approveQuestionnaireMutation.isPending}
                            className="flex-1"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirm Approval
                          </Button>
                          <Button
                            onClick={() => rejectQuestionnaireMutation.mutate({ 
                              questionnaireId: q.id,
                              reviewNotes 
                            })}
                            disabled={rejectQuestionnaireMutation.isPending}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Confirm Rejection
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedUser(null);
                              setReviewNotes("");
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => setSelectedUser(q.id)}
                            variant="default"
                            className="flex-1"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => setSelectedUser(q.id)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {!pendingDocuments || pendingDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending documents to review</p>
                </CardContent>
              </Card>
            ) : (
              pendingDocuments.map((doc: any) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">
                            {doc.documentType.replace("_", " ").toUpperCase()}
                          </CardTitle>
                          <CardDescription>
                            User ID: {doc.userId} • Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <a 
                        href={doc.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Document →
                      </a>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => approveDocumentMutation.mutate({ 
                          documentId: doc.id 
                        })}
                        disabled={approveDocumentMutation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectDocumentMutation.mutate({ 
                          documentId: doc.id 
                        })}
                        disabled={rejectDocumentMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </DashboardLayout>
  );
}
