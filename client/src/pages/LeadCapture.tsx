import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Facebook, Instagram, MessageCircle } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomFieldsForm } from "@/components/CustomFieldsForm";

export default function LeadCapture() {
  const { t, language } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [source, setSource] = useState<string>("social_media");
  
  const submitMutation = trpc.crm.leads.createPublic.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    submitMutation.mutate({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      company: formData.get("company") as string || undefined,
      source: source as any,
      investmentInterest: formData.get("investmentInterest") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };
  
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription className="text-base mt-2">
              {language === "en" 
                ? "We've received your information and our team will contact you soon."
                : "لقد تلقينا معلوماتك وسيتواصل معك فريقنا قريبًا."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === "en"
                  ? "You'll receive a confirmation email shortly. Our investment specialists typically respond within 24 hours."
                  : "ستتلقى بريدًا إلكترونيًا للتأكيد قريبًا. عادةً ما يستجيب متخصصو الاستثمار لدينا في غضون 24 ساعة."}
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon">
                    <Facebook className="h-5 w-5" />
                  </Button>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon">
                    <Instagram className="h-5 w-5" />
                  </Button>
                </a>
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </a>
              </div>
              <Button 
                variant="link" 
                onClick={() => window.location.href = "/"}
                className="mt-4"
              >
                {language === "en" ? "Visit Our Website" : "زيارة موقعنا"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {APP_LOGO && (
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 mx-auto mb-4" />
          )}
          <h1 className="text-4xl font-bold mb-2">
            {language === "en" ? "Start Your Investment Journey" : "ابدأ رحلتك الاستثمارية"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === "en"
              ? "Fill out the form below and our team will contact you to discuss investment opportunities."
              : "املأ النموذج أدناه وسيتواصل معك فريقنا لمناقشة فرص الاستثمار."}
          </p>
        </div>
        
        {/* Social Media Icons */}
        <div className="flex gap-4 justify-center mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
            <Facebook className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Facebook</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
            <Instagram className="h-5 w-5 text-pink-600" />
            <span className="text-sm font-medium">Instagram</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">WhatsApp</span>
          </div>
        </div>
        
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "en" ? "Contact Information" : "معلومات الاتصال"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Please provide your details so we can get in touch with you."
                : "يرجى تقديم بياناتك حتى نتمكن من التواصل معك."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {language === "en" ? "First Name" : "الاسم الأول"} *
                  </Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    required 
                    placeholder={language === "en" ? "John" : "أحمد"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {language === "en" ? "Last Name" : "اسم العائلة"} *
                  </Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    required 
                    placeholder={language === "en" ? "Doe" : "محمد"}
                  />
                </div>
              </div>
              
              {/* Contact Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === "en" ? "Email" : "البريد الإلكتروني"} *
                  </Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    placeholder={language === "en" ? "john@example.com" : "example@email.com"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {language === "en" ? "Phone Number" : "رقم الهاتف"}
                  </Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder={language === "en" ? "+1 234 567 8900" : "+966 50 123 4567"}
                  />
                </div>
              </div>
              
              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company">
                  {language === "en" ? "Company (Optional)" : "الشركة (اختياري)"}
                </Label>
                <Input 
                  id="company" 
                  name="company" 
                  placeholder={language === "en" ? "Your company name" : "اسم شركتك"}
                />
              </div>
              
              {/* Source Selection */}
              <div className="space-y-2">
                <Label htmlFor="source">
                  {language === "en" ? "How did you hear about us?" : "كيف سمعت عنا؟"} *
                </Label>
                <Select value={source} onValueChange={setSource} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_media">
                      {language === "en" ? "Social Media" : "وسائل التواصل الاجتماعي"}
                    </SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="referral">
                      {language === "en" ? "Referral" : "إحالة"}
                    </SelectItem>
                    <SelectItem value="advertisement">
                      {language === "en" ? "Advertisement" : "إعلان"}
                    </SelectItem>
                    <SelectItem value="other">
                      {language === "en" ? "Other" : "أخرى"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Investment Interest */}
              <div className="space-y-2">
                <Label htmlFor="investmentInterest">
                  {language === "en" ? "Investment Interest" : "الاهتمام الاستثماري"}
                </Label>
                <Input 
                  id="investmentInterest" 
                  name="investmentInterest" 
                  placeholder={language === "en" 
                    ? "e.g., Residential, Commercial, Mixed-use" 
                    : "مثال: سكني، تجاري، متعدد الاستخدامات"}
                />
              </div>
              
              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  {language === "en" ? "Message (Optional)" : "رسالة (اختياري)"}
                </Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  rows={4}
                  placeholder={language === "en"
                    ? "Tell us more about your investment goals..."
                    : "أخبرنا المزيد عن أهدافك الاستثمارية..."}
                />
              </div>

              {/* Custom Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === "en" ? "Additional Information" : "معلومات إضافية"}
                </h3>
                <CustomFieldsForm
                  module="leads"
                  showInContext="user"
                />
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending 
                  ? (language === "en" ? "Submitting..." : "جارٍ الإرسال...")
                  : (language === "en" ? "Submit" : "إرسال")}
              </Button>
              
              {submitMutation.isError && (
                <p className="text-sm text-destructive text-center">
                  {language === "en"
                    ? "An error occurred. Please try again."
                    : "حدث خطأ. يرجى المحاولة مرة أخرى."}
                </p>
              )}
              
              {/* Privacy Notice */}
              <p className="text-xs text-muted-foreground text-center">
                {language === "en"
                  ? "By submitting this form, you agree to our Privacy Policy and Terms of Service."
                  : "بإرسال هذا النموذج، فإنك توافق على سياسة الخصوصية وشروط الخدمة الخاصة بنا."}
              </p>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            {language === "en"
              ? "Questions? Contact us at support@emtelaak.com"
              : "أسئلة؟ اتصل بنا على support@emtelaak.com"}
          </p>
        </div>
      </div>
    </div>
  );
}
