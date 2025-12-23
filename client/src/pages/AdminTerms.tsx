import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  Eye,
  History
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminTerms() {
  const { language } = useLanguage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("en");

  // Form state for create/edit
  const [formData, setFormData] = useState({
    version: "",
    titleEn: "Terms and Conditions",
    titleAr: "الشروط والأحكام",
    contentEn: "",
    contentAr: "",
    setActive: false,
  });

  // Queries
  const { data: allTerms, isLoading, refetch } = trpc.terms.getAllTerms.useQuery();

  // Mutations
  const createMutation = trpc.terms.createTerms.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم إنشاء الشروط بنجاح" : "Terms created successfully");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(language === "ar" ? "خطأ" : "Error", { description: error.message });
    },
  });

  const updateMutation = trpc.terms.updateTerms.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم تحديث الشروط بنجاح" : "Terms updated successfully");
      setEditingTerms(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(language === "ar" ? "خطأ" : "Error", { description: error.message });
    },
  });

  const setActiveMutation = trpc.terms.setActiveTerms.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم تفعيل الشروط" : "Terms activated");
      refetch();
    },
    onError: (error) => {
      toast.error(language === "ar" ? "خطأ" : "Error", { description: error.message });
    },
  });

  const deleteMutation = trpc.terms.deleteTerms.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم حذف الشروط" : "Terms deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(language === "ar" ? "خطأ" : "Error", { description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      version: "",
      titleEn: "Terms and Conditions",
      titleAr: "الشروط والأحكام",
      contentEn: "",
      contentAr: "",
      setActive: false,
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingTerms) return;
    updateMutation.mutate({
      id: editingTerms.id,
      titleEn: formData.titleEn,
      titleAr: formData.titleAr,
      contentEn: formData.contentEn,
      contentAr: formData.contentAr,
    });
  };

  const handleEdit = (terms: any) => {
    setFormData({
      version: terms.version,
      titleEn: terms.titleEn,
      titleAr: terms.titleAr,
      contentEn: terms.contentEn || "",
      contentAr: terms.contentAr || "",
      setActive: false,
    });
    setEditingTerms(terms);
  };

  // Fetch full content when editing
  const { data: fullTermsContent } = trpc.terms.getTermsById.useQuery(
    { id: editingTerms?.id },
    { enabled: !!editingTerms?.id }
  );

  // Update form when full content is loaded
  if (fullTermsContent && editingTerms && formData.contentEn === "") {
    setFormData({
      version: fullTermsContent.version,
      titleEn: fullTermsContent.titleEn,
      titleAr: fullTermsContent.titleAr,
      contentEn: fullTermsContent.contentEn || "",
      contentAr: fullTermsContent.contentAr || "",
      setActive: false,
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: "Admin", labelAr: "الإدارة", href: "/admin" },
          { label: "Terms & Conditions", labelAr: "الشروط والأحكام" }
        ]} />
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              {language === "ar" ? "إدارة الشروط والأحكام" : "Terms & Conditions Management"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "ar" 
                ? "إنشاء وتعديل شروط وأحكام المنصة"
                : "Create and manage platform terms and conditions"}
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                {language === "ar" ? "إنشاء نسخة جديدة" : "Create New Version"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {language === "ar" ? "إنشاء شروط وأحكام جديدة" : "Create New Terms"}
                </DialogTitle>
                <DialogDescription>
                  {language === "ar" 
                    ? "أدخل محتوى الشروط والأحكام باللغتين العربية والإنجليزية"
                    : "Enter the terms content in both English and Arabic"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "رقم الإصدار" : "Version"}</Label>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="e.g., 1.0, 2.0"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={formData.setActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, setActive: checked })}
                    />
                    <Label>{language === "ar" ? "تفعيل فوراً" : "Set as Active"}</Label>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="ar">العربية</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="en" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title (English)</Label>
                      <Input
                        value={formData.titleEn}
                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (English) - Markdown supported</Label>
                      <Textarea
                        value={formData.contentEn}
                        onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                        rows={15}
                        placeholder="# Terms and Conditions&#10;&#10;## 1. Introduction&#10;..."
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ar" className="space-y-4">
                    <div className="space-y-2">
                      <Label>العنوان (بالعربية)</Label>
                      <Input
                        value={formData.titleAr}
                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المحتوى (بالعربية) - يدعم Markdown</Label>
                      <Textarea
                        value={formData.contentAr}
                        onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                        rows={15}
                        dir="rtl"
                        placeholder="# الشروط والأحكام&#10;&#10;## 1. المقدمة&#10;..."
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === "ar" ? "إنشاء" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Terms List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {language === "ar" ? "جميع الإصدارات" : "All Versions"}
            </CardTitle>
            <CardDescription>
              {language === "ar" 
                ? "قائمة بجميع إصدارات الشروط والأحكام"
                : "List of all terms and conditions versions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الإصدار" : "Version"}</TableHead>
                    <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "تاريخ الإنشاء" : "Created"}</TableHead>
                    <TableHead>{language === "ar" ? "آخر تحديث" : "Updated"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTerms?.map((terms: any) => (
                    <TableRow key={terms.id}>
                      <TableCell className="font-medium">{terms.version}</TableCell>
                      <TableCell>{language === "ar" ? terms.titleAr : terms.titleEn}</TableCell>
                      <TableCell>
                        {terms.isActive ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {language === "ar" ? "نشط" : "Active"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {language === "ar" ? "غير نشط" : "Inactive"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(terms.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(terms.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Preview */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  {language === "ar" ? terms.titleAr : terms.titleEn} (v{terms.version})
                                </DialogTitle>
                              </DialogHeader>
                              <PreviewContent termsId={terms.id} language={language} />
                            </DialogContent>
                          </Dialog>

                          {/* Edit */}
                          <Dialog open={editingTerms?.id === terms.id} onOpenChange={(open) => !open && setEditingTerms(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(terms)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  {language === "ar" ? "تعديل الشروط" : "Edit Terms"} (v{terms.version})
                                </DialogTitle>
                              </DialogHeader>
                              
                              <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="en">English</TabsTrigger>
                                  <TabsTrigger value="ar">العربية</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="en" className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Title (English)</Label>
                                    <Input
                                      value={formData.titleEn}
                                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Content (English)</Label>
                                    <Textarea
                                      value={formData.contentEn}
                                      onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                                      rows={15}
                                      className="font-mono text-sm"
                                    />
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="ar" className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>العنوان (بالعربية)</Label>
                                    <Input
                                      value={formData.titleAr}
                                      onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                      dir="rtl"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>المحتوى (بالعربية)</Label>
                                    <Textarea
                                      value={formData.contentAr}
                                      onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                                      rows={15}
                                      dir="rtl"
                                      className="font-mono text-sm"
                                    />
                                  </div>
                                </TabsContent>
                              </Tabs>

                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingTerms(null)}>
                                  {language === "ar" ? "إلغاء" : "Cancel"}
                                </Button>
                                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Set Active */}
                          {!terms.isActive && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setActiveMutation.mutate({ id: terms.id })}
                              disabled={setActiveMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}

                          {/* Delete */}
                          {!terms.isActive && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {language === "ar" ? "حذف الشروط" : "Delete Terms"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {language === "ar" 
                                      ? "هل أنت متأكد من حذف هذا الإصدار؟ لا يمكن التراجع عن هذا الإجراء."
                                      : "Are you sure you want to delete this version? This action cannot be undone."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {language === "ar" ? "إلغاء" : "Cancel"}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate({ id: terms.id })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {language === "ar" ? "حذف" : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Preview content component
function PreviewContent({ termsId, language }: { termsId: number; language: string }) {
  const { data: terms, isLoading } = trpc.terms.getTermsById.useQuery({ id: termsId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const content = language === "ar" ? terms?.contentAr : terms?.contentEn;

  return (
    <div className={`prose prose-sm max-w-none ${language === "ar" ? "prose-rtl" : ""}`}>
      <ReactMarkdown>{content || ""}</ReactMarkdown>
    </div>
  );
}
