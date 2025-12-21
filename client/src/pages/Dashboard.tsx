import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Briefcase, Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Building2 } from "lucide-react";
import { Link, Redirect } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: {
      title: "Investor Dashboard",
      welcome: "Welcome back",
      overview: "Portfolio Overview",
      totalInvestment: "Total Investment",
      portfolioValue: "Portfolio Value",
      totalReturn: "Total Return",
      activeProperties: "Active Properties",
      quickActions: "Quick Actions",
      invest: "Invest Now",
      viewPortfolio: "View Portfolio",
      addFunds: "Add Funds",
      recentActivity: "Recent Activity",
      noActivity: "No recent activity",
      viewAll: "View All",
      properties: "Properties",
      transactions: "Transactions",
      documents: "Documents",
    },
    ar: {
      title: "لوحة تحكم المستثمر",
      welcome: "مرحباً بعودتك",
      overview: "نظرة عامة على المحفظة",
      totalInvestment: "إجمالي الاستثمار",
      portfolioValue: "قيمة المحفظة",
      totalReturn: "إجمالي العائد",
      activeProperties: "العقارات النشطة",
      quickActions: "إجراءات سريعة",
      invest: "استثمر الآن",
      viewPortfolio: "عرض المحفظة",
      addFunds: "إضافة أموال",
      recentActivity: "النشاط الأخير",
      noActivity: "لا يوجد نشاط حديث",
      viewAll: "عرض الكل",
      properties: "العقارات",
      transactions: "المعاملات",
      documents: "المستندات",
    },
  };

  const content = language === "en" ? t.en : t.ar;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Mock data - replace with actual data from API
  const stats = [
    {
      title: content.totalInvestment,
      value: "EGP 250,000",
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: content.portfolioValue,
      value: "EGP 280,000",
      change: "+15.2%",
      isPositive: true,
      icon: TrendingUp,
    },
    {
      title: content.totalReturn,
      value: "EGP 30,000",
      change: "+12%",
      isPositive: true,
      icon: ArrowUpRight,
    },
    {
      title: content.activeProperties,
      value: "8",
      change: "+2",
      isPositive: true,
      icon: Building2,
    },
  ];

  const quickActions = [
    {
      title: content.invest,
      description: "Browse available properties",
      icon: TrendingUp,
      href: "/properties",
      color: "bg-lime-500",
    },
    {
      title: content.viewPortfolio,
      description: "View your investments",
      icon: Briefcase,
      href: "/portfolio",
      color: "bg-blue-500",
    },
    {
      title: content.addFunds,
      description: "Add money to wallet",
      icon: Wallet,
      href: "/wallet",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />

      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {content.welcome}, {user?.name}!
          </h1>
          <p className="text-muted-foreground">{content.title}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="flex items-center gap-1">
                    {stat.isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      vs last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{content.quickActions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full h-auto flex-col items-start gap-3 p-6 hover:bg-accent"
                    >
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold mb-1">{action.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{content.recentActivity}</CardTitle>
            <Button variant="ghost" size="sm">
              {content.viewAll}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              {content.noActivity}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
