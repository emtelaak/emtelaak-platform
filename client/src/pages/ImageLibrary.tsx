import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Search, Trash2, Edit2, Copy, Check, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ImageLibrary() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [editTags, setEditTags] = useState("");

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploadTags, setUploadTags] = useState("");

  const { data: mediaItems, isLoading, refetch } = trpc.mediaLibrary.list.useQuery({
    search: searchQuery || undefined,
  });

  const uploadMutation = trpc.mediaLibrary.upload.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Image uploaded successfully!" : "تم تحميل الصورة بنجاح!");
      refetch();
      setUploadDialogOpen(false);
      resetUploadForm();
    },
    onError: (error) => {
      toast.error(language === "en" ? `Upload failed: ${error.message}` : `فشل التحميل: ${error.message}`);
    },
  });

  const updateMutation = trpc.mediaLibrary.updateMetadata.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Image updated successfully!" : "تم تحديث الصورة بنجاح!");
      refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(language === "en" ? `Update failed: ${error.message}` : `فشل التحديث: ${error.message}`);
    },
  });

  const deleteMutation = trpc.mediaLibrary.delete.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Image deleted successfully!" : "تم حذف الصورة بنجاح!");
      refetch();
    },
    onError: (error) => {
      toast.error(language === "en" ? `Delete failed: ${error.message}` : `فشل الحذف: ${error.message}`);
    },
  });

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadAltText("");
    setUploadTags("");
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error(language === "en" ? "Please select a file" : "الرجاء تحديد ملف");
      return;
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (uploadFile.size > maxSize) {
      toast.error(language === "en" ? "File size must be less than 10MB" : "يجب أن يكون حجم الملف أقل من 10 ميجابايت");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      try {
        await uploadMutation.mutateAsync({
          fileName: uploadFile.name,
          fileData: base64String,
          contentType: uploadFile.type,
          title: uploadTitle || uploadFile.name,
          altText: uploadAltText,
          tags: uploadTags ? uploadTags.split(',').map(t => t.trim()) : [],
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    };

    reader.onerror = () => {
      toast.error(language === "en" ? "Failed to read file" : "فشل قراءة الملف");
    };

    reader.readAsDataURL(uploadFile);
  };

  const handleEdit = (image: any) => {
    setSelectedImage(image);
    setEditTitle(image.title || "");
    setEditAltText(image.altText || "");
    setEditTags(Array.isArray(image.tags) ? image.tags.join(", ") : "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedImage) return;

    updateMutation.mutate({
      id: selectedImage.id,
      title: editTitle,
      altText: editAltText,
      tags: editTags ? editTags.split(',').map(t => t.trim()) : [],
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(language === "en" ? "Are you sure you want to delete this image?" : "هل أنت متأكد من حذف هذه الصورة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(language === "en" ? "URL copied to clipboard!" : "تم نسخ الرابط!");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb 
            items={[
              { label: "Super Admin", labelAr: "المسؤول العام", href: "/super-admin" },
              { label: "Image Library", labelAr: "مكتبة الصور" }
            ]} 
          />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {language === "en" ? "Image Library" : "مكتبة الصور"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {language === "en"
                  ? "Manage and organize all your uploaded images"
                  : "إدارة وتنظيم جميع الصور المحملة"}
              </p>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {language === "en" ? "Upload Image" : "تحميل صورة"}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "en" ? "Search images..." : "البحث عن الصور..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Image Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : mediaItems && mediaItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square relative bg-muted">
                  <img
                    src={image.url}
                    alt={image.altText || image.title || ""}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate mb-2">{image.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {image.width && image.height ? `${image.width} × ${image.height}` : "N/A"} • {formatFileSize(image.fileSize)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyUrl(image.url)}
                      className="flex-1"
                    >
                      {copiedUrl === image.url ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(image)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === "en" ? "No images found" : "لم يتم العثور على صور"}
            </p>
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Upload Image" : "تحميل صورة"}</DialogTitle>
              <DialogDescription>
                {language === "en" ? "Add a new image to your library" : "إضافة صورة جديدة إلى مكتبتك"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "en" ? "Select Image" : "اختر صورة"}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label>{language === "en" ? "Title" : "العنوان"}</Label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={language === "en" ? "Image title" : "عنوان الصورة"}
                />
              </div>
              <div>
                <Label>{language === "en" ? "Alt Text" : "النص البديل"}</Label>
                <Textarea
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  placeholder={language === "en" ? "Description for accessibility" : "وصف لإمكانية الوصول"}
                  rows={2}
                />
              </div>
              <div>
                <Label>{language === "en" ? "Tags (comma-separated)" : "الوسوم (مفصولة بفواصل)"}</Label>
                <Input
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder={language === "en" ? "hero, background, homepage" : "بطل، خلفية، الصفحة الرئيسية"}
                />
              </div>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="w-full">
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {language === "en" ? "Uploading..." : "جارٍ التحميل..."}
                  </>
                ) : (
                  <>{language === "en" ? "Upload" : "تحميل"}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Edit Image" : "تعديل الصورة"}</DialogTitle>
              <DialogDescription>
                {language === "en" ? "Update image metadata" : "تحديث بيانات الصورة"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedImage && (
                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.altText || selectedImage.title || ""}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <Label>{language === "en" ? "Title" : "العنوان"}</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>{language === "en" ? "Alt Text" : "النص البديل"}</Label>
                <Textarea
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>{language === "en" ? "Tags (comma-separated)" : "الوسوم (مفصولة بفواصل)"}</Label>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {language === "en" ? "Saving..." : "جارٍ الحفظ..."}
                  </>
                ) : (
                  <>{language === "en" ? "Save Changes" : "حفظ التغييرات"}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
