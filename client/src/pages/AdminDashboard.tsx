import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Shield,
  Activity,
  Settings,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  UserCog,
  Eye,
  Key,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { FloatingActionButton, adminQuickActions } from "@/components/FloatingActionButton";
import { useLocation } from "wouter";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);

  const { data: stats, isLoading: statsLoading } = trpc.adminPermissions.dashboard.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin") }
  );

  const { data: usersList, isLoading: usersLoading, refetch: refetchUsers } = trpc.adminPermissions.users.list.useQuery(
    {
      search: searchQuery || undefined,
      role: roleFilter !== "all" ? (roleFilter as any) : undefined,
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      limit: 50,
      offset: 0,
    },
    { enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin") }
  );

  const updateRoleMutation = trpc.adminPermissions.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetchUsers();
      setShowUserDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

    const updateStatusMutation = trpc.adminPermissions.users.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated successfully");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendPasswordResetMutation = trpc.adminPermissions.users.sendPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Password reset email sent successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t.nav.login}</CardTitle>
            <CardDescription>
              {t.admin.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={"/login"}>
              <Button className="w-full">{t.nav.login}</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">{t.nav.home}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleViewUser = (userData: any) => {
    setSelectedUser(userData);
    setShowUserDialog(true);
  };

  const handleUpdateRole = (newRole: string) => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole as any,
    });
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedUser) return;
    updateStatusMutation.mutate({
      userId: selectedUser.id,
      status: newStatus as any,
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <MobileNav />
            <Link href="/">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{t.admin.title}</h1>
                <Badge variant="default">{user.role === "super_admin" ? t.roles.superAdmin : t.roles.admin}</Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                {t.admin.subtitle}
              </p>
            </div>
            <LanguageSwitcher />
            <div className="flex gap-2">
              {user.role === "super_admin" && (
                <>
                  <Link href="/admin/role-management">
                    <Button variant="outline">
                      <Shield className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                      {t.admin.roles.title}
                    </Button>
                  </Link>
                  <Link href="/admin/permissions">
                    <Button variant="outline">
                      <UserCog className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                      {t.admin.permissions.title}
                    </Button>
                  </Link>
                  <Link href="/admin/invoices">
                    <Button variant="outline">
                      <FileText className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                      {t.admin.invoices.title}
                    </Button>
                  </Link>
                  <Link href="/admin/settings">
                    <Button variant="outline">
                      <Settings className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                      {t.nav.settings}
                    </Button>
                  </Link>
                </>
              )}
              <Button variant="outline" onClick={() => logout()}>
                {t.common.logout}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Breadcrumb />
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.admin.stats.totalUsers}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.common.registeredOnPlatform || "Registered on the platform"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.admin.stats.activeUsers || "Active Users"}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.common.verifiedAndActive || "Verified and active"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.admin.stats.pendingKYC}</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.pendingKyc || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.common.awaitingVerification || "Awaiting verification"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{t.admin.users.title}</CardTitle>
                  <CardDescription>
                    {t.admin.users.description || "View and manage user accounts, roles, and permissions"}
                  </CardDescription>
                </div>
                <Link href="/admin/roles">
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    {t.admin.roles.manageRoles || "Manage Roles"}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.admin.users.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.admin.users.filterByRole || "Filter by role"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.common.allRoles || "All Roles"}</SelectItem>
                    <SelectItem value="user">{t.roles.user}</SelectItem>
                    <SelectItem value="investor">{t.roles.investor}</SelectItem>
                    <SelectItem value="fund_manager">{t.roles.fundraiser}</SelectItem>
                    <SelectItem value="admin">{t.roles.admin}</SelectItem>
                    <SelectItem value="super_admin">{t.roles.superAdmin}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.admin.users.filterByStatus || "Filter by status"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.common.allStatus || "All Status"}</SelectItem>
                    <SelectItem value="active">{t.common.active || "Active"}</SelectItem>
                    <SelectItem value="pending_verification">{t.common.pending || "Pending"}</SelectItem>
                    <SelectItem value="suspended">{t.common.suspended || "Suspended"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.admin.users.name}</TableHead>
                      <TableHead>{t.admin.users.email}</TableHead>
                      <TableHead>{t.admin.users.role}</TableHead>
                      <TableHead>{t.admin.users.status}</TableHead>
                      <TableHead>{t.common.joined || "Joined"}</TableHead>
                      <TableHead className="text-right">{t.admin.users.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : usersList && usersList.length > 0 ? (
                      usersList.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name || "N/A"}</TableCell>
                          <TableCell>{u.email || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "super_admin" || u.role === "admin" ? "default" : "secondary"}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                u.status === "active"
                                  ? "default"
                                  : u.status === "suspended"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(u)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user information, role, and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Login Method</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.loginMethod || "N/A"}</p>
                </div>
              </div>

              {user?.role === "super_admin" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Change Role</label>
                    <Select
                      value={selectedUser.role}
                      onValueChange={handleUpdateRole}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="fund_manager">Fundraiser</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Change Status</label>
                    <Select
                      value={selectedUser.status}
                      onValueChange={handleUpdateStatus}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending_verification">Pending Verification</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUser.email && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (confirm(`Send password reset email to ${selectedUser.email}?`)) {
                            sendPasswordResetMutation.mutate({ userId: selectedUser.id });
                          }
                        }}
                        disabled={sendPasswordResetMutation.isPending}
                      >
                        {sendPasswordResetMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="mr-2 h-4 w-4" />
                        )}
                        Send Password Reset Email
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateUserDialog}
        onOpenChange={setShowCreateUserDialog}
        onSuccess={refetchUsers}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        actions={adminQuickActions({
          onCreateUser: () => {
            setShowCreateUserDialog(true);
          },
          onReviewProperties: () => {
            window.location.href = "/admin/property-management";
          },
          onNewLead: () => {
            window.location.href = "/crm/leads";
          },
          onNewCase: () => {
            window.location.href = "/crm/cases";
          },
        })}
      />
      </div>
    </DashboardLayout>
  );
}
