import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Ban, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function IPBlockingManagement() {
  const { t, language } = useLanguage();
  const [blockTypeFilter, setBlockTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedIPs, setSelectedIPs] = useState<Set<string>>(new Set());
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);

  // Form state for blocking IP
  const [newIPAddress, setNewIPAddress] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [expiryDays, setExpiryDays] = useState<string>("");

  // Fetch blocked IPs
  const { data: blockedIPs, isLoading, refetch } = trpc.ipBlocking.getBlockedIPs.useQuery({
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    blockType: blockTypeFilter === "all" ? undefined : (blockTypeFilter as "manual" | "automatic"),
  });

  // Mutations
  const blockIPMutation = trpc.ipBlocking.blockIP.useMutation({
    onSuccess: () => {
      toast.success(
        language === "en" ? "IP Blocked Successfully" : "تم حظر IP بنجاح",
        { description: language === "en" ? `IP ${newIPAddress} has been blocked` : `تم حظر ${newIPAddress}` }
      );
      refetch();
      setIsBlockDialogOpen(false);
      setNewIPAddress("");
      setBlockReason("");
      setExpiryDays("");
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Failed to Block IP" : "فشل حظر IP",
        { description: error.message }
      );
    },
  });

  const unblockIPMutation = trpc.ipBlocking.unblockIP.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "IP Unblocked Successfully" : "تم إلغاء حظر IP بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(language === "en" ? "Failed to Unblock IP" : "فشل إلغاء حظر IP", { description: error.message });
    },
  });

  const bulkUnblockMutation = trpc.ipBlocking.bulkUnblockIPs.useMutation({
    onSuccess: (data) => {
      toast.success(
        language === "en" ? "Bulk Unblock Complete" : "اكتمل إلغاء الحظر الجماعي",
        { description: language === "en" ? `${data.successCount} IPs unblocked` : `تم إلغاء حظر ${data.successCount} IP` }
      );
      refetch();
      setSelectedIPs(new Set());
    },
  });

  const handleBlockIP = () => {
    if (!newIPAddress) {
      toast.error(language === "en" ? "IP address is required" : "عنوان IP مطلوب");
      return;
    }

    const expiresAt = expiryDays
      ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000)
      : undefined;

    blockIPMutation.mutate({
      ipAddress: newIPAddress,
      reason: blockReason || undefined,
      expiresAt,
    });
  };

  const handleUnblockIP = (ipAddress: string) => {
    unblockIPMutation.mutate({ ipAddress });
  };

  const handleBulkUnblock = () => {
    if (selectedIPs.size === 0) {
      toast.error(language === "en" ? "No IPs selected" : "لم يتم تحديد أي IP");
      return;
    }

    bulkUnblockMutation.mutate({ ipAddresses: Array.from(selectedIPs) });
  };

  const toggleIPSelection = (ipAddress: string) => {
    const newSelection = new Set(selectedIPs);
    if (newSelection.has(ipAddress)) {
      newSelection.delete(ipAddress);
    } else {
      newSelection.add(ipAddress);
    }
    setSelectedIPs(newSelection);
  };

  const selectAllIPs = () => {
    if (!blockedIPs) return;
    const activeIPs = blockedIPs.filter(ip => ip.isActive).map(ip => ip.ipAddress);
    setSelectedIPs(new Set(activeIPs));
  };

  const deselectAllIPs = () => {
    setSelectedIPs(new Set());
  };

  return (
    <DashboardLayout>
      <Breadcrumb />
      <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "en" ? "IP Blocking Management" : "إدارة حظر IP"}
          </h1>
          <p className="text-muted-foreground">
            {language === "en"
              ? "Manage blocked IP addresses and access control"
              : "إدارة عناوين IP المحظورة والتحكم في الوصول"}
          </p>
        </div>
        <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {language === "en" ? "Block IP" : "حظر IP"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Block IP Address" : "حظر عنوان IP"}</DialogTitle>
              <DialogDescription>
                {language === "en"
                  ? "Enter the IP address you want to block and provide a reason"
                  : "أدخل عنوان IP الذي تريد حظره وقدم سببًا"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ipAddress">{language === "en" ? "IP Address" : "عنوان IP"}</Label>
                <Input
                  id="ipAddress"
                  placeholder="192.168.1.1"
                  value={newIPAddress}
                  onChange={(e) => setNewIPAddress(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reason">{language === "en" ? "Reason (Optional)" : "السبب (اختياري)"}</Label>
                <Textarea
                  id="reason"
                  placeholder={language === "en" ? "Why is this IP being blocked?" : "لماذا يتم حظر هذا IP؟"}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="expiry">{language === "en" ? "Expiry (Days, Optional)" : "انتهاء الصلاحية (أيام، اختياري)"}</Label>
                <Input
                  id="expiry"
                  type="number"
                  placeholder={language === "en" ? "Leave empty for permanent" : "اترك فارغًا للدائم"}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
                {language === "en" ? "Cancel" : "إلغاء"}
              </Button>
              <Button onClick={handleBlockIP} disabled={blockIPMutation.isPending}>
                {blockIPMutation.isPending
                  ? (language === "en" ? "Blocking..." : "جاري الحظر...")
                  : (language === "en" ? "Block IP" : "حظر IP")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "en" ? "Filters & Actions" : "التصفية والإجراءات"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>{language === "en" ? "Block Type" : "نوع الحظر"}</Label>
              <Select value={blockTypeFilter} onValueChange={setBlockTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All Types" : "جميع الأنواع"}</SelectItem>
                  <SelectItem value="manual">{language === "en" ? "Manual" : "يدوي"}</SelectItem>
                  <SelectItem value="automatic">{language === "en" ? "Automatic" : "تلقائي"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>{language === "en" ? "Status" : "الحالة"}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All" : "الكل"}</SelectItem>
                  <SelectItem value="active">{language === "en" ? "Active" : "نشط"}</SelectItem>
                  <SelectItem value="inactive">{language === "en" ? "Inactive" : "غير نشط"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" size="sm" onClick={selectAllIPs}>
                {language === "en" ? "Select All" : "تحديد الكل"}
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllIPs}>
                {language === "en" ? "Deselect All" : "إلغاء تحديد الكل"}
              </Button>
              {selectedIPs.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkUnblock}
                  disabled={bulkUnblockMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === "en" ? `Unblock ${selectedIPs.size}` : `إلغاء حظر ${selectedIPs.size}`}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "en" ? "Blocked IP Addresses" : "عناوين IP المحظورة"}</CardTitle>
          <CardDescription>
            {language === "en"
              ? `Showing ${blockedIPs?.length || 0} blocked IPs`
              : `عرض ${blockedIPs?.length || 0} IP محظور`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "en" ? "Loading..." : "جاري التحميل..."}
            </div>
          ) : !blockedIPs || blockedIPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "en" ? "No blocked IPs found" : "لم يتم العثور على IPs محظورة"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>{language === "en" ? "IP Address" : "عنوان IP"}</TableHead>
                    <TableHead>{language === "en" ? "Type" : "النوع"}</TableHead>
                    <TableHead>{language === "en" ? "Reason" : "السبب"}</TableHead>
                    <TableHead>{language === "en" ? "Blocked At" : "تاريخ الحظر"}</TableHead>
                    <TableHead>{language === "en" ? "Expires At" : "ينتهي في"}</TableHead>
                    <TableHead>{language === "en" ? "Status" : "الحالة"}</TableHead>
                    <TableHead className="text-right">{language === "en" ? "Actions" : "الإجراءات"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell>
                        {ip.isActive && (
                          <input
                            type="checkbox"
                            checked={selectedIPs.has(ip.ipAddress)}
                            onChange={() => toggleIPSelection(ip.ipAddress)}
                            className="w-4 h-4"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{ip.ipAddress}</TableCell>
                      <TableCell>
                        <Badge variant={ip.blockType === "manual" ? "default" : "secondary"}>
                          {ip.blockType === "manual"
                            ? (language === "en" ? "Manual" : "يدوي")
                            : (language === "en" ? "Automatic" : "تلقائي")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ip.reason || "-"}</TableCell>
                      <TableCell>{format(new Date(ip.blockedAt), "PPp")}</TableCell>
                      <TableCell>
                        {ip.expiresAt ? format(new Date(ip.expiresAt), "PPp") : (language === "en" ? "Never" : "أبدًا")}
                      </TableCell>
                      <TableCell>
                        {ip.isActive ? (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            {language === "en" ? "Blocked" : "محظور"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {language === "en" ? "Unblocked" : "غير محظور"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {ip.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblockIP(ip.ipAddress)}
                            disabled={unblockIPMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {language === "en" ? "Unblock" : "إلغاء الحظر"}
                          </Button>
                        )}
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
    </DashboardLayout>
  );
}
