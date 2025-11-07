import { Home, TrendingUp, Briefcase, Wallet, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { t, language } = useLanguage();

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
  );
}
