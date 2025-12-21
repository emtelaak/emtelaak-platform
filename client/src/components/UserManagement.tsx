import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Trash2, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import BulkImportDialog from "@/components/BulkImportDialog";

interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: Date;
  lastSignedIn: Date;
}

export default function UserManagement() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    openId: "",
    name: "",
    email: "",
    phone: "",
    role: "user" as "user" | "admin" | "super_admin",
  });

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.userManagement.list.useQuery();
  
  const createMutation = trpc.userManagement.create.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      setCreateDialogOpen(false);
      resetForm();
      toast.success(language === "en" ? "User created successfully" : "تم إنشاء المستخدم بنجاح");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.userManagement.update.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      setEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success(language === "en" ? "User updated successfully" : "تم تحديث المستخدم بنجاح");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.userManagement.delete.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success(language === "en" ? "User deleted successfully" : "تم حذف المستخدم بنجاح");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      openId: "",
      name: "",
      email: "",
      phone: "",
      role: "user",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    updateMutation.mutate({
      id: selectedUser.id,
      ...formData,
    });
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    deleteMutation.mutate({ id: selectedUser.id });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      openId: user.openId,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role as "user" | "admin" | "super_admin",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.openId.toLowerCase().includes(query)
    );
  });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      super_admin: "destructive",
      admin: "default",
      user: "secondary",
    };
    return (
      <Badge variant={variants[role] || "outline"}>
        {role === "super_admin" ? (language === "en" ? "Super Admin" : "مسؤول أعلى") :
         role === "admin" ? (language === "en" ? "Admin" : "مسؤول") :
         (language === "en" ? "User" : "مستخدم")}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              {language === "en" ? "User Management" : "إدارة المستخدمين"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Create, edit, and manage platform users"
                : "إنشاء وتحرير وإدارة مستخدمي المنصة"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {language === "en" ? "Bulk Import" : "استيراد جماعي"}
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {language === "en" ? "Add User" : "إضافة مستخدم"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "en" ? "Search users..." : "البحث عن المستخدمين..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              {language === "en" ? "Loading users..." : "جاري تحميل المستخدمين..."}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "en" ? "Name" : "الاسم"}</TableHead>
                  <TableHead>{language === "en" ? "Email" : "البريد الإلكتروني"}</TableHead>
                  <TableHead>{language === "en" ? "Role" : "الدور"}</TableHead>
                  <TableHead>{language === "en" ? "Last Login" : "آخر تسجيل دخول"}</TableHead>
                  <TableHead className="text-right">{language === "en" ? "Actions" : "الإجراءات"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "-"}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {new Date(user.lastSignedIn).toLocaleDateString(language === "en" ? "en-US" : "ar-EG")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {language === "en" ? "No users found" : "لم يتم العثور على مستخدمين"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Create New User" : "إنشاء مستخدم جديد"}</DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Add a new user to the platform"
                : "إضافة مستخدم جديد إلى المنصة"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="openId">{language === "en" ? "Open ID (Required)" : "معرف مفتوح (مطلوب)"}</Label>
              <Input
                id="openId"
                value={formData.openId}
                onChange={(e) => setFormData({ ...formData, openId: e.target.value })}
                placeholder={language === "en" ? "Enter unique OpenID" : "أدخل معرف مفتوح فريد"}
              />
            </div>
            <div>
              <Label htmlFor="name">{language === "en" ? "Name" : "الاسم"}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === "en" ? "Enter name" : "أدخل الاسم"}
              />
            </div>
            <div>
              <Label htmlFor="email">{language === "en" ? "Email" : "البريد الإلكتروني"}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={language === "en" ? "Enter email" : "أدخل البريد الإلكتروني"}
              />
            </div>
            <div>
              <Label htmlFor="phone">{language === "en" ? "Phone" : "الهاتف"}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={language === "en" ? "Enter phone" : "أدخل الهاتف"}
              />
            </div>
            <div>
              <Label htmlFor="role">{language === "en" ? "Role" : "الدور"}</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{language === "en" ? "User" : "مستخدم"}</SelectItem>
                  <SelectItem value="admin">{language === "en" ? "Admin" : "مسؤول"}</SelectItem>
                  <SelectItem value="super_admin">{language === "en" ? "Super Admin" : "مسؤول أعلى"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
            <Button onClick={handleCreate} disabled={!formData.openId || createMutation.isPending}>
              {createMutation.isPending
                ? (language === "en" ? "Creating..." : "جاري الإنشاء...")
                : (language === "en" ? "Create User" : "إنشاء مستخدم")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Edit User" : "تحرير المستخدم"}</DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Update user information"
                : "تحديث معلومات المستخدم"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{language === "en" ? "Name" : "الاسم"}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">{language === "en" ? "Email" : "البريد الإلكتروني"}</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">{language === "en" ? "Phone" : "الهاتف"}</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">{language === "en" ? "Role" : "الدور"}</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{language === "en" ? "User" : "مستخدم"}</SelectItem>
                  <SelectItem value="admin">{language === "en" ? "Admin" : "مسؤول"}</SelectItem>
                  <SelectItem value="super_admin">{language === "en" ? "Super Admin" : "مسؤول أعلى"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending
                ? (language === "en" ? "Updating..." : "جاري التحديث...")
                : (language === "en" ? "Update User" : "تحديث المستخدم")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "en" ? "Are you sure?" : "هل أنت متأكد؟"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "en"
                ? `This will permanently delete the user "${selectedUser?.name || selectedUser?.email}". This action cannot be undone.`
                : `سيؤدي هذا إلى حذف المستخدم "${selectedUser?.name || selectedUser?.email}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "en" ? "Cancel" : "إلغاء"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending
                ? (language === "en" ? "Deleting..." : "جاري الحذف...")
                : (language === "en" ? "Delete" : "حذف")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkImportDialogOpen}
        onOpenChange={setBulkImportDialogOpen}
        onSuccess={() => utils.userManagement.list.invalidate()}
      />
    </Card>
  );
}
