import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as "user" | "investor" | "fundraiser" | "admin" | "super_admin",
    status: "pending_verification" as "active" | "suspended" | "pending_verification",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUserMutation = trpc.adminPermissions.users.createUser.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "User created successfully" : "تم إنشاء المستخدم بنجاح");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      status: "pending_verification",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = language === "en" ? "Name is required" : "الاسم مطلوب";
    }

    if (!formData.email.trim()) {
      newErrors.email = language === "en" ? "Email is required" : "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = language === "en" ? "Invalid email address" : "عنوان بريد إلكتروني غير صالح";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createUserMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role,
      status: formData.status,
    });
  };

  const handleClose = () => {
    if (!createUserMutation.isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {language === "en" ? "Create New User" : "إنشاء مستخدم جديد"}
          </DialogTitle>
          <DialogDescription>
            {language === "en"
              ? "Add a new user to the platform. Fill in the required information below."
              : "أضف مستخدمًا جديدًا إلى المنصة. املأ المعلومات المطلوبة أدناه."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === "en" ? "Full Name" : "الاسم الكامل"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === "en" ? "Enter full name" : "أدخل الاسم الكامل"}
              disabled={createUserMutation.isPending}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {language === "en" ? "Email Address" : "البريد الإلكتروني"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={language === "en" ? "Enter email address" : "أدخل البريد الإلكتروني"}
              disabled={createUserMutation.isPending}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === "en" ? "Phone Number" : "رقم الهاتف"} <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={language === "en" ? "Enter phone number" : "أدخل رقم الهاتف"}
              disabled={createUserMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              {language === "en" ? "User Role" : "دور المستخدم"} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              disabled={createUserMutation.isPending}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{language === "en" ? "User" : "مستخدم"}</SelectItem>
                <SelectItem value="investor">{language === "en" ? "Investor" : "مستثمر"}</SelectItem>
                <SelectItem value="fundraiser">{language === "en" ? "Fundraiser" : "جامع تبرعات"}</SelectItem>
                <SelectItem value="admin">{language === "en" ? "Admin" : "مسؤول"}</SelectItem>
                <SelectItem value="super_admin">{language === "en" ? "Super Admin" : "مسؤول رئيسي"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              {language === "en" ? "Account Status" : "حالة الحساب"} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              disabled={createUserMutation.isPending}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{language === "en" ? "Active" : "نشط"}</SelectItem>
                <SelectItem value="pending_verification">{language === "en" ? "Pending Verification" : "في انتظار التحقق"}</SelectItem>
                <SelectItem value="suspended">{language === "en" ? "Suspended" : "معلق"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createUserMutation.isPending}
            >
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "en" ? "Create User" : "إنشاء مستخدم"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
