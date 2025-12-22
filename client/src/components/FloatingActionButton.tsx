import { useState } from "react";
import { Plus, X, UserPlus, Building, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

interface QuickAction {
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  roles?: string[]; // Optional: restrict to specific roles
}

interface FloatingActionButtonProps {
  actions: QuickAction[];
}

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();

  // Filter actions based on user role
  const filteredActions = actions.filter(action => {
    if (!action.roles) return true;
    return action.roles.includes(user?.role || "");
  });

  if (filteredActions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons - shown when expanded */}
      <div className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={language === "ar" ? "left" : "right"}>
                <p>{language === "en" ? action.label : action.labelAr}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Main FAB button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            className={`h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all ${isOpen ? "rotate-45" : "rotate-0"}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={language === "ar" ? "left" : "right"}>
          <p>{language === "en" ? "Quick Actions" : "إجراءات سريعة"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Preset action configurations for common use cases
export const adminQuickActions = (handlers: {
  onCreateUser?: () => void;
  onReviewProperties?: () => void;
  onNewLead?: () => void;
  onNewCase?: () => void;
}): QuickAction[] => [
  {
    label: "Create User",
    labelAr: "إنشاء مستخدم",
    icon: UserPlus,
    onClick: handlers.onCreateUser || (() => {}),
    roles: ["admin", "super_admin"],
  },
  {
    label: "Review Properties",
    labelAr: "مراجعة العقارات",
    icon: Building,
    onClick: handlers.onReviewProperties || (() => {}),
    roles: ["admin", "super_admin"],
  },
  {
    label: "New Lead",
    labelAr: "عميل محتمل جديد",
    icon: Users,
    onClick: handlers.onNewLead || (() => {}),
    roles: ["admin", "super_admin"],
  },
  {
    label: "New Case",
    labelAr: "حالة جديدة",
    icon: MessageSquare,
    onClick: handlers.onNewCase || (() => {}),
    roles: ["admin", "super_admin"],
  },
];
