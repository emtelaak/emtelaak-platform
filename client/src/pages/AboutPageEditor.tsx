import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutPageEditor() {
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  // English content state
  const [heroTitle, setHeroTitle] = useState("About Emtelaak");
  const [heroSubtitle, setHeroSubtitle] = useState("Revolutionizing real estate investment in Egypt through fractional ownership");
  const [storyDescription, setStoryDescription] = useState("Emtelaak is Egypt's first regulated fractional real estate investment platform...");
  const [missionDescription, setMissionDescription] = useState("To democratize real estate investment and make property ownership accessible to everyone...");
  const [visionDescription, setVisionDescription] = useState("To become the leading fractional real estate platform in the MENA region...");
  const [ctaTitle, setCtaTitle] = useState("Ready to Start Your Investment Journey?");
  const [ctaDescription, setCtaDescription] = useState("Join thousands of investors building wealth through fractional real estate ownership");

  // Arabic content state
  const [heroTitleAr, setHeroTitleAr] = useState("عن إمتلاك");
  const [heroSubtitleAr, setHeroSubtitleAr] = useState("نحدث ثورة في الاستثمار العقاري في مصر من خلال الملكية الجزئية");
  const [storyDescriptionAr, setStoryDescriptionAr] = useState("إمتلاك هي أول منصة مصرية منظمة للاستثمار العقاري الجزئي...");
  const [missionDescriptionAr, setMissionDescriptionAr] = useState("إضفاء الطابع الديمقراطي على الاستثمار العقاري وجعل ملكية العقارات في متناول الجميع...");
  const [visionDescriptionAr, setVisionDescriptionAr] = useState("أن نصبح منصة الاستثمار العقاري الجزئي الرائدة في منطقة الشرق الأوسط وشمال أفريقيا...");
  const [ctaTitleAr, setCtaTitleAr] = useState("هل أنت مستعد لبدء رحلتك الاستثمارية؟");
  const [ctaDescriptionAr, setCtaDescriptionAr] = useState("انضم إلى آلاف المستثمرين الذين يبنون الثروة من خلال ملكية العقارات الجزئية");

  // Fetch existing content
  const { data: existingContent, isLoading, refetch } = trpc.content.get.useQuery({ key: "about_page" });

  // Load existing content when fetched
  useEffect(() => {
    if (existingContent) {
      const content = existingContent.content as any;
      const contentAr = existingContent.contentAr as any;

      if (content) {
        setHeroTitle(content.heroTitle || heroTitle);
        setHeroSubtitle(content.heroSubtitle || heroSubtitle);
        setStoryDescription(content.storyDescription || storyDescription);
        setMissionDescription(content.missionDescription || missionDescription);
        setVisionDescription(content.visionDescription || visionDescription);
        setCtaTitle(content.ctaTitle || ctaTitle);
        setCtaDescription(content.ctaDescription || ctaDescription);
      }

      if (contentAr) {
        setHeroTitleAr(contentAr.heroTitle || heroTitleAr);
        setHeroSubtitleAr(contentAr.heroSubtitle || heroSubtitleAr);
        setStoryDescriptionAr(contentAr.storyDescription || storyDescriptionAr);
        setMissionDescriptionAr(contentAr.missionDescription || missionDescriptionAr);
        setVisionDescriptionAr(contentAr.visionDescription || visionDescriptionAr);
        setCtaTitleAr(contentAr.ctaTitle || ctaTitleAr);
        setCtaDescriptionAr(contentAr.ctaDescription || ctaDescriptionAr);
      }
    }
  }, [existingContent]);

  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "About page content updated successfully!" : "تم تحديث محتوى صفحة حول بنجاح!");
      refetch();
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(language === "en" ? `Failed to update: ${error.message}` : `فشل التحديث: ${error.message}`);
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    updateMutation.mutate({
      key: "about_page",
      content: {
        heroTitle,
        heroSubtitle,
        storyDescription,
        missionDescription,
        visionDescription,
        ctaTitle,
        ctaDescription,
      },
      contentAr: {
        heroTitle: heroTitleAr,
        heroSubtitle: heroSubtitleAr,
        storyDescription: storyDescriptionAr,
        missionDescription: missionDescriptionAr,
        visionDescription: visionDescriptionAr,
        ctaTitle: ctaTitleAr,
        ctaDescription: ctaDescriptionAr,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb 
            items={[
              { label: "Super Admin", labelAr: "المسؤول العام", href: "/super-admin" },
              { label: "About Page Editor", labelAr: "محرر صفحة عنا" }
            ]} 
          />
          <h1 className="text-3xl font-bold">
            {language === "en" ? "About Page Content Editor" : "محرر محتوى صفحة حول"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en"
              ? "Edit company information, mission statement, and vision"
              : "تحرير معلومات الشركة وبيان المهمة والرؤية"}
          </p>
        </div>

        {/* English Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === "en" ? "English Content" : "المحتوى الإنجليزي"}</CardTitle>
            <CardDescription>
              {language === "en" ? "About page content in English" : "محتوى صفحة حول باللغة الإنجليزية"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hero Section */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">Hero Section</h3>
              <div>
                <Label htmlFor="heroTitle">Hero Title</Label>
                <Input
                  id="heroTitle"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="About Emtelaak"
                />
              </div>
              <div>
                <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                <Textarea
                  id="heroSubtitle"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  rows={2}
                  placeholder="Revolutionizing real estate investment..."
                />
              </div>
            </div>

            {/* Our Story */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">Our Story</h3>
              <div>
                <Label htmlFor="storyDescription">Story Description</Label>
                <RichTextEditor
                  content={storyDescription}
                  onChange={setStoryDescription}
                  placeholder="Emtelaak is Egypt's first regulated fractional real estate investment platform..."
                />
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">Mission & Vision</h3>
              <div>
                <Label htmlFor="missionDescription">Mission Statement</Label>
                <RichTextEditor
                  content={missionDescription}
                  onChange={setMissionDescription}
                  placeholder="To democratize real estate investment..."
                />
              </div>
              <div>
                <Label htmlFor="visionDescription">Vision Statement</Label>
                <RichTextEditor
                  content={visionDescription}
                  onChange={setVisionDescription}
                  placeholder="To become the leading fractional real estate platform..."
                />
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Call to Action</h3>
              <div>
                <Label htmlFor="ctaTitle">CTA Title</Label>
                <Input
                  id="ctaTitle"
                  value={ctaTitle}
                  onChange={(e) => setCtaTitle(e.target.value)}
                  placeholder="Ready to Start Your Investment Journey?"
                />
              </div>
              <div>
                <Label htmlFor="ctaDescription">CTA Description</Label>
                <Textarea
                  id="ctaDescription"
                  value={ctaDescription}
                  onChange={(e) => setCtaDescription(e.target.value)}
                  rows={2}
                  placeholder="Join thousands of investors..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arabic Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === "en" ? "Arabic Content" : "المحتوى العربي"}</CardTitle>
            <CardDescription>
              {language === "en" ? "About page content in Arabic" : "محتوى صفحة حول باللغة العربية"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hero Section */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">قسم البطل</h3>
              <div>
                <Label htmlFor="heroTitleAr">عنوان البطل</Label>
                <Input
                  id="heroTitleAr"
                  value={heroTitleAr}
                  onChange={(e) => setHeroTitleAr(e.target.value)}
                  placeholder="عن إمتلاك"
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="heroSubtitleAr">العنوان الفرعي</Label>
                <Textarea
                  id="heroSubtitleAr"
                  value={heroSubtitleAr}
                  onChange={(e) => setHeroSubtitleAr(e.target.value)}
                  rows={2}
                  placeholder="نحدث ثورة في الاستثمار العقاري..."
                  dir="rtl"
                />
              </div>
            </div>

            {/* Our Story */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">قصتنا</h3>
              <div>
                <Label htmlFor="storyDescriptionAr">وصف القصة</Label>
                <RichTextEditor
                  content={storyDescriptionAr}
                  onChange={setStoryDescriptionAr}
                  placeholder="إمتلاك هي أول منصة مصرية منظمة..."
                  dir="rtl"
                />
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">المهمة والرؤية</h3>
              <div>
                <Label htmlFor="missionDescriptionAr">بيان المهمة</Label>
                <RichTextEditor
                  content={missionDescriptionAr}
                  onChange={setMissionDescriptionAr}
                  placeholder="إضفاء الطابع الديمقراطي على الاستثمار العقاري..."
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="visionDescriptionAr">بيان الرؤية</Label>
                <RichTextEditor
                  content={visionDescriptionAr}
                  onChange={setVisionDescriptionAr}
                  placeholder="أن نصبح منصة الاستثمار العقاري الجزئي الرائدة..."
                  dir="rtl"
                />
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">الدعوة إلى العمل</h3>
              <div>
                <Label htmlFor="ctaTitleAr">عنوان الدعوة</Label>
                <Input
                  id="ctaTitleAr"
                  value={ctaTitleAr}
                  onChange={(e) => setCtaTitleAr(e.target.value)}
                  placeholder="هل أنت مستعد لبدء رحلتك الاستثمارية؟"
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="ctaDescriptionAr">وصف الدعوة</Label>
                <Textarea
                  id="ctaDescriptionAr"
                  value={ctaDescriptionAr}
                  onChange={(e) => setCtaDescriptionAr(e.target.value)}
                  rows={2}
                  placeholder="انضم إلى آلاف المستثمرين..."
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === "en" ? "Saving..." : "جارٍ الحفظ..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {language === "en" ? "Save Changes" : "حفظ التغييرات"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
