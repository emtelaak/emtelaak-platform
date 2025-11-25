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
          "hidden md:block fixed top-0 h-screen bg-gradient-to-b from-[#002B49] to-[#001a2e] text-white z-40 shadow-2xl transition-all duration-300 ease-in-out",
          isRTL ? "left-0" : "right-0",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-8 bg-[#D4FF00] text-[#002B49] rounded-full p-2.5 shadow-lg hover:bg-[#c4ef00] hover:scale-110 transition-all duration-200 z-50",
            isRTL 
              ? (isCollapsed ? "-right-5" : "-right-5")
              : (isCollapsed ? "-left-5" : "-left-5")
          )}
          aria-label={isCollapsed ? (language === "en" ? "Expand sidebar" : "توسيع القائمة") : (language === "en" ? "Collapse sidebar" : "طي القائمة")}
        >
          {isRTL ? (
            isCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
          ) : (
            isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        {/* Sidebar Header */}
        <div className={cn(
          "p-6 border-b border-white/10",
          isCollapsed && "px-3"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt="Emtelaak" className="h-12 w-auto" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-[#D4FF00] rounded-lg flex items-center justify-center">
                <span className="text-[#002B49] font-bold text-lg">E</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className={cn(
          "p-4 space-y-2",
          isCollapsed && "px-2"
        )}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-200 group",
                    item.active
                      ? "bg-[#D4FF00] text-[#002B49] shadow-lg"
                      : "text-white hover:bg-white/10 hover:translate-x-1",
                    isCollapsed && "justify-center px-2",
                    isRTL && !isCollapsed && "flex-row-reverse"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    "flex-shrink-0 transition-transform duration-200",
                    item.active ? "h-6 w-6" : "h-5 w-5 group-hover:scale-110"
                  )} />
                  {!isCollapsed && (
                    <span className={cn(
                      "font-medium transition-all duration-200",
                      item.active ? "text-base" : "text-sm"
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
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
            <p className="text-xs text-white/60 text-center">
              {language === "en" ? "© 2024 Emtelaak" : "© 2024 إمتلاك"}
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
