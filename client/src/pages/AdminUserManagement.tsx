import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Search, Shield, ShieldOff, RotateCcw, Loader2, Edit, User } from "lucide-react";
import { toast } from "sonner";
import { CustomFieldsForm } from "@/components/CustomFieldsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'toggle' | 'reset';
    userId: number;
    userName: string;
    currentStatus: boolean;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery();
  const toggleUser2FA = trpc.twoFactor.adminToggleUser2FA.useMutation({
    onSuccess: (data: { success: boolean; message: string }) => {
      toast.success(data.message);
      refetch();
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetUser2FA = trpc.twoFactor.adminResetUser2FA.useMutation({
    onSuccess: (data: { success: boolean; message: string }) => {
      toast.success(data.message);
      refetch();
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const filteredUsers = users?.filter((user: any) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.openId?.toLowerCase().includes(query)
    );
  });

  const handleToggle2FA = (userId: number, userName: string, currentStatus: boolean) => {
    setConfirmDialog({
      open: true,
      type: 'toggle',
      userId,
      userName,
      currentStatus,
    });
  };

  const handleReset2FA = (userId: number, userName: string) => {
    setConfirmDialog({
      open: true,
      type: 'reset',
      userId,
      userName,
      currentStatus: false,
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'toggle') {
      toggleUser2FA.mutate({
        userId: confirmDialog.userId,
        enabled: !confirmDialog.currentStatus,
      });
    } else if (confirmDialog.type === 'reset') {
      resetUser2FA.mutate({
        userId: confirmDialog.userId,
      });
    }
  };

  return (
    <DashboardLayout>
      <Breadcrumb />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and two-factor authentication settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage 2FA settings for all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>2FA Status</TableHead>
                      <TableHead>2FA Actions</TableHead>
                      <TableHead>Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name || "Unnamed User"}
                          </TableCell>
                          <TableCell>{user.email || "No email"}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.twoFactorEnabled ? (
                                <Badge variant="default" className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  Enabled
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <ShieldOff className="h-3 w-3" />
                                  Disabled
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.twoFactorEnabled || false}
                                onCheckedChange={() =>
                                  handleToggle2FA(
                                    user.id,
                                    user.name || "User",
                                    user.twoFactorEnabled || false
                                  )
                                }
                              />
                              {user.twoFactorEnabled && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReset2FA(user.id, user.name || "User")
                                  }
                                  className="gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setUserDetailsOpen(true);
                              }}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog?.open || false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.type === 'toggle'
                ? confirmDialog.currentStatus
                  ? 'Disable 2FA'
                  : 'Enable 2FA'
                : 'Reset 2FA'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === 'toggle' ? (
                confirmDialog.currentStatus ? (
                  <>
                    Are you sure you want to <strong>disable</strong> two-factor authentication for{" "}
                    <strong>{confirmDialog.userName}</strong>?
                    <br />
                    <br />
                    This will make their account less secure.
                  </>
                ) : (
                  <>
                    Are you sure you want to <strong>enable</strong> two-factor authentication for{" "}
                    <strong>{confirmDialog.userName}</strong>?
                    <br />
                    <br />
                    The user will need to set up 2FA on their next login.
                  </>
                )
              ) : (
                <>
                  Are you sure you want to <strong>reset</strong> two-factor authentication for{" "}
                  <strong>{confirmDialog?.userName}</strong>?
                  <br />
                  <br />
                  This will:
                  <ul className="list-disc list-inside mt-2">
                    <li>Disable 2FA for this user</li>
                    <li>Clear their 2FA secret and backup codes</li>
                    <li>Require them to set up 2FA again if needed</li>
                  </ul>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(null)}
              disabled={toggleUser2FA.isPending || resetUser2FA.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={toggleUser2FA.isPending || resetUser2FA.isPending}
              variant={confirmDialog?.type === 'reset' ? 'destructive' : 'default'}
            >
              {(toggleUser2FA.isPending || resetUser2FA.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details: {selectedUser?.name || "Unnamed User"}
            </DialogTitle>
            <DialogDescription>
              View and manage user information and custom fields
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Basic Information</TabsTrigger>
                <TabsTrigger value="custom">Custom Fields</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm mt-1">{selectedUser.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm mt-1">{selectedUser.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-sm mt-1">
                      <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                        {selectedUser.role}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">2FA Status</label>
                    <p className="text-sm mt-1">
                      <Badge variant={selectedUser.twoFactorEnabled ? 'default' : 'outline'}>
                        {selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="text-sm mt-1">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Open ID</label>
                    <p className="text-sm mt-1 truncate">{selectedUser.openId}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="mt-4">
                <CustomFieldsForm
                  module="users"
                  recordId={selectedUser.id}
                  showInContext="admin"
                />
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
