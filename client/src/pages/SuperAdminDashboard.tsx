import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Settings,
  Users,
  FileText,
  BarChart3,
  Shield,
  Edit,
  Database,
  TrendingUp,
  Mail,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import UserManagement from "@/components/UserManagement";
import AdminPermissionsManager from "@/components/AdminPermissionsManager";
import RoleTemplateManager from "@/components/RoleTemplateManager";
import AuditLogViewer from "@/components/AuditLogViewer";
import { MobileNav } from "@/components/MobileNav";
import { FloatingActionButton, adminQuickActions } from "@/components/FloatingActionButton";
import { toast } from "sonner";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  
  // Debug logging
  console.log('[SuperAdminDashboard] Auth state:', { user, loading, role: user?.role });
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);

  // localStorage keys
  const VISIBLE_SECTIONS_KEY = 'superAdminDashboard_visibleSections';
  const COLLAPSED_SECTIONS_KEY = 'superAdminDashboard_collapsedSections';

  // Helper function to load state from localStorage
  const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  // Section visibility state with localStorage initialization
  const [visibleSections, setVisibleSections] = useState(() =>
    loadFromLocalStorage(VISIBLE_SECTIONS_KEY, {
      quickAccess: true,
      userManagement: true,
      permissions: true,
      roles: true,
      auditLogs: true,
      contentManagement: true,
    })
  );

  // Section collapse state with localStorage initialization
  const [collapsedSections, setCollapsedSections] = useState(() =>
    loadFromLocalStorage(COLLAPSED_SECTIONS_KEY, {
      quickAccess: false,
      userManagement: false,
      permissions: false,
      roles: false,
      auditLogs: false,
      contentManagement: false,
    })
  );

  // Save visibleSections to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(VISIBLE_SECTIONS_KEY, JSON.stringify(visibleSections));
    } catch (error) {
      console.error('Failed to save visible sections to localStorage:', error);
    }
  }, [visibleSections, VISIBLE_SECTIONS_KEY]);

  // Save collapsedSections to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(collapsedSections));
    } catch (error) {
      console.error('Failed to save collapsed sections to localStorage:', error);
    }
  }, [collapsedSections, COLLAPSED_SECTIONS_KEY]);

  const toggleCollapse = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const showAll = () => {
    setVisibleSections({
      quickAccess: true,
      userManagement: true,
      permissions: true,
      roles: true,
      auditLogs: true,
      contentManagement: true,
    });
  };

  const hideAll = () => {
    setVisibleSections({
      quickAccess: false,
      userManagement: false,
      permissions: false,
      roles: false,
      auditLogs: false,
      contentManagement: false,
    });
  };

  const resetLayout = () => {
    // Restore default states
    const defaultVisible = {
      quickAccess: true,
      userManagement: true,
      permissions: true,
      roles: true,
      auditLogs: true,
      contentManagement: true,
    };
    const defaultCollapsed = {
      quickAccess: false,
      userManagement: false,
      permissions: false,
      roles: false,
      auditLogs: false,
      contentManagement: false,
    };

    setVisibleSections(defaultVisible);
    setCollapsedSections(defaultCollapsed);

    // Clear localStorage
    try {
      localStorage.removeItem(VISIBLE_SECTIONS_KEY);
      localStorage.removeItem(COLLAPSED_SECTIONS_KEY);
      toast.success(
        language === "en" 
          ? "Layout reset to default" 
          : "تمت إعادة تعيين التخطيط إلى الافتراضي"
      );
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      toast.error(
        language === "en" 
          ? "Failed to reset layout" 
          : "فشل إعادة تعيين التخطيط"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === "en" ? "Loading..." : "جاري التحميل..."}
          </p>
        </div>
      </div>
    );
  }

  if (user?.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>
              {language === "en" ? "Access Denied" : "تم رفض الوصول"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "You need super admin privileges to access this page"
                : "تحتاج إلى صلاحيات المسؤول الأعلى للوصول إلى هذه الصفحة"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const adminSections = [
    {
      title: language === "en" ? "Admin Dashboard" : "لوحة الإدارة",
      description: language === "en" 
        ? "View platform statistics, user analytics, and system health" 
        : "عرض إحصائيات المنصة وتحليلات المستخدمين وصحة النظام",
      icon: BarChart3,
      link: "/admin/dashboard",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: language === "en" ? "CRM Dashboard" : "لوحة إدارة العملاء",
      description: language === "en"
        ? "Manage customer relationships, leads, and communications"
        : "إدارة علاقات العملاء والعملاء المحتملين والاتصالات",
      icon: Users,
      link: "/crm",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: language === "en" ? "KYC Review" : "مراجعة التحقق من الهوية",
      description: language === "en"
        ? "Review and approve KYC submissions and documents"
        : "مراجعة والموافقة على طلبات التحقق من الهوية والمستندات",
      icon: Shield,
      link: "/admin/kyc-review",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: language === "en" ? "Invoice Management" : "إدارة الفواتير",
      description: language === "en"
        ? "View, manage, and track all platform invoices and payments"
        : "عرض وإدارة وتتبع جميع فواتير ومدفوعات المنصة",
      icon: FileText,
      link: "/admin/invoices",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: language === "en" ? "Platform Content" : "محتوى المنصة",
      description: language === "en"
        ? "Edit homepage, about page, and other platform content"
        : "تحرير الصفحة الرئيسية وصفحة حول وغيرها من محتوى المنصة",
      icon: Edit,
      link: "#content",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      action: () => {
        document.getElementById("content-management")?.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      title: language === "en" ? "Platform Settings" : "إعدادات المنصة",
      description: language === "en"
        ? "Configure platform settings, features, and integrations"
        : "تكوين إعدادات المنصة والميزات والتكاملات",
      icon: Settings,
      link: "/admin/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: language === "en" ? "Email Notifications" : "إشعارات البريد الإلكتروني",
      description: language === "en"
        ? "Configure email notifications for security alerts"
        : "تكوين إشعارات البريد الإلكتروني لتنبيهات الأمان",
      icon: Mail,
      link: "/admin/email-settings",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: language === "en" ? "Database Management" : "إدارة قاعدة البيانات",
      description: language === "en"
        ? "View and manage database records directly"
        : "عرض وإدارة سجلات قاعدة البيانات مباشرة",
      icon: Database,
      link: "#",
      color: "text-red-600",
      bgColor: "bg-red-50",
      external: true,
      externalNote: language === "en" 
        ? "Access via Management UI → Database panel" 
        : "الوصول عبر واجهة الإدارة ← لوحة قاعدة البيانات",
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <MobileNav />
              <h1 className="text-4xl font-bold">
                {language === "en" ? "Super Admin Control Center" : "مركز التحكم للمسؤول الأعلى"}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {language === "en"
                ? "Manage all aspects of the Emtelaak platform from one central location"
                : "إدارة جميع جوانب منصة إمتلاك من موقع مركزي واحد"}
            </p>
          </div>

          {/* Section Control Bar */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {language === "en" ? "Section Visibility" : "رؤية الأقسام"}
                  </h3>
                  <div className="flex gap-2">
                    <Button onClick={showAll} variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      {language === "en" ? "Show All" : "إظهار الكل"}
                    </Button>
                    <Button onClick={hideAll} variant="outline" size="sm">
                      <EyeOff className="h-4 w-4 mr-2" />
                      {language === "en" ? "Hide All" : "إخفاء الكل"}
                    </Button>
                    <Button onClick={resetLayout} variant="outline" size="sm" className="border-orange-300 hover:bg-orange-50">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {language === "en" ? "Reset Layout" : "إعادة تعيين التخطيط"}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => toggleSection('quickAccess')}
                    variant={visibleSections.quickAccess ? "default" : "outline"}
                    size="sm"
                  >
                    {visibleSections.quickAccess ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {language === "en" ? "Quick Access" : "الوصول السريع"}
                  </Button>
                  <Button
                    onClick={() => toggleSection('userManagement')}
                    variant={visibleSections.userManagement ? "default" : "outline"}
                    size="sm"
                  >
                    {visibleSections.userManagement ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {language === "en" ? "User Management" : "إدارة المستخدمين"}
                  </Button>
                  <Button
                    onClick={() => toggleSection('permissions')}
                    variant={visibleSections.permissions ? "default" : "outline"}
                    size="sm"
                  >
                    {visibleSections.permissions ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {language === "en" ? "Permissions" : "الصلاحيات"}
                  </Button>
                  <Button
                    onClick={() => toggleSection('roles')}
                    variant={visibleSections.roles ? "default" : "outline"}
                    size="sm"
                  >
                    {visibleSections.roles ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {language === "en" ? "Roles" : "الأدوار"}
                  </Button>
                  <Button
                    onClick={() => toggleSection('auditLogs')}
                    variant={visibleSections.auditLogs ? "default" : "outline"}
                    size="sm"
                  >
                    {visibleSections.auditLogs ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {language === "en" ? "Audit Logs" : "سجلات التدقيق"}
                  </Button>
                  <Button
                    onClick={() => toggleSection('contentManagement')}
                    variant={visibleSections.contentManagement ? "default" : "outline"}
                    size="sm"
                  >
                    {visibleSections.contentManagement ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {language === "en" ? "Content Management" : "إدارة المحتوى"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access Cards */}
          {visibleSections.quickAccess && (
            <Card className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {language === "en" ? "Quick Access" : "الوصول السريع"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCollapse('quickAccess')}
                  >
                    {collapsedSections.quickAccess ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {!collapsedSections.quickAccess && (
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4`}>
                      <section.icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {section.external ? (
                      <div className="text-sm text-muted-foreground italic">
                        {section.externalNote}
                      </div>
                    ) : section.action ? (
                      <Button
                        onClick={section.action}
                        className="w-full"
                        variant="default"
                      >
                        {language === "en" ? "Open" : "فتح"}
                      </Button>
                    ) : (
                      <Link href={section.link}>
                        <Button className="w-full" variant="default">
                          {language === "en" ? "Open" : "فتح"}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
              </CardContent>
              )}
            </Card>
          )}

          {/* User Management Section */}
          {visibleSections.userManagement && (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {language === "en" ? "User Management" : "إدارة المستخدمين"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCollapse('userManagement')}
                    >
                      {collapsedSections.userManagement ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedSections.userManagement && (
                  <CardContent className="pt-0">
                    <UserManagement />
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* Admin Permissions Section */}
          {visibleSections.permissions && (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {language === "en" ? "Permissions Management" : "إدارة الصلاحيات"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCollapse('permissions')}
                    >
                      {collapsedSections.permissions ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedSections.permissions && (
                  <CardContent className="pt-0">
                    <AdminPermissionsManager />
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* Role Templates Section */}
          {visibleSections.roles && (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {language === "en" ? "Role Templates" : "قوالب الأدوار"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCollapse('roles')}
                    >
                      {collapsedSections.roles ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedSections.roles && (
                  <CardContent className="pt-0">
                    <RoleTemplateManager />
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* Audit Logs Section */}
          {visibleSections.auditLogs && (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {language === "en" ? "Audit Logs" : "سجلات التدقيق"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCollapse('auditLogs')}
                    >
                      {collapsedSections.auditLogs ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedSections.auditLogs && (
                  <CardContent className="pt-0">
                    <AuditLogViewer />
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* Platform Content Management Section */}
          {visibleSections.contentManagement && (
            <div id="content-management" className="scroll-mt-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Edit className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {language === "en" ? "Platform Content Management" : "إدارة محتوى المنصة"}
                      </CardTitle>
                      <CardDescription>
                        {language === "en"
                          ? "Edit and customize platform content, pages, and messaging"
                          : "تحرير وتخصيص محتوى المنصة والصفحات والرسائل"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCollapse('contentManagement')}
                  >
                    {collapsedSections.contentManagement ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </Button>
                  </div>
                </CardHeader>
                {!collapsedSections.contentManagement && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === "en" ? "Homepage Content" : "محتوى الصفحة الرئيسية"}
                        </CardTitle>
                        <CardDescription>
                          {language === "en"
                            ? "Edit hero section, features, and call-to-action"
                            : "تحرير قسم البطل والميزات والدعوة إلى اتخاذ إجراء"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href="/admin/content/homepage">
                          <Button variant="outline" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            {language === "en" ? "Edit Content" : "تحرير المحتوى"}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === "en" ? "About Page" : "صفحة حول"}
                        </CardTitle>
                        <CardDescription>
                          {language === "en"
                            ? "Update company information and mission statement"
                            : "تحديث معلومات الشركة وبيان المهمة"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href="/admin/content/about">
                          <Button variant="outline" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            {language === "en" ? "Edit Content" : "تحرير المحتوى"}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === "en" ? "Email Templates" : "قوالب البريد الإلكتروني"}
                        </CardTitle>
                        <CardDescription>
                          {language === "en"
                            ? "Customize automated email notifications"
                            : "تخصيص إشعارات البريد الإلكتروني التلقائية"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => setLocation("/admin/email-templates")}
                        >
                          {language === "en" ? "Manage Templates" : "إدارة القوالب"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === "en" ? "Legal Documents" : "المستندات القانونية"}
                        </CardTitle>
                        <CardDescription>
                          {language === "en"
                            ? "Update terms of service and privacy policy"
                            : "تحديث شروط الخدمة وسياسة الخصوصية"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => setLocation("/admin/legal-documents")}
                        >
                          {language === "en" ? "Manage Documents" : "إدارة المستندات"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? "💡 Tip: Content management features are being developed. For now, you can edit content directly in the codebase or use the database panel in the Management UI."
                        : "💡 نصيحة: يتم تطوير ميزات إدارة المحتوى. في الوقت الحالي، يمكنك تحرير المحتوى مباشرة في قاعدة التعليمات البرمجية أو استخدام لوحة قاعدة البيانات في واجهة الإدارة."}
                    </p>
                  </div>
                </CardContent>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Create User Dialog */}
        <CreateUserDialog
          open={showCreateUserDialog}
          onOpenChange={setShowCreateUserDialog}
          onSuccess={() => {
            // Optionally refresh user data if needed
            toast.success("User created successfully");
          }}
        />

        {/* Floating Action Button */}
        <FloatingActionButton
          actions={adminQuickActions({
            onCreateUser: () => {
              setShowCreateUserDialog(true);
            },
            onReviewProperties: () => {
              window.location.href = "/admin/property-management";
            },
            onNewLead: () => {
              window.location.href = "/crm/leads";
            },
            onNewCase: () => {
              window.location.href = "/crm/cases";
            },
          })}
        />
      </div>
    </DashboardLayout>
  );
}
