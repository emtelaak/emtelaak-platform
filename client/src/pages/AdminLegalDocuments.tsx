import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Eye,
  FileCheck,
  Search,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Breadcrumb } from "@/components/Breadcrumb";

const CATEGORIES = [
  { value: "terms_of_service", label: "Terms of Service" },
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "investment_agreement", label: "Investment Agreement" },
  { value: "shareholder_agreement", label: "Shareholder Agreement" },
  { value: "subscription_agreement", label: "Subscription Agreement" },
  { value: "risk_disclosure", label: "Risk Disclosure" },
  { value: "kyc_consent", label: "KYC Consent" },
  { value: "other", label: "Other" },
];

export default function AdminLegalDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "terms_of_service",
    version: "1.0",
    htmlContent: "",
    variables: "",
    isActive: true,
    isPublished: false,
    effectiveDate: "",
    expiryDate: "",
  });

  const { data: documents, isLoading, refetch } = trpc.legalDocuments.list.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter === "all" ? undefined : (categoryFilter as any),
  });

  const createMutation = trpc.legalDocuments.create.useMutation({
    onSuccess: () => {
      toast.success("Legal document created successfully");
      setIsCreateDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create document: ${error.message}`);
    },
  });

  const updateMutation = trpc.legalDocuments.update.useMutation({
    onSuccess: () => {
      toast.success("Legal document updated successfully");
      setIsEditDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update document: ${error.message}`);
    },
  });

  const deleteMutation = trpc.legalDocuments.delete.useMutation({
    onSuccess: () => {
      toast.success("Legal document deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const duplicateMutation = trpc.legalDocuments.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Legal document duplicated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to duplicate document: ${error.message}`);
    },
  });

  const generatePDFMutation = trpc.legalDocuments.generatePDF.useMutation({
    onSuccess: (data) => {
      toast.success("PDF generated successfully");
      // Open PDF in new tab
      window.open(data.pdfUrl, "_blank");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      category: "terms_of_service",
      version: "1.0",
      htmlContent: "",
      variables: "",
      isActive: true,
      isPublished: false,
      effectiveDate: "",
      expiryDate: "",
    });
    setSelectedDocument(null);
  };

  const handleCreate = () => {
    createMutation.mutate({
      ...formData,
      effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
    } as any);
  };

  const handleUpdate = () => {
    if (!selectedDocument) return;
    updateMutation.mutate({
      id: selectedDocument.id,
      ...formData,
      effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
    } as any);
  };

  const handleEdit = (doc: any) => {
    setSelectedDocument(doc);
    setFormData({
      name: doc.name,
      slug: doc.slug,
      category: doc.category,
      version: doc.version,
      htmlContent: doc.htmlContent,
      variables: doc.variables || "",
      isActive: doc.isActive === 1,
      isPublished: doc.isPublished === 1,
      effectiveDate: doc.effectiveDate ? new Date(doc.effectiveDate).toISOString().split('T')[0] : "",
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this legal document?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ id });
  };

  const handleGeneratePDF = (id: number) => {
    generatePDFMutation.mutate({ id });
  };

  const handlePreview = (doc: any) => {
    setSelectedDocument(doc);
    setIsPreviewDialogOpen(true);
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  return (
    <DashboardLayout>
      <Breadcrumb />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Legal Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage legal documents and generate PDFs for customers
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : documents && documents.length > 0 ? (
                documents.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{getCategoryLabel(doc.category)}</TableCell>
                    <TableCell>{doc.version}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {doc.isActive === 1 && (
                          <Badge variant="default">Active</Badge>
                        )}
                        {doc.isPublished === 1 && (
                          <Badge variant="secondary">Published</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.pdfUrl ? (
                        <FileCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground text-sm">Not generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(doc)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(doc)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleGeneratePDF(doc.id)}
                          disabled={generatePDFMutation.isPending}
                          title="Generate PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(doc.id)}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No legal documents found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isCreateDialogOpen ? "Create Legal Document" : "Edit Legal Document"}
              </DialogTitle>
              <DialogDescription>
                {isCreateDialogOpen
                  ? "Create a new legal document template"
                  : "Update the legal document details"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Terms of Service"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="terms-of-service"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version *</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="htmlContent">HTML Content *</Label>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder="<h1>Document Title</h1><p>Content...</p>"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variables">Variables (JSON array)</Label>
                <Input
                  id="variables"
                  value={formData.variables}
                  onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  placeholder='["user_name", "property_name", "amount"]'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={isCreateDialogOpen ? handleCreate : handleUpdate}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isCreateDialogOpen ? "Create" : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDocument?.name}</DialogTitle>
              <DialogDescription>
                Version {selectedDocument?.version} • {getCategoryLabel(selectedDocument?.category || "")}
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg p-6 bg-white">
              <div
                dangerouslySetInnerHTML={{ __html: selectedDocument?.htmlContent || "" }}
                className="prose max-w-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                Close
              </Button>
              {selectedDocument && (
                <Button onClick={() => handleGeneratePDF(selectedDocument.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
