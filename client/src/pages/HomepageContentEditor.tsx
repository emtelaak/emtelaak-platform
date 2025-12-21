import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageUpload } from "@/components/ImageUpload";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HomepageContentEditor() {
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  // English content state
  const [heroTitle, setHeroTitle] = useState("Own today\nInvest for tomorrow.");
  const [heroSubtitle, setHeroSubtitle] = useState("Invest in fractional real estate ownership and build your property portfolio with as little as EGP 100");
  const [heroCTA1, setHeroCTA1] = useState("Explore Properties");
  const [heroCTA2, setHeroCTA2] = useState("How It Works");

  // Arabic content state
  const [heroTitleAr, setHeroTitleAr] = useState("امتلك اليوم\nاستثمر للغد");
  const [heroSubtitleAr, setHeroSubtitleAr] = useState("استثمر في ملكية العقارات الجزئية وابنِ محفظتك العقارية بمبلغ يبدأ من 100 جنيه مصري");
  const [heroCTA1Ar, setHeroCTA1Ar] = useState("استكشف العقارات");
  const [heroCTA2Ar, setHeroCTA2Ar] = useState("كيف يعمل");

  // Hero background image
  const [heroBackgroundImage, setHeroBackgroundImage] = useState("/brand/backgrounds/hero-bg.jpg");

  // Video URLs
  const [videoUrlEn, setVideoUrlEn] = useState("https://www.youtube.com/embed/P9K-VUdc0SA");
  const [videoUrlAr, setVideoUrlAr] = useState("https://www.youtube.com/embed/w7hmsuFkrmg");

  // Fetch existing content
  const { data: existingContent, isLoading, refetch } = trpc.content.get.useQuery({ key: "homepage_hero" });

  // Load existing content when fetched
  useEffect(() => {
    if (existingContent) {
      const content = existingContent.content as any;
      const contentAr = existingContent.contentAr as any;

      if (content) {
        setHeroTitle(content.title || heroTitle);
        setHeroSubtitle(content.subtitle || heroSubtitle);
        setHeroCTA1(content.cta1 || heroCTA1);
        setHeroCTA2(content.cta2 || heroCTA2);
        setHeroBackgroundImage(content.backgroundImage || heroBackgroundImage);
        setVideoUrlEn(content.videoUrl || videoUrlEn);
      }

      if (contentAr) {
        setHeroTitleAr(contentAr.title || heroTitleAr);
        setHeroSubtitleAr(contentAr.subtitle || heroSubtitleAr);
        setHeroCTA1Ar(contentAr.cta1 || heroCTA1Ar);
        setHeroCTA2Ar(contentAr.cta2 || heroCTA2Ar);
        setVideoUrlAr(contentAr.videoUrl || videoUrlAr);
      }
    }
  }, [existingContent]);

  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Homepage content updated successfully!" : "تم تحديث محتوى الصفحة الرئيسية بنجاح!");
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
      key: "homepage_hero",
      content: {
        title: heroTitle,
        subtitle: heroSubtitle,
        cta1: heroCTA1,
        cta2: heroCTA2,
        backgroundImage: heroBackgroundImage,
        videoUrl: videoUrlEn,
      },
      contentAr: {
        title: heroTitleAr,
        subtitle: heroSubtitleAr,
        cta1: heroCTA1Ar,
        cta2: heroCTA2Ar,
        videoUrl: videoUrlAr,
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
              { label: "Homepage Editor", labelAr: "محرر الصفحة الرئيسية" }
            ]} 
          />
          <h1 className="text-3xl font-bold mt-4">
            {language === "en" ? "Homepage Content Editor" : "محرر محتوى الصفحة الرئيسية"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en"
              ? "Edit hero section, features, and call-to-action"
              : "تحرير قسم البطل والميزات والدعوة إلى العمل"}
          </p>
        </div>

        {/* English Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === "en" ? "English Content" : "المحتوى الإنجليزي"}</CardTitle>
            <CardDescription>
              {language === "en" ? "Hero section content in English" : "محتوى قسم البطل باللغة الإنجليزية"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Textarea
                id="heroTitle"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                rows={2}
                placeholder="Own today\nInvest for tomorrow."
              />
            </div>
            <div>
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <RichTextEditor
                content={heroSubtitle}
                onChange={setHeroSubtitle}
                placeholder="Invest in fractional real estate ownership..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heroCTA1">Primary CTA Button</Label>
                <Input
                  id="heroCTA1"
                  value={heroCTA1}
                  onChange={(e) => setHeroCTA1(e.target.value)}
                  placeholder="Explore Properties"
                />
              </div>
              <div>
                <Label htmlFor="heroCTA2">Secondary CTA Button</Label>
                <Input
                  id="heroCTA2"
                  value={heroCTA2}
                  onChange={(e) => setHeroCTA2(e.target.value)}
                  placeholder="How It Works"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Background Image */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === "en" ? "Hero Background Image" : "صورة خلفية البطل"}</CardTitle>
            <CardDescription>
              {language === "en" ? "Upload a background image for the hero section" : "تحميل صورة خلفية لقسم البطل"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              label={language === "en" ? "Background Image" : "صورة الخلفية"}
              currentImageUrl={heroBackgroundImage}
              onImageUploaded={setHeroBackgroundImage}
              maxSizeMB={10}
            />
          </CardContent>
        </Card>

        {/* Video URLs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === "en" ? "Promotional Video URLs" : "روابط الفيديو الترويجي"}</CardTitle>
            <CardDescription>
              {language === "en" 
                ? "YouTube embed URLs for the promotional video section" 
                : "روابط تضمين YouTube لقسم الفيديو الترويجي"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="videoUrlEn">English Video URL</Label>
              <Input
                id="videoUrlEn"
                value={videoUrlEn}
                onChange={(e) => setVideoUrlEn(e.target.value)}
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use YouTube embed URL format: https://www.youtube.com/embed/VIDEO_ID
              </p>
            </div>
            <div>
              <Label htmlFor="videoUrlAr">Arabic Video URL / رابط الفيديو العربي</Label>
              <Input
                id="videoUrlAr"
                value={videoUrlAr}
                onChange={(e) => setVideoUrlAr(e.target.value)}
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground mt-1">
                استخدم تنسيق رابط تضمين YouTube
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Arabic Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === "en" ? "Arabic Content" : "المحتوى العربي"}</CardTitle>
            <CardDescription>
              {language === "en" ? "Hero section content in Arabic" : "محتوى قسم البطل باللغة العربية"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroTitleAr">عنوان البطل</Label>
              <Textarea
                id="heroTitleAr"
                value={heroTitleAr}
                onChange={(e) => setHeroTitleAr(e.target.value)}
                rows={2}
                placeholder="امتلك اليوم\nاستثمر للغد"
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="heroSubtitleAr">العنوان الفرعي</Label>
              <RichTextEditor
                content={heroSubtitleAr}
                onChange={setHeroSubtitleAr}
                placeholder="استثمر في ملكية العقارات الجزئية..."
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heroCTA1Ar">زر الدعوة الأساسي</Label>
                <Input
                  id="heroCTA1Ar"
                  value={heroCTA1Ar}
                  onChange={(e) => setHeroCTA1Ar(e.target.value)}
                  placeholder="استكشف العقارات"
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="heroCTA2Ar">زر الدعوة الثانوي</Label>
                <Input
                  id="heroCTA2Ar"
                  value={heroCTA2Ar}
                  onChange={(e) => setHeroCTA2Ar(e.target.value)}
                  placeholder="كيف يعمل"
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
