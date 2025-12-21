import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Shield, CheckCircle2 } from "lucide-react";

export default function RoleTemplateManager() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { data: templates, refetch } = trpc.adminPermissions.roleTemplates.list.useQuery();
  const createMutation = trpc.adminPermissions.roleTemplates.create.useMutation();
  const updateMutation = trpc.adminPermissions.roleTemplates.update.useMutation();
  const deleteMutation = trpc.adminPermissions.roleTemplates.delete.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    canManageUsers: false,
    canBulkUploadUsers: false,
    canEditContent: false,
    canManageProperties: false,
    canReviewKYC: false,
    canApproveInvestments: false,
    canManageTransactions: false,
    canViewFinancials: false,
    canAccessCRM: false,
    canViewAnalytics: false,
    canManageSettings: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      canManageUsers: false,
      canBulkUploadUsers: false,
      canEditContent: false,
      canManageProperties: false,
      canReviewKYC: false,
      canApproveInvestments: false,
      canManageTransactions: false,
      canViewFinancials: false,
      canAccessCRM: false,
      canViewAnalytics: false,
      canManageSettings: false,
    });
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Role template created successfully");
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      canManageUsers: template.canManageUsers,
      canBulkUploadUsers: template.canBulkUploadUsers,
      canEditContent: template.canEditContent,
      canManageProperties: template.canManageProperties,
      canReviewKYC: template.canReviewKYC,
      canApproveInvestments: template.canApproveInvestments,
      canManageTransactions: template.canManageTransactions,
      canViewFinancials: template.canViewFinancials,
      canAccessCRM: template.canAccessCRM,
      canViewAnalytics: template.canViewAnalytics,
      canManageSettings: template.canManageSettings,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTemplate) return;

    try {
      await updateMutation.mutateAsync({
        templateId: selectedTemplate.id,
        ...formData,
      });
      toast.success("Role template updated successfully");
      setEditDialogOpen(false);
      resetForm();
      setSelectedTemplate(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update template");
    }
  };

  const handleDelete = async (templateId: number, isSystem: boolean) => {
    if (isSystem) {
      toast.error("Cannot delete system templates");
      return;
    }

    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await deleteMutation.mutateAsync({ templateId });
      toast.success("Role template deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const permissionGroups = [
    {
      title: "User Management",
      permissions: [
        { key: "canManageUsers", label: "Manage Users" },
        { key: "canBulkUploadUsers", label: "Bulk Upload Users" },
      ],
    },
    {
      title: "Content Management",
      permissions: [
        { key: "canEditContent", label: "Edit Content" },
        { key: "canManageProperties", label: "Manage Properties" },
      ],
    },
    {
      title: "KYC & Verification",
      permissions: [
        { key: "canReviewKYC", label: "Review KYC" },
        { key: "canApproveInvestments", label: "Approve Investments" },
      ],
    },
    {
      title: "Financial",
      permissions: [
        { key: "canManageTransactions", label: "Manage Transactions" },
        { key: "canViewFinancials", label: "View Financials" },
      ],
    },
    {
      title: "System",
      permissions: [
        { key: "canAccessCRM", label: "Access CRM" },
        { key: "canViewAnalytics", label: "View Analytics" },
        { key: "canManageSettings", label: "Manage Settings" },
      ],
    },
  ];

  const countActivePermissions = (template: any) => {
    return Object.keys(template).filter(
      (key) => key.startsWith("can") && template[key] === true
    ).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Templates
            </CardTitle>
            <CardDescription>
              Predefined permission sets that can be applied to users
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {template.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{countActivePermissions(template)} permissions</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {!template.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id, template.isSystem)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Role Template</DialogTitle>
              <DialogDescription>
                Define a new permission template that can be applied to users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Content Manager"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this role template"
                />
              </div>

              {permissionGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <Label className="text-sm font-semibold">{group.title}</Label>
                  <div className="space-y-2 pl-4">
                    {group.permissions.map((perm) => (
                      <div key={perm.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-${perm.key}`}
                          checked={formData[perm.key as keyof typeof formData] as boolean}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, [perm.key]: checked })
                          }
                        />
                        <label
                          htmlFor={`create-${perm.key}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role Template</DialogTitle>
              <DialogDescription>
                Modify the permissions for this template
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={selectedTemplate?.isSystem}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {permissionGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <Label className="text-sm font-semibold">{group.title}</Label>
                  <div className="space-y-2 pl-4">
                    {group.permissions.map((perm) => (
                      <div key={perm.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${perm.key}`}
                          checked={formData[perm.key as keyof typeof formData] as boolean}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, [perm.key]: checked })
                          }
                        />
                        <label
                          htmlFor={`edit-${perm.key}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name}>
                Update Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
