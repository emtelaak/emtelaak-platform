import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Shield, 
  Ban, 
  Settings,
  FileText,
  UserCheck,
  Lock,
  Building2,
  DollarSign,
  Briefcase,
  BarChart3,
  Wallet,
  Receipt,
  Mail,
  Scale,
  HelpCircle,
  Phone,
  ChevronDown,
  Edit3,
  Home,
  Info,
  TrendingUp,
  FileCheck,
  Layers
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

type MenuItem = {
  icon: any;
  label: string;
  labelAr: string;
  path: string;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", labelAr: "لوحة التحكم", path: "/admin/dashboard" },
  { icon: Users, label: "Users", labelAr: "المستخدمون", path: "/admin/users" },
  { icon: Shield, label: "Security", labelAr: "الأمان", path: "/admin/security" },
  { icon: Ban, label: "IP Blocking", labelAr: "حظر IP", path: "/admin/ip-blocking" },
  { icon: Settings, label: "Security Settings", labelAr: "إعدادات الأمان", path: "/admin/security-settings" },
  { icon: Lock, label: "Permissions", labelAr: "الصلاحيات", path: "/admin/permissions" },
  { icon: Briefcase, label: "Roles", labelAr: "الأدوار", path: "/admin/roles" },
  { icon: UserCheck, label: "KYC Review", labelAr: "مراجعة التحقق", path: "/admin/kyc-review" },
  { icon: Users, label: "Access Requests", labelAr: "طلبات الوصول", path: "/admin/access-requests" },
  { icon: Building2, label: "Property Management", labelAr: "إدارة العقارات", path: "/admin/property-management" },
  { icon: Building2, label: "Property Interests", labelAr: "اهتمامات العقارات", path: "/admin/property-interests" },
  { icon: Receipt, label: "Invoices", labelAr: "الفواتير", path: "/admin/invoices" },
  { icon: Wallet, label: "Wallet", labelAr: "المحفظة", path: "/admin/wallet" },
  { icon: DollarSign, label: "Platform Settings", labelAr: "إعدادات المنصة", path: "/admin/platform-settings" },
  { icon: TrendingUp, label: "Income Distribution", labelAr: "توزيع الدخل", path: "/admin/income-distribution" },
  { icon: BarChart3, label: "Analytics", labelAr: "التحليلات", path: "/admin/analytics" },
  { 
    icon: Layers, 
    label: "Offering Management", 
    labelAr: "إدارة العروض",
    path: "/offerings",
    children: [
      { icon: Layers, label: "My Offerings", labelAr: "عروضي", path: "/offerings" },
      { icon: FileCheck, label: "Create Offering", labelAr: "إنشاء عرض", path: "/offerings/create" },
      { icon: FileCheck, label: "Offering Approvals", labelAr: "موافقات العروض", path: "/admin/offering-approvals" },
    ]
  },
  { 
    icon: Edit3, 
    label: "Content Management", 
    labelAr: "إدارة المحتوى",
    path: "/admin/content",
    children: [
      { icon: Home, label: "Homepage Content", labelAr: "محتوى الرئيسية", path: "/admin/content/homepage" },
      { icon: Info, label: "About Page", labelAr: "صفحة عنا", path: "/admin/content/about" },
      { icon: HelpCircle, label: "FAQ Editor", labelAr: "محرر الأسئلة", path: "/admin/content/faq" },
      { icon: Phone, label: "Contact Editor", labelAr: "محرر الاتصال", path: "/admin/content/contact" },
      { icon: FileText, label: "Terms Editor", labelAr: "محرر الشروط", path: "/admin/content/terms" },
      { icon: Mail, label: "Email Templates", labelAr: "قوالب البريد", path: "/admin/email-templates" },
      { icon: Scale, label: "Legal Documents", labelAr: "المستندات القانونية", path: "/admin/legal-documents" },
      { icon: FileText, label: "Terms & Conditions", labelAr: "الشروط والأحكام", path: "/admin/terms" },
    ]
  },
  { icon: FileText, label: "Settings", labelAr: "الإعدادات", path: "/admin/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => 
    item.path === location || item.children?.some(child => child.path === location)
  );
  const isMobile = useIsMobile();
  
  // Helper function to get localized label
  const getLabel = (item: MenuItem) => language === 'ar' ? item.labelAr : item.label;

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                if (item.children) {
                  // Collapsible menu item with submenu
                  const hasActiveChild = item.children.some(child => location === child.path);
                  return (
                    <Collapsible key={item.path} defaultOpen={hasActiveChild} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={getLabel(item)}
                            className="h-10 transition-all font-normal"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{getLabel(item)}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map(child => {
                              const isActive = location === child.path;
                              return (
                                <SidebarMenuSubItem key={child.path}>
                                  <SidebarMenuSubButton
                                    isActive={isActive}
                                    onClick={() => setLocation(child.path)}
                                  >
                                    <child.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                                    <span>{getLabel(child)}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Regular menu item
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={getLabel(item)}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{getLabel(item)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarImage src={profile?.profilePicture || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem ? getLabel(activeMenuItem) : APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
