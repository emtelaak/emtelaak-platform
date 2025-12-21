import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Breadcrumb } from "@/components/Breadcrumb";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  Globe, 
  Loader2,
  Search,
  Send,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  UserCheck,
  UserX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const translations = {
  en: {
    title: "Access Requests",
    subtitle: "Manage investor access requests and send invitation codes",
    stats: {
      total: "Total Requests",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    tabs: {
      all: "All",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    table: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      country: "Country",
      interest: "Interest",
      budget: "Budget",
      status: "Status",
      date: "Date",
      actions: "Actions"
    },
    actions: {
      view: "View",
      approve: "Approve",
      reject: "Reject",
      resend: "Resend",
      delete: "Delete"
    },
    dialog: {
      viewTitle: "Request Details",
      approveTitle: "Approve Request",
      approveDesc: "This will create an invitation code and send it to the applicant's email.",
      rejectTitle: "Reject Request",
      rejectDesc: "Optionally provide a reason for rejection.",
      rejectReason: "Rejection Reason (Optional)",
      rejectPlaceholder: "Enter reason for rejection...",
      confirm: "Confirm",
      cancel: "Cancel",
      sending: "Sending...",
      rejecting: "Rejecting..."
    },
    status: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    },
    search: "Search by name or email...",
    noResults: "No requests found",
    message: "Message",
    invitationCode: "Invitation Code",
    loading: "Loading requests..."
  },
  ar: {
    title: "طلبات الوصول",
    subtitle: "إدارة طلبات وصول المستثمرين وإرسال رموز الدعوة",
    stats: {
      total: "إجمالي الطلبات",
      pending: "قيد الانتظار",
      approved: "تمت الموافقة",
      rejected: "مرفوض"
    },
    tabs: {
      all: "الكل",
      pending: "قيد الانتظار",
      approved: "تمت الموافقة",
      rejected: "مرفوض"
    },
    table: {
      name: "الاسم",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      country: "البلد",
      interest: "الاهتمام",
      budget: "الميزانية",
      status: "الحالة",
      date: "التاريخ",
      actions: "الإجراءات"
    },
    actions: {
      view: "عرض",
      approve: "موافقة",
      reject: "رفض",
      resend: "إعادة إرسال",
      delete: "حذف"
    },
    dialog: {
      viewTitle: "تفاصيل الطلب",
      approveTitle: "الموافقة على الطلب",
      approveDesc: "سيتم إنشاء رمز دعوة وإرساله إلى البريد الإلكتروني لمقدم الطلب.",
      rejectTitle: "رفض الطلب",
      rejectDesc: "يمكنك اختيارياً تقديم سبب للرفض.",
      rejectReason: "سبب الرفض (اختياري)",
      rejectPlaceholder: "أدخل سبب الرفض...",
      confirm: "تأكيد",
      cancel: "إلغاء",
      sending: "جاري الإرسال...",
      rejecting: "جاري الرفض..."
    },
    status: {
      pending: "قيد الانتظار",
      approved: "تمت الموافقة",
      rejected: "مرفوض"
    },
    search: "البحث بالاسم أو البريد الإلكتروني...",
    noResults: "لم يتم العثور على طلبات",
    message: "الرسالة",
    invitationCode: "رمز الدعوة",
    loading: "جاري تحميل الطلبات..."
  }
};

export default function AdminAccessRequests() {
  const { language, dir } = useLanguage();
  const t = translations[language];
  const isRTL = dir === 'rtl';
  const dateLocale = language === 'ar' ? ar : enUS;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests, isLoading, refetch } = trpc.accessRequests.list.useQuery();

  const approveMutation = trpc.accessRequests.approve.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تمت الموافقة وإرسال رمز الدعوة" : "Approved and invitation code sent!");
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || (language === 'ar' ? "فشل في الموافقة" : "Failed to approve"));
    }
  });

  const rejectMutation = trpc.accessRequests.reject.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم رفض الطلب" : "Request rejected");
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || (language === 'ar' ? "فشل في الرفض" : "Failed to reject"));
    }
  });

  const deleteMutation = trpc.accessRequests.delete.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم حذف الطلب" : "Request deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || (language === 'ar' ? "فشل في الحذف" : "Failed to delete"));
    }
  });

  const resendMutation = trpc.accessRequests.resendInvitation.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم إعادة إرسال الدعوة" : "Invitation resent!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || (language === 'ar' ? "فشل في إعادة الإرسال" : "Failed to resend"));
    }
  });

  const filteredRequests = requests?.filter((req: any) => {
    const matchesSearch = 
      req.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || req.status === activeTab;
    return matchesSearch && matchesTab;
  }) || [];

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r: any) => r.status === 'pending').length || 0,
    approved: requests?.filter((r: any) => r.status === 'approved').length || 0,
    rejected: requests?.filter((r: any) => r.status === 'rejected').length || 0
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"><Clock className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />{t.status.pending}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle2 className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />{t.status.approved}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><XCircle className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />{t.status.rejected}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 md:py-8">
      <div className="container px-4 max-w-7xl">
        <Breadcrumb items={[{ label: language === 'ar' ? 'لوحة التحكم' : 'Admin', href: '/admin' }, { label: t.title }]} />
        
        {/* Header */}
        <div className={cn("mb-6 md:mb-8", isRTL ? "text-right" : "")}>
          <h1 className={cn("text-2xl md:text-3xl font-bold flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
            <Users className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className={cn(isRTL ? "text-right" : "")}>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.stats.total}</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                </div>
                <div className={cn(isRTL ? "text-right" : "")}>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.stats.pending}</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div className={cn(isRTL ? "text-right" : "")}>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.stats.approved}</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "")}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <UserX className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                </div>
                <div className={cn(isRTL ? "text-right" : "")}>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.stats.rejected}</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRTL ? "md:flex-row-reverse" : "")}>
              <div className="relative flex-1 max-w-md">
                <Search className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn("w-full", isRTL ? "pr-9 text-right" : "pl-9")}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
              <Button variant="outline" onClick={() => refetch()} className={cn("gap-2", isRTL ? "flex-row-reverse" : "")}>
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">{t.tabs.all}</TabsTrigger>
                <TabsTrigger value="pending">{t.tabs.pending}</TabsTrigger>
                <TabsTrigger value="approved">{t.tabs.approved}</TabsTrigger>
                <TabsTrigger value="rejected">{t.tabs.rejected}</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t.noResults}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((request: any) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRTL ? "md:flex-row-reverse" : "")}>
                            {/* Request Info */}
                            <div className={cn("flex-1 space-y-2", isRTL ? "text-right" : "")}>
                              <div className={cn("flex items-center gap-2 flex-wrap", isRTL ? "flex-row-reverse" : "")}>
                                <h3 className="font-semibold">{request.fullName}</h3>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground", isRTL ? "flex-row-reverse" : "")}>
                                <span className={cn("flex items-center gap-1", isRTL ? "flex-row-reverse" : "")}>
                                  <Mail className="h-3 w-3" /> {request.email}
                                </span>
                                {request.phone && (
                                  <span className={cn("flex items-center gap-1", isRTL ? "flex-row-reverse" : "")}>
                                    <Phone className="h-3 w-3" /> {request.phone}
                                  </span>
                                )}
                                {request.country && (
                                  <span className={cn("flex items-center gap-1", isRTL ? "flex-row-reverse" : "")}>
                                    <Globe className="h-3 w-3" /> {request.country}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.createdAt), 'PPp', { locale: dateLocale })}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className={cn("flex flex-wrap gap-2", isRTL ? "flex-row-reverse" : "")}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setApproveDialogOpen(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setRejectDialogOpen(true);
                                    }}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}

                              {request.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resendMutation.mutate({ id: request.id })}
                                  disabled={resendMutation.isPending}
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
                                    deleteMutation.mutate({ id: request.id });
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className={cn(isRTL ? "text-right" : "")}>{t.dialog.viewTitle}</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className={cn("space-y-4", isRTL ? "text-right" : "")}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.name}</Label>
                    <p className="font-medium">{selectedRequest.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.status}</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.email}</Label>
                    <p className="font-medium text-sm break-all">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.phone}</Label>
                    <p className="font-medium">{selectedRequest.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.country}</Label>
                    <p className="font-medium">{selectedRequest.country || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.interest}</Label>
                    <p className="font-medium">{selectedRequest.investmentInterest || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.budget}</Label>
                    <p className="font-medium">{selectedRequest.investmentBudget || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.table.date}</Label>
                    <p className="font-medium text-sm">{format(new Date(selectedRequest.createdAt), 'PPp', { locale: dateLocale })}</p>
                  </div>
                </div>
                {selectedRequest.message && (
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.message}</Label>
                    <p className="font-medium mt-1 p-3 bg-muted rounded-lg text-sm">{selectedRequest.message}</p>
                  </div>
                )}
                {selectedRequest.invitationCode && (
                  <div>
                    <Label className="text-muted-foreground text-xs">{t.invitationCode}</Label>
                    <p className="font-mono font-bold text-lg mt-1 p-3 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg">{selectedRequest.invitationCode}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={cn(isRTL ? "text-right" : "")}>{t.dialog.approveTitle}</DialogTitle>
              <DialogDescription className={cn(isRTL ? "text-right" : "")}>{t.dialog.approveDesc}</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className={cn("py-4", isRTL ? "text-right" : "")}>
                <p className="font-medium">{selectedRequest.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
              </div>
            )}
            <DialogFooter className={cn(isRTL ? "flex-row-reverse gap-2" : "")}>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>{t.dialog.cancel}</Button>
              <Button
                onClick={() => approveMutation.mutate({ id: selectedRequest.id })}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                    {t.dialog.sending}
                  </>
                ) : (
                  t.dialog.confirm
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={cn(isRTL ? "text-right" : "")}>{t.dialog.rejectTitle}</DialogTitle>
              <DialogDescription className={cn(isRTL ? "text-right" : "")}>{t.dialog.rejectDesc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={cn(isRTL ? "text-right block" : "")}>{t.dialog.rejectReason}</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t.dialog.rejectPlaceholder}
                  className={cn(isRTL ? "text-right" : "")}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
            <DialogFooter className={cn(isRTL ? "flex-row-reverse gap-2" : "")}>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>{t.dialog.cancel}</Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate({ id: selectedRequest.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                    {t.dialog.rejecting}
                  </>
                ) : (
                  t.dialog.confirm
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
