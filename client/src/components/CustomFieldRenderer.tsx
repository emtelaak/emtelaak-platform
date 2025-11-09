import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountrySelector } from "./CountrySelector";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useState } from "react";

export interface CustomFieldDefinition {
  id: number;
  module: string;
  fieldKey: string;
  labelEn: string;
  labelAr: string | null;
  fieldType: string;
  config: string | null;
  isRequired: boolean;
  showInAdmin: boolean;
  showInUserForm: boolean;
  displayOrder: number;
  helpTextEn: string | null;
  helpTextAr: string | null;
  placeholderEn: string | null;
  placeholderAr: string | null;
  dependencies: string | null;
  validationRules: string | null;
}

export interface CustomFieldValue {
  fieldId: number;
  value?: string;
  fileUrl?: string;
  fileName?: string;
}

interface CustomFieldRendererProps {
  field: CustomFieldDefinition;
  value?: string;
  fileUrl?: string;
  fileName?: string;
  onChange: (value: string, fileUrl?: string, fileName?: string) => void;
  onFileUpload?: (file: File) => Promise<{ url: string; name: string }>;
  disabled?: boolean;
  showInContext?: "admin" | "user";
  allFieldValues?: Map<string, string>; // All field values for dependency evaluation
}

/**
 * Custom Field Renderer Component
 * Dynamically renders a custom field based on its type
 */
export function CustomFieldRenderer({
  field,
  value = "",
  fileUrl,
  fileName,
  onChange,
  onFileUpload,
  disabled,
  showInContext = "user",
  allFieldValues,
}: CustomFieldRendererProps) {
  const { language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if field should be shown in current context
  const shouldShow = showInContext === "admin" ? field.showInAdmin : field.showInUserForm;
  if (!shouldShow) return null;

  // Evaluate conditional visibility based on dependencies
  if (field.dependencies && allFieldValues) {
    try {
      const deps = JSON.parse(field.dependencies);
      if (deps.showIf) {
        const { fieldKey, operator, value: expectedValue } = deps.showIf;
        const actualValue = allFieldValues.get(fieldKey);
        
        let shouldShowConditional = false;
        switch (operator) {
          case "equals":
            shouldShowConditional = actualValue === expectedValue;
            break;
          case "notEquals":
            shouldShowConditional = actualValue !== expectedValue;
            break;
          case "contains":
            shouldShowConditional = actualValue?.includes(expectedValue) || false;
            break;
          case "notEmpty":
            shouldShowConditional = !!actualValue && actualValue.trim() !== "";
            break;
          case "empty":
            shouldShowConditional = !actualValue || actualValue.trim() === "";
            break;
          case "in":
            // expectedValue should be an array
            shouldShowConditional = Array.isArray(expectedValue) && expectedValue.includes(actualValue);
            break;
          default:
            shouldShowConditional = true;
        }
        
        if (!shouldShowConditional) {
          return null;
        }
      }
    } catch (error) {
      console.error("Error evaluating field dependencies:", error);
      // Show field if dependency evaluation fails
    }
  }

  // Validate field value based on validation rules
  const validateValue = (val: string): string | null => {
    if (!field.validationRules) return null;
    
    try {
      const rules = JSON.parse(field.validationRules);
      if (!Array.isArray(rules)) return null;
      
      for (const rule of rules) {
        const errorMessage = language === "en" ? rule.errorMessageEn : (rule.errorMessageAr || rule.errorMessageEn);
        
        switch (rule.type) {
          case "minLength":
            if (val.length < (rule.value || 0)) {
              return errorMessage || `Minimum length is ${rule.value} characters`;
            }
            break;
          case "maxLength":
            if (val.length > (rule.value || 0)) {
              return errorMessage || `Maximum length is ${rule.value} characters`;
            }
            break;
          case "minValue":
            if (parseFloat(val) < (rule.value || 0)) {
              return errorMessage || `Minimum value is ${rule.value}`;
            }
            break;
          case "maxValue":
            if (parseFloat(val) > (rule.value || 0)) {
              return errorMessage || `Maximum value is ${rule.value}`;
            }
            break;
          case "regex":
            try {
              const regex = new RegExp(rule.value);
              if (!regex.test(val)) {
                return errorMessage || "Value does not match required pattern";
              }
            } catch (e) {
              console.error("Invalid regex pattern:", e);
            }
            break;
          case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
              return errorMessage || "Invalid email address";
            }
            break;
          case "url":
            try {
              new URL(val);
            } catch {
              return errorMessage || "Invalid URL";
            }
            break;
          case "phone":
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(val) || val.length < 10) {
              return errorMessage || "Invalid phone number";
            }
            break;
        }
      }
      
      return null; // All validations passed
    } catch (error) {
      console.error("Error parsing validation rules:", error);
      return null;
    }
  };
  
  // Handle value change with validation
  const handleChange = (newValue: string, newFileUrl?: string, newFileName?: string) => {
    // Only validate non-empty values
    if (newValue && newValue.trim() !== "") {
      const error = validateValue(newValue);
      setValidationError(error);
    } else {
      setValidationError(null);
    }
    onChange(newValue, newFileUrl, newFileName);
  };

  // Get localized label, help text, and placeholder
  const label = language === "en" ? field.labelEn : (field.labelAr || field.labelEn);
  const helpText = language === "en" ? field.helpTextEn : (field.helpTextAr || field.helpTextEn);
  const placeholder = language === "en" ? field.placeholderEn : (field.placeholderAr || field.placeholderEn);

  // Parse config for dropdown/multi-select options
  let options: Array<{ value: string; label: string }> = [];
  if (field.config && (field.fieldType === "dropdown" || field.fieldType === "multi_select")) {
    try {
      const config = JSON.parse(field.config);
      options = config.options || [];
    } catch (e) {
      console.error("Failed to parse field config:", e);
    }
  }

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;

    setUploading(true);
    try {
      const { url, name } = await onFileUpload(file);
      onChange("", url, name);
    } catch (error) {
      console.error("File upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  // Render field based on type
  const renderField = () => {
    switch (field.fieldType) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <Input
            type={field.fieldType === "email" ? "email" : field.fieldType === "url" ? "url" : "text"}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || ""}
            disabled={disabled}
            required={field.isRequired}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || ""}
            rows={4}
            disabled={disabled}
            required={field.isRequired}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || ""}
            disabled={disabled}
            required={field.isRequired}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.isRequired}
          />
        );

      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={field.isRequired}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === "true" || value === "1"}
              onCheckedChange={(checked) => handleChange(checked ? "true" : "false")}
              disabled={disabled}
            />
            <span className="text-sm text-muted-foreground">
              {value === "true" || value === "1"
                ? (language === "en" ? "Yes" : "نعم")
                : (language === "en" ? "No" : "لا")}
            </span>
          </div>
        );

      case "dropdown":
        return (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder || (language === "en" ? "Select an option" : "اختر خيار")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multi_select":
        const selectedValues = value ? value.split(",") : [];
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.id}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value);
                    onChange(newValues.join(","));
                  }}
                  disabled={disabled}
                  className="rounded border-gray-300"
                />
                <label htmlFor={`${field.id}-${option.value}`} className="text-sm">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case "country":
        return (
          <CountrySelector
            value={value}
            onChange={onChange}
            placeholder={placeholder || undefined}
            disabled={disabled}
          />
        );

      case "file":
        return (
          <div className="space-y-2">
            {fileUrl && fileName ? (
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{fileName}</span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {language === "en" ? "View" : "عرض"}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange("", "", "")}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  disabled={disabled || uploading}
                  className="flex-1"
                />
                {uploading && (
                  <span className="text-sm text-muted-foreground">
                    {language === "en" ? "Uploading..." : "جاري الرفع..."}
                  </span>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || ""}
            disabled={disabled}
            required={field.isRequired}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`field-${field.id}`}>
        {label}
        {field.isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      {helpText && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}
    </div>
  );
}
