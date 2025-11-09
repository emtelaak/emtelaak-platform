import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomFieldsForm, useSaveCustomFields } from "@/components/CustomFieldsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CustomFieldValue } from "@/components/CustomFieldRenderer";

/**
 * Custom Fields Test Page
 * Test the dynamic custom fields renderer with different modules
 */
export default function CustomFieldsTest() {
  const { language } = useLanguage();
  const [selectedModule, setSelectedModule] = useState("properties");
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue[]>([]);
  const { saveCustomFields, isLoading } = useSaveCustomFields();

  const modules = [
    { value: "properties", labelEn: "Properties", labelAr: "العقارات" },
    { value: "users", labelEn: "Users", labelAr: "المستخدمين" },
    { value: "leads", labelEn: "CRM Leads", labelAr: "عملاء CRM" },
    { value: "invoices", labelEn: "Invoices", labelAr: "الفواتير" },
  ];

  const handleSave = async () => {
    try {
      // For testing, we'll use a dummy record ID
      const testRecordId = 1;
      
      await saveCustomFields(selectedModule, testRecordId, customFieldValues);
      toast.success(
        language === "en"
          ? "Custom fields saved successfully"
          : "تم حفظ الحقول المخصصة بنجاح"
      );
    } catch (error) {
      toast.error(
        language === "en"
          ? "Failed to save custom fields"
          : "فشل حفظ الحقول المخصصة"
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === "en" ? "Custom Fields Test" : "اختبار الحقول المخصصة"}
        </h1>
        <p className="text-muted-foreground">
          {language === "en"
            ? "Test the dynamic custom fields renderer with different modules"
            : "اختبار عارض الحقول المخصصة الديناميكي مع وحدات مختلفة"}
        </p>
      </div>

      {/* Module Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {language === "en" ? "Select Module" : "اختر الوحدة"}
          </CardTitle>
          <CardDescription>
            {language === "en"
              ? "Choose a module to test its custom fields"
              : "اختر وحدة لاختبار حقولها المخصصة"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {modules.map((module) => (
              <Button
                key={module.value}
                variant={selectedModule === module.value ? "default" : "outline"}
                onClick={() => setSelectedModule(module.value)}
              >
                {language === "en" ? module.labelEn : module.labelAr}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields Form */}
      <CustomFieldsForm
        module={selectedModule}
        showInContext="user"
        onValuesChange={setCustomFieldValues}
      />

      {/* Values Display */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {language === "en" ? "Current Values" : "القيم الحالية"}
          </CardTitle>
          <CardDescription>
            {language === "en"
              ? "Values captured from the custom fields form"
              : "القيم الملتقطة من نموذج الحقول المخصصة"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customFieldValues.length > 0 ? (
            <div className="space-y-2">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                {JSON.stringify(customFieldValues, null, 2)}
              </pre>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading
                  ? (language === "en" ? "Saving..." : "جاري الحفظ...")
                  : (language === "en" ? "Save Values" : "حفظ القيم")}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {language === "en"
                ? "No values entered yet"
                : "لم يتم إدخال قيم بعد"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {language === "en" ? "Testing Instructions" : "تعليمات الاختبار"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {language === "en"
              ? "1. Go to /admin/custom-fields to create custom fields for different modules"
              : "1. انتقل إلى /admin/custom-fields لإنشاء حقول مخصصة لوحدات مختلفة"}
          </p>
          <p>
            {language === "en"
              ? "2. Select a module above to see its custom fields"
              : "2. اختر وحدة أعلاه لرؤية حقولها المخصصة"}
          </p>
          <p>
            {language === "en"
              ? "3. Fill in the custom fields and see the values update below"
              : "3. املأ الحقول المخصصة وشاهد القيم تتحدث أدناه"}
          </p>
          <p>
            {language === "en"
              ? "4. Click 'Save Values' to test saving to the database"
              : "4. انقر على 'حفظ القيم' لاختبار الحفظ في قاعدة البيانات"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
