import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Building2, TrendingUp, Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import NotificationCenter from "@/components/NotificationCenter";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ROICalculator from "@/components/ROICalculator";
import KYCStatusBanner from "@/components/KYCStatusBanner";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-auto" />
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.home}
            </Link>
            <Link href="/properties" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.properties}
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.howItWorks}
            </Link>
            <Link href="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.about}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                <Link href="/profile">
                  <Button variant="ghost">{t.nav.profile}</Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">{t.nav.login}</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button>{t.nav.getStarted}</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* KYC Status Banner */}
      <div className="container mt-6">
        <KYCStatusBanner />
      </div>

      {/* Hero Section - Matching emtelaak.com design */}
      <section className="relative overflow-hidden py-32 md:py-40" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container">
          <div className="mx-auto max-w-5xl text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 md:p-16 shadow-xl">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ color: '#032941' }}>
                {language === "en" ? "Own today" : "امتلك اليوم"}
                <br />
                {language === "en" ? "Invest for tomorrow." : "استثمر للغد."}
              </h1>
              <div className="inline-block px-6 py-3 rounded-full mb-8" style={{ backgroundColor: '#CDE428' }}>
                <span className="font-semibold" style={{ color: '#032941' }}>
                  {language === "en" ? "Application Coming Soon" : "التطبيق قريباً"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Emtelaak */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.home.whyChoose.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.home.whyChoose.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Building2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.lowMinimum.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.lowMinimum.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.highReturns.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.highReturns.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.fullyRegulated.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.fullyRegulated.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.professionalManagement.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.professionalManagement.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Matching emtelaak.com design */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t.home.howItWorks.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.home.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Browse Card - Oxford Blue */}
            <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: '#032941' }}>
              <h3 className="text-2xl font-bold mb-6">{t.home.howItWorks.step1.title}</h3>
              <p className="text-white/90 leading-relaxed">{t.home.howItWorks.step1.description}</p>
            </div>

            {/* Calculate Card - Lime Yellow */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: '#CDE428' }}>
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#032941' }}>{t.home.howItWorks.step2.title}</h3>
              <p className="leading-relaxed" style={{ color: '#333333' }}>{t.home.howItWorks.step2.description}</p>
            </div>

            {/* Own Card - Bangladesh Green */}
            <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: '#085C52' }}>
              <h3 className="text-2xl font-bold mb-6">{t.home.howItWorks.step3.title}</h3>
              <p className="text-white/90 leading-relaxed">{t.home.howItWorks.step3.description}</p>
            </div>

            {/* Track Card - Orange */}
            <div className="rounded-3xl p-8 text-white" style={{ backgroundColor: '#FF7F00' }}>
              <h3 className="text-2xl font-bold mb-6">{t.home.howItWorks.step4.title}</h3>
              <p className="text-white/90 leading-relaxed">{t.home.howItWorks.step4.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Type Demos */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {language === "en" ? "Investment Opportunities" : "فرص الاستثمار"}
            </h2>
            <p className="text-muted-foreground">
              {language === "en" 
                ? "Explore two distinct investment strategies tailored to your financial goals" 
                : "استكشف استراتيجيتين استثماريتين مميزتين تناسب أهدافك المالية"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Buy to Let Demo */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
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
              
              <CardContent className="p-6">
                <div className="space-y-4">
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
                    <Button className="w-full" variant="default">
                      {language === "en" ? "Explore Buy to Let Properties" : "استكشف عقارات الشراء للتأجير"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Buy to Sell Demo */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
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
              
              <CardContent className="p-6">
                <div className="space-y-4">
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
                    <Button className="w-full" variant="default">
                      {language === "en" ? "Explore Buy to Sell Properties" : "استكشف عقارات الشراء للبيع"}
                      <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">{t.home.cta.title}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            {t.home.cta.subtitle}
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" variant="default" className="gap-2">
              {t.home.cta.button} <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
