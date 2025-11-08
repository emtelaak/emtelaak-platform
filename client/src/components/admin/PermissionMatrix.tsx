import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface PermissionMatrixProps {
  roleId: number;
  permissions: Permission[];
  onSave: (permissionIds: number[]) => void;
  onCancel: () => void;
}

export default function PermissionMatrix({
  roleId,
  permissions,
  onSave,
  onCancel,
}: PermissionMatrixProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current role permissions
  const { data: rolePermissions, isLoading } = trpc.adminRoles.getPermissions.useQuery({
    roleId,
  });

  useEffect(() => {
    if (rolePermissions) {
      setSelectedPermissions(new Set(rolePermissions.map((p) => p.id)));
    }
  }, [rolePermissions]);

  const togglePermission = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(Array.from(selectedPermissions));
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Category display names
  const categoryNames: Record<string, string> = {
    user_management: "User Management",
    investment_management: "Investment Management",
    property_management: "Property Management",
    kyc_management: "KYC Management",
    financial_management: "Financial Management",
    system_management: "System Management",
  };

  // Category colors
  const categoryColors: Record<string, string> = {
    user_management: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    investment_management: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    property_management: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    kyc_management: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    financial_management: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    system_management: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedCount = selectedPermissions.size;
  const totalCount = permissions.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm font-medium">Selected Permissions</p>
          <p className="text-2xl font-bold">
            {selectedCount} / {totalCount}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {Math.round((selectedCount / totalCount) * 100)}% Complete
        </Badge>
      </div>

      {/* Permission Categories */}
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
          const categorySelected = categoryPermissions.filter((p) =>
            selectedPermissions.has(p.id)
          ).length;
          const categoryTotal = categoryPermissions.length;

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {categoryNames[category] || category}
                    </CardTitle>
                    <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                      {categorySelected} / {categoryTotal}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSelected = new Set(selectedPermissions);
                      const allSelected = categoryPermissions.every((p) =>
                        selectedPermissions.has(p.id)
                      );
                      categoryPermissions.forEach((p) => {
                        if (allSelected) {
                          newSelected.delete(p.id);
                        } else {
                          newSelected.add(p.id);
                        }
                      });
                      setSelectedPermissions(newSelected);
                    }}
                  >
                    {categoryPermissions.every((p) => selectedPermissions.has(p.id))
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                <CardDescription>
                  Manage permissions for {categoryNames[category]?.toLowerCase() || category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryPermissions.map((permission) => {
                    const isSelected = selectedPermissions.has(permission.id);
                    return (
                      <div
                        key={permission.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-primary/5 border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{permission.name}</p>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                        </div>
                        <Switch
                          checked={isSelected}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Permissions"
          )}
        </Button>
      </div>
    </div>
  );
}
