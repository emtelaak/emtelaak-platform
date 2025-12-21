import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminWallet() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed" | "failed" | "cancelled" | "all">("pending");
  const [typeFilter, setTypeFilter] = useState<"deposit" | "withdrawal" | "all">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: transactions, refetch } = trpc.wallet.admin.getAllTransactions.useQuery({
    status: statusFilter,
    type: typeFilter,
    limit: 100,
  });

  const approveMutation = trpc.wallet.admin.approveTransaction.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تمت الموافقة على المعاملة بنجاح" : "Transaction approved successfully");
      refetch();
      setReviewDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.wallet.admin.rejectTransaction.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم رفض المعاملة" : "Transaction rejected");
      refetch();
      setReviewDialogOpen(false);
      setRejectReason("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (transactionId: number) => {
    if (confirm(language === "ar" ? "هل أنت متأكد من الموافقة على هذه المعاملة؟" : "Are you sure you want to approve this transaction?")) {
      approveMutation.mutate({ transactionId });
    }
  };

  const handleReject = (transactionId: number) => {
    rejectMutation.mutate({ transactionId, reason: rejectReason });
  };

  const openReviewDialog = (transaction: any) => {
    setSelectedTransaction(transaction);
    setReviewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDE428]"></div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "غير مصرح" : "Unauthorized"}</CardTitle>
            <CardDescription>
              {language === "ar" ? "يتطلب الوصول إلى المسؤول" : "Admin access required"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pendingCount = transactions?.filter((t) => t.status === "pending").length || 0;
  const totalDeposits = transactions?.filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWithdrawals = transactions?.filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#032941]">
            {language === "ar" ? "إدارة المحفظة" : "Wallet Management"}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === "ar" ? "مراجعة والموافقة على طلبات الإيداع والسحب" : "Review and approve deposit and withdrawal requests"}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "المعاملات المعلقة" : "Pending Transactions"}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "تتطلب المراجعة" : "Require review"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "إجمالي الإيداعات" : "Total Deposits"}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">EGP {(totalDeposits / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "المعتمدة" : "Approved"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "إجمالي السحوبات" : "Total Withdrawals"}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">EGP {(totalWithdrawals / 100).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "المعتمدة" : "Approved"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{language === "ar" ? "الفلاتر" : "Filters"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === "ar" ? "الحالة" : "Status"}
                </label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="pending">{language === "ar" ? "معلق" : "Pending"}</SelectItem>
                    <SelectItem value="completed">{language === "ar" ? "مكتمل" : "Completed"}</SelectItem>
                    <SelectItem value="failed">{language === "ar" ? "فشل" : "Failed"}</SelectItem>
                    <SelectItem value="cancelled">{language === "ar" ? "ملغى" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === "ar" ? "النوع" : "Type"}
                </label>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="deposit">{language === "ar" ? "إيداع" : "Deposit"}</SelectItem>
                    <SelectItem value="withdrawal">{language === "ar" ? "سحب" : "Withdrawal"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "المعاملات" : "Transactions"}</CardTitle>
            <CardDescription>
              {language === "ar" ? `عرض ${transactions?.length || 0} معاملة` : `Showing ${transactions?.length || 0} transactions`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "المعرف" : "ID"}</TableHead>
                    <TableHead>{language === "ar" ? "المستخدم" : "User"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "المبلغ" : "Amount"}</TableHead>
                    <TableHead>{language === "ar" ? "طريقة الدفع" : "Payment Method"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">#{transaction.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.userName || "N/A"}</div>
                          <div className="text-sm text-gray-500">{transaction.userEmail || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "deposit" ? "default" : "secondary"}>
                          {transaction.type === "deposit" 
                            ? (language === "ar" ? "إيداع" : "Deposit")
                            : (language === "ar" ? "سحب" : "Withdrawal")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        EGP {(transaction.amount / 100).toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">
                        {transaction.paymentMethod?.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : transaction.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {transaction.status === "pending" && (language === "ar" ? "معلق" : "Pending")}
                          {transaction.status === "completed" && (language === "ar" ? "مكتمل" : "Completed")}
                          {transaction.status === "failed" && (language === "ar" ? "فشل" : "Failed")}
                          {transaction.status === "cancelled" && (language === "ar" ? "ملغى" : "Cancelled")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewDialog(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(transaction.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openReviewDialog(transaction)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {language === "ar" ? "مراجعة المعاملة" : "Review Transaction"}
              </DialogTitle>
              <DialogDescription>
                {language === "ar" ? "مراجعة تفاصيل المعاملة والموافقة أو الرفض" : "Review transaction details and approve or reject"}
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {language === "ar" ? "المعرف" : "Transaction ID"}
                    </label>
                    <p className="font-semibold">#{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {language === "ar" ? "المستخدم" : "User"}
                    </label>
                    <p className="font-semibold">{selectedTransaction.userName || "N/A"}</p>
                    <p className="text-sm text-gray-500">{selectedTransaction.userEmail || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {language === "ar" ? "النوع" : "Type"}
                    </label>
                    <p className="font-semibold capitalize">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {language === "ar" ? "المبلغ" : "Amount"}
                    </label>
                    <p className="font-semibold text-lg">
                      EGP {(selectedTransaction.amount / 100).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {language === "ar" ? "طريقة الدفع" : "Payment Method"}
                    </label>
                    <p className="font-semibold capitalize">
                      {selectedTransaction.paymentMethod?.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {language === "ar" ? "المرجع" : "Reference"}
                    </label>
                    <p className="font-semibold">{selectedTransaction.reference || "N/A"}</p>
                  </div>
                </div>

                {selectedTransaction.receiptUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                      {language === "ar" ? "إيصال الدفع" : "Payment Receipt"}
                    </label>
                    <img
                      src={selectedTransaction.receiptUrl}
                      alt="Receipt"
                      className="w-full max-h-96 object-contain border rounded-lg"
                    />
                  </div>
                )}

                {selectedTransaction.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {language === "ar" ? "الوصف" : "Description"}
                    </label>
                    <p className="text-sm">{selectedTransaction.description}</p>
                  </div>
                )}

                {selectedTransaction.status === "pending" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                      {language === "ar" ? "سبب الرفض (اختياري)" : "Rejection Reason (Optional)"}
                    </label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={language === "ar" ? "أدخل سبب الرفض..." : "Enter rejection reason..."}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedTransaction?.status === "pending" && (
                <>
                  <Button
                    variant="default"
                    onClick={() => handleApprove(selectedTransaction.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {language === "ar" ? "موافقة" : "Approve"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedTransaction.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {language === "ar" ? "رفض" : "Reject"}
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <MobileBottomNav />
      </div>
    </DashboardLayout>
  );
}
