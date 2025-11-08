import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, FileText, DollarSign, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [actionType, setActionType] = useState<"paid" | "cancelled" | null>(null);
  const [notes, setNotes] = useState("");

  const { data: invoices, isLoading, refetch } = trpc.admin.invoices.list.useQuery();
  const updateStatusMutation = trpc.admin.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice status updated successfully");
      refetch();
      setSelectedInvoice(null);
      setActionType(null);
      setNotes("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice status");
    },
  });

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toLocaleString()}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      pending: { variant: "default", label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      paid: { variant: "default", label: "Paid", className: "bg-green-100 text-green-800" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      expired: { variant: "outline", label: "Expired" },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleMarkAs = (invoice: any, type: "paid" | "cancelled") => {
    setSelectedInvoice(invoice);
    setActionType(type);
  };

  const handleConfirmAction = () => {
    if (!selectedInvoice || !actionType) return;

    updateStatusMutation.mutate({
      id: selectedInvoice.id,
      status: actionType,
      notes: notes || undefined,
    });
  };

  // Filter invoices
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.propertyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: invoices?.length || 0,
    pending: invoices?.filter((inv) => inv.status === "pending").length || 0,
    paid: invoices?.filter((inv) => inv.status === "paid").length || 0,
    totalAmount: invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invoice Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all platform invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice #, user, email, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {filteredInvoices?.length || 0} invoice(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices && filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.userName}</div>
                          <div className="text-sm text-muted-foreground">{invoice.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.propertyName}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>{invoice.shares.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAs(invoice, "paid")}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAs(invoice, "cancelled")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {invoice.status !== "pending" && (
                            <span className="text-sm text-muted-foreground">No actions</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              <p className="text-sm mt-2">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Invoices will appear here when users make investments"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => {
        setActionType(null);
        setSelectedInvoice(null);
        setNotes("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "paid" ? "Mark Invoice as Paid" : "Cancel Invoice"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "paid"
                ? "This will mark the invoice as paid and confirm the related investment."
                : "This will cancel the invoice and the related investment. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice:</span>
                  <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedInvoice.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  placeholder={
                    actionType === "paid"
                      ? "Add any payment confirmation details..."
                      : "Reason for cancellation..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setSelectedInvoice(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={updateStatusMutation.isPending}
              variant={actionType === "paid" ? "default" : "destructive"}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {actionType === "paid" ? "Confirm Payment" : "Cancel Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
