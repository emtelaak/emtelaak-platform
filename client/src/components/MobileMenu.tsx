import { X, Menu } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useState, useEffect } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();

  const t = {
    en: {
      home: "Home",
      properties: "Properties",
      howItWorks: "How It Works",
      about: "About",
      login: "Login",
      getStarted: "Get Started",
      profile: "Profile",
    },
    ar: {
      home: "الرئيسية",
      properties: "العقارات",
      howItWorks: "كيف يعمل",
      about: "من نحن",
      login: "تسجيل الدخول",
      getStarted: "ابدأ الآن",
      profile: "الملف الشخصي",
    },
  };

  const nav = language === "en" ? t.en : t.ar;

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Slide-out Menu Drawer */}
      <div
        className={`fixed top-0 ${language === "ar" ? "left-0" : "right-0"} h-full w-80 bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen
            ? "translate-x-0"
            : language === "ar"
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-auto" />
            <button
              onClick={closeMenu}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              <Link href="/" onClick={closeMenu}>
                <div className="block px-4 py-3 rounded-lg hover:bg-muted transition-colors text-base font-medium">
                  {nav.home}
                </div>
              </Link>
              <Link href="/properties" onClick={closeMenu}>
                <div className="block px-4 py-3 rounded-lg hover:bg-muted transition-colors text-base font-medium">
                  {nav.properties}
                </div>
              </Link>
              <Link href="/how-it-works" onClick={closeMenu}>
                <div className="block px-4 py-3 rounded-lg hover:bg-muted transition-colors text-base font-medium">
                  {nav.howItWorks}
                </div>
              </Link>
              <Link href="/about" onClick={closeMenu}>
                <div className="block px-4 py-3 rounded-lg hover:bg-muted transition-colors text-base font-medium">
                  {nav.about}
                </div>
              </Link>
            </div>

            {/* Divider */}
            <div className="my-6 border-t"></div>

            {/* Language Switcher */}
            <div className="px-4 py-3">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                {language === "en" ? "Language" : "اللغة"}
              </div>
              <LanguageSwitcher />
            </div>

            {/* Divider */}
            <div className="my-6 border-t"></div>

            {/* Auth Buttons */}
            <div className="space-y-3">
              {isAuthenticated ? (
                <Link href="/profile" onClick={closeMenu}>
                  <Button variant="default" className="w-full">
                    {nav.profile}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenu}>
                    <Button variant="outline" className="w-full">
                      {nav.login}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={closeMenu}>
                    <Button
                      className="w-full"
                      style={{ backgroundColor: "#CDE428", color: "#032941" }}
                    >
                      {nav.getStarted}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 Emtelaak
              <br />
              {language === "en"
                ? "Fractional Real Estate"
                : "الاستثمار العقاري الجزئي"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
