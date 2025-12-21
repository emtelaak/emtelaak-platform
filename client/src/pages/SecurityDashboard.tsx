import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Ban, Activity, Download, Search, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useSecurityNotifications } from "@/hooks/useSocket";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function SecurityDashboard() {
  const { t, language } = useLanguage();
  
  // Real-time security event notifications
  const handleSecurityEvent = useCallback((event: any) => {
    const eventTypeLabels: Record<string, { en: string; ar: string }> = {
      failed_login: { en: "Failed Login", ar: "فشل تسجيل الدخول" },
      account_lockout: { en: "Account Lockout", ar: "حظر الحساب" },
      rate_limit_hit: { en: "Rate Limit Hit", ar: "تجاوز الحد" },
      suspicious_activity: { en: "Suspicious Activity", ar: "نشاط مشبوه" },
      password_reset_request: { en: "Password Reset", ar: "إعادة تعيين كلمة المرور" },
      unauthorized_access_attempt: { en: "Unauthorized Access", ar: "محاولة وصول غير مصرح" },
      "2fa_failed": { en: "2FA Failed", ar: "فشل المصادقة الثنائية" },
    };

    const eventLabel = eventTypeLabels[event.eventType] || { en: event.eventType, ar: event.eventType };
    const title = language === "en" 
      ? `🚨 Security Alert: ${eventLabel.en}`
      : `🚨 تنبيه أمني: ${eventLabel.ar}`;
    
    const message = language === "en"
      ? `${event.severity.toUpperCase()} - IP: ${event.ipAddress || "Unknown"}`
      : `${event.severity.toUpperCase()} - IP: ${event.ipAddress || "غير معروف"}`;

    // Show toast notification
    if (event.severity === "critical") {
      toast.error(title, { description: message, duration: 10000 });
    } else {
      toast.warning(title, { description: message, duration: 5000 });
    }

    // Play notification sound
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Ignore audio errors
    }

    // Refetch events to update the table
    refetchEvents();
    refetchStats();
  }, [language]);

  const { isConnected } = useSecurityNotifications(handleSecurityEvent);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.security.getStats.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: events, refetch: refetchEvents, isLoading } = trpc.security.getEvents.useQuery({
    eventType: eventTypeFilter !== "all" ? (eventTypeFilter as any) : undefined,
    severity: severityFilter !== "all" ? (severityFilter as any) : undefined,
    resolved: resolvedFilter === "all" ? undefined : resolvedFilter === "resolved",
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 100,
  });

  const { data: topIPs } = trpc.security.getTopIPs.useQuery({ limit: 5 });

  const resolveEventMutation = trpc.security.resolveEvent.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Event resolved successfully" : "تم حل الحدث بنجاح");
      refetchEvents();
      refetchStats();
    },
    onError: () => {
      toast.error(language === "en" ? "Failed to resolve event" : "فشل حل الحدث");
    },
  });

  const handleResolveEvent = (eventId: number) => {
    resolveEventMutation.mutate({ eventId });
  };

  const handleExportCSV = () => {
    if (!events || events.length === 0) {
      toast.error(language === "en" ? "No data to export" : "لا توجد بيانات للتصدير");
      return;
    }

    const headers = ["ID", "Event Type", "Severity", "IP Address", "Email", "User Agent", "Endpoint", "Created At", "Resolved"];
    const rows = events.map(({ event }) => [
      event.id,
      event.eventType,
      event.severity,
      event.ipAddress || "",
      event.email || "",
      event.userAgent || "",
      event.endpoint || "",
      format(new Date(event.createdAt), "yyyy-MM-dd HH:mm:ss"),
      event.resolved ? "Yes" : "No",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-events-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(language === "en" ? "CSV exported successfully" : "تم تصدير CSV بنجاح");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "failed_login":
        return <XCircle className="h-4 w-4" />;
      case "account_lockout":
        return <Ban className="h-4 w-4" />;
      case "rate_limit_hit":
        return <AlertTriangle className="h-4 w-4" />;
      case "suspicious_activity":
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <Breadcrumb />
      <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "en" ? "Security Dashboard" : "لوحة الأمان"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">
              {language === "en"
                ? "Monitor security events and threats"
                : "مراقبة الأحداث الأمنية والتهديدات"}
            </p>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`} />
              <span className="text-xs text-muted-foreground">
                {isConnected 
                  ? (language === "en" ? "Live" : "مباشر")
                  : (language === "en" ? "Offline" : "غير متصل")
                }
              </span>
            </div>
          </div>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {language === "en" ? "Export CSV" : "تصدير CSV"}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "en" ? "Total Events" : "إجمالي الأحداث"}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "en" ? "Failed Logins" : "محاولات تسجيل دخول فاشلة"}
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedLogins || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "en" ? "Account Lockouts" : "حظر الحسابات"}
            </CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.accountLockouts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "en" ? "Critical Events" : "أحداث حرجة"}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.criticalEvents || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Offending IPs */}
      {topIPs && topIPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "en" ? "Top Offending IP Addresses" : "أكثر عناوين IP المخالفة"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "IP addresses with the most security events"
                : "عناوين IP التي لديها أكثر الأحداث الأمنية"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topIPs.map((ip, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono">{ip.ipAddress}</span>
                  <Badge variant="destructive">{ip.eventCount} events</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "en" ? "Filters" : "الفلاتر"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === "en" ? "Event Type" : "نوع الحدث"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Types" : "كل الأنواع"}</SelectItem>
                <SelectItem value="failed_login">
                  {language === "en" ? "Failed Login" : "فشل تسجيل الدخول"}
                </SelectItem>
                <SelectItem value="account_lockout">
                  {language === "en" ? "Account Lockout" : "حظر الحساب"}
                </SelectItem>
                <SelectItem value="rate_limit_hit">
                  {language === "en" ? "Rate Limit" : "تجاوز الحد"}
                </SelectItem>
                <SelectItem value="suspicious_activity">
                  {language === "en" ? "Suspicious Activity" : "نشاط مشبوه"}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === "en" ? "Severity" : "الخطورة"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Severities" : "كل المستويات"}</SelectItem>
                <SelectItem value="low">{language === "en" ? "Low" : "منخفض"}</SelectItem>
                <SelectItem value="medium">{language === "en" ? "Medium" : "متوسط"}</SelectItem>
                <SelectItem value="high">{language === "en" ? "High" : "عالي"}</SelectItem>
                <SelectItem value="critical">{language === "en" ? "Critical" : "حرج"}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === "en" ? "Status" : "الحالة"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All" : "الكل"}</SelectItem>
                <SelectItem value="resolved">{language === "en" ? "Resolved" : "محلول"}</SelectItem>
                <SelectItem value="unresolved">{language === "en" ? "Unresolved" : "غير محلول"}</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "en" ? "Search IP, email..." : "بحث IP، البريد..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "en" ? "Security Events" : "الأحداث الأمنية"}</CardTitle>
          <CardDescription>
            {language === "en"
              ? "Recent security events and incidents"
              : "الأحداث والحوادث الأمنية الأخيرة"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "en" ? "Loading..." : "جاري التحميل..."}
            </div>
          ) : events && events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "en" ? "Type" : "النوع"}</TableHead>
                    <TableHead>{language === "en" ? "Severity" : "الخطورة"}</TableHead>
                    <TableHead>{language === "en" ? "IP Address" : "عنوان IP"}</TableHead>
                    <TableHead>{language === "en" ? "Email" : "البريد"}</TableHead>
                    <TableHead>{language === "en" ? "Date" : "التاريخ"}</TableHead>
                    <TableHead>{language === "en" ? "Status" : "الحالة"}</TableHead>
                    <TableHead>{language === "en" ? "Actions" : "الإجراءات"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events
                    .filter(({ event }) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        event.ipAddress?.toLowerCase().includes(query) ||
                        event.email?.toLowerCase().includes(query) ||
                        event.userAgent?.toLowerCase().includes(query)
                      );
                    })
                    .map(({ event, user }) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventTypeIcon(event.eventType)}
                            <span className="capitalize">{event.eventType.replace(/_/g, " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(event.severity) as any}>
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{event.ipAddress || "-"}</span>
                        </TableCell>
                        <TableCell>{event.email || user?.email || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(event.createdAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {event.resolved ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {language === "en" ? "Resolved" : "محلول"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              {language === "en" ? "Pending" : "قيد الانتظار"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!event.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveEvent(event.id)}
                              disabled={resolveEventMutation.isPending}
                            >
                              {language === "en" ? "Resolve" : "حل"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === "en" ? "No security events found" : "لم يتم العثور على أحداث أمنية"}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
