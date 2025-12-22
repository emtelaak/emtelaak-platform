import { Link, useLocation } from "wouter";
import { Globe, Bell, User, LayoutDashboard, TrendingUp, Briefcase, Wallet as WalletIcon, LogOut, ChevronDown, Shield, Building2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import GuestMobileMenu from "./GuestMobileMenu";


export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const t = {
    en: {
      home: "Home",
      properties: "Properties",
      howItWorks: "How It Works",
      about: "About",
      faq: "FAQ",
      contact: "Contact",
      login: "Login",
      getStarted: "Get Started",
      profile: "Profile",
      dashboard: "Dashboard",
      invest: "Invest",
      portfolio: "Portfolio",
      wallet: "Wallet",
      admin: "Admin",
      logout: "Logout",
    },
    ar: {
      home: "الرئيسية",
      properties: "العقارات",
      howItWorks: "كيف يعمل",
      about: "من نحن",
      faq: "الأسئلة الشائعة",
      contact: "اتصل بنا",
      login: "تسجيل الدخول",
      getStarted: "ابدأ الآن",
      profile: "الملف الشخصي",
      dashboard: "لوحة التحكم",
      invest: "استثمر",
      portfolio: "المحفظة",
      wallet: "المحفظة المالية",
      admin: "لوحة الإدارة",
      logout: "تسجيل الخروج",
    },
  };

  const nav = language === "en" ? t.en : t.ar;

  const mainMenuItems = [
    { href: "/", label: nav.home },
    { href: "/properties", label: nav.properties },
    { href: "/how-it-works", label: nav.howItWorks },
    { href: "/about", label: nav.about },
    { href: "/faq", label: nav.faq },
    { href: "/contact", label: nav.contact },
  ];

  const userMenuItems = [
    { href: "/dashboard", label: nav.dashboard, icon: LayoutDashboard },
    { href: "/properties", label: nav.invest, icon: TrendingUp },
    { href: "/portfolio", label: nav.portfolio, icon: Briefcase },
    { href: "/wallet", label: nav.wallet, icon: WalletIcon },
  ];

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 sticky top-0 z-50 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src={APP_LOGO} alt="Emtelaak" className="h-8 w-auto" />
          </div>
        </Link>

        {/* Main Menu - Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {mainMenuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ar")}>
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications - Only for authenticated users */}
          {isAuthenticated && (
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {/* User Menu or Auth Buttons */}
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline">{user?.name || nav.profile}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* User Info */}
                <div className="px-2 py-3 border-b">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

                {/* Mega Menu Items */}
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem className="cursor-pointer gap-3 py-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}

                <DropdownMenuSeparator />

                {/* Profile Link */}
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer gap-3 py-3">
                    <User className="h-5 w-5" />
                    <span className="font-medium">{nav.profile}</span>
                  </DropdownMenuItem>
                </Link>

                {/* Developer Portal Link - Only for developer, admin and super_admin */}
                {(user?.role === 'developer' || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/developer">
                      <DropdownMenuItem className="cursor-pointer gap-3 py-3">
                        <Building2 className="h-5 w-5" />
                        <span className="font-medium">{language === 'en' ? 'Developer Portal' : 'بوابة المطور'}</span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}

                {/* Admin Link - Only for admin and super_admin */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer gap-3 py-3">
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">{nav.admin}</span>
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-3 py-3 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">{nav.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">{nav.login}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{nav.getStarted}</Link>
                </Button>
              </div>
              
              {/* Mobile Hamburger Menu for Guests */}
              <div className="md:hidden">
                <GuestMobileMenu />
              </div>
            </>
          )}


        </div>
      </div>
    </nav>
  );
}
