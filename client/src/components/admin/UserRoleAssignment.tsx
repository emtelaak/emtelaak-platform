import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

interface UserRoleAssignmentProps {
  userId: number;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function UserRoleAssignment({
  userId,
  userName,
  open,
  onOpenChange,
  onSuccess,
}: UserRoleAssignmentProps) {
  const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set());

  // Queries
  const { data: allRoles, isLoading: rolesLoading } = trpc.adminRoles.list.useQuery();
  const { data: userRoles, isLoading: userRolesLoading } = trpc.adminRoles.getUserRoles.useQuery(
    { userId },
    { enabled: open }
  );

  // Mutation
  const assignRolesMutation = trpc.adminRoles.assignRolesToUser.useMutation({
    onSuccess: () => {
      toast.success("Roles updated successfully");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update roles: ${error.message}`);
    },
  });

  // Initialize selected roles when user roles are loaded
  useState(() => {
    if (userRoles) {
      setSelectedRoles(new Set(userRoles.map((r) => r.id)));
    }
  });

  const toggleRole = (roleId: number) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const handleSave = () => {
    assignRolesMutation.mutate({
      userId,
      roleIds: Array.from(selectedRoles),
    });
  };

  const isLoading = rolesLoading || userRolesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Roles to {userName}</DialogTitle>
          <DialogDescription>
            Select the roles you want to assign to this user
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {allRoles?.map((role) => {
              const isSelected = selectedRoles.has(role.id);
              return (
                <div
                  key={role.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/5 border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                  onClick={() => toggleRole(role.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRole(role.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <p className="font-medium">{role.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {role.permissionCount || 0} permissions
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description || "No description"}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!allRoles || allRoles.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                No roles available. Create roles first.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={assignRolesMutation.isPending || isLoading}
          >
            {assignRolesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Roles"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
