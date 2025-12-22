import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Building2, TrendingUp, Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import NotificationCenter from "@/components/NotificationCenter";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import MobileMenu from "@/components/MobileMenu";
import Navigation from "@/components/Navigation";
import ROICalculator from "@/components/ROICalculator";
import KYCStatusBanner from "@/components/KYCStatusBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import MobileBottomNav from "@/components/MobileBottomNav";
import { TwoFactorVerification } from "@/components/TwoFactorVerification";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Cookies from "js-cookie";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [location, setLocation] = useLocation();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const utils = trpc.useUtils();

  // Check if 2FA verification is required
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const requires2FA = Cookies.get("requires_2fa") === "true";
      const verify2FA = urlParams.get("verify2fa") === "true";

      if (requires2FA && verify2FA && isAuthenticated) {
        setShow2FAModal(true);
      }
    }
  }, [isAuthenticated]);

  const handle2FASuccess = async () => {
    // Add device to trusted devices if remember was checked
    setShow2FAModal(false);
    
    // Clear URL parameter
    window.history.replaceState({}, "", "/");
    
    // Refresh user data
    await utils.auth.me.invalidate();
  };

  // Fetch homepage content
  const { data: heroContent } = trpc.content.get.useQuery({ key: "homepage_hero" });

  // Default content (fallback)
  const defaultContent = {
    title: language === "en" ? "Own today\nInvest for tomorrow." : "امتلك اليوم\nاستثمر للغد.",
    subtitle: language === "en" 
      ? "Invest in fractional real estate ownership and build your property portfolio with as little as EGP 100"
      : "استثمر في ملكية عقارية جزئية وابني محفظتك العقارية بدءًا من 100 جنيه مصري",
    cta1: language === "en" ? "Explore Properties" : "استكشف العقارات",
    cta2: language === "en" ? "How It Works" : "كيف يعمل",
  };

  // Use dynamic content if available, otherwise use defaults
  const content = heroContent 
    ? (language === "ar" && heroContent.contentAr ? heroContent.contentAr : heroContent.content)
    : defaultContent;

  const heroTitle = (content as any)?.title || defaultContent.title;
  const heroSubtitle = (content as any)?.subtitle || defaultContent.subtitle;
  const heroCTA1 = (content as any)?.cta1 || defaultContent.cta1;
  const heroCTA2 = (content as any)?.cta2 || defaultContent.cta2;
  const heroBackgroundImage = (heroContent?.content as any)?.backgroundImage || "/brand/backgrounds/hero-bg.jpg";
  

  // Don't show loading spinner on homepage - let it load immediately
  // Only show loading for authenticated features

  return (
    <>
      {/* 2FA Verification Modal */}
      {show2FAModal && (
        <TwoFactorVerification
          open={show2FAModal}
          onSuccess={handle2FASuccess}
          onCancel={() => {
            setShow2FAModal(false);
            window.history.replaceState({}, "", "/");
          }}
        />
      )}

      <div className="min-h-screen pb-16 md:pb-0">
      <Navigation />

      {/* Email Verification Banner */}
      {isAuthenticated && user && !user.emailVerified && user.email && (
        <div className="container mt-6">
          <EmailVerificationBanner email={user.email} />
        </div>
      )}

      {/* KYC Status Banner */}
      <div className="container mt-6">
        <KYCStatusBanner />
      </div>

      {/* Hero Section - Modern Redesign */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center" style={{
        backgroundImage: `linear-gradient(135deg, rgba(0, 43, 73, 0.95) 0%, rgba(0, 43, 73, 0.85) 50%, rgba(0, 43, 73, 0.95) 100%), url("${heroBackgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#CDE428] rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#CDE428] rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-white space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                  {language === "en" ? "🏢 Fractional Real Estate Investment" : "🏢 الاستثمار العقاري الجزئي"}
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {heroTitle.split('\n').map((line: string, i: number) => (
                  <span key={i} className="block">
                    {i === 0 ? (
                      <span className="text-white">{line}</span>
                    ) : (
                      <span className="bg-gradient-to-r from-[#CDE428] to-[#a8b820] bg-clip-text text-transparent">
                        {line}
                      </span>
                    )}
                  </span>
                ))}
              </h1>
              
              <div 
                className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-xl"
                dangerouslySetInnerHTML={{ __html: heroSubtitle }}
              />

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold" style={{ color: '#CDE428' }}>10K+</div>
                  <div className="text-sm text-gray-300">{language === "en" ? "Investors" : "مستثمر"}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold" style={{ color: '#CDE428' }}>50+</div>
                  <div className="text-sm text-gray-300">{language === "en" ? "Properties" : "عقار"}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold" style={{ color: '#CDE428' }}>12%</div>
                  <div className="text-sm text-gray-300">{language === "en" ? "Avg ROI" : "متوسط العائد"}</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/properties">
                  <Button size="lg" className="text-lg px-10 py-7 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                    {heroCTA1}
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link href="/register">
                    <Button size="lg" className="text-lg px-10 py-7 h-auto font-semibold bg-white text-[#032941] hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      {language === "en" ? "Sign Up Free" : "سجل مجاناً"}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" style={{ color: '#CDE428' }} />
                  <span>{language === "en" ? "Fully Regulated" : "مرخص بالكامل"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: '#CDE428' }} />
                  <span>{language === "en" ? "Secure Platform" : "منصة آمنة"}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Floating Card */}
                <div className="bg-white rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold" style={{ color: '#032941' }}>
                        {language === "en" ? "Start Investing" : "ابدأ الاستثمار"}
                      </h3>
                      <Building2 className="h-10 w-10" style={{ color: '#CDE428' }} />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CDE428' }}>
                          <span className="text-sm font-bold" style={{ color: '#032941' }}>1</span>
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#032941' }}>{language === "en" ? "Browse Properties" : "تصفح العقارات"}</p>
                          <p className="text-sm text-gray-600">{language === "en" ? "Explore verified investment opportunities" : "استكشف فرص استثمارية موثوقة"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CDE428' }}>
                          <span className="text-sm font-bold" style={{ color: '#032941' }}>2</span>
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#032941' }}>{language === "en" ? "Invest from EGP 10,000" : "استثمر من 10,000 جنيه"}</p>
                          <p className="text-sm text-gray-600">{language === "en" ? "Own fractional shares in premium properties" : "امتلك حصصاً جزئية في عقارات مميزة"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CDE428' }}>
                          <span className="text-sm font-bold" style={{ color: '#032941' }}>3</span>
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#032941' }}>{language === "en" ? "Earn Returns" : "احصل على العوائد"}</p>
                          <p className="text-sm text-gray-600">{language === "en" ? "Receive rental income & capital appreciation" : "احصل على دخل إيجاري وزيادة رأس المال"}</p>
                        </div>
                      </div>
                    </div>

                    <Link href="/how-it-works">
                      <Button variant="outline" className="w-full border-2" style={{ borderColor: '#032941', color: '#032941' }}>
                        {heroCTA2}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: '#CDE428' }}></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: '#CDE428' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>


      {/* Why Choose Emtelaak */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                {language === "en" ? "✨ Why Choose Us" : "✨ لماذا تختارنا"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#032941' }}>{t.home.whyChoose.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t.home.whyChoose.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-[#CDE428]/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              <Card className="relative border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#CDE428' }}>
                    <Building2 className="h-8 w-8" style={{ color: '#032941' }} />
                  </div>
                  <CardTitle className="text-xl">{t.home.whyChoose.lowMinimum.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {t.home.whyChoose.lowMinimum.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-[#CDE428]/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              <Card className="relative border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#CDE428' }}>
                    <TrendingUp className="h-8 w-8" style={{ color: '#032941' }} />
                  </div>
                  <CardTitle className="text-xl">{t.home.whyChoose.highReturns.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {t.home.whyChoose.highReturns.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-[#CDE428]/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              <Card className="relative border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#CDE428' }}>
                    <Shield className="h-8 w-8" style={{ color: '#032941' }} />
                  </div>
                  <CardTitle className="text-xl">{t.home.whyChoose.fullyRegulated.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {t.home.whyChoose.fullyRegulated.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-[#CDE428]/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              <Card className="relative border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#CDE428' }}>
                    <Users className="h-8 w-8" style={{ color: '#032941' }} />
                  </div>
                  <CardTitle className="text-xl">{t.home.whyChoose.professionalManagement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {t.home.whyChoose.professionalManagement.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Modern Flow Design */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                {language === "en" ? "🚀 Simple Process" : "🚀 عملية بسيطة"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#032941' }}>{t.home.howItWorks.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t.home.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connection Lines (Desktop only) */}
            <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDE428]/30 to-transparent"></div>

            {/* Step 1 - Browse */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#032941] to-[#032941]/80 rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative rounded-3xl p-8 text-white h-full" style={{ backgroundColor: '#032941' }}>
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.home.howItWorks.step1.title}</h3>
                <p className="text-white/90 leading-relaxed">{t.home.howItWorks.step1.description}</p>
              </div>
            </div>

            {/* Step 2 - Calculate */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#CDE428] to-[#a8b820] rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative rounded-3xl p-8 h-full" style={{ backgroundColor: '#CDE428' }}>
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white" style={{ backgroundColor: '#032941' }}>
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#032941' }}>{t.home.howItWorks.step2.title}</h3>
                <p className="leading-relaxed" style={{ color: '#333333' }}>{t.home.howItWorks.step2.description}</p>
              </div>
            </div>

            {/* Step 3 - Own */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#085C52] to-[#085C52]/80 rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative rounded-3xl p-8 text-white h-full" style={{ backgroundColor: '#085C52' }}>
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.home.howItWorks.step3.title}</h3>
                <p className="text-white/90 leading-relaxed">{t.home.howItWorks.step3.description}</p>
              </div>
            </div>

            {/* Step 4 - Track */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#FF7F00] to-[#FF7F00]/80 rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative rounded-3xl p-8 text-white h-full" style={{ backgroundColor: '#FF7F00' }}>
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                  4
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.home.howItWorks.step4.title}</h3>
                <p className="text-white/90 leading-relaxed">{t.home.howItWorks.step4.description}</p>
              </div>
            </div>
          </div>

          {/* CTA Below Steps */}
          <div className="text-center mt-12">
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2" style={{ borderColor: '#032941', color: '#032941' }}>
                {language === "en" ? "Learn More About the Process" : "تعرف على المزيد عن العملية"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Buy to Let and Buy to Sell Demo */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
              {language === "en" ? "Investment Opportunities" : "فرص الاستثمار"}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground px-4">
              {language === "en" 
                ? "Explore two distinct investment strategies tailored to your financial goals" 
                : "استكشف استراتيجيتين استثماريتين مميزتين تناسب أهدافك المالية"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Buy to Let Demo */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 md:p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {language === "en" ? "Buy to Let" : "شراء للتأجير"}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {language === "en" ? "Steady Rental Income" : "دخل إيجار ثابت"}
                    </p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === "en" ? "What is Buy to Let?" : "ما هو الشراء للتأجير؟"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "Invest in rental properties and earn consistent monthly or quarterly income from tenant rent payments. Perfect for investors seeking regular cash flow."
                        : "استثمر في العقارات المؤجرة واحصل على دخل شهري أو ربع سنوي ثابت من مدفوعات الإيجار. مثالي للمستثمرين الباحثين عن تدفق نقدي منتظم."}
                    </p>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {language === "en" ? "Expected Yield" : "العائد المتوقع"}
                      </span>
                      <span className="text-lg font-bold text-green-600">8-12%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {language === "en" ? "Income Frequency" : "تكرار الدخل"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {language === "en" ? "Monthly/Quarterly" : "شهري/ربع سنوي"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        {language === "en" ? "Regular passive income" : "دخل سلبي منتظم"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        {language === "en" ? "Lower risk investment" : "استثمار منخفض المخاطر"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">
                        {language === "en" ? "Ideal for long-term wealth building" : "مثالي لبناء الثروة على المدى الطويل"}
                      </span>
                    </div>
                  </div>
                  
                  <Link href="/properties">
                    <Button className="w-full text-sm md:text-base py-5 md:py-6" variant="default">
                      <span className="flex-1 text-center">
                        {language === "en" ? "Explore Buy to Let Properties" : "استكشف عقارات الشراء للتأجير"}
                      </span>
                      <ArrowRight className={`h-4 w-4 flex-shrink-0 ${language === "ar" ? "mr-2 rotate-180" : "ml-2"}`} />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Buy to Sell Demo */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 md:p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {language === "en" ? "Buy to Sell" : "شراء للبيع"}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {language === "en" ? "Capital Appreciation" : "نمو رأس المال"}
                    </p>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {language === "en" ? "What is Buy to Sell?" : "ما هو الشراء للبيع؟"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "Invest in properties with high appreciation potential. Profit from property value growth when sold after development or market appreciation. Ideal for capital growth seekers."
                        : "استثمر في العقارات ذات إمكانات النمو العالية. استفد من نمو قيمة العقار عند البيع بعد التطوير أو ارتفاع السوق. مثالي للباحثين عن نمو رأس المال."}
                    </p>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {language === "en" ? "Expected ROI" : "العائد المتوقع على الاستثمار"}
                      </span>
                      <span className="text-lg font-bold text-blue-600">15-25%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {language === "en" ? "Investment Period" : "فترة الاستثمار"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {language === "en" ? "2-5 Years" : "2-5 سنوات"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">
                        {language === "en" ? "Higher return potential" : "إمكانية عائد أعلى"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">
                        {language === "en" ? "Capital appreciation focus" : "التركيز على نمو رأس المال"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">
                        {language === "en" ? "Ideal for growth-oriented investors" : "مثالي للمستثمرين الموجهين نحو النمو"}
                      </span>
                    </div>
                  </div>
                  
                  <Link href="/properties">
                    <Button className="w-full text-sm md:text-base py-5 md:py-6" variant="default">
                      <span className="flex-1 text-center">
                        {language === "en" ? "Explore Buy to Sell Properties" : "استكشف عقارات الشراء للبيع"}
                      </span>
                      <ArrowRight className={`h-4 w-4 flex-shrink-0 ${language === "ar" ? "mr-2 rotate-180" : "ml-2"}`} />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Investment Categories */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.home.categories.title}</h2>
            <p className="text-muted-foreground">
              {t.home.categories.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              t.home.categories.residential,
              t.home.categories.commercial,
              t.home.categories.administrative,
              t.home.categories.hospitality,
              t.home.categories.education,
              t.home.categories.logistics,
              t.home.categories.medical,
            ].map((category) => (
              <Card key={category} className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {category}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {language === "en" ? "Calculate Your Returns" : "احسب عوائدك"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === "en"
                ? "Compare potential returns across different property types and see how your investment can grow over time."
                : "قارن العوائد المحتملة عبر أنواع العقارات المختلفة وشاهد كيف يمكن لاستثمارك أن ينمو بمرور الوقت."}
            </p>
          </div>
          <ROICalculator compact />
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t.home.trust.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t.home.trust.fra.title}</h3>
              <p className="text-sm text-muted-foreground">{t.home.trust.fra.description}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t.home.trust.difc.title}</h3>
              <p className="text-sm text-muted-foreground">{t.home.trust.difc.description}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t.home.trust.security.title}</h3>
              <p className="text-sm text-muted-foreground">{t.home.trust.security.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Modern Design */}
      <section className="relative py-32 overflow-hidden" style={{
        backgroundImage: `linear-gradient(135deg, rgba(0, 43, 73, 0.97) 0%, rgba(0, 43, 73, 0.95) 100%), url("${heroBackgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#CDE428] rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#CDE428] rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-block mb-6">
              <span className="px-6 py-3 rounded-full text-base font-semibold" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                {language === "en" ? "🚀 Ready to Invest?" : "🚀 جاهز للاستثمار؟"}
              </span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{t.home.cta.title}</h2>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-200 leading-relaxed">
              {t.home.cta.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-12 py-7 h-auto font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#CDE428', color: '#032941' }}>
                  {t.home.cta.button}
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <Link href="/properties">
                <Button size="lg" variant="outline" className="text-lg px-12 py-7 h-auto font-semibold bg-white/10 border-2 border-white text-white hover:bg-white/20 shadow-xl transition-all duration-300 hover:scale-105">
                  {language === "en" ? "Browse Properties" : "تصفح العقارات"}
                </Button>
              </Link>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/20">
              <div>
                <div className="text-4xl font-bold mb-2" style={{ color: '#CDE428' }}>10,000+</div>
                <div className="text-sm text-gray-300">{language === "en" ? "Active Investors" : "مستثمر نشط"}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2" style={{ color: '#CDE428' }}>EGP 500M+</div>
                <div className="text-sm text-gray-300">{language === "en" ? "Assets Under Management" : "الأصول المُدارة"}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2" style={{ color: '#CDE428' }}>12%</div>
                <div className="text-sm text-gray-300">{language === "en" ? "Average Annual Return" : "متوسط العائد السنوي"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
    </>
  );
}
