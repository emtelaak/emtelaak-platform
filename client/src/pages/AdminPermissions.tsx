import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { APP_LOGO } from "@/const";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2, Shield, Check, X } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";

export default function AdminPermissions() {
  const { user, isAuthenticated } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingUsers, setExportingUsers] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);

  const { data: usersList, isLoading: usersLoading, refetch: refetchUsers } = trpc.adminPermissions.users.list.useQuery(
    {
      search: searchQuery || undefined,
      limit: 100,
      offset: 0,
    },
    { enabled: isAuthenticated && user?.role === "super_admin" }
  );

  const { data: allPermissions } = trpc.adminPermissions.permissions.list.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "super_admin" }
  );

  const { data: userPermissions, refetch: refetchUserPermissions } = trpc.adminPermissions.users.getPermissions.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  const assignPermissionMutation = trpc.adminPermissions.users.assignPermission.useMutation({
    onSuccess: () => {
      toast.success("Permission assigned");
      refetchUserPermissions();
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const removePermissionMutation = trpc.adminPermissions.users.removePermission.useMutation({
    onSuccess: () => {
      toast.success("Permission removed");
      refetchUserPermissions();
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const exportUsersMutation = trpc.adminPermissions.export.users.useQuery(
    {},
    { enabled: false }
  );

  const exportAuditLogsMutation = trpc.adminPermissions.export.auditLogs.useQuery(
    { limit: 10000 },
    { enabled: false }
  );

  const selectedUser = usersList?.find(u => u.id === selectedUserId);

  const handleExportUsers = async () => {
    setExportingUsers(true);
    try {
      const result = await exportUsersMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Users exported successfully");
      }
    } catch (error) {
      toast.error("Failed to export users");
    } finally {
      setExportingUsers(false);
    }
  };

  const handleExportAuditLogs = async () => {
    setExportingLogs(true);
    try {
      const result = await exportAuditLogsMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Audit logs exported successfully");
      }
    } catch (error) {
      toast.error("Failed to export audit logs");
    } finally {
      setExportingLogs(false);
    }
  };

  const handleTogglePermission = (permissionId: number, hasPermission: boolean) => {
    if (!selectedUserId) return;

    if (hasPermission) {
      removePermissionMutation.mutate({ userId: selectedUserId, permissionId });
    } else {
      assignPermissionMutation.mutate({ userId: selectedUserId, permissionId });
    }
  };

  // Group permissions by category
  const permissionsByCategory = allPermissions?.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  if (!isAuthenticated || user?.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src={APP_LOGO} alt="Emtelaak" className="h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1">
              <Breadcrumb 
                items={[
                  { label: "Admin", labelAr: "الإدارة", href: "/admin/dashboard" },
                  { label: "Permissions", labelAr: "الصلاحيات" }
                ]} 
              />
              <h1 className="text-3xl font-bold">Permissions Management</h1>
              <p className="text-muted-foreground mt-2">
                Visually manage user permissions and export data
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportUsers}
                disabled={exportingUsers}
              >
                {exportingUsers ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export Users
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAuditLogs}
                disabled={exportingLogs}
              >
                {exportingLogs ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export Audit Logs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* User Selection */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Select User</CardTitle>
                <CardDescription>
                  Choose a user to manage their permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : usersList && usersList.length > 0 ? (
                    usersList.map((u) => (
                      <div
                        key={u.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUserId === u.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <div className="font-medium">{u.name || "N/A"}</div>
                        <div className="text-sm opacity-80">{u.email || "N/A"}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={selectedUserId === u.id ? "secondary" : "default"} className="text-xs">
                            {u.role}
                          </Badge>
                          <Badge variant={selectedUserId === u.id ? "secondary" : "outline"} className="text-xs">
                            {u.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions Matrix */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>
                      {selectedUser ? `Permissions for ${selectedUser.name}` : "Permissions Matrix"}
                    </CardTitle>
                    <CardDescription>
                      {selectedUser
                        ? "Toggle permissions on/off for this user"
                        : "Select a user to manage their permissions"}
                    </CardDescription>
                  </div>
                  {selectedUser && (
                    <Badge variant="default">{selectedUser.role}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedUserId ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Shield className="h-16 w-16 mb-4 opacity-20" />
                    <p>Select a user from the list to manage permissions</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {permissionsByCategory && Object.entries(permissionsByCategory).map(([category, perms]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 capitalize flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {category}
                        </h3>
                        <div className="space-y-3">
                          {perms.map((perm) => {
                            const hasPermission = userPermissions?.includes(perm.name);
                            const isLoading = assignPermissionMutation.isPending || removePermissionMutation.isPending;

                            return (
                              <div
                                key={perm.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{perm.name}</div>
                                  <div className="text-sm text-muted-foreground">{perm.description}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {hasPermission ? (
                                    <Badge variant="default" className="gap-1">
                                      <Check className="h-3 w-3" />
                                      Granted
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="gap-1">
                                      <X className="h-3 w-3" />
                                      Denied
                                    </Badge>
                                  )}
                                  <Switch
                                    checked={hasPermission || false}
                                    onCheckedChange={() => handleTogglePermission(perm.id, hasPermission || false)}
                                    disabled={isLoading}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
