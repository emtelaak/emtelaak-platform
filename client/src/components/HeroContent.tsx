import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BarChart3, Home as HomeIcon, Users, Shield, ArrowRight } from 'lucide-react';

interface HeroContentProps {
  language: string;
  isRTL: boolean;
  isAuthenticated: boolean;
}

export function HeroTextContent({ language, isRTL, isAuthenticated }: HeroContentProps) {
  return (
    <div className="text-white space-y-8 lg:flex-1">
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
  );
}

export function HeroCard({ language, isRTL }: Omit<HeroContentProps, 'isAuthenticated'>) {
  return (
    <div className="hidden lg:block lg:flex-1">
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
  );
}
