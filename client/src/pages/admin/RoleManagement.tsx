import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, Shield, Search, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import PermissionMatrix from "@/components/admin/PermissionMatrix";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function RoleManagement() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  // Queries
  const { data: roles, refetch: refetchRoles } = trpc.adminRoles.list.useQuery();
  const { data: permissions } = trpc.adminPermissions.permissions.list.useQuery();

  // Mutations
  const createRoleMutation = trpc.adminRoles.create.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      setCreateDialogOpen(false);
      setNewRole({ name: "", description: "" });
      refetchRoles();
    },
    onError: (error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });

  const updateRoleMutation = trpc.adminRoles.update.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      setEditDialogOpen(false);
      setSelectedRole(null);
      refetchRoles();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const deleteRoleMutation = trpc.adminRoles.delete.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedRole(null);
      refetchRoles();
    },
    onError: (error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    createRoleMutation.mutate(newRole);
  };

  const handleUpdateRole = (permissionIds: number[]) => {
    if (!selectedRole) return;
    updateRoleMutation.mutate({
      roleId: selectedRole.id,
      name: selectedRole.name,
      description: selectedRole.description,
      permissionIds,
    });
  };

  const handleDeleteRole = () => {
    if (!selectedRole) return;
    deleteRoleMutation.mutate({ roleId: selectedRole.id });
  };

  const filteredRoles = roles?.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Breadcrumb 
        items={[
          { label: "Admin", labelAr: "الإدارة", href: "/admin/dashboard" },
          { label: "Role Management", labelAr: "إدارة الأدوار" }
        ]} 
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage roles with granular permissions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            {filteredRoles?.length || 0} role(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles?.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description || "No description"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {role.permissionCount || 0} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{role.userCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={role.isSystem}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredRoles || filteredRoles.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No roles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign permissions to it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Content Manager"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role and its responsibilities"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
              {createRoleMutation.isPending ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Assign permissions to this role using the matrix below
            </DialogDescription>
          </DialogHeader>
          {selectedRole && permissions && (
            <PermissionMatrix
              roleId={selectedRole.id}
              permissions={permissions as Array<{ id: number; name: string; description: string; category: string }>}
              onSave={handleUpdateRole}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
