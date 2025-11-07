import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function Wallet() {
  const { user, loading, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Link href="/">
                  <Button variant="outline">{language === "en" ? "Back to Home" : "العودة للرئيسية"}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center">
            <WalletIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">
              {language === "en" ? "Your Wallet" : "محفظتك المالية"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === "en" 
                ? "Sign in to manage your wallet and view your transactions"
                : "سجل الدخول لإدارة محفظتك المالية وعرض معاملاتك"}
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg">{language === "en" ? "Sign In" : "تسجيل الدخول"}</Button>
            </a>
          </div>
        </div>

        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
              </Link>
              <h1 className="text-2xl font-bold">{language === "en" ? "Wallet" : "المحفظة المالية"}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="outline">{language === "en" ? "Back to Home" : "العودة للرئيسية"}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Balance Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "en" ? "Available Balance" : "الرصيد المتاح"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-6">EGP 0.00</div>
            <div className="flex gap-4">
              <Button className="flex-1">
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                {language === "en" ? "Deposit" : "إيداع"}
              </Button>
              <Button variant="outline" className="flex-1">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                {language === "en" ? "Withdraw" : "سحب"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Payment Methods" : "طرق الدفع"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "Manage your payment methods" : "إدارة طرق الدفع"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Transaction History" : "سجل المعاملات"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ArrowUpRight className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "View all your transactions" : "عرض جميع معاملاتك"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Pending Transactions" : "المعاملات المعلقة"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "No pending transactions" : "لا توجد معاملات معلقة"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <WalletIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">
            {language === "en" ? "No Transactions Yet" : "لا توجد معاملات بعد"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "en" 
              ? "Your transaction history will appear here"
              : "سيظهر سجل معاملاتك هنا"}
          </p>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
