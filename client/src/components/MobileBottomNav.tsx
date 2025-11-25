import { Home, TrendingUp, Briefcase, Wallet, Menu, ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { APP_LOGO } from "@/const";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { t, language } = useLanguage();
  const { isAuthenticated, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Don't show navigation if not authenticated or still loading
  if (!isAuthenticated || loading) {
    return null;
  }

  const isRTL = language === "ar";

  const navItems = [
    {
      icon: Home,
      label: language === "en" ? "Home" : "الرئيسية",
      href: "/",
      active: location === "/"
    },
    {
      icon: TrendingUp,
      label: language === "en" ? "Invest" : "استثمر",
      href: "/properties",
      active: location.startsWith("/properties")
    },
    {
      icon: Briefcase,
      label: language === "en" ? "Portfolio" : "المحفظة",
      href: "/portfolio",
      active: location === "/portfolio"
    },
    {
      icon: Wallet,
      label: language === "en" ? "Wallet" : "المحفظة المالية",
      href: "/wallet",
      active: location === "/wallet"
    },
    {
      icon: Menu,
      label: language === "en" ? "Menu" : "القائمة",
      href: "/menu",
      active: location === "/menu"
    }
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation - Clean White Design */}
      <nav 
        className={cn(
          "hidden md:flex fixed top-0 h-screen bg-white z-40 shadow-2xl transition-all duration-300 ease-in-out flex-col border-l-2 border-gray-100",
          isRTL ? "left-0" : "right-0",
          isCollapsed ? "w-24" : "w-72"
        )}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-8 bg-[#CDE428] text-[#032941] rounded-full p-3 shadow-xl hover:bg-[#b8ce22] hover:scale-110 transition-all duration-200 z-50 border-2 border-[#032941]",
            isRTL 
              ? (isCollapsed ? "-right-5" : "-right-5")
              : (isCollapsed ? "-left-5" : "-left-5")
          )}
          aria-label={isCollapsed ? (language === "en" ? "Expand sidebar" : "توسيع القائمة") : (language === "en" ? "Collapse sidebar" : "طي القائمة")}
        >
          {isRTL ? (
            isCollapsed ? <ChevronLeft className="h-5 w-5 font-bold" /> : <ChevronRight className="h-5 w-5 font-bold" />
          ) : (
            isCollapsed ? <ChevronRight className="h-5 w-5 font-bold" /> : <ChevronLeft className="h-5 w-5 font-bold" />
          )}
        </button>

        {/* Sidebar Header - Navy Blue Section */}
        <div className={cn(
          "p-8 border-b-2 border-gray-100 bg-gradient-to-br from-[#002B49] to-[#003a5f]",
          isCollapsed && "px-4 py-8"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center justify-center">
              <img src={APP_LOGO} alt="Emtelaak" className="h-20 w-auto" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-[#CDE428] rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-[#032941] font-bold text-3xl">E</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className={cn(
          "flex-1 p-5 space-y-2 overflow-y-auto",
          isCollapsed && "px-3"
        )}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all duration-200 group relative",
                    item.active
                      ? "bg-[#CDE428] text-[#032941] shadow-lg scale-105 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:scale-102 hover:shadow-md",
                    isCollapsed && "justify-center px-3",
                    isRTL && !isCollapsed && "flex-row-reverse"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    "flex-shrink-0 transition-all duration-200",
                    item.active ? "h-7 w-7" : "h-6 w-6 group-hover:scale-110"
                  )} />
                  
                  {!isCollapsed && (
                    <span className={cn(
                      "transition-all duration-200",
                      item.active ? "text-lg font-bold" : "text-base font-semibold"
                    )}>
                      {item.label}
                    </span>
                  )}
                </button>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className={cn(
          "p-6 border-t-2 border-gray-100 bg-gray-50",
          isCollapsed && "px-3"
        )}>
          {!isCollapsed ? (
            <div className="text-center">
              <p className="text-sm text-gray-700 font-semibold mb-1">
                {language === "en" ? "© 2024 Emtelaak" : "© 2024 إمتلاك"}
              </p>
              <p className="text-xs text-gray-500">
                {language === "en" ? "Fractional Real Estate" : "الملكية العقارية الجزئية"}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-600 font-semibold">© 2024</p>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-100 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-colors",
                    item.active
                      ? "text-[#032941]"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className={cn(
                    "mb-1",
                    item.active ? "h-6 w-6" : "h-5 w-5"
                  )} />
                  <span className={cn(
                    "text-xs",
                    item.active ? "font-bold" : "font-medium"
                  )}>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
