import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Code, CheckCircle2, XCircle } from "lucide-react";

interface ValidationRule {
  type: "minLength" | "maxLength" | "minValue" | "maxValue" | "regex" | "email" | "url" | "phone";
  value?: number | string;
  errorMessageEn?: string;
  errorMessageAr?: string;
}

interface ValidationRulesBuilderProps {
  fieldType: string;
  value?: string; // JSON string
  onChange: (json: string) => void;
}

/**
 * Visual Validation Rules Builder Component
 * Provides a user-friendly interface to create field validation rules
 */
export function ValidationRulesBuilder({
  fieldType,
  value,
  onChange,
}: ValidationRulesBuilderProps) {
  const { language } = useLanguage();
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [testValue, setTestValue] = useState("");
  const [testResult, setTestResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setRules(parsed);
        }
      } catch (e) {
        console.error("Failed to parse validation rules:", e);
      }
    }
  }, [value]);

  // Generate JSON and notify parent
  const updateRules = (newRules: ValidationRule[]) => {
    setRules(newRules);
    if (newRules.length > 0) {
      const json = JSON.stringify(newRules);
      onChange(json);
    } else {
      onChange("");
    }
    // Clear test result when rules change
    setTestResult(null);
  };

  // Add a new rule
  const addRule = (type: ValidationRule["type"]) => {
    const newRule: ValidationRule = { type };
    updateRules([...rules, newRule]);
  };

  // Update a rule
  const updateRule = (index: number, updates: Partial<ValidationRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    updateRules(newRules);
  };

  // Remove a rule
  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    updateRules(newRules);
  };

  // Test validation rules
  const testValidation = () => {
    const errors: string[] = [];
    
    rules.forEach((rule) => {
      switch (rule.type) {
        case "minLength":
          if (testValue.length < (rule.value as number || 0)) {
            errors.push(
              rule.errorMessageEn ||
                `Minimum length is ${rule.value} characters`
            );
          }
          break;
        case "maxLength":
          if (testValue.length > (rule.value as number || 0)) {
            errors.push(
              rule.errorMessageEn ||
                `Maximum length is ${rule.value} characters`
            );
          }
          break;
        case "minValue":
          if (parseFloat(testValue) < (rule.value as number || 0)) {
            errors.push(
              rule.errorMessageEn ||
                `Minimum value is ${rule.value}`
            );
          }
          break;
        case "maxValue":
          if (parseFloat(testValue) > (rule.value as number || 0)) {
            errors.push(
              rule.errorMessageEn ||
                `Maximum value is ${rule.value}`
            );
          }
          break;
        case "regex":
          try {
            const regex = new RegExp(rule.value as string);
            if (!regex.test(testValue)) {
              errors.push(
                rule.errorMessageEn ||
                  `Value does not match required pattern`
              );
            }
          } catch (e) {
            errors.push("Invalid regex pattern");
          }
          break;
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(testValue)) {
            errors.push(rule.errorMessageEn || "Invalid email address");
          }
          break;
        case "url":
          try {
            new URL(testValue);
          } catch {
            errors.push(rule.errorMessageEn || "Invalid URL");
          }
          break;
        case "phone":
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          if (!phoneRegex.test(testValue) || testValue.length < 10) {
            errors.push(rule.errorMessageEn || "Invalid phone number");
          }
          break;
      }
    });

    setTestResult({
      valid: errors.length === 0,
      errors,
    });
  };

  // Available rule types based on field type
  const getAvailableRuleTypes = () => {
    const types: Array<{ value: ValidationRule["type"]; labelEn: string; labelAr: string }> = [];

    if (["text", "textarea"].includes(fieldType)) {
      types.push(
        { value: "minLength", labelEn: "Minimum Length", labelAr: "الحد الأدنى للطول" },
        { value: "maxLength", labelEn: "Maximum Length", labelAr: "الحد الأقصى للطول" },
        { value: "regex", labelEn: "Regex Pattern", labelAr: "نمط Regex" }
      );
    }

    if (fieldType === "number") {
      types.push(
        { value: "minValue", labelEn: "Minimum Value", labelAr: "الحد الأدنى للقيمة" },
        { value: "maxValue", labelEn: "Maximum Value", labelAr: "الحد الأقصى للقيمة" }
      );
    }

    if (fieldType === "email") {
      types.push({ value: "email", labelEn: "Email Format", labelAr: "تنسيق البريد الإلكتروني" });
    }

    if (fieldType === "url") {
      types.push({ value: "url", labelEn: "URL Format", labelAr: "تنسيق URL" });
    }

    if (fieldType === "phone") {
      types.push({ value: "phone", labelEn: "Phone Format", labelAr: "تنسيق الهاتف" });
    }

    return types;
  };

  const availableTypes = getAvailableRuleTypes();

  if (availableTypes.length === 0) {
    return null; // No validation rules available for this field type
  }

  const getRuleLabel = (type: ValidationRule["type"]) => {
    const ruleType = availableTypes.find((t) => t.value === type);
    return ruleType ? (language === "en" ? ruleType.labelEn : ruleType.labelAr) : type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {language === "en" ? "Validation Rules" : "قواعد التحقق"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Define validation rules to ensure data quality"
                : "حدد قواعد التحقق لضمان جودة البيانات"}
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
        {/* Existing Rules */}
        {rules.map((rule, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{getRuleLabel(rule.type)}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Value Input */}
              {["minLength", "maxLength", "minValue", "maxValue"].includes(rule.type) && (
                <div className="grid gap-2">
                  <Label>{language === "en" ? "Value:" : "القيمة:"}</Label>
                  <Input
                    type="number"
                    value={rule.value || ""}
                    onChange={(e) =>
                      updateRule(index, { value: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
              )}

              {rule.type === "regex" && (
                <div className="grid gap-2">
                  <Label>{language === "en" ? "Regex Pattern:" : "نمط Regex:"}</Label>
                  <Input
                    value={rule.value || ""}
                    onChange={(e) => updateRule(index, { value: e.target.value })}
                    placeholder="^[A-Z][a-z]+$"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Example: ^[A-Z][a-z]+$ (Capitalized word)"
                      : "مثال: ^[A-Z][a-z]+$ (كلمة بحرف كبير)"}
                  </p>
                </div>
              )}

              {/* Error Messages */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{language === "en" ? "Error Message (English):" : "رسالة الخطأ (إنجليزي):"}</Label>
                  <Textarea
                    value={rule.errorMessageEn || ""}
                    onChange={(e) =>
                      updateRule(index, { errorMessageEn: e.target.value })
                    }
                    placeholder="Please enter a valid value"
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{language === "en" ? "Error Message (Arabic):" : "رسالة الخطأ (عربي):"}</Label>
                  <Textarea
                    value={rule.errorMessageAr || ""}
                    onChange={(e) =>
                      updateRule(index, { errorMessageAr: e.target.value })
                    }
                    placeholder="يرجى إدخال قيمة صالحة"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Rule Buttons */}
        <div className="flex flex-wrap gap-2">
          {availableTypes
            .filter((type) => !rules.some((r) => r.type === type.value))
            .map((type) => (
              <Button
                key={type.value}
                variant="outline"
                size="sm"
                onClick={() => addRule(type.value)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === "en" ? type.labelEn : type.labelAr}
              </Button>
            ))}
        </div>

        {/* Validation Tester */}
        {rules.length > 0 && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">
                {language === "en" ? "Test Validation" : "اختبار التحقق"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder={language === "en" ? "Enter test value..." : "أدخل قيمة الاختبار..."}
                />
                <Button onClick={testValidation}>
                  {language === "en" ? "Test" : "اختبار"}
                </Button>
              </div>
              {testResult && (
                <div
                  className={`p-3 rounded-lg flex items-start gap-2 ${
                    testResult.valid
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}
                >
                  {testResult.valid ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {testResult.valid ? (
                      <p className="font-medium">
                        {language === "en" ? "Valid!" : "صالح!"}
                      </p>
                    ) : (
                      <div>
                        <p className="font-medium mb-1">
                          {language === "en" ? "Validation Errors:" : "أخطاء التحقق:"}
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {testResult.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* JSON Preview */}
        {showJson && rules.length > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">
              {language === "en" ? "JSON Output:" : "مخرجات JSON:"}
            </p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(rules, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
