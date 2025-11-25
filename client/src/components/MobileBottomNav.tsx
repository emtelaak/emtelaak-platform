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
      {/* Desktop Sidebar Navigation */}
      <nav 
        className={cn(
          "hidden md:flex fixed top-0 h-screen bg-gradient-to-br from-[#002B49] via-[#003a5f] to-[#001a2e] text-white z-40 shadow-2xl transition-all duration-300 ease-in-out flex-col",
          isRTL ? "left-0" : "right-0",
          isCollapsed ? "w-24" : "w-80"
        )}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-10 bg-[#D4FF00] text-[#002B49] rounded-full p-3 shadow-xl hover:bg-[#c4ef00] hover:scale-110 transition-all duration-200 z-50 border-2 border-[#002B49]",
            isRTL 
              ? (isCollapsed ? "-right-6" : "-right-6")
              : (isCollapsed ? "-left-6" : "-left-6")
          )}
          aria-label={isCollapsed ? (language === "en" ? "Expand sidebar" : "توسيع القائمة") : (language === "en" ? "Collapse sidebar" : "طي القائمة")}
        >
          {isRTL ? (
            isCollapsed ? <ChevronLeft className="h-5 w-5 font-bold" /> : <ChevronRight className="h-5 w-5 font-bold" />
          ) : (
            isCollapsed ? <ChevronRight className="h-5 w-5 font-bold" /> : <ChevronLeft className="h-5 w-5 font-bold" />
          )}
        </button>

        {/* Sidebar Header */}
        <div className={cn(
          "p-8 border-b border-white/20",
          isCollapsed && "px-4 py-8"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center justify-center">
              <img src={APP_LOGO} alt="Emtelaak" className="h-16 w-auto" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-[#D4FF00] rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-[#002B49] font-bold text-2xl">E</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className={cn(
          "flex-1 p-6 space-y-3",
          isCollapsed && "px-3"
        )}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all duration-200 group relative overflow-hidden",
                    item.active
                      ? "bg-[#D4FF00] text-[#002B49] shadow-xl scale-105"
                      : "text-white hover:bg-white/15 hover:scale-105 hover:shadow-lg",
                    isCollapsed && "justify-center px-3",
                    isRTL && !isCollapsed && "flex-row-reverse"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Background glow effect for active state */}
                  {item.active && (
                    <div className="absolute inset-0 bg-[#D4FF00] opacity-20 blur-xl"></div>
                  )}
                  
                  <Icon className={cn(
                    "flex-shrink-0 transition-all duration-200 relative z-10",
                    item.active ? "h-7 w-7" : "h-6 w-6 group-hover:scale-110"
                  )} />
                  
                  {!isCollapsed && (
                    <span className={cn(
                      "font-semibold transition-all duration-200 relative z-10",
                      item.active ? "text-lg" : "text-base"
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
        {!isCollapsed && (
          <div className="p-6 border-t border-white/20">
            <p className="text-sm text-white/70 text-center font-medium">
              {language === "en" ? "© 2024 Emtelaak" : "© 2024 إمتلاك"}
            </p>
            <p className="text-xs text-white/50 text-center mt-1">
              {language === "en" ? "Fractional Real Estate" : "الملكية العقارية الجزئية"}
            </p>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-colors",
                    item.active
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
