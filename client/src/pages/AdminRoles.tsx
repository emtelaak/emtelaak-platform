import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { APP_LOGO } from "@/const";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Shield, Plus, Edit, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminRoles() {
  const { user, isAuthenticated } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = trpc.adminPermissions.roles.list.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "super_admin" }
  );

  const { data: permissions, isLoading: permissionsLoading } = trpc.adminPermissions.permissions.list.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "super_admin" }
  );

  const { data: rolePermissions, refetch: refetchRolePermissions } = trpc.adminPermissions.roles.getPermissions.useQuery(
    { roleId: selectedRole?.id },
    { enabled: !!selectedRole }
  );

  const createRoleMutation = trpc.adminPermissions.roles.create.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      refetchRoles();
      setShowCreateDialog(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions([]);
    },
    onError: (error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });

  const updateRoleMutation = trpc.adminPermissions.roles.setPermissions.useMutation({
    onSuccess: () => {
      toast.success("Role permissions updated successfully");
      refetchRoles();
      refetchRolePermissions();
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to update permissions: ${error.message}`);
    },
  });

  const deleteRoleMutation = trpc.adminPermissions.roles.delete.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      refetchRoles();
    },
    onError: (error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });

  if (!isAuthenticated || user?.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Breadcrumb />
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need super admin privileges to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard">
              <Button className="w-full">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    createRoleMutation.mutate({
      name: newRoleName,
      description: newRoleDescription,
      permissionIds: selectedPermissions,
    });
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setShowEditDialog(true);
  };

  const handleUpdatePermissions = () => {
    if (!selectedRole) return;
    updateRoleMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: selectedPermissions,
    });
  };

  const handleDeleteRole = (roleId: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate({ roleId });
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Group permissions by category
  const permissionsByCategory = permissions?.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <img src={APP_LOGO} alt="Emtelaak" className="h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Role Management</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage roles with custom permissions
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Manage platform roles and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolesLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : roles && roles.length > 0 ? (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <Badge variant={role.isSystem ? "default" : "secondary"}>
                            {role.isSystem ? "System" : "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {!role.isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={deleteRoleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No roles found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with custom permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Role Name</label>
              <Input
                placeholder="e.g., Content Manager"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Describe the role's responsibilities..."
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Permissions</label>
              {permissionsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="space-y-4">
                  {permissionsByCategory && Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 capitalize">{category}</h4>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`perm-${perm.id}`}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {perm.name}
                              <span className="text-muted-foreground ml-2">- {perm.description}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
              {createRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setSelectedRole(null);
          setSelectedPermissions([]);
        } else if (selectedRole && rolePermissions) {
          setSelectedPermissions(rolePermissions.map(p => p.id));
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Modify permissions for this role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Permissions</label>
              {permissionsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="space-y-4">
                  {permissionsByCategory && Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 capitalize">{category}</h4>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-perm-${perm.id}`}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <label
                              htmlFor={`edit-perm-${perm.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {perm.name}
                              <span className="text-muted-foreground ml-2">- {perm.description}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
