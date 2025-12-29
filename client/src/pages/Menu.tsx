import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  User, Settings, HelpCircle, FileText, Shield, 
  LogOut, ChevronRight, Bell, Globe
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import MobileBottomNav from "@/components/MobileBottomNav";
import Navigation from "@/components/Navigation";

export default function Menu() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
              </Link>
              <h1 className="text-2xl font-bold">{language === "en" ? "Menu" : "القائمة"}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="outline">{language === "en" ? "Home" : "الرئيسية"}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 max-w-2xl">
        {/* User Profile Section */}
        {isAuthenticated && user ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{user.name || "User"}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">
                {language === "en" ? "Welcome to Emtelaak" : "مرحباً بك في إمتلاك"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {language === "en" 
                  ? "Sign in to access all features"
                  : "سجل الدخول للوصول إلى جميع الميزات"}
              </p>
              <a href={"/login"}>
                <Button size="lg">{language === "en" ? "Sign In" : "تسجيل الدخول"}</Button>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Menu Items */}
        <div className="space-y-2">
          {isAuthenticated && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
                {language === "en" ? "ACCOUNT" : "الحساب"}
              </h3>
              <Card>
                <CardContent className="p-0">
                  <Link href="/profile">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 text-left">{language === "en" ? "Profile" : "الملف الشخصي"}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </Link>
                  <Link href="/settings">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 text-left">{language === "en" ? "Settings" : "الإعدادات"}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </Link>
                  <Link href="/notifications">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 text-left">{language === "en" ? "Notifications" : "الإشعارات"}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Information Section */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
              {language === "en" ? "INFORMATION" : "المعلومات"}
            </h3>
            <Card>
              <CardContent className="p-0">
                <Link href="/how-it-works">
                  <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-left">{language === "en" ? "How It Works" : "كيف يعمل"}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Link>
                <Link href="/about">
                  <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-left">{language === "en" ? "About Us" : "من نحن"}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Link>
                <Link href="/terms">
                  <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-left">{language === "en" ? "Terms & Privacy" : "الشروط والخصوصية"}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Language Section */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-2">
              {language === "en" ? "PREFERENCES" : "التفضيلات"}
            </h3>
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1">{language === "en" ? "Language" : "اللغة"}</span>
                  <LanguageSwitcher />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logout */}
          {isAuthenticated && (
            <Card>
              <CardContent className="p-0">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-4 p-4 hover:bg-destructive/10 transition-colors text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="flex-1 text-left">{language === "en" ? "Sign Out" : "تسجيل الخروج"}</span>
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
