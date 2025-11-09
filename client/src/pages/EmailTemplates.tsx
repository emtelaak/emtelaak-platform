import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function EmailTemplates() {
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const { data: templates, isLoading } = trpc.admin.emailTemplates.list.useQuery();
  const deleteMutation = trpc.admin.emailTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync({ id: deleteId });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      password_reset: "Password Reset",
      invoice: "Invoice",
      payment_confirmation: "Payment Confirmation",
      kyc_approved: "KYC Approved",
      kyc_rejected: "KYC Rejected",
      custom: "Custom",
    };
    return labels[type] || type;
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage and customize email templates</p>
        </div>
        <Button onClick={() => navigate("/admin/email-template-editor")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading templates...</div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getTypeLabel(template.type)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {template.isActive && (
                      <Badge variant="default">Active</Badge>
                    )}
                    {template.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Subject:</p>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/email-template-editor?id=${template.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(template.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No email templates found</p>
            <Button onClick={() => navigate("/admin/email-template-editor")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this email template? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="border rounded-lg p-4">
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="font-semibold">{previewTemplate.subject}</p>
              </div>
              <div dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
