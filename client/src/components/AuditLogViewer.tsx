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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Search, Filter, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

export default function AuditLogViewer() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const utils = trpc.useUtils();

  const { data: auditLogs, isLoading, refetch } = trpc.adminPermissions.auditLogs.list.useQuery({
    limit,
    offset,
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await utils.adminPermissions.export.auditLogs.fetch({ limit: 1000 });
      // Create a blob from the CSV data
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (!action) return "outline";
    if (action.includes("created")) return "default";
    if (action.includes("updated")) return "secondary";
    if (action.includes("deleted")) return "destructive";
    return "outline";
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, { en: string; ar: string }> = {
      "user.created": { en: "User Created", ar: "إنشاء مستخدم" },
      "user.updated": { en: "User Updated", ar: "تحديث مستخدم" },
      "user.deleted": { en: "User Deleted", ar: "حذف مستخدم" },
      "user.role.changed": { en: "Role Changed", ar: "تغيير الدور" },
      "user.status.changed": { en: "Status Changed", ar: "تغيير الحالة" },
      "user.permission.assigned": { en: "Permission Assigned", ar: "تعيين إذن" },
      "user.permission.removed": { en: "Permission Removed", ar: "إزالة إذن" },
      "role.created": { en: "Role Created", ar: "إنشاء دور" },
      "role.updated": { en: "Role Updated", ar: "تحديث دور" },
      "role.deleted": { en: "Role Deleted", ar: "حذف دور" },
      "role.permissions.updated": { en: "Role Permissions Updated", ar: "تحديث أذونات الدور" },
      "role_template.created": { en: "Template Created", ar: "إنشاء قالب" },
      "role_template.updated": { en: "Template Updated", ar: "تحديث قالب" },
      "role_template.deleted": { en: "Template Deleted", ar: "حذف قالب" },
      "role_template.applied": { en: "Template Applied", ar: "تطبيق قالب" },
      "permissions.updated": { en: "Permissions Updated", ar: "تحديث الأذونات" },
      "property.created": { en: "Property Created", ar: "إنشاء عقار" },
      "property.updated": { en: "Property Updated", ar: "تحديث عقار" },
      "property.deleted": { en: "Property Deleted", ar: "حذف عقار" },
      "settings.updated": { en: "Settings Updated", ar: "تحديث الإعدادات" },
      "content.updated": { en: "Content Updated", ar: "تحديث المحتوى" },
    };

    if (!action) return "N/A";
    const mapped = actionMap[action];
    return mapped ? (language === "en" ? mapped.en : mapped.ar) : action;
  };

  // Transform the nested structure to flat structure with null safety
  const transformedLogs = auditLogs?.map((item) => ({
    id: item?.log?.id || 0,
    userId: item?.log?.userId || 0,
    action: item?.log?.action || "",
    targetType: item?.log?.targetType || null,
    targetId: item?.log?.targetId || null,
    details: item?.log?.details || null,
    createdAt: item?.log?.createdAt || null,
    userName: item?.user?.name || "Unknown",
    userEmail: item?.user?.email || "",
  })) || [];

  const filteredLogs = transformedLogs?.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action?.startsWith(actionFilter);

    return matchesSearch && matchesAction;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === "en" ? "Loading audit logs..." : "جاري تحميل سجلات التدقيق..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>
                {language === "en" ? "Audit Logs" : "سجلات التدقيق"}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Track all administrative actions and changes"
                  : "تتبع جميع الإجراءات والتغييرات الإدارية"}
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {language === "en" ? "Export CSV" : "تصدير CSV"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "en" ? "Search logs..." : "البحث في السجلات..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "en" ? "All Actions" : "جميع الإجراءات"}
              </SelectItem>
              <SelectItem value="user">
                {language === "en" ? "User Actions" : "إجراءات المستخدم"}
              </SelectItem>
              <SelectItem value="role">
                {language === "en" ? "Role Actions" : "إجراءات الدور"}
              </SelectItem>
              <SelectItem value="role_template">
                {language === "en" ? "Template Actions" : "إجراءات القالب"}
              </SelectItem>
              <SelectItem value="permissions">
                {language === "en" ? "Permission Actions" : "إجراءات الأذونات"}
              </SelectItem>
              <SelectItem value="property">
                {language === "en" ? "Property Actions" : "إجراءات العقار"}
              </SelectItem>
              <SelectItem value="settings">
                {language === "en" ? "Settings Actions" : "إجراءات الإعدادات"}
              </SelectItem>
              <SelectItem value="content">
                {language === "en" ? "Content Actions" : "إجراءات المحتوى"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit Logs Table */}
        {!filteredLogs || filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === "en" ? "No audit logs found" : "لم يتم العثور على سجلات تدقيق"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {language === "en" ? "Timestamp" : "الوقت"}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    {language === "en" ? "User" : "المستخدم"}
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    {language === "en" ? "Action" : "الإجراء"}
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    {language === "en" ? "Target" : "الهدف"}
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    {language === "en" ? "Details" : "التفاصيل"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.createdAt ? format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{log.userName || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.targetType && (
                        <span className="text-muted-foreground">
                          {log.targetType} #{log.targetId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.details && (
                        <details className="cursor-pointer">
                          <summary className="text-primary hover:underline">
                            {language === "en" ? "View details" : "عرض التفاصيل"}
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(log.details), null, 2);
                              } catch (e) {
                                return log.details;
                              }
                            })()}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? `Showing ${offset + 1} to ${Math.min(offset + limit, filteredLogs?.length || 0)} of ${filteredLogs?.length || 0} logs`
              : `عرض ${offset + 1} إلى ${Math.min(offset + limit, filteredLogs?.length || 0)} من ${filteredLogs?.length || 0} سجل`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              {language === "en" ? "Previous" : "السابق"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={!filteredLogs || filteredLogs.length < limit}
            >
              {language === "en" ? "Next" : "التالي"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
