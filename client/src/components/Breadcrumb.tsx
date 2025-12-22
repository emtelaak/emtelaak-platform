import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  labelAr?: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]; // Now optional - will auto-generate if not provided
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({ items, showHome = true, className }: BreadcrumbProps) {
  const { language } = useLanguage();
  const [location] = useLocation();
  
  // Auto-generate breadcrumbs if not provided
  const breadcrumbItems = items || generateBreadcrumbs(location);
  
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", labelAr: "الرئيسية", href: "/" }, ...breadcrumbItems]
    : breadcrumbItems;

  if (allItems.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-2 text-sm text-muted-foreground mb-4", className)}>
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const label = language === "ar" && item.labelAr ? item.labelAr : item.label;

        return (
          <div key={index} className="flex items-center">
            {index === 0 && showHome && (
              <Home className="h-4 w-4 mr-2" />
            )}
            
            {item.href && !isLast ? (
              <Link href={item.href}>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  {label}
                </span>
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : ""}>
                {label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="h-4 w-4 mx-2" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Generate breadcrumbs automatically from URL path
 */
function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  // Remove leading/trailing slashes and split
  const segments = path.replace(/^\/|\/$/g, "").split("/").filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Get human-readable label
    const { label, labelAr } = getSegmentLabel(segment, segments, index);

    items.push({
      label,
      labelAr,
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

/**
 * Convert URL segment to human-readable label with Arabic translation
 */
function getSegmentLabel(segment: string, allSegments: string[], index: number): { label: string; labelAr?: string } {
  // Custom labels for known routes
  const labelMap: Record<string, { en: string; ar?: string }> = {
    // Admin routes
    admin: { en: "Admin", ar: "الإدارة" },
    "super-admin": { en: "Super Admin", ar: "المدير العام" },
    dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
    
    // User routes
    profile: { en: "Profile", ar: "الملف الشخصي" },
    wallet: { en: "Wallet", ar: "المحفظة" },
    portfolio: { en: "Portfolio", ar: "المحفظة الاستثمارية" },
    invoices: { en: "Invoices", ar: "الفواتير" },
    
    // Property routes
    properties: { en: "Properties", ar: "العقارات" },
    "add-property": { en: "Add Property", ar: "إضافة عقار" },
    "property-analytics": { en: "Property Analytics", ar: "تحليلات العقارات" },
    "property-management": { en: "Property Management", ar: "إدارة العقارات" },
    
    // Offering routes
    offerings: { en: "Offerings", ar: "العروض" },
    "create-offering": { en: "Create Offering", ar: "إنشاء عرض" },
    "offering-approvals": { en: "Offering Approvals", ar: "موافقات العروض" },
    
    // Investment routes
    investments: { en: "Investments", ar: "الاستثمارات" },
    "investment-flow": { en: "Investment Flow", ar: "تدفق الاستثمار" },
    
    // Content routes
    content: { en: "Content", ar: "المحتوى" },
    homepage: { en: "Homepage", ar: "الصفحة الرئيسية" },
    faq: { en: "FAQ", ar: "الأسئلة الشائعة" },
    about: { en: "About", ar: "عن المنصة" },
    contact: { en: "Contact", ar: "اتصل بنا" },
    terms: { en: "Terms", ar: "الشروط" },
    "how-it-works": { en: "How It Works", ar: "كيف يعمل" },
    
    // Settings routes
    settings: { en: "Settings", ar: "الإعدادات" },
    "platform-settings": { en: "Platform Settings", ar: "إعدادات المنصة" },
    "email-settings": { en: "Email Settings", ar: "إعدادات البريد" },
    "email-templates": { en: "Email Templates", ar: "قوالب البريد" },
    "email-template-editor": { en: "Email Template Editor", ar: "محرر قوالب البريد" },
    "legal-documents": { en: "Legal Documents", ar: "المستندات القانونية" },
    "custom-fields": { en: "Custom Fields", ar: "الحقول المخصصة" },
    "security-settings": { en: "Security Settings", ar: "إعدادات الأمان" },
    "ip-blocking": { en: "IP Blocking", ar: "حظر IP" },
    
    // User management
    users: { en: "Users", ar: "المستخدمون" },
    "user-management": { en: "User Management", ar: "إدارة المستخدمين" },
    permissions: { en: "Permissions", ar: "الصلاحيات" },
    roles: { en: "Roles", ar: "الأدوار" },
    
    // KYC routes
    kyc: { en: "KYC", ar: "التحقق من الهوية" },
    "kyc-questionnaire": { en: "KYC Questionnaire", ar: "استبيان التحقق" },
    "kyc-review": { en: "KYC Review", ar: "مراجعة التحقق" },
    
    // CRM routes
    crm: { en: "CRM", ar: "إدارة العملاء" },
    leads: { en: "Leads", ar: "العملاء المحتملون" },
    cases: { en: "Cases", ar: "الحالات" },
    
    // Help Desk
    "help-desk": { en: "Help Desk", ar: "مكتب المساعدة" },
    "knowledge-base": { en: "Knowledge Base", ar: "قاعدة المعرفة" },
    
    // Developer Portal routes
    developer: { en: "Developer Portal", ar: "بوابة المطور" },
    
    // Distribution routes
    "income-distribution": { en: "Income Distribution", ar: "توزيع الدخل" },
    
    // Media
    "image-library": { en: "Image Library", ar: "مكتبة الصور" },
    "media-library": { en: "Media Library", ar: "مكتبة الوسائط" },
    
    // Actions
    create: { en: "Create", ar: "إنشاء" },
    edit: { en: "Edit", ar: "تعديل" },
    view: { en: "View", ar: "عرض" },
    detail: { en: "Detail", ar: "التفاصيل" },
    documents: { en: "Documents", ar: "المستندات" },
    analytics: { en: "Analytics", ar: "التحليلات" },
    approvals: { en: "Approvals", ar: "الموافقات" },
  };

  // Check if it's a known route
  if (labelMap[segment]) {
    return { label: labelMap[segment].en, labelAr: labelMap[segment].ar };
  }

  // Check if it's an ID (numeric or UUID-like)
  if (/^\d+$/.test(segment)) {
    // It's a numeric ID
    const previousSegment = index > 0 ? allSegments[index - 1] : "";
    
    // Try to provide context based on previous segment
    if (previousSegment === "properties") return { label: `Property #${segment}`, labelAr: `عقار #${segment}` };
    if (previousSegment === "offerings") return { label: `Offering #${segment}`, labelAr: `عرض #${segment}` };
    if (previousSegment === "users") return { label: `User #${segment}`, labelAr: `مستخدم #${segment}` };
    if (previousSegment === "invoices") return { label: `Invoice #${segment}`, labelAr: `فاتورة #${segment}` };
    
    return { label: `ID: ${segment}` };
  }

  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(segment)) {
    // It's a UUID
    return { label: segment.substring(0, 8) + "..." };
  }

  // Convert kebab-case or snake_case to Title Case
  const label = segment
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return { label };
}

/**
 * Hook to get current breadcrumbs
 */
export function useBreadcrumbs(customItems?: BreadcrumbItem[]): BreadcrumbItem[] {
  const [location] = useLocation();
  return customItems || generateBreadcrumbs(location);
}
