import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X, Settings2, Package, Download } from "lucide-react";
import { DependencyBuilder } from "@/components/DependencyBuilder";
import { ValidationRulesBuilder } from "@/components/ValidationRulesBuilder";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Custom Fields Management Page
 * Allows admins to create and manage custom fields for any module
 */

export default function CustomFieldsManagement() {
  const { language } = useLanguage();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    module: "properties",
    fieldKey: "",
    labelEn: "",
    labelAr: "",
    fieldType: "text",
    config: "",
    isRequired: false,
    showInAdmin: true,
    showInUserForm: true,
    displayOrder: 0,
    helpTextEn: "",
    helpTextAr: "",
    placeholderEn: "",
    placeholderAr: "",
    dependencies: "",
    validationRules: "",
  });

  // Queries
  const { data: customFields, refetch } = trpc.customFields.getAll.useQuery();
  const { data: stats } = trpc.customFields.getStats.useQuery();

  // Mutations
  const createMutation = trpc.customFields.create.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Custom field created successfully" : "تم إنشاء الحقل المخصص بنجاح");
      refetch();
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.customFields.update.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Custom field updated successfully" : "تم تحديث الحقل المخصص بنجاح");
      refetch();
      setEditingField(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.customFields.delete.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Custom field deleted successfully" : "تم حذف الحقل المخصص بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      module: "properties",
      fieldKey: "",
      labelEn: "",
      labelAr: "",
      fieldType: "text",
      config: "",
      isRequired: false,
      showInAdmin: true,
      showInUserForm: true,
      displayOrder: 0,
      helpTextEn: "",
      helpTextAr: "",
      placeholderEn: "",
      placeholderAr: "",
      dependencies: "",
      validationRules: "",
    });
  };

  const handleSubmit = () => {
    if (editingField) {
      updateMutation.mutate({
        id: editingField.id,
        data: formData as any,
      });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const handleEdit = (field: any) => {
    setEditingField(field);
    setFormData({
      module: field.module,
      fieldKey: field.fieldKey,
      labelEn: field.labelEn,
      labelAr: field.labelAr || "",
      fieldType: field.fieldType,
      config: field.config || "",
      isRequired: field.isRequired,
      showInAdmin: field.showInAdmin,
      showInUserForm: field.showInUserForm,
      displayOrder: field.displayOrder,
      helpTextEn: field.helpTextEn || "",
      helpTextAr: field.helpTextAr || "",
      placeholderEn: field.placeholderEn || "",
      placeholderAr: field.placeholderAr || "",
      dependencies: field.dependencies || "",
      validationRules: field.validationRules || "",
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(language === "en" ? "Are you sure you want to delete this custom field?" : "هل أنت متأكد من حذف هذا الحقل المخصص؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredFields = customFields?.filter(
    (field) => selectedModule === "all" || field.module === selectedModule
  );

  const modules = [
    { value: "all", labelEn: "All Modules", labelAr: "جميع الوحدات" },
    { value: "properties", labelEn: "Properties", labelAr: "العقارات" },
    { value: "users", labelEn: "Users", labelAr: "المستخدمين" },
    { value: "leads", labelEn: "CRM Leads", labelAr: "عملاء CRM" },
    { value: "invoices", labelEn: "Invoices", labelAr: "الفواتير" },
  ];

  const fieldTypes = [
    { value: "text", labelEn: "Text", labelAr: "نص" },
    { value: "textarea", labelEn: "Text Area", labelAr: "منطقة نصية" },
    { value: "number", labelEn: "Number", labelAr: "رقم" },
    { value: "date", labelEn: "Date", labelAr: "تاريخ" },
    { value: "datetime", labelEn: "Date & Time", labelAr: "تاريخ ووقت" },
    { value: "dropdown", labelEn: "Dropdown", labelAr: "قائمة منسدلة" },
    { value: "multi_select", labelEn: "Multi-Select", labelAr: "اختيار متعدد" },
    { value: "country", labelEn: "Country", labelAr: "دولة" },
    { value: "file", labelEn: "File Upload", labelAr: "رفع ملف" },
    { value: "boolean", labelEn: "Yes/No", labelAr: "نعم/لا" },
    { value: "email", labelEn: "Email", labelAr: "بريد إلكتروني" },
    { value: "phone", labelEn: "Phone", labelAr: "هاتف" },
    { value: "url", labelEn: "URL", labelAr: "رابط" },
  ];

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === "en" ? "Custom Fields Management" : "إدارة الحقول المخصصة"}
        </h1>
        <p className="text-muted-foreground">
          {language === "en"
            ? "Create and manage custom fields for different modules"
            : "إنشاء وإدارة الحقول المخصصة للوحدات المختلفة"}
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Total Fields" : "إجمالي الحقول"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFields}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Total Values" : "إجمالي القيم"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalValues}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Modules" : "الوحدات"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byModule).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label>{language === "en" ? "Filter by Module:" : "تصفية حسب الوحدة:"}</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.value} value={module.value}>
                      {language === "en" ? module.labelEn : module.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplatesDialog(true)}>
                <Package className="h-4 w-4 mr-2" />
                {language === "en" ? "Field Templates" : "قوالب الحقول"}
              </Button>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {language === "en" ? "Create Custom Field" : "إنشاء حقل مخصص"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "en" ? "Custom Fields" : "الحقول المخصصة"}
          </CardTitle>
          <CardDescription>
            {language === "en"
              ? "Manage all custom fields across different modules"
              : "إدارة جميع الحقول المخصصة عبر الوحدات المختلفة"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "en" ? "Module" : "الوحدة"}</TableHead>
                <TableHead>{language === "en" ? "Field Key" : "مفتاح الحقل"}</TableHead>
                <TableHead>{language === "en" ? "Label" : "التسمية"}</TableHead>
                <TableHead>{language === "en" ? "Type" : "النوع"}</TableHead>
                <TableHead>{language === "en" ? "Required" : "مطلوب"}</TableHead>
                <TableHead>{language === "en" ? "Admin" : "إداري"}</TableHead>
                <TableHead>{language === "en" ? "User Form" : "نموذج المستخدم"}</TableHead>
                <TableHead>{language === "en" ? "Actions" : "الإجراءات"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields?.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium capitalize">{field.module}</TableCell>
                  <TableCell className="font-mono text-sm">{field.fieldKey}</TableCell>
                  <TableCell>{language === "en" ? field.labelEn : (field.labelAr || field.labelEn)}</TableCell>
                  <TableCell className="capitalize">{field.fieldType}</TableCell>
                  <TableCell>{field.isRequired ? "✓" : "—"}</TableCell>
                  <TableCell>{field.showInAdmin ? "✓" : "—"}</TableCell>
                  <TableCell>{field.showInUserForm ? "✓" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(field)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(field.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredFields || filteredFields.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {language === "en" ? "No custom fields found" : "لم يتم العثور على حقول مخصصة"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingField
                ? (language === "en" ? "Edit Custom Field" : "تحرير الحقل المخصص")
                : (language === "en" ? "Create Custom Field" : "إنشاء حقل مخصص")}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Configure the custom field settings below"
                : "قم بتكوين إعدادات الحقل المخصص أدناه"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Module */}
            <div className="grid gap-2">
              <Label>{language === "en" ? "Module" : "الوحدة"}</Label>
              <Select value={formData.module} onValueChange={(value) => setFormData({ ...formData, module: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.filter(m => m.value !== "all").map((module) => (
                    <SelectItem key={module.value} value={module.value}>
                      {language === "en" ? module.labelEn : module.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Key */}
            <div className="grid gap-2">
              <Label>{language === "en" ? "Field Key (unique identifier)" : "مفتاح الحقل (معرف فريد)"}</Label>
              <Input
                value={formData.fieldKey}
                onChange={(e) => setFormData({ ...formData, fieldKey: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g., property_manager_name"
              />
            </div>

            {/* Field Type */}
            <div className="grid gap-2">
              <Label>{language === "en" ? "Field Type" : "نوع الحقل"}</Label>
              <Select value={formData.fieldType} onValueChange={(value) => setFormData({ ...formData, fieldType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {language === "en" ? type.labelEn : type.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Labels */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{language === "en" ? "Label (English)" : "التسمية (إنجليزي)"}</Label>
                <Input
                  value={formData.labelEn}
                  onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                  placeholder="Property Manager Name"
                />
              </div>
              <div className="grid gap-2">
                <Label>{language === "en" ? "Label (Arabic)" : "التسمية (عربي)"}</Label>
                <Input
                  value={formData.labelAr}
                  onChange={(e) => setFormData({ ...formData, labelAr: e.target.value })}
                  placeholder="اسم مدير العقار"
                />
              </div>
            </div>

            {/* Placeholders */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{language === "en" ? "Placeholder (English)" : "النص التوضيحي (إنجليزي)"}</Label>
                <Input
                  value={formData.placeholderEn}
                  onChange={(e) => setFormData({ ...formData, placeholderEn: e.target.value })}
                  placeholder="Enter property manager name..."
                />
              </div>
              <div className="grid gap-2">
                <Label>{language === "en" ? "Placeholder (Arabic)" : "النص التوضيحي (عربي)"}</Label>
                <Input
                  value={formData.placeholderAr}
                  onChange={(e) => setFormData({ ...formData, placeholderAr: e.target.value })}
                  placeholder="أدخل اسم مدير العقار..."
                />
              </div>
            </div>

            {/* Help Text */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{language === "en" ? "Help Text (English)" : "نص المساعدة (إنجليزي)"}</Label>
                <Textarea
                  value={formData.helpTextEn}
                  onChange={(e) => setFormData({ ...formData, helpTextEn: e.target.value })}
                  placeholder="Additional information about this field..."
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>{language === "en" ? "Help Text (Arabic)" : "نص المساعدة (عربي)"}</Label>
                <Textarea
                  value={formData.helpTextAr}
                  onChange={(e) => setFormData({ ...formData, helpTextAr: e.target.value })}
                  placeholder="معلومات إضافية حول هذا الحقل..."
                  rows={2}
                />
              </div>
            </div>

            {/* Dependencies Configuration */}
            <DependencyBuilder
              module={formData.module}
              availableFields={
                customFields
                  ?.filter((f) => f.module === formData.module && f.fieldKey !== formData.fieldKey)
                  .map((f) => ({
                    fieldKey: f.fieldKey,
                    labelEn: f.labelEn,
                    labelAr: f.labelAr || undefined,
                    fieldType: f.fieldType,
                  })) || []
              }
              value={formData.dependencies}
              onChange={(json) => setFormData({ ...formData, dependencies: json })}
            />

            {/* Validation Rules */}
            <ValidationRulesBuilder
              fieldType={formData.fieldType}
              value={formData.validationRules}
              onChange={(json) => setFormData({ ...formData, validationRules: json })}
            />

            {/* Configuration (for dropdown/multi-select) */}
            {(formData.fieldType === "dropdown" || formData.fieldType === "multi_select") && (
              <div className="grid gap-2">
                <Label>{language === "en" ? "Options (JSON format)" : "الخيارات (صيغة JSON)"}</Label>
                <Textarea
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  placeholder='{"options": [{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]}'
                  rows={4}
                />
              </div>
            )}

            {/* Switches */}
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label>{language === "en" ? "Required Field" : "حقل مطلوب"}</Label>
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{language === "en" ? "Show in Admin Interface" : "عرض في واجهة الإدارة"}</Label>
                <Switch
                  checked={formData.showInAdmin}
                  onCheckedChange={(checked) => setFormData({ ...formData, showInAdmin: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{language === "en" ? "Show in User Forms" : "عرض في نماذج المستخدم"}</Label>
                <Switch
                  checked={formData.showInUserForm}
                  onCheckedChange={(checked) => setFormData({ ...formData, showInUserForm: checked })}
                />
              </div>
            </div>

            {/* Display Order */}
            <div className="grid gap-2">
              <Label>{language === "en" ? "Display Order" : "ترتيب العرض"}</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingField(null); resetForm(); }}>
              <X className="h-4 w-4 mr-2" />
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.fieldKey || !formData.labelEn}>
              <Save className="h-4 w-4 mr-2" />
              {editingField
                ? (language === "en" ? "Update" : "تحديث")
                : (language === "en" ? "Create" : "إنشاء")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Templates Dialog */}
      <FieldTemplatesDialog
        open={showTemplatesDialog}
        onClose={() => setShowTemplatesDialog(false)}
        onApplyTemplate={() => {
          refetch();
          setShowTemplatesDialog(false);
        }}
      />
    </div>
  );
}

/**
 * Field Templates Dialog Component
 */
function FieldTemplatesDialog({
  open,
  onClose,
  onApplyTemplate,
}: {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: () => void;
}) {
  const { language } = useLanguage();
  const [selectedModule, setSelectedModule] = useState("properties");

  // Queries
  const { data: templates } = trpc.customFieldTemplates.getAll.useQuery();
  const seedMutation = trpc.customFieldTemplates.seedSystemTemplates.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "System templates seeded successfully" : "تم إنشاء القوالب النظامية بنجاح");
    },
  });
  const applyMutation = trpc.customFieldTemplates.applyTemplate.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Template applied successfully" : "تم تطبيق القالب بنجاح");
      onApplyTemplate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const modules = [
    { value: "properties", labelEn: "Properties", labelAr: "العقارات" },
    { value: "users", labelEn: "Users", labelAr: "المستخدمين" },
    { value: "leads", labelEn: "CRM Leads", labelAr: "عملاء CRM" },
    { value: "invoices", labelEn: "Invoices", labelAr: "الفواتير" },
  ];

  const filteredTemplates = templates?.filter((t) => t.module === selectedModule);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "en" ? "Field Templates" : "قوالب الحقول"}
          </DialogTitle>
          <DialogDescription>
            {language === "en"
              ? "Apply predefined field templates to quickly set up custom fields"
              : "تطبيق قوالب الحقول المحددة مسبقًا لإعداد الحقول المخصصة بسرعة"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Module Selector */}
          <div className="flex items-center gap-4">
            <Label>{language === "en" ? "Module:" : "الوحدة:"}</Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.value} value={module.value}>
                    {language === "en" ? module.labelEn : module.labelAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {language === "en" ? "Seed System Templates" : "إنشاء القوالب النظامية"}
            </Button>
          </div>

          {/* Templates List */}
          <div className="grid gap-4">
            {filteredTemplates && filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => {
                const fields = JSON.parse(template.fields);
                return (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {language === "en" ? template.nameEn : (template.nameAr || template.nameEn)}
                          </CardTitle>
                          <CardDescription>
                            {language === "en" ? template.descriptionEn : (template.descriptionAr || template.descriptionEn)}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyMutation.mutate({ templateId: template.id })}
                          disabled={applyMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {language === "en" ? "Apply" : "تطبيق"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">
                          {language === "en" ? "Fields included:" : "الحقول المضمنة:"}
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {fields.map((field: any, index: number) => (
                            <li key={index}>
                              {language === "en" ? field.labelEn : (field.labelAr || field.labelEn)}
                              {" "}
                              <span className="text-xs">({field.fieldType})</span>
                              {field.isRequired && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {language === "en"
                    ? "No templates available for this module. Click 'Seed System Templates' to create default templates."
                    : "لا توجد قوالب متاحة لهذه الوحدة. انقر على 'إنشاء القوالب النظامية' لإنشاء القوالب الافتراضية."}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === "en" ? "Close" : "إغلاق"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
