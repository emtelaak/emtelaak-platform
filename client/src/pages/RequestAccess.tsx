import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { 
  Building2, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  Phone, 
  User, 
  Globe, 
  DollarSign,
  Shield,
  TrendingUp,
  Users,
  ArrowLeft,
  ArrowRight,
  Search
} from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { cn } from "@/lib/utils";

const translations = {
  en: {
    title: "Request Access to Emtelaak",
    subtitle: "Join our exclusive community of real estate investors",
    benefits: {
      title: "Why Join Emtelaak?",
      premium: "Premium Properties",
      premiumDesc: "Access to carefully vetted real estate investments",
      returns: "Attractive Returns",
      returnsDesc: "Competitive yields on your investments",
      secure: "Secure & Regulated",
      secureDesc: "Fully compliant with financial regulations",
      community: "Exclusive Community",
      communityDesc: "Join a network of sophisticated investors"
    },
    form: {
      title: "Submit Your Request",
      description: "Fill out the form below and our team will review your application",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email Address",
      emailPlaceholder: "Enter your email",
      phone: "Phone Number",
      phonePlaceholder: "+20 XXX XXX XXXX",
      country: "Country of Residence",
      countryPlaceholder: "Select your country",
      interest: "Investment Interest",
      interestPlaceholder: "Select your interest",
      budget: "Investment Budget",
      budgetPlaceholder: "Select your budget range",
      message: "Additional Information",
      messagePlaceholder: "Tell us about your investment goals and experience...",
      submit: "Submit Request",
      submitting: "Submitting..."
    },
    interests: {
      residential: "Residential Properties",
      commercial: "Commercial Properties",
      mixed: "Mixed Use",
      all: "All Property Types"
    },
    budgets: {
      under50k: "Under $50,000",
      "50k-100k": "$50,000 - $100,000",
      "100k-250k": "$100,000 - $250,000",
      "250k-500k": "$250,000 - $500,000",
      over500k: "Over $500,000"
    },
    countries: {
      egypt: "Egypt",
      uae: "United Arab Emirates",
      saudi: "Saudi Arabia",
      kuwait: "Kuwait",
      qatar: "Qatar",
      bahrain: "Bahrain",
      oman: "Oman",
      jordan: "Jordan",
      lebanon: "Lebanon",
      other: "Other"
    },
    success: {
      title: "Request Submitted!",
      message: "Thank you for your interest in Emtelaak. Our team will review your request and get back to you within 24-48 hours with your exclusive invitation code.",
      checkEmail: "Check your email at",
      backHome: "Back to Home",
      submitAnother: "Submit Another Request"
    },
    checkStatus: {
      title: "Already submitted a request?",
      description: "Enter your email to check your request status",
      check: "Check Status",
      checking: "Checking..."
    },
    status: {
      pending: "Pending Review",
      approved: "Approved",
      rejected: "Rejected"
    },
    backToHome: "Back to Home"
  },
  ar: {
    title: "طلب الانضمام إلى امتلاك",
    subtitle: "انضم إلى مجتمعنا الحصري من مستثمري العقارات",
    benefits: {
      title: "لماذا تنضم إلى امتلاك؟",
      premium: "عقارات متميزة",
      premiumDesc: "الوصول إلى استثمارات عقارية مختارة بعناية",
      returns: "عوائد جذابة",
      returnsDesc: "عوائد تنافسية على استثماراتك",
      secure: "آمن ومنظم",
      secureDesc: "متوافق تماماً مع اللوائح المالية",
      community: "مجتمع حصري",
      communityDesc: "انضم إلى شبكة من المستثمرين المتميزين"
    },
    form: {
      title: "قدم طلبك",
      description: "املأ النموذج أدناه وسيقوم فريقنا بمراجعة طلبك",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      email: "البريد الإلكتروني",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      phone: "رقم الهاتف",
      phonePlaceholder: "+20 XXX XXX XXXX",
      country: "بلد الإقامة",
      countryPlaceholder: "اختر بلدك",
      interest: "الاهتمام الاستثماري",
      interestPlaceholder: "اختر اهتمامك",
      budget: "ميزانية الاستثمار",
      budgetPlaceholder: "اختر نطاق ميزانيتك",
      message: "معلومات إضافية",
      messagePlaceholder: "أخبرنا عن أهدافك وخبرتك الاستثمارية...",
      submit: "إرسال الطلب",
      submitting: "جاري الإرسال..."
    },
    interests: {
      residential: "العقارات السكنية",
      commercial: "العقارات التجارية",
      mixed: "الاستخدام المختلط",
      all: "جميع أنواع العقارات"
    },
    budgets: {
      under50k: "أقل من 50,000 دولار",
      "50k-100k": "50,000 - 100,000 دولار",
      "100k-250k": "100,000 - 250,000 دولار",
      "250k-500k": "250,000 - 500,000 دولار",
      over500k: "أكثر من 500,000 دولار"
    },
    countries: {
      egypt: "مصر",
      uae: "الإمارات العربية المتحدة",
      saudi: "المملكة العربية السعودية",
      kuwait: "الكويت",
      qatar: "قطر",
      bahrain: "البحرين",
      oman: "عمان",
      jordan: "الأردن",
      lebanon: "لبنان",
      other: "أخرى"
    },
    success: {
      title: "تم إرسال الطلب!",
      message: "شكراً لاهتمامك بامتلاك. سيقوم فريقنا بمراجعة طلبك والرد عليك خلال 24-48 ساعة مع رمز الدعوة الحصري الخاص بك.",
      checkEmail: "تحقق من بريدك الإلكتروني على",
      backHome: "العودة للرئيسية",
      submitAnother: "إرسال طلب آخر"
    },
    checkStatus: {
      title: "هل قدمت طلباً بالفعل؟",
      description: "أدخل بريدك الإلكتروني للتحقق من حالة طلبك",
      check: "تحقق من الحالة",
      checking: "جاري التحقق..."
    },
    status: {
      pending: "قيد المراجعة",
      approved: "تمت الموافقة",
      rejected: "مرفوض"
    },
    backToHome: "العودة للرئيسية"
  }
};

export default function RequestAccess() {
  const { language, dir } = useLanguage();
  const t = translations[language];
  const isRTL = dir === 'rtl';
  
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [checkEmail, setCheckEmail] = useState("");
  const [requestStatus, setRequestStatus] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    investmentInterest: "",
    investmentBudget: "",
    message: ""
  });

  const submitMutation = trpc.accessRequests.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setSubmittedEmail(formData.email);
      toast.success(language === 'ar' ? "تم إرسال طلبك بنجاح!" : "Your request has been submitted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || (language === 'ar' ? "فشل في إرسال الطلب" : "Failed to submit request"));
    }
  });

  const [shouldCheckStatus, setShouldCheckStatus] = useState(false);
  const { data: statusData, isLoading: isCheckingStatus, refetch: refetchStatus } = trpc.accessRequests.checkStatus.useQuery(
    { email: checkEmail },
    { enabled: false }
  );

  // Handle status check
  useEffect(() => {
    if (shouldCheckStatus && checkEmail) {
      refetchStatus().then((result) => {
        if (result.data) {
          setRequestStatus(result.data);
        } else {
          toast.error(language === 'ar' ? "لم يتم العثور على طلب بهذا البريد الإلكتروني" : "No request found with this email");
        }
        setShouldCheckStatus(false);
      }).catch(() => {
        toast.error(language === 'ar' ? "لم يتم العثور على طلب بهذا البريد الإلكتروني" : "No request found with this email");
        setShouldCheckStatus(false);
      });
    }
  }, [shouldCheckStatus, checkEmail, refetchStatus, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handleCheckStatus = () => {
    if (!checkEmail) return;
    setShouldCheckStatus(true);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.success.title}</h2>
            <p className="text-muted-foreground mb-4">{t.success.message}</p>
            <div className="bg-muted/50 rounded-lg p-3 mb-6 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t.success.checkEmail} <strong>{submittedEmail}</strong></span>
            </div>
            <div className={cn("flex gap-3", isRTL ? "flex-row-reverse" : "")}>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">{t.success.backHome}</Button>
              </Link>
              <Button 
                className="flex-1"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    fullName: "",
                    email: "",
                    phone: "",
                    country: "",
                    investmentInterest: "",
                    investmentBudget: "",
                    message: ""
                  });
                }}
              >
                {t.success.submitAnother}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link href="/">
            <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "")}>
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
              <span className="font-bold text-lg">{APP_TITLE}</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className={cn("gap-2", isRTL ? "flex-row-reverse" : "")}>
              <BackArrow className="h-4 w-4" />
              {t.backToHome}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-8 md:py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Benefits Section */}
          <div className={cn("order-2 lg:order-1", isRTL ? "lg:order-2" : "")}>
            <h2 className={cn("text-2xl font-bold mb-6", isRTL ? "text-right" : "")}>{t.benefits.title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6">
                  <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse text-right" : "")}>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.benefits.premium}</h3>
                      <p className="text-sm text-muted-foreground">{t.benefits.premiumDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6">
                  <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse text-right" : "")}>
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.benefits.returns}</h3>
                      <p className="text-sm text-muted-foreground">{t.benefits.returnsDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6">
                  <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse text-right" : "")}>
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.benefits.secure}</h3>
                      <p className="text-sm text-muted-foreground">{t.benefits.secureDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="pt-6">
                  <div className={cn("flex items-start gap-4", isRTL ? "flex-row-reverse text-right" : "")}>
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t.benefits.community}</h3>
                      <p className="text-sm text-muted-foreground">{t.benefits.communityDesc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Check Status Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className={cn("text-lg", isRTL ? "text-right" : "")}>{t.checkStatus.title}</CardTitle>
                <CardDescription className={cn(isRTL ? "text-right" : "")}>{t.checkStatus.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={cn("flex gap-2", isRTL ? "flex-row-reverse" : "")}>
                  <Input
                    type="email"
                    placeholder={t.form.emailPlaceholder}
                    value={checkEmail}
                    onChange={(e) => setCheckEmail(e.target.value)}
                    className={cn("flex-1", isRTL ? "text-right" : "")}
                    dir="ltr"
                  />
                  <Button 
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus || !checkEmail}
                    className={cn("gap-2 whitespace-nowrap", isRTL ? "flex-row-reverse" : "")}
                  >
                    {isCheckingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{isCheckingStatus ? t.checkStatus.checking : t.checkStatus.check}</span>
                  </Button>
                </div>
                {requestStatus && (
                  <div className={cn(
                    "mt-4 p-4 rounded-lg",
                    requestStatus.status === 'approved' ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                    requestStatus.status === 'rejected' ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800" :
                    "bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                  )}>
                    <p className={cn(
                      "font-medium",
                      isRTL ? "text-right" : "",
                      requestStatus.status === 'approved' ? "text-green-700 dark:text-green-400" :
                      requestStatus.status === 'rejected' ? "text-red-700 dark:text-red-400" :
                      "text-yellow-700 dark:text-yellow-400"
                    )}>
                      {t.status[requestStatus.status as keyof typeof t.status]}
                    </p>
                    {requestStatus.invitationCode && (
                      <p className={cn("mt-2 text-sm", isRTL ? "text-right" : "")}>
                        {language === 'ar' ? 'رمز الدعوة:' : 'Invitation Code:'} <strong>{requestStatus.invitationCode}</strong>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className={cn("order-1 lg:order-2", isRTL ? "lg:order-1" : "")}>
            <Card>
              <CardHeader>
                <CardTitle className={cn(isRTL ? "text-right" : "")}>{t.form.title}</CardTitle>
                <CardDescription className={cn(isRTL ? "text-right" : "")}>{t.form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className={cn(isRTL ? "text-right block" : "")}>{t.form.fullName}</Label>
                    <div className="relative">
                      <User className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder={t.form.fullNamePlaceholder}
                        className={cn(isRTL ? "pr-9 text-right" : "pl-9")}
                        dir={isRTL ? "rtl" : "ltr"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className={cn(isRTL ? "text-right block" : "")}>{t.form.email}</Label>
                    <div className="relative">
                      <Mail className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t.form.emailPlaceholder}
                        className={cn(isRTL ? "pr-9" : "pl-9")}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className={cn(isRTL ? "text-right block" : "")}>{t.form.phone}</Label>
                    <div className="relative">
                      <Phone className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={t.form.phonePlaceholder}
                        className={cn(isRTL ? "pr-9" : "pl-9")}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={cn(isRTL ? "text-right block" : "")}>{t.form.country}</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger className={cn(isRTL ? "flex-row-reverse" : "")}>
                        <Globe className={cn("h-4 w-4 text-muted-foreground", isRTL ? "ml-2" : "mr-2")} />
                        <SelectValue placeholder={t.form.countryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.countries).map(([key, value]) => (
                          <SelectItem key={key} value={key} className={cn(isRTL ? "text-right" : "")}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={cn(isRTL ? "text-right block" : "")}>{t.form.interest}</Label>
                      <Select
                        value={formData.investmentInterest}
                        onValueChange={(value) => setFormData({ ...formData, investmentInterest: value })}
                      >
                        <SelectTrigger className={cn(isRTL ? "flex-row-reverse" : "")}>
                          <SelectValue placeholder={t.form.interestPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(t.interests).map(([key, value]) => (
                            <SelectItem key={key} value={key} className={cn(isRTL ? "text-right" : "")}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className={cn(isRTL ? "text-right block" : "")}>{t.form.budget}</Label>
                      <Select
                        value={formData.investmentBudget}
                        onValueChange={(value) => setFormData({ ...formData, investmentBudget: value })}
                      >
                        <SelectTrigger className={cn(isRTL ? "flex-row-reverse" : "")}>
                          <DollarSign className={cn("h-4 w-4 text-muted-foreground", isRTL ? "ml-2" : "mr-2")} />
                          <SelectValue placeholder={t.form.budgetPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(t.budgets).map(([key, value]) => (
                            <SelectItem key={key} value={key} className={cn(isRTL ? "text-right" : "")}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className={cn(isRTL ? "text-right block" : "")}>{t.form.message}</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={t.form.messagePlaceholder}
                      className={cn(isRTL ? "text-right" : "")}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                        {t.form.submitting}
                      </>
                    ) : (
                      t.form.submit
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
