import { Home, TrendingUp, Briefcase, Wallet, Menu, ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { t, language } = useLanguage();
  const { isAuthenticated, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Don't show navigation if not authenticated or still loading
  if (!isAuthenticated || loading) {
    return null;
  }

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
      {/* Desktop Right Sidebar Navigation */}
      <nav 
        className={cn(
          "hidden md:block fixed right-0 top-0 h-screen bg-[#002B49] text-white z-40 shadow-xl transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-4 top-6 bg-[#D4FF00] text-[#002B49] rounded-full p-2 shadow-lg hover:bg-[#c4ef00] transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="p-6">
          {!isCollapsed && (
            <h2 className="text-xl font-bold mb-8">Emtelaak</h2>
          )}
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors",
                      item.active
                        ? "bg-[#D4FF00] text-[#002B49]"
                        : "text-white hover:bg-white/10"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
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
