import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Home, Building2, HelpCircle, Info, LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/button";
import { APP_LOGO } from "@/const";

export default function GuestMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const t = {
    en: {
      home: "Home",
      properties: "Properties",
      howItWorks: "How It Works",
      about: "About",
      faq: "FAQ",
      contact: "Contact",
      login: "Login",
      signUp: "Sign Up",
    },
    ar: {
      home: "الرئيسية",
      properties: "العقارات",
      howItWorks: "كيف يعمل",
      about: "من نحن",
      faq: "الأسئلة الشائعة",
      contact: "اتصل بنا",
      login: "تسجيل الدخول",
      signUp: "سجل الآن",
    },
  };

  const navLinks = [
    { href: "/", icon: Home, label: t[language].home },
    { href: "/properties", icon: Building2, label: t[language].properties },
    { href: "/how-it-works", icon: HelpCircle, label: t[language].howItWorks },
    { href: "/about", icon: Info, label: t[language].about },
    { href: "/faq", icon: HelpCircle, label: t[language].faq },
    { href: "/contact", icon: Info, label: t[language].contact },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors border-2 border-[#032941] shadow-md"
        aria-label="Menu"
      >
        <Menu className="h-7 w-7 text-[#032941] stroke-[2.5]" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[60]"
          onClick={closeMenu}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 ${language === "ar" ? "left-0" : "right-0"} h-full w-80 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : language === "ar" ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: "#002B49" }}>
          <img src={APP_LOGO} alt="Emtelaak" className="h-10" />
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <a
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-[#032941]"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div className="px-6 py-4 border-t border-gray-200">
          <LanguageSwitcher />
        </div>

        {/* Auth Buttons */}
        <div className="p-6 space-y-3 border-t border-gray-200">
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={closeMenu}
            >
              <LogIn className="h-4 w-4" />
              {t[language].login}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              className="w-full justify-center gap-2"
              style={{ backgroundColor: "#CDE428", color: "#032941" }}
              onClick={closeMenu}
            >
              <UserPlus className="h-4 w-4" />
              {t[language].signUp}
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            © 2024 Emtelaak
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            {language === "en" ? "Fractional Real Estate" : "الاستثمار العقاري الجزئي"}
          </p>
        </div>
      </div>
    </>
  );
}
