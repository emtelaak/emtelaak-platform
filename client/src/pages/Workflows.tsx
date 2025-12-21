import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  Building2, 
  Shield, 
  Wallet, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  UserCheck,
  Home,
  Settings,
  BarChart3,
  FileCheck,
  DollarSign,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Workflows() {
  const { t, language } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<"admin" | "investor" | "fundraiser">("investor");

  const roles = [
    {
      id: "investor" as const,
      name: language === "ar" ? "المستثمر" : "Investor",
      description: language === "ar" 
        ? "تصفح العقارات والاستثمار وإدارة المحفظة"
        : "Browse properties, invest, and manage portfolio",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "fundraiser" as const,
      name: language === "ar" ? "جامع التمويل" : "Fundraiser",
      description: language === "ar"
        ? "إدراج العقارات وإنشاء العروض وإدارة المستثمرين"
        : "List properties, create offerings, and manage investors",
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "admin" as const,
      name: language === "ar" ? "المسؤول" : "Admin",
      description: language === "ar"
        ? "إدارة المنصة والموافقات والإشراف"
        : "Platform management, approvals, and oversight",
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const investorWorkflow = [
    {
      step: 1,
      title: language === "ar" ? "التسجيل والتحقق من البريد الإلكتروني" : "Registration & Email Verification",
      description: language === "ar"
        ? "إنشاء حساب والتحقق من عنوان البريد الإلكتروني"
        : "Create account and verify email address",
      icon: UserCheck,
      path: "/register",
      duration: "5 min",
      status: "required",
    },
    {
      step: 2,
      title: language === "ar" ? "إكمال التحقق من الهوية (KYC)" : "Complete KYC Verification",
      description: language === "ar"
        ? "تحميل المستندات وملء الاستبيان المالي"
        : "Upload documents and complete financial questionnaire",
      icon: FileCheck,
      path: "/kyc-questionnaire",
      duration: "15-20 min",
      status: "required",
    },
    {
      step: 3,
      title: language === "ar" ? "تصفح العقارات" : "Browse Properties",
      description: language === "ar"
        ? "استكشاف فرص الاستثمار المتاحة والتصفية حسب النوع"
        : "Explore available investment opportunities and filter by type",
      icon: Home,
      path: "/properties",
      duration: "Variable",
      status: "explore",
    },
    {
      step: 4,
      title: language === "ar" ? "تحليل العقار" : "Analyze Property",
      description: language === "ar"
        ? "مراجعة التفاصيل المالية والمستندات وحاسبة العائد على الاستثمار"
        : "Review financials, documents, and ROI calculator",
      icon: BarChart3,
      path: "/properties/:id",
      duration: "10-30 min",
      status: "research",
    },
    {
      step: 5,
      title: language === "ar" ? "إضافة أموال إلى المحفظة (اختياري)" : "Add Funds to Wallet (Optional)",
      description: language === "ar"
        ? "إيداع الأموال للاستثمار السريع"
        : "Deposit funds for quick investments",
      icon: Wallet,
      path: "/wallet",
      duration: "5 min",
      status: "optional",
    },
    {
      step: 6,
      title: language === "ar" ? "إجراء الاستثمار" : "Make Investment",
      description: language === "ar"
        ? "اختيار عدد الحصص والدفع عبر المحفظة أو البطاقة"
        : "Select shares and pay via wallet or card",
      icon: DollarSign,
      path: "/properties/:id",
      duration: "5 min",
      status: "action",
    },
    {
      step: 7,
      title: language === "ar" ? "إدارة المحفظة" : "Manage Portfolio",
      description: language === "ar"
        ? "تتبع الاستثمارات والعائدات وتوزيعات الدخل"
        : "Track investments, returns, and income distributions",
      icon: TrendingUp,
      path: "/portfolio",
      duration: "Ongoing",
      status: "ongoing",
    },
  ];

  const fundraiserWorkflow = [
    {
      step: 1,
      title: language === "ar" ? "التسجيل والتحقق" : "Registration & Verification",
      description: language === "ar"
        ? "إنشاء حساب والتقدم بطلب للحصول على حالة جامع التمويل"
        : "Create account and apply for fundraiser status",
      icon: UserCheck,
      path: "/register",
      duration: "1-2 days",
      status: "required",
    },
    {
      step: 2,
      title: language === "ar" ? "إنشاء قائمة العقار" : "Create Property Listing",
      description: language === "ar"
        ? "إضافة تفاصيل العقار والصور والمستندات"
        : "Add property details, images, and documents",
      icon: Building2,
      path: "/admin/add-property",
      duration: "30-60 min",
      status: "action",
    },
    {
      step: 3,
      title: language === "ar" ? "إنشاء العرض" : "Create Offering",
      description: language === "ar"
        ? "إعداد الهيكل المالي والرسوم والمستندات"
        : "Set up financial structure, fees, and documents",
      icon: FileText,
      path: "/offerings/create",
      duration: "2-4 hours",
      status: "action",
    },
    {
      step: 4,
      title: language === "ar" ? "تقديم للموافقة" : "Submit for Approval",
      description: language === "ar"
        ? "عملية موافقة متعددة المراحل (5 مراحل)"
        : "Multi-stage approval process (5 stages)",
      icon: CheckCircle2,
      path: "/offerings/:id",
      duration: "5-10 days",
      status: "waiting",
    },
    {
      step: 5,
      title: language === "ar" ? "إطلاق العقار" : "Launch Property",
      description: language === "ar"
        ? "تفعيل العقار للاستثمار العام"
        : "Activate property for public investment",
      icon: Home,
      path: "/fundraiser/property-management",
      duration: "Immediate",
      status: "action",
    },
    {
      step: 6,
      title: language === "ar" ? "إدارة المستثمرين" : "Manage Investors",
      description: language === "ar"
        ? "تتبع الاستثمارات والتواصل مع المستثمرين"
        : "Track investments and communicate with investors",
      icon: Users,
      path: "/fundraiser/dashboard",
      duration: "Ongoing",
      status: "ongoing",
    },
    {
      step: 7,
      title: language === "ar" ? "معالجة التوزيعات" : "Process Distributions",
      description: language === "ar"
        ? "توزيع دخل الإيجار أو أرباح رأس المال"
        : "Distribute rental income or capital gains",
      icon: DollarSign,
      path: "/admin/income-distribution",
      duration: "Monthly/Quarterly",
      status: "recurring",
    },
  ];

  const adminWorkflow = [
    {
      step: 1,
      title: language === "ar" ? "لوحة التحكم الإدارية" : "Admin Dashboard",
      description: language === "ar"
        ? "مراقبة صحة النظام والمقاييس الرئيسية"
        : "Monitor system health and key metrics",
      icon: BarChart3,
      path: "/admin/dashboard",
      duration: "Daily",
      status: "ongoing",
    },
    {
      step: 2,
      title: language === "ar" ? "مراجعة التحقق من الهوية" : "Review KYC Submissions",
      description: language === "ar"
        ? "الموافقة على أو رفض طلبات التحقق من المستثمرين"
        : "Approve or reject investor verification requests",
      icon: FileCheck,
      path: "/admin/kyc-review",
      duration: "As needed",
      status: "action",
    },
    {
      step: 3,
      title: language === "ar" ? "إدارة المستخدمين" : "User Management",
      description: language === "ar"
        ? "إدارة حسابات المستخدمين والأدوار والأذونات"
        : "Manage user accounts, roles, and permissions",
      icon: Users,
      path: "/admin/users",
      duration: "As needed",
      status: "action",
    },
    {
      step: 4,
      title: language === "ar" ? "الموافقة على العروض" : "Approve Offerings",
      description: language === "ar"
        ? "مراجعة والموافقة على عروض جامعي التمويل"
        : "Review and approve fundraiser offerings",
      icon: CheckCircle2,
      path: "/admin/offering-approvals",
      duration: "5-10 days",
      status: "action",
    },
    {
      step: 5,
      title: language === "ar" ? "إدارة المحفظة" : "Wallet Management",
      description: language === "ar"
        ? "الموافقة على الإيداعات والسحوبات"
        : "Approve deposits and withdrawals",
      icon: Wallet,
      path: "/admin/wallet",
      duration: "As needed",
      status: "action",
    },
    {
      step: 6,
      title: language === "ar" ? "إدارة الفواتير" : "Invoice Management",
      description: language === "ar"
        ? "مراقبة ومعالجة فواتير الاستثمار"
        : "Monitor and process investment invoices",
      icon: FileText,
      path: "/admin/invoices",
      duration: "As needed",
      status: "action",
    },
    {
      step: 7,
      title: language === "ar" ? "إعدادات المنصة" : "Platform Settings",
      description: language === "ar"
        ? "تكوين الرسوم والمحتوى والإعدادات"
        : "Configure fees, content, and settings",
      icon: Settings,
      path: "/admin/platform-settings",
      duration: "As needed",
      status: "config",
    },
    {
      step: 8,
      title: language === "ar" ? "الأمان والمراقبة" : "Security & Monitoring",
      description: language === "ar"
        ? "مراقبة الأحداث الأمنية وصحة النظام"
        : "Monitor security events and system health",
      icon: Shield,
      path: "/admin/security",
      duration: "Ongoing",
      status: "ongoing",
    },
  ];

  const workflows = {
    investor: investorWorkflow,
    fundraiser: fundraiserWorkflow,
    admin: adminWorkflow,
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      required: { 
        label: language === "ar" ? "مطلوب" : "Required", 
        variant: "destructive" as const 
      },
      optional: { 
        label: language === "ar" ? "اختياري" : "Optional", 
        variant: "secondary" as const 
      },
      explore: { 
        label: language === "ar" ? "استكشاف" : "Explore", 
        variant: "default" as const 
      },
      research: { 
        label: language === "ar" ? "بحث" : "Research", 
        variant: "default" as const 
      },
      action: { 
        label: language === "ar" ? "إجراء" : "Action", 
        variant: "default" as const 
      },
      waiting: { 
        label: language === "ar" ? "انتظار" : "Waiting", 
        variant: "secondary" as const 
      },
      ongoing: { 
        label: language === "ar" ? "مستمر" : "Ongoing", 
        variant: "outline" as const 
      },
      recurring: { 
        label: language === "ar" ? "متكرر" : "Recurring", 
        variant: "outline" as const 
      },
      config: { 
        label: language === "ar" ? "تكوين" : "Config", 
        variant: "secondary" as const 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.action;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const currentWorkflow = workflows[selectedRole];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002B5B] to-[#1a4d7d] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">
            {language === "ar" ? "سير عمل المنصة" : "Platform Workflows"}
          </h1>
          <p className="text-lg text-gray-200">
            {language === "ar"
              ? "أدلة شاملة خطوة بخطوة لجميع أدوار المستخدمين"
              : "Comprehensive step-by-step guides for all user roles"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? "ring-2 ring-primary shadow-lg" : ""
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${role.bgColor}`}>
                      <Icon className={`h-6 w-6 ${role.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{role.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {role.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {language === "ar"
                ? `سير عمل ${roles.find((r) => r.id === selectedRole)?.name}`
                : `${roles.find((r) => r.id === selectedRole)?.name} Workflow`}
            </CardTitle>
            <CardDescription>
              {language === "ar"
                ? "اتبع هذه الخطوات لإكمال رحلة المستخدم"
                : "Follow these steps to complete the user journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {currentWorkflow.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === currentWorkflow.length - 1;
                return (
                  <div key={step.step} className="relative">
                    {/* Connector Line */}
                    {!isLast && (
                      <div
                        className={`absolute ${
                          language === "ar" ? "right-[23px]" : "left-[23px]"
                        } top-12 w-0.5 h-full bg-gray-200`}
                      />
                    )}

                    {/* Step Card */}
                    <div className="flex gap-4">
                      {/* Step Number Circle */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg z-10">
                        {step.step}
                      </div>

                      {/* Step Content */}
                      <Card className="flex-1 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                              <CardTitle className="text-lg">
                                {step.title}
                              </CardTitle>
                            </div>
                            {getStatusBadge(step.status)}
                          </div>
                          <CardDescription className="mt-2">
                            {step.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{step.duration}</span>
                            </div>
                            {step.path && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() => {
                                  if (!step.path.includes(":id")) {
                                    window.location.href = step.path;
                                  }
                                }}
                                disabled={step.path.includes(":id")}
                              >
                                {language === "ar" ? "الانتقال" : "Go to Step"}
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Features by Role */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "ar" ? "الميزات الرئيسية" : "Key Features"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "الوظائف الأساسية المتاحة لهذا الدور"
                  : "Essential functionality available to this role"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRole === "investor" && (
                  <>
                    <FeatureCard
                      icon={Home}
                      title={language === "ar" ? "تصفح العقارات" : "Browse Properties"}
                      description={
                        language === "ar"
                          ? "استكشاف فرص الاستثمار المتاحة"
                          : "Explore available investment opportunities"
                      }
                    />
                    <FeatureCard
                      icon={FileCheck}
                      title={language === "ar" ? "التحقق من الهوية" : "KYC Verification"}
                      description={
                        language === "ar"
                          ? "إكمال التحقق من الهوية للاستثمار"
                          : "Complete identity verification for investing"
                      }
                    />
                    <FeatureCard
                      icon={DollarSign}
                      title={language === "ar" ? "الاستثمار" : "Invest"}
                      description={
                        language === "ar"
                          ? "شراء حصص في العقارات"
                          : "Purchase shares in properties"
                      }
                    />
                    <FeatureCard
                      icon={TrendingUp}
                      title={language === "ar" ? "إدارة المحفظة" : "Portfolio Management"}
                      description={
                        language === "ar"
                          ? "تتبع الاستثمارات والعائدات"
                          : "Track investments and returns"
                      }
                    />
                    <FeatureCard
                      icon={Wallet}
                      title={language === "ar" ? "إدارة المحفظة" : "Wallet Management"}
                      description={
                        language === "ar"
                          ? "إيداع وسحب الأموال"
                          : "Deposit and withdraw funds"
                      }
                    />
                    <FeatureCard
                      icon={BarChart3}
                      title={language === "ar" ? "حاسبة العائد" : "ROI Calculator"}
                      description={
                        language === "ar"
                          ? "حساب العائدات المتوقعة"
                          : "Calculate expected returns"
                      }
                    />
                  </>
                )}

                {selectedRole === "fundraiser" && (
                  <>
                    <FeatureCard
                      icon={Building2}
                      title={language === "ar" ? "إدراج العقارات" : "Property Listing"}
                      description={
                        language === "ar"
                          ? "إنشاء قوائم عقارية مفصلة"
                          : "Create detailed property listings"
                      }
                    />
                    <FeatureCard
                      icon={FileText}
                      title={language === "ar" ? "إنشاء العروض" : "Offering Creation"}
                      description={
                        language === "ar"
                          ? "إعداد عروض الاستثمار"
                          : "Set up investment offerings"
                      }
                    />
                    <FeatureCard
                      icon={Users}
                      title={language === "ar" ? "إدارة المستثمرين" : "Investor Management"}
                      description={
                        language === "ar"
                          ? "تتبع والتواصل مع المستثمرين"
                          : "Track and communicate with investors"
                      }
                    />
                    <FeatureCard
                      icon={DollarSign}
                      title={language === "ar" ? "معالجة التوزيعات" : "Distribution Processing"}
                      description={
                        language === "ar"
                          ? "توزيع الدخل على المستثمرين"
                          : "Distribute income to investors"
                      }
                    />
                    <FeatureCard
                      icon={BarChart3}
                      title={language === "ar" ? "تحليلات العقار" : "Property Analytics"}
                      description={
                        language === "ar"
                          ? "عرض أداء العقار"
                          : "View property performance"
                      }
                    />
                    <FeatureCard
                      icon={CheckCircle2}
                      title={language === "ar" ? "تتبع الموافقات" : "Approval Tracking"}
                      description={
                        language === "ar"
                          ? "مراقبة حالة الموافقة"
                          : "Monitor approval status"
                      }
                    />
                  </>
                )}

                {selectedRole === "admin" && (
                  <>
                    <FeatureCard
                      icon={Users}
                      title={language === "ar" ? "إدارة المستخدمين" : "User Management"}
                      description={
                        language === "ar"
                          ? "إدارة حسابات المستخدمين والأدوار"
                          : "Manage user accounts and roles"
                      }
                    />
                    <FeatureCard
                      icon={FileCheck}
                      title={language === "ar" ? "مراجعة التحقق من الهوية" : "KYC Review"}
                      description={
                        language === "ar"
                          ? "الموافقة على طلبات التحقق"
                          : "Approve verification requests"
                      }
                    />
                    <FeatureCard
                      icon={CheckCircle2}
                      title={language === "ar" ? "الموافقة على العروض" : "Offering Approval"}
                      description={
                        language === "ar"
                          ? "مراجعة والموافقة على العروض"
                          : "Review and approve offerings"
                      }
                    />
                    <FeatureCard
                      icon={Wallet}
                      title={language === "ar" ? "إدارة المعاملات" : "Transaction Management"}
                      description={
                        language === "ar"
                          ? "الموافقة على الإيداعات والسحوبات"
                          : "Approve deposits and withdrawals"
                      }
                    />
                    <FeatureCard
                      icon={Settings}
                      title={language === "ar" ? "إعدادات المنصة" : "Platform Settings"}
                      description={
                        language === "ar"
                          ? "تكوين الرسوم والمحتوى"
                          : "Configure fees and content"
                      }
                    />
                    <FeatureCard
                      icon={Shield}
                      title={language === "ar" ? "الأمان والمراقبة" : "Security & Monitoring"}
                      description={
                        language === "ar"
                          ? "مراقبة صحة النظام"
                          : "Monitor system health"
                      }
                    />
                    <FeatureCard
                      icon={FileText}
                      title={language === "ar" ? "إدارة الفواتير" : "Invoice Management"}
                      description={
                        language === "ar"
                          ? "معالجة فواتير الاستثمار"
                          : "Process investment invoices"
                      }
                    />
                    <FeatureCard
                      icon={BarChart3}
                      title={language === "ar" ? "التحليلات" : "Analytics"}
                      description={
                        language === "ar"
                          ? "عرض مقاييس المنصة"
                          : "View platform metrics"
                      }
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <CardTitle>
                {language === "ar" ? "هل تحتاج إلى مساعدة؟" : "Need Help?"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              {language === "ar"
                ? "إذا كان لديك أسئلة حول أي خطوة في سير العمل، فإن فريق الدعم لدينا هنا للمساعدة."
                : "If you have questions about any step in the workflow, our support team is here to help."}
            </p>
            <div className="flex gap-4">
              <Button onClick={() => (window.location.href = "/contact")}>
                {language === "ar" ? "اتصل بالدعم" : "Contact Support"}
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/faq")}
              >
                {language === "ar" ? "عرض الأسئلة الشائعة" : "View FAQ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
