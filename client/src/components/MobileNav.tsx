import { useState } from "react";
import { Menu, X, Home, Users, FileText, Briefcase, Settings, Shield, MessageSquare, Image, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

interface NavItem {
  label: string;
  labelAr: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  titleAr: string;
  items: NavItem[];
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;

  const navSections: NavSection[] = [
    {
      title: "Dashboard",
      titleAr: "لوحة التحكم",
      items: [
        { label: "Home", labelAr: "الرئيسية", href: "/", icon: Home },
        ...(isSuperAdmin ? [{ label: "Super Admin", labelAr: "المسؤول العام", href: "/super-admin", icon: Shield }] : []),
        ...(isAdmin ? [{ label: "Admin Dashboard", labelAr: "لوحة الإدارة", href: "/admin/dashboard", icon: Settings }] : []),
      ],
    },
    ...(isAdmin ? [
      {
        title: "User Management",
        titleAr: "إدارة المستخدمين",
        items: [
          { label: "Users", labelAr: "المستخدمون", href: "/admin/dashboard", icon: Users },
          { label: "Permissions", labelAr: "الصلاحيات", href: "/admin/permissions", icon: Shield },
          { label: "Roles", labelAr: "الأدوار", href: "/admin/role-management", icon: Shield },
        ],
      },
      {
        title: "Content",
        titleAr: "المحتوى",
        items: [
          ...(isSuperAdmin ? [
            { label: "Homepage Editor", labelAr: "محرر الصفحة الرئيسية", href: "/homepage-editor", icon: FileText },
            { label: "About Page Editor", labelAr: "محرر صفحة عنا", href: "/about-editor", icon: FileText },
            { label: "Image Library", labelAr: "مكتبة الصور", href: "/image-library", icon: Image },
          ] : []),
        ],
      },
      {
        title: "CRM",
        titleAr: "إدارة علاقات العملاء",
        items: [
          { label: "CRM Dashboard", labelAr: "لوحة CRM", href: "/crm", icon: Briefcase },
          { label: "Leads", labelAr: "العملاء المحتملون", href: "/crm/leads", icon: Users },
          { label: "Cases", labelAr: "الحالات", href: "/crm/cases", icon: MessageSquare },
        ],
      },
      {
        title: "Settings",
        titleAr: "الإعدادات",
        items: [
          { label: "Admin Settings", labelAr: "إعدادات الإدارة", href: "/admin/settings", icon: Settings },
          ...(isSuperAdmin ? [
            { label: "Email Settings", labelAr: "إعدادات البريد الإلكتروني", href: "/admin/email-settings", icon: Mail },
          ] : []),
        ],
      },
    ] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side={language === "ar" ? "right" : "left"} className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className={language === "ar" ? "text-right" : "text-left"}>
            {language === "en" ? "Navigation" : "القائمة"}
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className={`text-sm font-semibold text-muted-foreground px-2 ${language === "ar" ? "text-right" : "text-left"}`}>
                {language === "en" ? section.title : section.titleAr}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <Link key={itemIdx} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${language === "ar" ? "flex-row-reverse" : ""}`}
                        onClick={() => setOpen(false)}
                      >
                        <Icon className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                        {language === "en" ? item.label : item.labelAr}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
