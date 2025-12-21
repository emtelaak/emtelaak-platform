import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminEmailTemplates() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "custom" as any,
    subject: "",
    htmlContent: "",
    textContent: "",
    isActive: true,
  });

  // Queries
  const { data: templates, isLoading, refetch } = trpc.emailTemplates.list.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory as any : undefined,
  });

  // Mutations
  const createMutation = trpc.emailTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateMutation = trpc.emailTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      setShowEditDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteMutation = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const duplicateMutation = trpc.emailTemplates.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to duplicate template: ${error.message}`);
    },
  });

  const previewMutation = trpc.emailTemplates.preview.useMutation({
    onSuccess: (data) => {
      setPreviewHtml(data.htmlContent);
      setShowPreviewDialog(true);
    },
    onError: (error) => {
      toast.error(`Failed to generate preview: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "custom",
      subject: "",
      htmlContent: "",
      textContent: "",
      isActive: true,
    });
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      ...formData,
    });
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      isActive: template.isActive,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ id });
  };

  const handlePreview = (template: any) => {
    previewMutation.mutate({
      id: template.id,
      subject: template.subject,
      htmlContent: template.htmlContent,
      sampleData: {
        user_name: "John Doe",
        user_email: "john@example.com",
        property_name: "Sample Property",
        amount: "$10,000",
        date: new Date().toLocaleDateString(),
      },
    });
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <Breadcrumb />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Email Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage automated email notifications
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                  <SelectItem value="kyc_approved">KYC Approved</SelectItem>
                  <SelectItem value="kyc_rejected">KYC Rejected</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading templates...</p>
              </div>
            ) : templates && templates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template: any) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(template.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No templates found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a new email template for automated notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password_reset">Password Reset</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                    <SelectItem value="kyc_approved">KYC Approved</SelectItem>
                    <SelectItem value="kyc_rejected">KYC Rejected</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Welcome to {{property_name}}"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use variables like {"{{"} user_name {"}}"}, {"{{"} property_name {"}}"}, {"{{"} amount {"}}"}, {"{{"} date {"}}"}
                </p>
              </div>
              <div>
                <Label htmlFor="htmlContent">HTML Content</Label>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder="<h1>Hello {{user_name}}</h1><p>Welcome to our platform!</p>"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
                <Textarea
                  id="textContent"
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  placeholder="Hello {{user_name}}, Welcome to our platform!"
                  rows={5}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
              <DialogDescription>
                Update the email template configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password_reset">Password Reset</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                    <SelectItem value="kyc_approved">KYC Approved</SelectItem>
                    <SelectItem value="kyc_rejected">KYC Rejected</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-htmlContent">HTML Content</Label>
                <Textarea
                  id="edit-htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-textContent">Plain Text Content (Optional)</Label>
                <Textarea
                  id="edit-textContent"
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
              <DialogDescription>
                Preview with sample data
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg p-4 bg-white">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
            <DialogFooter>
              <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
