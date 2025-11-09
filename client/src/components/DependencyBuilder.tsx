import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Code } from "lucide-react";

interface DependencyRule {
  fieldKey: string;
  operator: "equals" | "notEquals" | "contains" | "notEmpty" | "empty" | "in";
  value?: string | string[];
}

interface DependencyBuilderProps {
  module: string;
  availableFields: Array<{ fieldKey: string; labelEn: string; labelAr?: string; fieldType: string }>;
  value?: string; // JSON string
  onChange: (json: string) => void;
}

/**
 * Visual Dependency Builder Component
 * Provides a user-friendly interface to create field dependency rules
 */
export function DependencyBuilder({
  module,
  availableFields,
  value,
  onChange,
}: DependencyBuilderProps) {
  const { language } = useLanguage();
  const [rule, setRule] = useState<DependencyRule | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.showIf) {
          setRule(parsed.showIf);
        }
      } catch (e) {
        console.error("Failed to parse dependency value:", e);
      }
    }
  }, [value]);

  // Generate JSON and notify parent
  const updateDependency = (newRule: DependencyRule | null) => {
    setRule(newRule);
    if (newRule) {
      const json = JSON.stringify({ showIf: newRule });
      onChange(json);
    } else {
      onChange("");
    }
  };

  const operators = [
    { value: "equals", labelEn: "Equals", labelAr: "يساوي" },
    { value: "notEquals", labelEn: "Not Equals", labelAr: "لا يساوي" },
    { value: "contains", labelEn: "Contains", labelAr: "يحتوي على" },
    { value: "notEmpty", labelEn: "Is Not Empty", labelAr: "ليس فارغًا" },
    { value: "empty", labelEn: "Is Empty", labelAr: "فارغ" },
    { value: "in", labelEn: "Is One Of", labelAr: "واحد من" },
  ];

  const needsValue = rule?.operator && !["notEmpty", "empty"].includes(rule.operator);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {language === "en" ? "Conditional Visibility" : "الرؤية الشرطية"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Show this field only when another field meets a condition"
                : "إظهار هذا الحقل فقط عندما يستوفي حقل آخر شرطًا"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowJson(!showJson)}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!rule ? (
          <Button
            variant="outline"
            onClick={() =>
              updateDependency({
                fieldKey: "",
                operator: "equals",
                value: "",
              })
            }
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === "en" ? "Add Dependency Rule" : "إضافة قاعدة التبعية"}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Field Selector */}
            <div className="grid gap-2">
              <Label>
                {language === "en" ? "Show this field when:" : "إظهار هذا الحقل عندما:"}
              </Label>
              <Select
                value={rule.fieldKey}
                onValueChange={(value) =>
                  updateDependency({ ...rule, fieldKey: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select field..." : "اختر الحقل..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((field) => (
                    <SelectItem key={field.fieldKey} value={field.fieldKey}>
                      {language === "en" ? field.labelEn : (field.labelAr || field.labelEn)}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({field.fieldType})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operator Selector */}
            <div className="grid gap-2">
              <Label>{language === "en" ? "Condition:" : "الشرط:"}</Label>
              <Select
                value={rule.operator}
                onValueChange={(value: any) =>
                  updateDependency({ ...rule, operator: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {language === "en" ? op.labelEn : op.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input */}
            {needsValue && (
              <div className="grid gap-2">
                <Label>{language === "en" ? "Value:" : "القيمة:"}</Label>
                {rule.operator === "in" ? (
                  <div className="space-y-2">
                    <Input
                      placeholder={language === "en" ? "Enter values separated by commas" : "أدخل القيم مفصولة بفواصل"}
                      value={Array.isArray(rule.value) ? rule.value.join(", ") : ""}
                      onChange={(e) => {
                        const values = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                        updateDependency({ ...rule, value: values });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === "en"
                        ? "Example: option1, option2, option3"
                        : "مثال: خيار1, خيار2, خيار3"}
                    </p>
                  </div>
                ) : (
                  <Input
                    placeholder={language === "en" ? "Enter value..." : "أدخل القيمة..."}
                    value={typeof rule.value === "string" ? rule.value : ""}
                    onChange={(e) =>
                      updateDependency({ ...rule, value: e.target.value })
                    }
                  />
                )}
              </div>
            )}

            {/* Rule Preview */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">
                {language === "en" ? "Rule Preview:" : "معاينة القاعدة:"}
              </p>
              <div className="flex flex-wrap gap-2 items-center text-sm">
                <Badge variant="secondary">
                  {language === "en" ? "Show when" : "إظهار عندما"}
                </Badge>
                <Badge variant="outline">
                  {availableFields.find((f) => f.fieldKey === rule.fieldKey)
                    ? language === "en"
                      ? availableFields.find((f) => f.fieldKey === rule.fieldKey)!.labelEn
                      : availableFields.find((f) => f.fieldKey === rule.fieldKey)!.labelAr ||
                        availableFields.find((f) => f.fieldKey === rule.fieldKey)!.labelEn
                    : rule.fieldKey || "?"}
                </Badge>
                <Badge variant="outline">
                  {operators.find((o) => o.value === rule.operator)
                    ? language === "en"
                      ? operators.find((o) => o.value === rule.operator)!.labelEn
                      : operators.find((o) => o.value === rule.operator)!.labelAr
                    : rule.operator}
                </Badge>
                {needsValue && (
                  <Badge variant="outline">
                    {Array.isArray(rule.value) ? rule.value.join(", ") : rule.value || "?"}
                  </Badge>
                )}
              </div>
            </div>

            {/* JSON Preview */}
            {showJson && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">
                  {language === "en" ? "JSON Output:" : "مخرجات JSON:"}
                </p>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify({ showIf: rule }, null, 2)}
                </pre>
              </div>
            )}

            {/* Remove Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => updateDependency(null)}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              {language === "en" ? "Remove Dependency" : "إزالة التبعية"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
