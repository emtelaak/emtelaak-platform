import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type TermsContent = {
  termsEn: string;
  termsAr: string;
  privacyEn: string;
  privacyAr: string;
};

export default function TermsContentEditor() {
  const [content, setContent] = useState<TermsContent>({
    termsEn: "",
    termsAr: "",
    privacyEn: "",
    privacyAr: "",
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ title: "", content: "" });

  // Fetch existing content
  const { data: existingContent } = trpc.content.get.useQuery({ key: "terms_privacy_page" });

  // Update mutation
  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => {
      toast.success("Terms & Privacy content updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update content: ${error.message}`);
    },
  });

  // Load existing content
  useEffect(() => {
    if (existingContent?.content) {
      try {
        const parsed = typeof existingContent.content === 'string'
          ? JSON.parse(existingContent.content)
          : existingContent.content;
        setContent({ ...content, ...parsed });
      } catch (e) {
        console.error("Failed to parse terms content:", e);
      }
    }
  }, [existingContent]);

  const handleChange = (field: keyof TermsContent, value: string) => {
    setContent({ ...content, [field]: value });
  };

  const handleSave = () => {
    updateMutation.mutate({
      key: "terms_privacy_page",
      content: JSON.stringify(content),
    } as any);
  };

  const handlePreview = (title: string, htmlContent: string) => {
    setPreviewContent({ title, content: htmlContent });
    setIsPreviewOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Terms & Privacy Content Editor</h1>
            <p className="text-muted-foreground mt-2">
              Manage legal documents in English and Arabic
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          {/* Terms of Service Tab */}
          <TabsContent value="terms" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Terms of Service (English)</CardTitle>
                    <CardDescription>Write terms in HTML or Markdown format</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("Terms of Service (English)", content.termsEn)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content.termsEn}
                  onChange={(e) => handleChange("termsEn", e.target.value)}
                  placeholder="<h2>1. Introduction</h2><p>Welcome to Emtelaak...</p>"
                  rows={15}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Terms of Service (Arabic)</CardTitle>
                    <CardDescription>اكتب الشروط بتنسيق HTML أو Markdown</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("شروط الخدمة (عربي)", content.termsAr)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    معاينة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content.termsAr}
                  onChange={(e) => handleChange("termsAr", e.target.value)}
                  placeholder="<h2>1. المقدمة</h2><p>مرحباً بك في امتلاك...</p>"
                  rows={15}
                  className="font-mono text-sm"
                  dir="rtl"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Policy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Privacy Policy (English)</CardTitle>
                    <CardDescription>Write privacy policy in HTML or Markdown format</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("Privacy Policy (English)", content.privacyEn)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content.privacyEn}
                  onChange={(e) => handleChange("privacyEn", e.target.value)}
                  placeholder="<h2>1. Information We Collect</h2><p>We collect information...</p>"
                  rows={15}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Privacy Policy (Arabic)</CardTitle>
                    <CardDescription>اكتب سياسة الخصوصية بتنسيق HTML أو Markdown</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview("سياسة الخصوصية (عربي)", content.privacyAr)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    معاينة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content.privacyAr}
                  onChange={(e) => handleChange("privacyAr", e.target.value)}
                  placeholder="<h2>1. المعلومات التي نجمعها</h2><p>نقوم بجمع المعلومات...</p>"
                  rows={15}
                  className="font-mono text-sm"
                  dir="rtl"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Use HTML tags for formatting. Common tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;,
            &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;. Preview before saving to check formatting.
          </p>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewContent.title}</DialogTitle>
          </DialogHeader>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: previewContent.content }}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
