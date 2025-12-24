import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO } from "@/const";
import { 
  Building2, TrendingUp, Shield, Users, ArrowRight, CheckCircle2, 
  DollarSign, Search, UserPlus, BarChart3, Home as HomeIcon, 
  Briefcase, GraduationCap, Heart, Hotel, Building, Layers,
  ChevronRight, Menu, X
} from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import ROICalculator from "@/components/ROICalculator";
import KYCStatusBanner from "@/components/KYCStatusBanner";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import MobileBottomNav from "@/components/MobileBottomNav";
import { TwoFactorVerification } from "@/components/TwoFactorVerification";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Cookies from "js-cookie";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t, language, dir } = useLanguage();
  const [location, setLocation] = useLocation();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'buyToLet' | 'buyToSell'>('buyToLet');
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [rentalYield, setRentalYield] = useState(10);
  const [appreciation, setAppreciation] = useState(15);
  const [investmentPeriod, setInvestmentPeriod] = useState(5);
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
    setShow2FAModal(false);
    window.history.replaceState({}, "", "/");
    await utils.auth.me.invalidate();
  };

  // Calculate ROI
  const rentalIncome = investmentAmount * (rentalYield / 100) * investmentPeriod;
  const capitalGrowth = investmentAmount * Math.pow(1 + appreciation / 100, investmentPeriod) - investmentAmount;
  const totalReturns = rentalIncome + capitalGrowth;
  const finalValue = investmentAmount + totalReturns;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Property categories
  const categories = [
    { icon: GraduationCap, name: language === 'en' ? 'Educational' : 'تعليمي', desc: language === 'en' ? 'Schools and universities serving Egypt\'s growing youth.' : 'مدارس وجامعات تخدم الشباب المتزايد في مصر.' },
    { icon: Heart, name: language === 'en' ? 'Medical' : 'طبي', desc: language === 'en' ? 'Hospitals, clinics, and healthcare facilities.' : 'مستشفيات وعيادات ومرافق رعاية صحية.' },
    { icon: Building2, name: language === 'en' ? 'Commercial' : 'تجاري', desc: language === 'en' ? 'Office buildings and retail centers.' : 'مباني مكتبية ومراكز تجارية.' },
    { icon: HomeIcon, name: language === 'en' ? 'Residential' : 'سكني', desc: language === 'en' ? 'High-quality apartments and homes.' : 'شقق ومساكن عالية الجودة.' },
    { icon: Hotel, name: language === 'en' ? 'Hospitality' : 'ضيافة', desc: language === 'en' ? 'Hotels, resorts, and serviced apartments.' : 'فنادق ومنتجعات وشقق فندقية.' },
    { icon: Building, name: language === 'en' ? 'Administrative' : 'إداري', desc: language === 'en' ? 'Professional office spaces.' : 'مساحات مكتبية احترافية.' },
    { icon: Layers, name: language === 'en' ? 'Mixed-Use' : 'متعدد الاستخدامات', desc: language === 'en' ? 'Integrated multi-type developments.' : 'مشاريع متكاملة متعددة الأنواع.' },
  ];

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

      <div className="min-h-screen pb-16 md:pb-0" dir={dir}>
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

        {/* Hero Section */}
        <section 
          className="relative overflow-hidden min-h-[90vh] flex items-center"
          style={{
            background: 'linear-gradient(135deg, #032941 0%, #064B66 50%, #032941 100%)',
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#CDE428]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#CDE428]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="container relative z-10 py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className={`text-white space-y-8 ${language === 'ar' ? 'lg:order-2' : ''}`}>
                <div className="inline-block">
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428] text-[#032941]">
                    🏢 {language === 'en' ? 'Fractional Real Estate Investment' : 'الاستثمار العقاري الجزئي'}
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="block text-white">
                    {language === 'en' ? 'Own today.' : 'امتلك اليوم.'}
                  </span>
                  <span className="block bg-gradient-to-r from-[#CDE428] to-[#a8b820] bg-clip-text text-transparent">
                    {language === 'en' ? 'Invest for tomorrow.' : 'استثمر للغد.'}
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-xl">
                  {language === 'en' 
                    ? 'Invest in fractional real estate and build your property portfolio starting from EGP 10,000.'
                    : 'استثمر في العقارات الجزئية وابنِ محفظتك العقارية بدءاً من 10,000 جنيه مصري.'}
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <Users className="h-5 w-5 text-[#CDE428]" />
                    <span className="text-sm">{language === 'en' ? 'Individual & Institutional Investors' : 'مستثمرون أفراد ومؤسسات'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <HomeIcon className="h-5 w-5 text-[#CDE428]" />
                    <span className="text-sm">{language === 'en' ? 'Asset-Backed' : 'مدعوم بالأصول'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <BarChart3 className="h-5 w-5 text-[#CDE428]" />
                    <span className="text-sm">{language === 'en' ? '7 Property Types' : '7 أنواع من العقارات'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-[#CDE428]" />
                    <span className="text-sm">{language === 'en' ? 'FRA Licensed' : 'مرخص من الهيئة العامة للرقابة المالية'}</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/properties">
                    <Button 
                      size="lg" 
                      className="text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-[#CDE428] text-[#032941] hover:bg-[#d9ed3a]"
                    >
                      {language === 'en' ? 'Explore Properties' : 'استكشف العقارات'}
                      <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </Button>
                  </Link>
                  {!isAuthenticated && (
                    <Link href="/register">
                      <Button 
                        size="lg" 
                        className="text-lg px-8 py-6 h-auto font-semibold bg-white text-[#032941] hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        {language === 'en' ? 'Register Now (2 min)' : 'سجل الآن (دقيقتين فقط)'}
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-6 pt-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#CDE428]" />
                    <span>{language === 'en' ? 'Fully Regulated' : 'منظم بالكامل'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#CDE428]" />
                    <span>{language === 'en' ? 'Secure Platform' : 'منصة آمنة'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Hero Card */}
              <div className={`hidden lg:block ${language === 'ar' ? 'lg:order-1' : ''}`}>
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-[#032941]">
                          {language === 'en' ? 'Start Investing' : 'ابدأ الاستثمار'} 🏢
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className={`flex items-start gap-3 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#CDE428]">
                            <span className="text-sm font-bold text-[#032941]">1</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#032941]">{language === 'en' ? 'Browse Properties' : 'تصفح العقارات'}</p>
                            <p className="text-sm text-gray-600">{language === 'en' ? 'Explore verified investment opportunities' : 'استكشف فرص استثمارية موثقة'}</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-start gap-3 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#CDE428]">
                            <span className="text-sm font-bold text-[#032941]">2</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#032941]">{language === 'en' ? 'Invest from EGP 10,000' : 'استثمر من 10,000 ج.م'}</p>
                            <p className="text-sm text-gray-600">{language === 'en' ? 'Own fractional shares in premium properties' : 'امتلك حصص جزئية في عقارات مميزة'}</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-start gap-3 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#CDE428]">
                            <span className="text-sm font-bold text-[#032941]">3</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#032941]">{language === 'en' ? 'Earn Returns' : 'احصل على عوائد'}</p>
                            <p className="text-sm text-gray-600">{language === 'en' ? 'Rental income & capital appreciation' : 'دخل إيجاري وزيادة رأس المال'}</p>
                          </div>
                        </div>
                      </div>

                      <Link href="/how-it-works">
                        <Button variant="outline" className="w-full border-2 border-[#032941] text-[#032941] hover:bg-[#032941] hover:text-white">
                          {language === 'en' ? 'How It Works' : 'كيف يعمل'}
                          <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fund Banner */}
        <div className="bg-gradient-to-r from-[#085C52] to-[#064B66] py-4">
          <div className="container">
            <div className={`flex items-center justify-center gap-5 flex-wrap ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <p className="text-white font-bold text-lg">
                {language === 'en' ? 'Emtelaak Real Estate Investment Fund' : 'صندوق امتلاك للاستثمار العقاري'}
              </p>
              <span className="text-[#CDE428] text-2xl opacity-70">|</span>
              <div className={`flex items-center gap-4 flex-wrap ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  {language === 'en' ? 'Diverse' : 'متنوع'}
                </span>
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  {language === 'en' ? 'Smart' : 'ذكي'}
                </span>
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  {language === 'en' ? 'Sustainable' : 'مستدام'}
                </span>
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  {language === 'en' ? 'Green' : 'أخضر'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941] mb-4">
                ✨ {language === 'en' ? 'Why Choose Us' : 'لماذا تختارنا'}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-6">
                {language === 'en' ? 'Your Gateway to Egyptian Real Estate' : 'بوابتك إلى سوق العقارات المصري'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'en' 
                  ? 'We make real estate investment accessible, transparent, and profitable for everyone through a regulated and professional platform.'
                  : 'نجعل الاستثمار العقاري متاحاً وشفافاً ومربحاً للجميع من خلال منصة منظمة ومهنية.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mb-4">
                    <DollarSign className="h-8 w-8 text-[#032941]" />
                  </div>
                  <CardTitle className="text-xl">{language === 'en' ? 'Flexible Investment' : 'استثمار مرن'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {language === 'en' 
                      ? 'Start with EGP 10,000 instead of millions. Diversify across multiple properties to reduce risk and maximize returns.'
                      : 'ابدأ بمبلغ 10,000 جنيه مصري بدلاً من الملايين. نوّع استثماراتك عبر عقارات متعددة للتخفيف من المخاطر وتعظيم العوائد.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mb-4">
                    <Briefcase className="h-8 w-8 text-[#032941]" />
                  </div>
                  <CardTitle className="text-xl">{language === 'en' ? 'Professional Management' : 'إدارة مهنية'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {language === 'en' 
                      ? 'Our expert team handles property sourcing, due diligence, management, and tenant relations. Enjoy passive income without operational complexities.'
                      : 'يتولى فريق الخبراء لدينا تحديد مصادر العقارات والعناية الواجبة والإدارة وعلاقات المستأجرين. استمتع بدخل سلبي دون التعقيدات التشغيلية.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-[#032941]" />
                  </div>
                  <CardTitle className="text-xl">{language === 'en' ? 'FRA Licensed & Regulated' : 'مرخص ومنظم من الهيئة العامة للرقابة المالية'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {language === 'en' 
                      ? 'Emtelaak is a fully licensed and regulated real estate investment fund by the Financial Regulatory Authority (FRA).'
                      : 'امتلاك هو صندوق استثمار عقاري مرخص ومنظم بالكامل من قبل الهيئة العامة للرقابة المالية (FRA).'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-[#032941]" />
                  </div>
                  <CardTitle className="text-xl">{language === 'en' ? 'Diversified Portfolio' : 'محفظة متنوعة'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {language === 'en' 
                      ? 'Invest across seven different property types to build a balanced and resilient portfolio designed to capture growth across Egypt\'s dynamic economy.'
                      : 'استثمر عبر سبعة أنواع مختلفة من العقارات لبناء محفظة متوازنة ومرنة مصممة لالتقاط النمو عبر الاقتصاد المصري الديناميكي.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Simple Process Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#032941]/10 text-[#032941] mb-4">
                🚀 {language === 'en' ? 'Simple Process' : 'عملية بسيطة'}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-6">
                {language === 'en' ? 'Start Your Investment Journey in 4 Simple Steps' : 'ابدأ رحلة استثمارك في 4 خطوات بسيطة'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'en' 
                  ? 'From registration to earning returns, we\'ve made the process seamless and straightforward.'
                  : 'من التسجيل إلى كسب العوائد، جعلنا العملية سلسة ومباشرة.'}
              </p>
            </div>

            {/* Timeline */}
            <div className={`relative ${language === 'ar' ? 'direction-rtl' : ''}`}>
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#032941] via-[#CDE428] via-[#085C52] to-[#FF7F00] transform -translate-y-1/2 z-0"></div>
              
              <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 ${language === 'ar' ? 'direction-rtl' : ''}`}>
                {/* Step 1 */}
                <div className="relative group">
                  <div className="bg-[#032941] rounded-2xl p-6 text-white h-full transform hover:scale-105 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#CDE428] flex items-center justify-center">
                      <span className="font-bold text-[#032941]">1</span>
                    </div>
                    <div className="pt-4 text-center">
                      <UserPlus className="h-10 w-10 mx-auto mb-4 text-[#CDE428]" />
                      <h3 className="text-xl font-bold mb-2">{language === 'en' ? 'Register & Verify' : 'التسجيل والتحقق'}</h3>
                      <p className="text-white/80 text-sm">
                        {language === 'en' 
                          ? 'Create your account and complete secure KYC verification in 2 minutes.'
                          : 'أنشئ حسابك وأكمل عملية التحقق الآمنة (KYC) في دقيقتين.'}
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#CDE428] text-2xl">→</div>
                </div>

                {/* Step 2 */}
                <div className="relative group">
                  <div className="bg-[#CDE428] rounded-2xl p-6 h-full transform hover:scale-105 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#032941] flex items-center justify-center">
                      <span className="font-bold text-white">2</span>
                    </div>
                    <div className="pt-4 text-center">
                      <Search className="h-10 w-10 mx-auto mb-4 text-[#032941]" />
                      <h3 className="text-xl font-bold mb-2 text-[#032941]">{language === 'en' ? 'Explore Properties' : 'استكشف العقارات'}</h3>
                      <p className="text-[#032941]/80 text-sm">
                        {language === 'en' 
                          ? 'Browse our curated collection of premium properties across seven asset categories.'
                          : 'تصفح مجموعتنا المنسقة من العقارات المميزة عبر سبع فئات أصول.'}
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#085C52] text-2xl">→</div>
                </div>

                {/* Step 3 */}
                <div className="relative group">
                  <div className="bg-[#085C52] rounded-2xl p-6 text-white h-full transform hover:scale-105 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#CDE428] flex items-center justify-center">
                      <span className="font-bold text-[#032941]">3</span>
                    </div>
                    <div className="pt-4 text-center">
                      <DollarSign className="h-10 w-10 mx-auto mb-4 text-[#CDE428]" />
                      <h3 className="text-xl font-bold mb-2">{language === 'en' ? 'Invest & Own' : 'استثمر وامتلك'}</h3>
                      <p className="text-white/80 text-sm">
                        {language === 'en' 
                          ? 'Choose your investment amount and own fractional shares in high-value properties.'
                          : 'اختر مبلغ استثمارك وامتلك حصصاً جزئية في عقارات عالية القيمة.'}
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#FF7F00] text-2xl">→</div>
                </div>

                {/* Step 4 */}
                <div className="relative group">
                  <div className="bg-[#FF7F00] rounded-2xl p-6 text-white h-full transform hover:scale-105 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-[#CDE428] flex items-center justify-center">
                      <span className="font-bold text-[#032941]">4</span>
                    </div>
                    <div className="pt-4 text-center">
                      <TrendingUp className="h-10 w-10 mx-auto mb-4 text-white" />
                      <h3 className="text-xl font-bold mb-2">{language === 'en' ? 'Earn Returns' : 'احصل على عوائد'}</h3>
                      <p className="text-white/80 text-sm">
                        {language === 'en' 
                          ? 'Receive regular income from rental yields and benefit from capital appreciation.'
                          : 'احصل على دخل منتظم من عوائد الإيجار واستفد من زيادة رأس المال.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Options Section */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941] mb-4">
                💼 {language === 'en' ? 'Investment Options' : 'خيارات الاستثمار'}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-6">
                {language === 'en' ? 'Two Distinct Strategies for Your Financial Goals' : 'استراتيجيتان مميزتان لأهدافك المالية'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'en' 
                  ? 'Choose the investment approach that aligns with your financial objectives.'
                  : 'اختر نهج الاستثمار الذي يتوافق مع أهدافك المالية.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Buy to Let */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{language === 'en' ? 'Recommended for Beginners' : 'موصى به للمبتدئين'}</span>
                      <h3 className="text-2xl font-bold">{language === 'en' ? 'Buy to Let' : 'الشراء للتأجير'}</h3>
                    </div>
                  </div>
                  <p className="text-white/90">{language === 'en' ? 'Steady Rental Income' : 'دخل إيجاري ثابت'}</p>
                  <div className="mt-4 text-3xl font-bold">8-12% <span className="text-lg font-normal">{language === 'en' ? 'Annual Yield' : 'العائد السنوي'}</span></div>
                </div>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">
                    {language === 'en' 
                      ? 'Invest in rental properties and receive consistent monthly or quarterly income from tenant rent payments. Perfect for building passive income.'
                      : 'استثمر في العقارات المؤجرة واحصل على دخل شهري أو ربع سنوي ثابت من مدفوعات المستأجرين. مثالي لبناء دخل سلبي.'}
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{language === 'en' ? 'Regular passive income stream' : 'تدفق دخل سلبي منتظم'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{language === 'en' ? 'Lower volatility investment' : 'استثمار أقل تقلباً'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{language === 'en' ? 'Ideal for wealth preservation' : 'مثالي للحفاظ على الثروة'}</span>
                    </div>
                  </div>
                  <Link href="/properties?type=buy-to-let">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      {language === 'en' ? 'Explore Buy to Let' : 'استكشف الشراء للتأجير'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Buy to Sell */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{language === 'en' ? 'Higher Return Potential' : 'إمكانية عوائد أعلى'}</span>
                      <h3 className="text-2xl font-bold">{language === 'en' ? 'Buy to Sell' : 'الشراء للبيع'}</h3>
                    </div>
                  </div>
                  <p className="text-white/90">{language === 'en' ? 'Capital Appreciation' : 'زيادة رأس المال'}</p>
                  <div className="mt-4 text-3xl font-bold">15-25% <span className="text-lg font-normal">{language === 'en' ? 'Expected ROI' : 'العائد المتوقع'}</span></div>
                </div>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">
                    {language === 'en' 
                      ? 'Invest in properties with high growth potential. Benefit from market appreciation and development to achieve substantial returns upon sale.'
                      : 'استثمر في العقارات ذات إمكانيات النمو العالية. استفد من تقدير السوق والتطوير لتحقيق عوائد كبيرة عند البيع.'}
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">{language === 'en' ? 'Higher return potential' : 'إمكانية عوائد أعلى'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">{language === 'en' ? 'Capital appreciation focus' : 'التركيز على زيادة رأس المال'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">{language === 'en' ? 'Ideal for growth investors' : 'مثالي لمستثمري النمو'}</span>
                    </div>
                  </div>
                  <Link href="/properties?type=buy-to-sell">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      {language === 'en' ? 'Explore Buy to Sell' : 'استكشف الشراء للبيع'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941] mb-4">
                💰 {language === 'en' ? 'Returns Calculator' : 'حاسبة العوائد'}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-6">
                {language === 'en' ? 'Calculate Your Potential Returns' : 'احسب عوائدك المحتملة'}
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          💵 {language === 'en' ? 'Investment (EGP)' : 'الاستثمار (ج.م)'}: <span className="text-[#032941] font-bold">{formatCurrency(investmentAmount)}</span>
                        </label>
                        <Slider
                          value={[investmentAmount]}
                          onValueChange={(value) => setInvestmentAmount(value[0])}
                          min={10000}
                          max={1000000}
                          step={10000}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          🏠 {language === 'en' ? 'Rental Yield' : 'عائد الإيجار'}: <span className="text-[#032941] font-bold">{rentalYield}%</span>
                        </label>
                        <Slider
                          value={[rentalYield]}
                          onValueChange={(value) => setRentalYield(value[0])}
                          min={5}
                          max={15}
                          step={0.5}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          📈 {language === 'en' ? 'Appreciation' : 'زيادة القيمة'}: <span className="text-[#032941] font-bold">{appreciation}%</span>
                        </label>
                        <Slider
                          value={[appreciation]}
                          onValueChange={(value) => setAppreciation(value[0])}
                          min={5}
                          max={25}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          📅 {language === 'en' ? 'Period' : 'المدة'}: <span className="text-[#032941] font-bold">{investmentPeriod} {language === 'en' ? 'years' : 'سنوات'}</span>
                        </label>
                        <Slider
                          value={[investmentPeriod]}
                          onValueChange={(value) => setInvestmentPeriod(value[0])}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Results */}
                    <div className="bg-gradient-to-br from-[#032941] to-[#064B66] rounded-2xl p-6 text-white">
                      <h3 className="text-xl font-bold mb-6">{language === 'en' ? 'Projected Returns' : 'العوائد المتوقعة'}</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                          <span>🏠 {language === 'en' ? 'Rental Income' : 'دخل الإيجار'}</span>
                          <span className="font-bold text-[#CDE428]">{language === 'en' ? 'EGP' : 'ج.م'} {formatCurrency(rentalIncome)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                          <span>📈 {language === 'en' ? 'Value Growth' : 'نمو القيمة'}</span>
                          <span className="font-bold text-[#CDE428]">{language === 'en' ? 'EGP' : 'ج.م'} {formatCurrency(capitalGrowth)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                          <span>💰 {language === 'en' ? 'Total Returns' : 'إجمالي العوائد'}</span>
                          <span className="font-bold text-[#CDE428]">{language === 'en' ? 'EGP' : 'ج.م'} {formatCurrency(totalReturns)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-[#CDE428] rounded-lg text-[#032941]">
                          <span className="font-bold">🎯 {language === 'en' ? 'Final Value' : 'القيمة النهائية'}</span>
                          <span className="font-bold text-xl">{language === 'en' ? 'EGP' : 'ج.م'} {formatCurrency(finalValue)}</span>
                        </div>
                      </div>
                      <Link href="/register">
                        <Button className="w-full mt-6 bg-white text-[#032941] hover:bg-gray-100">
                          {language === 'en' ? 'Start Investing' : 'ابدأ الاستثمار'}
                          <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Portfolio Categories Section */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941] mb-4">
                🏗️ {language === 'en' ? 'Diversified Portfolio' : 'محفظة متنوعة'}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-6">
                {language === 'en' ? 'Diversified Portfolio Across 7 Key Sectors' : 'محفظة متنوعة عبر 7 قطاعات رئيسية'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'en' 
                  ? 'Invest across multiple property categories to build a balanced and resilient portfolio.'
                  : 'استثمر عبر فئات عقارية متعددة لبناء محفظة متوازنة ومرنة.'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center p-4">
                    <div className="w-12 h-12 rounded-xl bg-[#CDE428] flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-6 w-6 text-[#032941]" />
                    </div>
                    <h3 className="font-bold text-sm text-[#032941] mb-1">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="py-20 bg-[#032941] text-white">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428] text-[#032941] mb-4">
                🔒 {language === 'en' ? 'Trust & Security' : 'الثقة والأمان'}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {language === 'en' ? 'A Secure and Transparent Investment Platform' : 'منصة استثمار آمنة وشفافة'}
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                {language === 'en' 
                  ? 'Your investments are protected by multiple layers of security and regulatory compliance.'
                  : 'استثماراتك محمية بطبقات متعددة من الأمان والامتثال التنظيمي.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white/10 border-0 text-white">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-[#032941]" />
                  </div>
                  <CardTitle className="text-xl text-white">{language === 'en' ? 'FRA Licensed & Regulated' : 'مرخص ومنظم من الهيئة العامة للرقابة المالية'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">
                    {language === 'en' 
                      ? 'Fully licensed real estate investment fund under the supervision of Egypt\'s Financial Regulatory Authority.'
                      : 'صندوق استثمار عقاري مرخص بالكامل تحت إشراف الهيئة العامة للرقابة المالية المصرية.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-0 text-white">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-[#032941]" />
                  </div>
                  <CardTitle className="text-xl text-white">{language === 'en' ? 'Strategic Partnership' : 'شراكة استراتيجية'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">
                    {language === 'en' 
                      ? 'Partnership with Uptown 6th of October provides access to premium projects like Grand Uptown Mall.'
                      : 'شراكة مع أبتاون السادس من أكتوبر توفر الوصول إلى مشاريع متميزة مثل جراند أبتاون مول.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-0 text-white">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mb-4">
                    <HomeIcon className="h-8 w-8 text-[#032941]" />
                  </div>
                  <CardTitle className="text-xl text-white">{language === 'en' ? 'Asset-Backed Guarantee' : 'ضمان مدعوم بالأصول'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">
                    {language === 'en' 
                      ? 'Every investment is backed by real, tangible properties with legally documented fractional ownership.'
                      : 'كل استثمار مدعوم بعقارات حقيقية وملموسة مع ملكية جزئية موثقة قانونياً.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#CDE428] to-[#a8b820]">
          <div className="container text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-6">
              {language === 'en' ? 'Ready to Build Your Real Estate Portfolio?' : 'هل أنت مستعد لبناء محفظتك العقارية؟'}
            </h2>
            <p className="text-xl text-[#032941]/80 mb-8 max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Join thousands of investors building wealth through fractional real estate ownership.'
                : 'انضم إلى آلاف المستثمرين الذين يبنون ثرواتهم من خلال الملكية العقارية الجزئية.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-10 py-6 h-auto font-semibold bg-[#032941] text-white hover:bg-[#064B66]">
                  {language === 'en' ? 'Start Now' : 'ابدأ الآن'}
                  <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link href="/properties">
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 h-auto font-semibold border-2 border-[#032941] text-[#032941] hover:bg-[#032941] hover:text-white">
                  {language === 'en' ? 'Browse Properties' : 'تصفح العقارات'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
        <MobileBottomNav />
      </div>
    </>
  );
}
