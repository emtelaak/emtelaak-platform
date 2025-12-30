import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, TrendingUp, Shield, Users, ArrowRight, CheckCircle2, 
  DollarSign, Home as HomeIcon, Briefcase, GraduationCap, Heart, 
  Hotel, Building, Layers, BarChart3, X, Target, Zap, PiggyBank,
  FileCheck, TrendingDown, Clock, Award, MapPin
} from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";
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
  const { language, dir } = useLanguage();
  const [location, setLocation] = useLocation();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [strategyTab, setStrategyTab] = useState<'buyToLet' | 'buyToSell'>('buyToLet');
  const [propertyTab, setPropertyTab] = useState<'buyToLet' | 'buyToSell'>('buyToLet');
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [rentalYield, setRentalYield] = useState(10);
  const [appreciation, setAppreciation] = useState(15);
  const [investmentPeriod, setInvestmentPeriod] = useState(5);
  const utils = trpc.useUtils();
  const isRTL = dir === 'rtl';
  
  // Debug logging
  console.log('Home Page RTL Debug:', { language, dir, isRTL, documentDir: document.documentElement.dir });

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

      <div className="min-h-screen pb-16 md:pb-0" dir={isRTL ? "rtl" : "ltr"}>
        {/* Top Notification Banner */}
        {showBanner && (
          <div className="bg-[#CDE428] py-3 px-4 relative">
            <div className="container flex items-center justify-center gap-4">
              <span className="text-[#032941] font-semibold text-sm md:text-base">
                {language === 'ar' 
                  ? '🏢 حفز تطبيق امتلاك للحصول على أفضل تجربة'
                  : '🏢 Download the Emtelaak app for the best experience'}
              </span>
              <Button 
                size="sm" 
                className="bg-[#032941] text-white hover:bg-[#064B66] h-8"
              >
                {language === 'ar' ? 'ثبت الآن' : 'Install Now'}
              </Button>
              <button
                onClick={() => setShowBanner(false)}
                className={`absolute top-1/2 -translate-y-1/2 text-[#032941] hover:opacity-70 ${isRTL ? 'right-4' : 'left-4'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

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
            <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              {/* Main Content */}
              <div className="text-white space-y-8 ltr:lg:col-start-1 rtl:lg:col-start-2">
                <div className="inline-block">
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428] text-[#032941]">
                    🏢 {language === 'ar' ? 'الاستثمار العقاري الجزئي' : 'Fractional Real Estate Investment'}
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="block text-white">
                    {language === 'ar' ? 'امتلك اليوم.' : 'Own today.'}
                  </span>
                  <span className="block bg-gradient-to-r from-[#CDE428] to-[#a8b820] bg-clip-text text-transparent">
                    {language === 'ar' ? 'استثمر للغد.' : 'Invest for tomorrow.'}
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-xl">
                  {language === 'ar' 
                    ? 'استثمر في العقارات الجزئية وابنِ محفظتك العقارية بدءاً من ١٠٬٠٠٠ جنيه مصري.'
                    : 'Invest in fractional real estate and build your property portfolio starting from EGP 10,000.'}
                </p>

                {/* Trust Badges */}
                <div className={`grid grid-cols-2 gap-3 max-w-2xl ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-3 bg-[#0a3d52] px-4 py-3 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-[#CDE428] flex-shrink-0" />
                    <span className="text-sm">{language === 'ar' ? 'مرخص من الهيئة العامة للرقابة المالية' : 'FRA Licensed'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-[#0a3d52] px-4 py-3 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-[#CDE428] flex-shrink-0" />
                    <span className="text-sm">{language === 'ar' ? '7 أنواع من العقارات' : '7 Property Types'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-[#0a3d52] px-4 py-3 rounded-lg">
                    <HomeIcon className="h-5 w-5 text-[#CDE428] flex-shrink-0" />
                    <span className="text-sm">{language === 'ar' ? 'مدعوم بالأصول' : 'Asset-Backed'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-[#0a3d52] px-4 py-3 rounded-lg">
                    <Users className="h-5 w-5 text-[#CDE428] flex-shrink-0" />
                    <span className="text-sm">{language === 'ar' ? 'مستثمرون أفراد ومؤسسات' : 'Individual & Institutional'}</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-4 pt-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <Link href="/properties">
                    <Button 
                      size="lg" 
                      className="text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-[#CDE428] text-[#032941] hover:bg-[#d9ed3a]"
                    >
                      {language === 'ar' ? 'استكشف العقارات' : 'Explore Properties'}
                      <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                    </Button>
                  </Link>
                  {!isAuthenticated && (
                    <Link href="/register">
                      <Button 
                        size="lg" 
                        className="text-lg px-8 py-6 h-auto font-semibold bg-white text-[#032941] hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        {language === 'ar' ? 'سجل الآن (دقيقتين فقط)' : 'Register Now (2 min)'}
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className={`flex items-center gap-6 pt-4 text-sm text-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Shield className="h-5 w-5 text-[#CDE428]" />
                    <span>{language === 'ar' ? 'منصة آمنة' : 'Secure Platform'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CheckCircle2 className="h-5 w-5 text-[#CDE428]" />
                    <span>{language === 'ar' ? 'منظم بالكامل' : 'Fully Regulated'}</span>
                  </div>
                </div>
              </div>

              {/* Hero Card */}
              <div className="hidden lg:block ltr:lg:col-start-2 rtl:lg:col-start-1">
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-6">
                      <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-between'}`}>
                        <h3 className="text-2xl font-bold text-[#032941]">
                          {language === 'ar' ? 'ابدأ الاستثمار' : 'Start Investing'} 🏢
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#CDE428]">
                            <span className="text-sm font-bold text-[#032941]">1</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#032941]">{language === 'ar' ? 'تصفح العقارات' : 'Browse Properties'}</p>
                            <p className="text-sm text-gray-600">{language === 'ar' ? 'استكشف فرص استثمارية موثقة' : 'Explore verified investment opportunities'}</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#CDE428]">
                            <span className="text-sm font-bold text-[#032941]">2</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#032941]">{language === 'ar' ? 'استثمر من ١٠٬٠٠٠ ج.م' : 'Invest from EGP 10,000'}</p>
                            <p className="text-sm text-gray-600">{language === 'ar' ? 'امتلك حصص جزئية في عقارات مميزة' : 'Own fractional shares in premium properties'}</p>
                          </div>
                        </div>
                        
                        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#CDE428]">
                            <span className="text-sm font-bold text-[#032941]">3</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#032941]">{language === 'ar' ? 'احصل على عوائد' : 'Earn Returns'}</p>
                            <p className="text-sm text-gray-600">{language === 'ar' ? 'دخل إيجاري وزيادة رأس المال' : 'Rental income & capital appreciation'}</p>
                          </div>
                        </div>
                      </div>

                      <Link href="/how-it-works">
                        <Button variant="outline" className="w-full border-2 border-[#032941] text-[#032941] hover:bg-[#032941] hover:text-white">
                          {language === 'ar' ? 'كيف يعمل' : 'How It Works'}
                          <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941]">
                  {language === 'ar' ? 'عملية بسيطة 🚀' : 'Simple Process 🚀'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-4">
                {language === 'ar' ? 'ابدأ رحلة استثمارك في 4 خطوات بسيطة' : 'Start your investment journey in 4 simple steps'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'ar' 
                  ? 'من التسجيل إلى كسب العوائد، جعلنا العملية سلسة ومباشرة.'
                  : 'From registration to earning returns, we\'ve made the process smooth and straightforward.'}
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className={`flex flex-col md:flex-row gap-8 relative ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                {/* Step 1 */}
                <div className="relative md:flex-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-[#032941] flex items-center justify-center mb-6 relative z-10 shadow-lg">
                      <FileCheck className="h-12 w-12 text-[#CDE428]" />
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#CDE428] flex items-center justify-center">
                        <span className="text-xl font-bold text-[#032941]">1</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#032941] mb-2">
                      {language === 'ar' ? 'التسجيل والتحقق' : 'Register & Verify'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'أنشئ حسابك وأكمل عملية التحقق الآمنة (KYC) في دقائق.'
                        : 'Create your account and complete secure KYC verification in minutes.'}
                    </p>
                  </div>
                  {/* Connector Arrow */}
                  <div className={`hidden md:block absolute top-12 ${isRTL ? 'right-full mr-4' : 'left-full ml-4'} w-full`}>
                    <div className={`h-0.5 bg-gradient-to-r ${isRTL ? 'from-[#CDE428] to-[#064B66]' : 'from-[#064B66] to-[#CDE428]'} relative`}>
                      <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-0' : 'right-0'}`}>
                        <div className={`w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ${isRTL ? 'border-r-8 border-r-[#CDE428]' : 'border-l-8 border-l-[#CDE428]'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative md:flex-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-[#CDE428] flex items-center justify-center mb-6 relative z-10 shadow-lg">
                      <Building2 className="h-12 w-12 text-[#032941]" />
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#032941] flex items-center justify-center">
                        <span className="text-xl font-bold text-[#CDE428]">2</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#032941] mb-2">
                      {language === 'ar' ? 'استكشف العقارات' : 'Explore Properties'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'تصفح مجموعتنا المتنوعة من العقارات المميزة عبر سبع فئات أصول.'
                        : 'Browse our diverse collection of premium properties across seven asset classes.'}
                    </p>
                  </div>
                  {/* Connector Arrow */}
                  <div className={`hidden md:block absolute top-12 ${isRTL ? 'right-full mr-4' : 'left-full ml-4'} w-full`}>
                    <div className={`h-0.5 bg-gradient-to-r ${isRTL ? 'from-[#064B66] to-[#CDE428]' : 'from-[#CDE428] to-[#064B66]'} relative`}>
                      <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-0' : 'right-0'}`}>
                        <div className={`w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ${isRTL ? 'border-r-8 border-r-[#064B66]' : 'border-l-8 border-l-[#064B66]'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative md:flex-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-[#064B66] flex items-center justify-center mb-6 relative z-10 shadow-lg">
                      <DollarSign className="h-12 w-12 text-[#CDE428]" />
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#CDE428] flex items-center justify-center">
                        <span className="text-xl font-bold text-[#032941]">3</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#032941] mb-2">
                      {language === 'ar' ? 'استثمر وامتلك' : 'Invest & Own'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'اختر مبلغ استثمارك وامتلك حصصاً جزئية في عقارات عالية القيمة.'
                        : 'Choose your investment amount and own fractional shares in high-value properties.'}
                    </p>
                  </div>
                  {/* Connector Arrow */}
                  <div className={`hidden md:block absolute top-12 ${isRTL ? 'right-full mr-4' : 'left-full ml-4'} w-full`}>
                    <div className={`h-0.5 bg-gradient-to-r ${isRTL ? 'from-[#FF6B35] to-[#064B66]' : 'from-[#064B66] to-[#FF6B35]'} relative`}>
                      <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-0' : 'right-0'}`}>
                        <div className={`w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent ${isRTL ? 'border-r-8 border-r-[#FF6B35]' : 'border-l-8 border-l-[#FF6B35]'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative md:flex-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-[#FF6B35] flex items-center justify-center mb-6 relative z-10 shadow-lg">
                      <TrendingUp className="h-12 w-12 text-white" />
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#CDE428] flex items-center justify-center">
                        <span className="text-xl font-bold text-[#032941]">4</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#032941] mb-2">
                      {language === 'ar' ? 'احصل على عوائد' : 'Earn Returns'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'احصل على دخل منتظم من الإيجار وأرباح من زيادة رأس المال.'
                        : 'Receive regular rental income and profit from capital appreciation.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fund Banner */}
        <div className="bg-gradient-to-r from-[#064B66] to-[#032941] py-4">
          <div className="container">
            <div className={`flex items-center justify-center gap-5 flex-wrap ${isRTL ? '' : ''}`}>
              {isRTL ? (
                <>
                  <div className="flex items-center gap-4 flex-wrap flex-row-reverse">
                    <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                      ✓ {language === 'ar' ? 'اختار' : 'Selected'}
                    </span>
                    <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                      💚 {language === 'ar' ? 'مستدام' : 'Sustainable'}
                    </span>
                    <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                      💡 {language === 'ar' ? 'ذكي' : 'Smart'}
                    </span>
                    <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                      🏢 {language === 'ar' ? 'متنوع' : 'Diverse'}
                    </span>
                  </div>
                  <span className="text-[#CDE428] text-2xl opacity-70">|</span>
                  <p className="text-white font-bold text-lg">
                    {language === 'ar' ? 'صندوق امتلاك للاستثمار العقاري' : 'Emtelaak Real Estate Investment Fund'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-lg">
                    {language === 'ar' ? 'صندوق امتلاك للاستثمار العقاري' : 'Emtelaak Real Estate Investment Fund'}
                  </p>
                  <span className="text-[#CDE428] text-2xl opacity-70">|</span>
                  <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  ✓ {language === 'ar' ? 'اختار' : 'Selected'}
                </span>
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  💚 {language === 'ar' ? 'مستدام' : 'Sustainable'}
                </span>
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  💡 {language === 'ar' ? 'ذكي' : 'Smart'}
                </span>
                <span className="flex items-center gap-2 text-[#CDE428] text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  🏢 {language === 'ar' ? 'متنوع' : 'Diverse'}
                </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941]">
                  {language === 'ar' ? 'لماذا نختارنا ⭐' : 'Why Choose Us ⭐'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-4">
                {language === 'ar' ? 'بوابتك إلى سوق العقارات المصري' : 'Your Gateway to the Egyptian Real Estate Market'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'ar' 
                  ? 'نجعل الاستثمار العقاري متاحاً وشفافاً وسريعاً للجميع من خلال منصة منظمة وموثوقة.'
                  : 'We make real estate investment accessible, transparent, and fast for everyone through a regulated and trusted platform.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Benefit 1 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mx-auto mb-6">
                    <DollarSign className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#032941] mb-3">
                    {language === 'ar' ? 'استثمار مرن' : 'Flexible Investment'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar' 
                      ? 'ابدأ بمبلغ ١٠٬٠٠٠ جنيه مصري بدلاً من الملايين. نوّع استثماراتك عبر عقارات متعددة للتخفيف من المخاطر وتعظيم العوائد.'
                      : 'Start with 10,000 EGP instead of millions. Diversify your investments across multiple properties to reduce risk and maximize returns.'}
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 2 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#032941] mb-3">
                    {language === 'ar' ? 'إدارة مهنية' : 'Professional Management'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar' 
                      ? 'يتولى فريق الخبراء لدينا تحديد مصادر العقارات والعناية الواجبة والإدارة، بينما تستمتع أنت بدخل سلبي دون التعقيدات الشغالية.'
                      : 'Our expert team handles property sourcing, due diligence, and management, while you enjoy passive income without operational complexities.'}
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 3 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#032941] mb-3">
                    {language === 'ar' ? 'مرخص ومنظم من الهيئة العامة للرقابة المالية' : 'FRA Licensed & Regulated'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar' 
                      ? 'امتلاك هو صندوق استثمار عقاري مرخص ومنظم بالكامل من قبل الهيئة العامة للرقابة المالية (FRA)، والهيئة العامة للرقابة المالية المصرية.'
                      : 'Emtelaak is a fully licensed and regulated real estate investment fund by the Financial Regulatory Authority (FRA), the Egyptian Financial Supervisory Authority.'}
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 4 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#CDE428] flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#032941] mb-3">
                    {language === 'ar' ? 'محفظة متنوعة' : 'Diverse Portfolio'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar' 
                      ? 'استثمر عبر سبعة أنواع مختلفة من العقارات لبناء محفظة متوازنة ومرنة مصممة للنمو المستدام والاستقرار الديناميكي.'
                      : 'Invest across seven different property types to build a balanced and resilient portfolio designed for sustainable growth and dynamic stability.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Investment Strategies Section */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941]">
                  {language === 'ar' ? 'خيارات الاستثمار 🎯' : 'Investment Options 🎯'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-4">
                {language === 'ar' ? 'استراتيجيتان مميزتان لأهدافك المالية' : 'Two Distinct Strategies for Your Financial Goals'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'ar' 
                  ? 'اختر نهج الاستثمار الذي يتوافق مع أهدافك المالية.'
                  : 'Choose the investment approach that aligns with your financial goals.'}
              </p>
            </div>

            <div className={`grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto ${isRTL ? 'lg:flex lg:flex-row-reverse' : ''}`}>
              {/* Buy to Let */}
              <Card className="border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                <div className="bg-gradient-to-br from-green-50 to-white p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                      <HomeIcon className="h-8 w-8 text-white" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      {language === 'ar' ? 'موجه به للمبتدئين' : 'Beginner Friendly'}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-[#032941] mb-2">
                    {language === 'ar' ? 'الشراء للتأجير' : 'Buy-to-Let'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {language === 'ar' ? 'دخل إيجاري ثابت' : 'Steady Rental Income'}
                  </p>

                  <div className="bg-green-50 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">{language === 'ar' ? 'العائد السنوي' : 'Annual Return'}</p>
                      <p className="text-5xl font-bold text-green-600">{language === 'ar' ? '٨-١٢٪' : '8-12%'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <p className="text-gray-700 leading-relaxed">
                      {language === 'ar' 
                        ? 'استثمر في العقارات المؤجرة واحصل على دخل شهري أو ربع سنوي، ثابت. استمتع بدخل سلبي من مدفوعات المستأجرين، مثالي لبناء دخل سنوي.'
                        : 'Invest in rented properties and receive steady monthly or quarterly income. Enjoy passive income from tenant payments, ideal for building annual income.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl mb-1">📅</div>
                      <p className="text-xs font-semibold text-gray-700">{language === 'ar' ? 'شهري/ربع سنوي' : 'Monthly/Quarterly'}</p>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'تكرار الدخل' : 'Income Frequency'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">📉</div>
                      <p className="text-xs font-semibold text-gray-700">{language === 'ar' ? 'منخفض' : 'Low'}</p>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'ملف المخاطر' : 'Risk Profile'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">⏳</div>
                      <p className="text-xs font-semibold text-gray-700">{language === 'ar' ? 'طويل الأجل' : 'Long-term'}</p>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'أفق الاستثمار' : 'Investment Horizon'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{language === 'ar' ? 'تدفق نقدي منتظم، منخفض' : 'Regular, predictable cash flow'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{language === 'ar' ? 'استثمر أمن نسبياً' : 'Relatively stable investment'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{language === 'ar' ? 'مثالي للحفاظ على الثروة' : 'Ideal for wealth preservation'}</span>
                    </div>
                  </div>

                  <Link href="/properties?type=buyToLet">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold">
                      {language === 'ar' ? 'استكشف الشراء للتأجير' : 'Explore Buy-to-Let'}
                      <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Buy to Sell */}
              <Card className="border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 to-white p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {language === 'ar' ? 'إمكانية عوائد أعلى' : 'Higher Return Potential'}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-[#032941] mb-2">
                    {language === 'ar' ? 'الشراء للبيع' : 'Buy-to-Sell'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {language === 'ar' ? 'زيادة رأس المال' : 'Capital Growth'}
                  </p>

                  <div className="bg-blue-50 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">{language === 'ar' ? 'العائد المتوقع' : 'Expected Return'}</p>
                      <p className="text-5xl font-bold text-blue-600">{language === 'ar' ? '١٥-٢٥٪' : '15-25%'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <p className="text-gray-700 leading-relaxed">
                      {language === 'ar' 
                        ? 'استثمر في العقارات ذات إمكانيات النمو العالية، استفد من تقدير السوق والتطوير لتحقيق عوائد كبيرة عند البيع.'
                        : 'Invest in properties with high growth potential. Benefit from market appreciation and development to achieve significant returns upon sale.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl mb-1">⏱️</div>
                      <p className="text-xs font-semibold text-gray-700">{language === 'ar' ? '2-5 سنوات' : '2-5 Years'}</p>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'مدة الاستثمار' : 'Investment Period'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <p className="text-xs font-semibold text-gray-700">{language === 'ar' ? 'متوسط' : 'Medium'}</p>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'ملف المخاطر' : 'Risk Profile'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎯</div>
                      <p className="text-xs font-semibold text-gray-700">{language === 'ar' ? 'تركيز النمو' : 'Growth Focus'}</p>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'نوع الاستراتيجية' : 'Strategy Type'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{language === 'ar' ? 'إمكانية عوائد أعلى' : 'Higher return potential'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{language === 'ar' ? 'الأكثر على زيادة رأس المال' : 'Focus on capital appreciation'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{language === 'ar' ? 'مثالي لمستثمري النمو' : 'Ideal for growth investors'}</span>
                    </div>
                  </div>

                  <Link href="/properties?type=buyToSell">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold">
                      {language === 'ar' ? 'استكشف الشراء للبيع' : 'Explore Buy-to-Sell'}
                      <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Property Categories Section */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941]">
                  {language === 'ar' ? 'محفظة متنوعة 📊' : 'Diverse Portfolio 📊'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-4">
                {language === 'ar' ? 'محفظة متنوعة عبر 7 قطاعات رئيسية' : 'Diverse Portfolio Across 7 Key Sectors'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'ar' 
                  ? 'استثمر عبر فئات عقارية متعددة لبناء محفظة متوازنة ومرنة.'
                  : 'Invest across multiple property categories to build a balanced and resilient portfolio.'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
              {/* Educational */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="font-bold text-[#032941] mb-2">
                  {language === 'ar' ? 'تعليمي' : 'Educational'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'مدارس وجامعات تخدم الشباب المتزايد في مصر' : 'Schools and universities serving Egypt\'s growing youth'}
                </p>
              </div>

              {/* Medical */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-6xl mb-4">🏥</div>
                <h3 className="font-bold text-[#032941] mb-2">
                  {language === 'ar' ? 'طبي' : 'Medical'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'مستشفيات وعيادات ومرافق رعاية صحية' : 'Hospitals, clinics, and healthcare facilities'}
                </p>
              </div>

              {/* Commercial */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="font-bold text-[#032941] mb-2">
                  {language === 'ar' ? 'تجاري' : 'Commercial'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'مباني مكتبية ومراكز تجارية' : 'Office buildings and retail centers'}
                </p>
              </div>

              {/* Residential */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="font-bold text-[#032941] mb-2">
                  {language === 'ar' ? 'سكني' : 'Residential'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'شقق ومساكن عالية الجودة' : 'High-quality apartments and homes'}
                </p>
              </div>

              {/* Hospitality */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-6xl mb-4">🏨</div>
                <h3 className="font-bold text-[#032941] mb-2">
                  {language === 'ar' ? 'ضيافة' : 'Hospitality'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'فنادق ومنتجعات وشقق فندقية' : 'Hotels, resorts, and serviced apartments'}
                </p>
              </div>

              {/* Administrative */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-6xl mb-4">🏛️</div>
                <h3 className="font-bold text-[#032941] mb-2">
                  {language === 'ar' ? 'إداري' : 'Administrative'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'مساحات مكتبية احترافية' : 'Professional office spaces'}
                </p>
              </div>

              {/* Mixed-Use */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-6xl mb-4">🏗️</div>
                <h3 className="font-bold text-[#032941] mb-2">
                  {language === 'ar' ? 'متعدد الاستخدامات' : 'Mixed-Use'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'مشاريع متكاملة متعددة الأنواع' : 'Integrated multi-type developments'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section 
          className="py-20"
          style={{
            background: 'linear-gradient(135deg, #032941 0%, #064B66 100%)',
          }}
        >
          <div className="container">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-white">
                  {language === 'ar' ? 'الثقة والأمان 🛡️' : 'Trust & Security 🛡️'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {language === 'ar' ? 'منصة استثمار آمنة وشفافة' : 'Secure and Transparent Investment Platform'}
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {language === 'ar' 
                  ? 'استثماراتك محمية بطبقات متعددة من الأمان والامتثال التنظيمي.'
                  : 'Your investments are protected by multiple layers of security and regulatory compliance.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Trust Badge 1 */}
              <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#CDE428] flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {language === 'ar' ? 'مرخص ومنظم من الهيئة العامة للرقابة المالية' : 'FRA Licensed & Regulated'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {language === 'ar' 
                      ? 'صندوق استثمار عقاري مرخص بالكامل تحت إشراف الهيئة العامة للرقابة المالية المصرية.'
                      : 'Fully licensed real estate investment fund under the supervision of the Egyptian FRA.'}
                  </p>
                </CardContent>
              </Card>

              {/* Trust Badge 2 */}
              <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#CDE428] flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {language === 'ar' ? 'ضمان مدعوم بالأصول' : 'Asset-Backed Guarantee'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {language === 'ar' 
                      ? 'كل استثمار مدعوم بعقارات حقيقية ملموسة وملكية جزئية موثقة قانونياً.'
                      : 'Every investment is backed by real, tangible properties and legally documented fractional ownership.'}
                  </p>
                </CardContent>
              </Card>

              {/* Trust Badge 3 */}
              <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#CDE428] flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {language === 'ar' ? 'شراكة استراتيجية' : 'Strategic Partnership'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {language === 'ar' 
                      ? 'شراكة مع أليانز السادس من أكتوبر توفر الوصول إلى مشاريع متميزة على طول دائرة الأليانز دول.'
                      : 'Partnership with Allianz 6th of October provides access to premium projects along the Allianz Ring Road.'}
                  </p>
                </CardContent>
              </Card>

              {/* Trust Badge 4 */}
              <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#CDE428] flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-[#032941]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {language === 'ar' ? 'رؤية مصر 2030' : 'Egypt Vision 2030'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {language === 'ar' 
                      ? 'استراتيجية استثمار متوافقة مع أهداف التنمية الوطنية المصرية للنمو المستدام.'
                      : 'Investment strategy aligned with Egypt\'s national development goals for sustainable growth.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section 
          className="py-20"
          style={{
            background: 'linear-gradient(135deg, #064B66 0%, #032941 100%)',
          }}
        >
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-white">
                  {language === 'ar' ? 'حاسبة العوائد 🧮' : 'ROI Calculator 🧮'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {language === 'ar' ? 'احسب عوائدك المحتملة' : 'Calculate Your Potential Returns'}
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-white shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {/* Investment Amount Slider */}
                    <div>
                      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <label className="text-sm font-semibold text-gray-700">
                          {language === 'ar' ? 'الاستثمار (ج.م) 💰' : 'Investment Amount (EGP) 💰'}
                        </label>
                        <span className="text-2xl font-bold text-[#032941]">
                          {formatCurrency(investmentAmount)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                      <Slider
                        value={[investmentAmount]}
                        onValueChange={(value) => setInvestmentAmount(value[0])}
                        min={10000}
                        max={1000000}
                        step={10000}
                        className="w-full"
                      />
                    </div>

                    {/* Rental Yield Slider */}
                    <div>
                      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <label className="text-sm font-semibold text-gray-700">
                          {language === 'ar' ? 'عائد الإيجار 🏠' : 'Rental Yield 🏠'}
                        </label>
                        <span className="text-2xl font-bold text-[#032941]">{rentalYield}%</span>
                      </div>
                      <Slider
                        value={[rentalYield]}
                        onValueChange={(value) => setRentalYield(value[0])}
                        min={5}
                        max={20}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    {/* Appreciation Slider */}
                    <div>
                      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <label className="text-sm font-semibold text-gray-700">
                          {language === 'ar' ? 'زيادة القيمة 📈' : 'Annual Appreciation 📈'}
                        </label>
                        <span className="text-2xl font-bold text-[#032941]">{appreciation}%</span>
                      </div>
                      <Slider
                        value={[appreciation]}
                        onValueChange={(value) => setAppreciation(value[0])}
                        min={0}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Investment Period Slider */}
                    <div>
                      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <label className="text-sm font-semibold text-gray-700">
                          {language === 'ar' ? 'المدة 🎯' : 'Investment Period 🎯'}
                        </label>
                        <span className="text-2xl font-bold text-[#032941]">
                          {investmentPeriod} {language === 'ar' ? 'سنوات' : 'years'}
                        </span>
                      </div>
                      <Slider
                        value={[investmentPeriod]}
                        onValueChange={(value) => setInvestmentPeriod(value[0])}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Results */}
                    <div className="grid md:grid-cols-2 gap-4 pt-6 border-t">
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">{language === 'ar' ? 'دخل الإيجار 🏠' : 'Rental Income 🏠'}</p>
                        <p className="text-3xl font-bold text-[#032941]">
                          {formatCurrency(rentalIncome)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">{language === 'ar' ? 'نمو القيمة 📊' : 'Capital Growth 📊'}</p>
                        <p className="text-3xl font-bold text-[#032941]">
                          {formatCurrency(capitalGrowth)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                      <div className="bg-[#CDE428] rounded-xl p-6 text-center">
                        <p className="text-sm text-[#032941] font-semibold mb-2">{language === 'ar' ? 'إجمالي العوائد 💰' : 'Total Returns 💰'}</p>
                        <p className="text-3xl font-bold text-[#032941]">
                          {formatCurrency(totalReturns)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                      <div className="bg-[#032941] rounded-xl p-6 text-center">
                        <p className="text-sm text-[#CDE428] font-semibold mb-2">{language === 'ar' ? 'القيمة النهائية 💎' : 'Final Value 💎'}</p>
                        <p className="text-3xl font-bold text-white">
                          {formatCurrency(finalValue)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                    </div>

                    <Link href="/register">
                      <Button className="w-full bg-[#CDE428] hover:bg-[#d9ed3a] text-[#032941] py-6 text-lg font-semibold">
                        {language === 'ar' ? 'ابدأ الاستثمار' : 'Start Investing'}
                        <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-20"
          style={{
            background: 'linear-gradient(135deg, #032941 0%, #064B66 100%)',
          }}
        >
          <div className="container text-center">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428] text-[#032941]">
                {language === 'ar' ? 'مستعد للاستثمار؟ 🚀' : 'Ready to Invest? 🚀'}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {language === 'ar' ? 'ابدأ رحلة استثمارك اليوم' : 'Start Your Investment Journey Today'}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              {language === 'ar' 
                ? 'انضم إلى آلاف المستثمرين الذين يبنون ثرواتهم من خلال الملكية العقارية الجزئية.'
                : 'Join thousands of investors who are building wealth through fractional property ownership.'}
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <Link href="/register">
                <Button className="bg-[#CDE428] hover:bg-[#d9ed3a] text-[#032941] px-8 py-6 text-lg font-semibold">
                  {language === 'ar' ? 'ابدأ الآن' : 'Start Now'}
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#032941] px-8 py-6 text-lg font-semibold">
                  {language === 'ar' ? 'تصفح العقارات' : 'Browse Properties'}
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 flex-wrap text-white/80">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 className="h-5 w-5 text-[#CDE428]" />
                <span>{language === 'ar' ? 'منصة آمنة' : 'Secure Platform'}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 className="h-5 w-5 text-[#CDE428]" />
                <span>{language === 'ar' ? 'منظم بالكامل' : 'Fully Regulated'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Properties Section */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-[#CDE428]/20 text-[#032941]">
                  {language === 'ar' ? 'استثمارات مميزة 🏘️' : 'Featured Investments 🏘️'}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#032941] mb-4">
                {language === 'ar' ? 'عقاراتنا' : 'Our Properties'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {language === 'ar' 
                  ? 'استكشف مجموعتنا المنسقة من فرص الاستثمار في جميع أنحاء مصر.'
                  : 'Explore our curated collection of investment opportunities across Egypt.'}
              </p>
            </div>

            {!isAuthenticated ? (
              /* Sign-in prompt for non-authenticated users */
              <div className="max-w-2xl mx-auto text-center py-16">
                <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-[#CDE428]">
                  <div className="w-20 h-20 rounded-full bg-[#CDE428] flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-10 w-10 text-[#032941]" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#032941] mb-4">
                    {language === 'ar' ? 'سجل الدخول لرؤية العقارات المتاحة' : 'Sign In to See Available Properties'}
                  </h3>
                  <p className="text-lg text-gray-600 mb-8">
                    {language === 'ar' 
                      ? 'قم بتسجيل الدخول أو إنشاء حساب للوصول إلى مجموعتنا الحصرية من فرص الاستثمار العقاري.'
                      : 'Sign in or create an account to access our exclusive collection of real estate investment opportunities.'}
                  </p>
                  <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                    <Link href="/login">
                      <Button className="bg-[#032941] hover:bg-[#064B66] text-white px-8 py-6 text-lg font-semibold w-full sm:w-auto">
                        {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                        <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline" className="border-2 border-[#032941] text-[#032941] hover:bg-[#032941] hover:text-white px-8 py-6 text-lg font-semibold w-full sm:w-auto">
                        {language === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Property cards for authenticated users */
              <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Property Card 1 */}
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80" 
                    alt="Luxury property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                      {language === 'ar' ? 'الشراء للتأجير' : 'Buy-to-Let'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#CDE428] text-[#032941]">
                      {language === 'ar' ? 'ممول' : 'Funded'}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className={`flex items-center gap-2 text-sm text-gray-600 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <MapPin className="h-4 w-4" />
                    <span>{language === 'ar' ? 'العين السخنة 📍' : 'Ain Sokhna 📍'}</span>
                    <span className="mx-2">|</span>
                    <span>{language === 'ar' ? 'فندق 🏨' : 'Hotel 🏨'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#032941] mb-3">
                    {language === 'ar' ? 'جناح فندقي في منتجع سيلد دي ماري' : 'Hotel Suite in Ciel de Marie Resort'}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ar' ? 'العائد السنوي' : 'Annual Return'}</p>
                      <p className="text-2xl font-bold text-green-600">15%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{language === 'ar' ? 'المستثمرون' : 'Investors'}</p>
                      <p className="text-lg font-bold text-[#032941]">245</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{language === 'ar' ? 'تاريخ التمويل' : 'Funding Date'}</span>
                      <span className="font-semibold">{language === 'ar' ? '28 أكتوبر 2024' : 'Oct 28, 2024'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">{language === 'ar' ? 'التقييم الحالي' : 'Current Valuation'}</span>
                      <span className="font-semibold">3,200,000 {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Card 2 */}
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80" 
                    alt="Commercial property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                      {language === 'ar' ? 'الشراء للتأجير' : 'Buy-to-Let'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#CDE428] text-[#032941]">
                      {language === 'ar' ? 'متاح' : 'Available'}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className={`flex items-center gap-2 text-sm text-gray-600 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <MapPin className="h-4 w-4" />
                    <span>{language === 'ar' ? 'السادس من أكتوبر 📍' : '6th of October 📍'}</span>
                    <span className="mx-2">|</span>
                    <span>{language === 'ar' ? 'مكتب 🏢' : 'Office 🏢'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#032941] mb-3">
                    {language === 'ar' ? 'مكتب مصر في جراند أليانز مول' : 'Egypt Office in Grand Allianz Mall'}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ar' ? 'العائد المتوقع' : 'Expected Return'}</p>
                      <p className="text-2xl font-bold text-green-600">11.2%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{language === 'ar' ? 'المستثمرون' : 'Investors'}</p>
                      <p className="text-lg font-bold text-[#032941]">89</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{language === 'ar' ? 'الحد الأدنى للاستثمار' : 'Min. Investment'}</span>
                      <span className="font-semibold">{language === 'ar' ? '١٠٬٠٠٠ ج.م' : '10,000 EGP'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">{language === 'ar' ? 'التمويل المستهدف' : 'Target Funding'}</span>
                      <span className="font-semibold">1,800,000 {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Card 3 */}
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80" 
                    alt="Residential property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                      {language === 'ar' ? 'الشراء للبيع' : 'Buy-to-Sell'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#CDE428] text-[#032941]">
                      {language === 'ar' ? 'ممول' : 'Funded'}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className={`flex items-center gap-2 text-sm text-gray-600 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <MapPin className="h-4 w-4" />
                    <span>{language === 'ar' ? 'القاهرة الجديدة 📍' : 'New Cairo 📍'}</span>
                    <span className="mx-2">|</span>
                    <span>{language === 'ar' ? '2 غرف نوم 🏠' : '2 BR Apt 🏠'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#032941] mb-3">
                    {language === 'ar' ? 'شقة فاخرة في ليك فيو ريزيدنس' : 'Luxury Apartment in Lake View Residence'}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{language === 'ar' ? 'العائد السنوي' : 'Annual Return'}</p>
                      <p className="text-2xl font-bold text-green-600">10.5%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{language === 'ar' ? 'المستثمرون' : 'Investors'}</p>
                      <p className="text-lg font-bold text-[#032941]">156</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{language === 'ar' ? 'تاريخ التمويل' : 'Funding Date'}</span>
                      <span className="font-semibold">{language === 'ar' ? '15 نوفمبر 2024' : 'Nov 15, 2024'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">{language === 'ar' ? 'التقييم الحالي' : 'Current Valuation'}</span>
                      <span className="font-semibold">2,650,000 {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>

              <div className="text-center">
                <Link href="/properties">
                  <Button className="bg-[#CDE428] hover:bg-[#d9ed3a] text-[#032941] px-8 py-6 text-lg font-semibold">
                    {language === 'ar' ? 'عرض جميع العقارات' : 'View All Properties'}
                    <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rtl-mirror' : 'ml-2'}`} />
                  </Button>
                </Link>
              </div>
              </>
            )}
          </div>
        </section>
      </div>

      <Footer />
      <MobileBottomNav />
    </>
  );
}
