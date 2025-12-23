import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, CheckCircle2, ChevronDown, TrendingUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import { InvestorLeadForm } from "@/components/InvestorLeadForm";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";

export default function Contact() {
  const { t, language, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      toast.success(t.contact.success.description);
    },
    onError: (error) => {
      toast.error(error.message || t.common.error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error(t.common.error);
      return;
    }

    contactMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Matching emtelaak.com design */}
      <section className="relative overflow-hidden py-24 md:py-32" style={{
        backgroundImage: 'linear-gradient(rgba(0, 43, 73, 0.9), rgba(0, 43, 73, 0.9)), url("https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              {t.contact.title}
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              {t.contact.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <div className="container py-16">
        <div className="max-w-5xl mx-auto">

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Contact Info Cards */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t.contact.info.address.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm">
                  {t.contact.info.address.value}<br />
                  {t.contact.info.address.city}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t.contact.info.phone.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a 
                  href="tel:+971-4-123-4567" 
                  className="text-primary hover:underline"
                  dir="ltr"
                >
                  {t.contact.info.phone.value}
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.contact.info.phone.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t.contact.info.email.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a 
                  href="mailto:support@emtelaak.com" 
                  className="text-primary hover:underline"
                  dir="ltr"
                >
                  {t.contact.info.email.value}
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.contact.info.email.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Investor Lead Generation Form */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">{t.contact.investor.title}</h2>
              <p className="text-muted-foreground">
                {t.contact.investor.subtitle}
              </p>
            </div>
            <Card className="max-w-3xl mx-auto border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t.contact.investor.formTitle}
                </CardTitle>
                <CardDescription>
                  {t.contact.investor.formDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <InvestorLeadForm />
              </CardContent>
            </Card>
          </div>

          <div className="text-center my-12">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <div className="h-px w-20 bg-border" />
              <span>{t.contact.divider}</span>
              <div className="h-px w-20 bg-border" />
            </div>
          </div>

          {/* Contact Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{t.contact.form.title}</CardTitle>
              <CardDescription>
                {t.contact.form.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t.contact.success.title}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t.contact.success.description}
                  </p>
                  <Button onClick={() => setSubmitted(false)}>
                    {t.contact.form.sendAnother}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.contact.form.name} {t.contact.form.required}</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder={t.contact.form.namePlaceholder}
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.contact.form.email} {t.contact.form.required}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t.contact.form.emailPlaceholder}
                        value={formData.email}
                        onChange={handleChange}
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t.contact.form.subject} {t.contact.form.required}</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder={t.contact.form.subjectPlaceholder}
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t.contact.form.message} {t.contact.form.required}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder={t.contact.form.messagePlaceholder}
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? (
                      <>{t.contact.form.sending}</>
                    ) : (
                      <>
                        <Send className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t.contact.form.send}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t.contact.faq.title}</h2>
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? 'اعثر على إجابات للأسئلة الشائعة حول الاستثمار مع امتلاك'
                  : 'Find answers to common questions about investing with Emtelaak'}
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {/* Getting Started */}
                <AccordionItem value="what-is-emtelaak" className="border rounded-lg px-6">
                  <AccordionTrigger className={`font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' 
                      ? 'ما هو امتلاك وكيف يعمل؟'
                      : 'What is Emtelaak and how does it work?'}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'امتلاك هي منصة استثمار عقاري جزئي تتيح لك الاستثمار في العقارات المميزة في أسواق الشرق الأوسط وأفريقيا وجنوب آسيا بدءاً من 100 دولار فقط. نقوم بتقسيم العقارات إلى حصص، مما يمكّن العديد من المستثمرين من امتلاك أسهم وكسب دخل إيجاري أو مكاسب رأسمالية بما يتناسب مع استثماراتهم.'
                      : 'Emtelaak is a fractional real estate investment platform that allows you to invest in premium properties across MEASA markets starting from just $100. We divide properties into fractions, enabling multiple investors to own shares and earn rental income or capital gains proportional to their investment.'}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="minimum-investment" className="border rounded-lg px-6">
                  <AccordionTrigger className={`font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' 
                      ? 'ما هو الحد الأدنى للاستثمار؟'
                      : 'What is the minimum investment amount?'}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'يمكنك البدء بالاستثمار بمبلغ 100 دولار فقط. هذا يجعل الاستثمار العقاري متاحاً للجميع، بغض النظر عن حجم رأس المال.'
                      : 'You can start investing with as little as $100. This makes real estate investment accessible to everyone, regardless of capital size.'}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="how-returns" className="border rounded-lg px-6">
                  <AccordionTrigger className={`font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' 
                      ? 'كيف أحصل على العوائد؟'
                      : 'How do I earn returns?'}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'تحصل على العوائد بطريقتين: (1) الدخل الإيجاري - توزيعات منتظمة من دخل إيجار العقار بناءً على نسبة ملكيتك، و(2) زيادة رأس المال - مكاسب محتملة عند ارتفاع قيمة العقار أو عند بيع حصصك في السوق الثانوي.'
                      : 'You earn returns in two ways: (1) Rental Income - Regular distributions from property rental income based on your ownership percentage, and (2) Capital Appreciation - Potential gains when the property value increases or when you sell your shares on the secondary market.'}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="kyc-required" className="border rounded-lg px-6">
                  <AccordionTrigger className={`font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' 
                      ? 'لماذا يجب علي إكمال التحقق من الهوية (KYC)؟'
                      : 'Why do I need to complete KYC verification?'}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'التحقق من الهوية (KYC) مطلوب للامتثال للوائح المالية وحماية جميع المستثمرين على منصتنا. يساعد في منع الاحتيال وغسيل الأموال، مما يضمن بيئة استثمارية آمنة للجميع.'
                      : 'KYC verification is required to comply with financial regulations and protect all investors on our platform. It helps prevent fraud and money laundering, ensuring a safe investment environment for everyone.'}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sell-shares" className="border rounded-lg px-6">
                  <AccordionTrigger className={`font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' 
                      ? 'هل يمكنني بيع حصصي في أي وقت؟'
                      : 'Can I sell my shares anytime?'}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'نعم، يمكنك بيع حصصك من خلال السوق الثانوي الخاص بنا. ومع ذلك، قد تكون هناك فترة احتفاظ أولية حسب العقار. نحن نعمل على توفير السيولة لمستثمرينا مع الحفاظ على استقرار الاستثمارات.'
                      : 'Yes, you can sell your shares through our secondary market. However, there may be an initial holding period depending on the property. We work to provide liquidity for our investors while maintaining investment stability.'}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="property-selection" className="border rounded-lg px-6">
                  <AccordionTrigger className={`font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {language === 'ar' 
                      ? 'كيف يتم اختيار العقارات؟'
                      : 'How are properties selected?'}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'يقوم فريقنا من خبراء العقارات بتقييم دقيق لكل عقار بناءً على الموقع، وإمكانية النمو، وجودة المستأجرين، والعائد المتوقع. نختار فقط العقارات التي تلبي معاييرنا الصارمة للجودة والعائد.'
                      : 'Our team of real estate experts carefully evaluates each property based on location, growth potential, tenant quality, and expected returns. We only select properties that meet our strict criteria for quality and returns.'}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
