import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface BreadcrumbItem {
  label: string;
  labelAr?: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  const { language } = useLanguage();
  
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", labelAr: "الرئيسية", href: "/" }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
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
