import { Home, TrendingUp, Briefcase, Wallet, Menu, Info, Phone, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { language } = useLanguage();
  const { isAuthenticated, loading, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();

  // Navigation items for logged-in users
  const authenticatedNavItems = [
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
      active: location.startsWith("/properties") || location.startsWith("/property/")
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
      href: "#",
      active: false,
      isMenu: true
    }
  ];

  // Navigation items for non-logged-in users
  const guestNavItems = [
    {
      icon: Home,
      label: language === "en" ? "Home" : "الرئيسية",
      href: "/",
      active: location === "/"
    },
    {
      icon: TrendingUp,
      label: language === "en" ? "Properties" : "العقارات",
      href: "/properties",
      active: location.startsWith("/properties") || location.startsWith("/property/")
    },
    {
      icon: Info,
      label: language === "en" ? "About" : "من نحن",
      href: "/about",
      active: location === "/about"
    },
    {
      icon: HelpCircle,
      label: language === "en" ? "FAQ" : "الأسئلة",
      href: "/faq",
      active: location === "/faq"
    },
    {
      icon: Menu,
      label: language === "en" ? "Menu" : "القائمة",
      href: "#",
      active: false,
      isMenu: true
    }
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : guestNavItems;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setMenuOpen(false);
    window.location.href = "/";
  };

  // Menu items for logged-in users
  const authenticatedMenuItems = [
    { label: language === "en" ? "Dashboard" : "لوحة التحكم", href: "/dashboard" },
    { label: language === "en" ? "Profile" : "الملف الشخصي", href: "/profile" },
    { label: language === "en" ? "Settings" : "الإعدادات", href: "/settings" },
    { label: language === "en" ? "Transactions" : "المعاملات", href: "/transactions" },
    { label: language === "en" ? "Help & Support" : "المساعدة والدعم", href: "/help" },
    ...(user?.role === "admin" || user?.role === "super_admin" 
      ? [{ label: language === "en" ? "Admin Dashboard" : "لوحة الإدارة", href: "/admin/dashboard" }] 
      : []),
  ];

  // Menu items for non-logged-in users
  const guestMenuItems = [
    { label: language === "en" ? "How It Works" : "كيف يعمل", href: "/how-it-works" },
    { label: language === "en" ? "Contact" : "اتصل بنا", href: "/contact" },
    { label: language === "en" ? "Help & Support" : "المساعدة والدعم", href: "/help" },
  ];

  const menuItems = isAuthenticated ? authenticatedMenuItems : guestMenuItems;

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isMenu) {
      setMenuOpen(true);
    }
  };

  // Don't show during loading
  if (loading) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.isMenu) {
              return (
                <button
                  key="menu"
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-95",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-95 relative",
                    item.active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "mb-1 transition-all",
                    item.active ? "h-6 w-6" : "h-5 w-5"
                  )} />
                  <span className={cn(
                    "text-xs transition-all",
                    item.active ? "font-bold" : "font-medium"
                  )}>{item.label}</span>
                  {item.active && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent 
          side={language === "ar" ? "right" : "left"} 
          className="w-[280px] sm:w-[320px]"
        >
          <SheetHeader>
            <SheetTitle className={language === "ar" ? "text-right" : "text-left"}>
              {language === "en" ? "Menu" : "القائمة"}
            </SheetTitle>
          </SheetHeader>
          
          <nav className="mt-6 space-y-2">
            {menuItems.map((item, idx) => (
              <Link key={idx} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${language === "ar" ? "flex-row-reverse text-right" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Button>
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <div className="my-4 border-t" />
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 ${language === "ar" ? "flex-row-reverse text-right" : ""}`}
                  onClick={handleLogout}
                >
                  {language === "en" ? "Logout" : "تسجيل الخروج"}
                </Button>
              </>
            ) : (
              <>
                <div className="my-4 border-t" />
                <Link href={getLoginUrl()}>
                  <Button
                    className="w-full"
                    onClick={() => setMenuOpen(false)}
                  >
                    {language === "en" ? "Login / Sign Up" : "تسجيل الدخول / إنشاء حساب"}
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
