import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";

type ContactContent = {
  // English
  titleEn: string;
  subtitleEn: string;
  addressEn: string;
  // Arabic
  titleAr: string;
  subtitleAr: string;
  addressAr: string;
  // Common (no translation needed)
  phone: string;
  email: string;
  whatsapp: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
};

export default function ContactContentEditor() {
  const [content, setContent] = useState<ContactContent>({
    titleEn: "Contact Us",
    subtitleEn: "Get in touch with our team",
    addressEn: "",
    titleAr: "اتصل بنا",
    subtitleAr: "تواصل مع فريقنا",
    addressAr: "",
    phone: "",
    email: "",
    whatsapp: "",
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  });

  // Fetch existing content
  const { data: existingContent } = trpc.content.get.useQuery({ key: "contact_page" });

  // Update mutation
  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => {
      toast.success("Contact page content updated successfully");
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
        console.error("Failed to parse contact content:", e);
      }
    }
  }, [existingContent]);

  const handleChange = (field: keyof ContactContent, value: string) => {
    setContent({ ...content, [field]: value });
  };

  const handleSave = () => {
    updateMutation.mutate({
      key: "contact_page",
      content: JSON.stringify(content),
    } as any);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contact Page Content Editor</h1>
            <p className="text-muted-foreground mt-2">
              Manage contact information and social media links
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Page Headers */}
          <Card>
            <CardHeader>
              <CardTitle>Page Headers</CardTitle>
              <CardDescription>Title and subtitle in both languages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (English)</Label>
                  <Input
                    value={content.titleEn}
                    onChange={(e) => handleChange("titleEn", e.target.value)}
                    placeholder="Contact Us"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (Arabic)</Label>
                  <Input
                    value={content.titleAr}
                    onChange={(e) => handleChange("titleAr", e.target.value)}
                    placeholder="اتصل بنا"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtitle (English)</Label>
                  <Input
                    value={content.subtitleEn}
                    onChange={(e) => handleChange("subtitleEn", e.target.value)}
                    placeholder="Get in touch with our team"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle (Arabic)</Label>
                  <Input
                    value={content.subtitleAr}
                    onChange={(e) => handleChange("subtitleAr", e.target.value)}
                    placeholder="تواصل مع فريقنا"
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Phone, email, and physical address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={content.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={content.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="info@emtelaak.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Address (English)</Label>
                  <Textarea
                    value={content.addressEn}
                    onChange={(e) => handleChange("addressEn", e.target.value)}
                    placeholder="123 Main Street, Cairo, Egypt"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address (Arabic)</Label>
                  <Textarea
                    value={content.addressAr}
                    onChange={(e) => handleChange("addressAr", e.target.value)}
                    placeholder="123 الشارع الرئيسي، القاهرة، مصر"
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={content.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input
                    value={content.facebook}
                    onChange={(e) => handleChange("facebook", e.target.value)}
                    placeholder="https://facebook.com/emtelaak"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Twitter / X</Label>
                  <Input
                    value={content.twitter}
                    onChange={(e) => handleChange("twitter", e.target.value)}
                    placeholder="https://twitter.com/emtelaak"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input
                    value={content.instagram}
                    onChange={(e) => handleChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/emtelaak"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={content.linkedin}
                  onChange={(e) => handleChange("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/emtelaak"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Make sure all social media links are complete URLs starting with https://
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
