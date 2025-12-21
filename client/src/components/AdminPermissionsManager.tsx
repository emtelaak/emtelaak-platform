import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPermissionsManager() {
  const { language } = useLanguage();
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const { data: permissionsList, isLoading, refetch } = trpc.adminPermissions.users.list.useQuery({});
  const { data: roleTemplates } = trpc.adminPermissions.roleTemplates.list.useQuery();
  const applyTemplateMutation = trpc.adminPermissions.roleTemplates.applyRoleTemplate.useMutation({
    onSuccess: () => {
      toast.success(
        language === "en"
          ? "Role template applied successfully"
          : "تم تطبيق قالب الدور بنجاح"
      );
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const updatePermissionsMutation = trpc.adminPermissions.users.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success(
        language === "en"
          ? "Permissions updated successfully"
          : "تم تحديث الأذونات بنجاح"
      );
      refetch();
      setUpdatingUserId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setUpdatingUserId(null);
    },
  });

  const handlePermissionToggle = (userId: number, permission: string, currentValue: boolean) => {
    setUpdatingUserId(userId);
    updatePermissionsMutation.mutate({
      userId,
      permissions: {
        [permission]: !currentValue,
      },
    });
  };

  const permissions = [
    { key: "canManageUsers", label: language === "en" ? "Manage Users" : "إدارة المستخدمين" },
    { key: "canBulkUploadUsers", label: language === "en" ? "Bulk Upload Users" : "استيراد المستخدمين بالجملة" },
    { key: "canEditContent", label: language === "en" ? "Edit Content" : "تحرير المحتوى" },
    { key: "canManageProperties", label: language === "en" ? "Manage Properties" : "إدارة العقارات" },
    { key: "canReviewKYC", label: language === "en" ? "Review KYC" : "مراجعة KYC" },
    { key: "canApproveInvestments", label: language === "en" ? "Approve Investments" : "الموافقة على الاستثمارات" },
    { key: "canManageTransactions", label: language === "en" ? "Manage Transactions" : "إدارة المعاملات" },
    { key: "canViewFinancials", label: language === "en" ? "View Financials" : "عرض البيانات المالية" },
    { key: "canAccessCRM", label: language === "en" ? "Access CRM" : "الوصول إلى CRM" },
    { key: "canViewAnalytics", label: language === "en" ? "View Analytics" : "عرض التحليلات" },
    { key: "canManageSettings", label: language === "en" ? "Manage Settings" : "إدارة الإعدادات" },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>
              {language === "en" ? "Admin Permissions" : "أذونات المسؤولين"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Manage granular permissions for admin users"
                : "إدارة الأذونات التفصيلية لمستخدمي المسؤولين"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!permissionsList || permissionsList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "en"
              ? "No admin users with permissions yet"
              : "لا يوجد مستخدمون مسؤولون بأذونات بعد"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">
                    {language === "en" ? "User" : "المستخدم"}
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    {language === "en" ? "Apply Template" : "تطبيق القالب"}
                  </TableHead>
                  {permissions.map((perm) => (
                    <TableHead key={perm.key} className="text-center min-w-[120px]">
                      {perm.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsList.map((user, index) => (
                  <TableRow key={`user-${user.id}-${index}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => {
                          applyTemplateMutation.mutate({
                            userId: user.id,
                            templateId: parseInt(value),
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={
                            language === "en" ? "Select template..." : "اختر القالب..."
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {roleTemplates?.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                {template.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {permissions.map((perm) => (
                      <TableCell key={perm.key} className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={user[perm.key as keyof typeof user] as boolean || false}
                            onCheckedChange={() =>
                              handlePermissionToggle(
                                user.id,
                                perm.key,
                                user[perm.key as keyof typeof user] as boolean || false
                              )
                            }
                            disabled={updatingUserId === user.id}
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">
            {language === "en" ? "Permission Descriptions:" : "وصف الأذونات:"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <Badge variant="outline" className="mr-2">canManageUsers</Badge>
              {language === "en" ? "Create, edit, delete users" : "إنشاء وتحرير وحذف المستخدمين"}
            </div>
            <div>
              <Badge variant="outline" className="mr-2">canBulkUploadUsers</Badge>
              {language === "en" ? "Import users from CSV" : "استيراد المستخدمين من CSV"}
            </div>
            <div>
              <Badge variant="outline" className="mr-2">canEditContent</Badge>
              {language === "en" ? "Edit platform content" : "تحرير محتوى المنصة"}
            </div>
            <div>
              <Badge variant="outline" className="mr-2">canManageProperties</Badge>
              {language === "en" ? "Manage property listings" : "إدارة قوائم العقارات"}
            </div>
            <div>
              <Badge variant="outline" className="mr-2">canReviewKYC</Badge>
              {language === "en" ? "Review and approve KYC" : "مراجعة والموافقة على KYC"}
            </div>
            <div>
              <Badge variant="outline" className="mr-2">canAccessCRM</Badge>
              {language === "en" ? "Access CRM dashboard" : "الوصول إلى لوحة CRM"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
