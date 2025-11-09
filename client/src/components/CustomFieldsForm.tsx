import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { CustomFieldRenderer, type CustomFieldDefinition, type CustomFieldValue } from "./CustomFieldRenderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";


interface CustomFieldsFormProps {
  module: string;
  recordId?: number;
  showInContext?: "admin" | "user";
  onValuesChange?: (values: CustomFieldValue[]) => void;
  initialValues?: CustomFieldValue[];
  className?: string;
}

/**
 * Custom Fields Form Component
 * Wrapper that fetches and renders all custom fields for a module
 */
export function CustomFieldsForm({
  module,
  recordId,
  showInContext = "user",
  onValuesChange,
  initialValues = [],
  className,
}: CustomFieldsFormProps) {
  const { language } = useLanguage();
  const [fieldValues, setFieldValues] = useState<Map<number, CustomFieldValue>>(new Map());

  // Fetch custom field definitions for this module
  const { data: fields, isLoading: fieldsLoading } = trpc.customFields.getByModule.useQuery({
    module,
  });

  // Fetch existing values if recordId is provided
  const { data: existingValues, isLoading: valuesLoading } = trpc.customFields.getValuesWithDefinitions.useQuery(
    { module, recordId: recordId! },
    { enabled: !!recordId }
  );

  // Initialize field values from existing data or initial values
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const valuesMap = new Map<number, CustomFieldValue>();
      existingValues.forEach((item) => {
        if (item.value) {
          valuesMap.set(item.value.fieldId, {
            fieldId: item.value.fieldId,
            value: item.value.value || undefined,
            fileUrl: item.value.fileUrl || undefined,
            fileName: item.value.fileName || undefined,
          });
        }
      });
      setFieldValues(valuesMap);
    } else if (initialValues.length > 0) {
      const valuesMap = new Map<number, CustomFieldValue>();
      initialValues.forEach((value) => {
        valuesMap.set(value.fieldId, value);
      });
      setFieldValues(valuesMap);
    }
  }, [existingValues, initialValues]);

  // Notify parent of value changes
  useEffect(() => {
    if (onValuesChange) {
      const values = Array.from(fieldValues.values());
      onValuesChange(values);
    }
  }, [fieldValues, onValuesChange]);

  // Handle field value change
  const handleFieldChange = (fieldId: number, value: string, fileUrl?: string, fileName?: string) => {
    setFieldValues((prev) => {
      const newMap = new Map(prev);
      newMap.set(fieldId, {
        fieldId,
        value,
        fileUrl,
        fileName,
      });
      return newMap;
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<{ url: string; name: string }> => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      
      // Upload to storage (you'll need to implement this based on your storage setup)
      // For now, we'll just return a placeholder
      // In a real implementation, you would call your storage API here
      
      return {
        url: base64Data, // Temporary: storing base64 directly
        name: file.name,
      };
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error("Failed to upload file");
    }
  };

  if (fieldsLoading || (recordId && valuesLoading)) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!fields || fields.length === 0) {
    return null; // No custom fields defined for this module
  }

  // Filter fields based on context
  const visibleFields = fields.filter((field) =>
    showInContext === "admin" ? field.showInAdmin : field.showInUserForm
  );

  if (visibleFields.length === 0) {
    return null; // No fields to show in this context
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {language === "en" ? "Additional Information" : "معلومات إضافية"}
        </CardTitle>
        <CardDescription>
          {language === "en"
            ? "Please provide the following additional details"
            : "يرجى تقديم التفاصيل الإضافية التالية"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleFields.map((field) => {
          const fieldValue = fieldValues.get(field.id);
          
          // Create a map of field keys to values for dependency evaluation
          const allFieldValuesMap = new Map<string, string>();
          visibleFields.forEach((f) => {
            const val = fieldValues.get(f.id);
            if (val?.value) {
              allFieldValuesMap.set(f.fieldKey, val.value);
            }
          });
          
          return (
            <CustomFieldRenderer
              key={field.id}
              field={field as unknown as CustomFieldDefinition}
              value={fieldValue?.value}
              fileUrl={fieldValue?.fileUrl}
              fileName={fieldValue?.fileName}
              onChange={(value, fileUrl, fileName) =>
                handleFieldChange(field.id, value, fileUrl, fileName)
              }
              onFileUpload={handleFileUpload}
              showInContext={showInContext}
              allFieldValues={allFieldValuesMap}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Hook to save custom field values
 */
export function useSaveCustomFields() {
  const saveMutation = trpc.customFields.saveMultipleValues.useMutation();

  const saveCustomFields = async (
    module: string,
    recordId: number,
    values: CustomFieldValue[]
  ) => {
    // Filter out empty values
    const nonEmptyValues = values.filter((v) => v.value || v.fileUrl);

    if (nonEmptyValues.length === 0) {
      return { success: true };
    }

    return await saveMutation.mutateAsync({
      module,
      recordId,
      values: nonEmptyValues.map((v) => ({
        fieldId: v.fieldId,
        value: v.value || "",
        fileUrl: v.fileUrl,
        fileName: v.fileName,
      })),
    });
  };

  return {
    saveCustomFields,
    isLoading: saveMutation.isPending,
    error: saveMutation.error,
  };
}
