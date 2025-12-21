import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, Eye, DollarSign, Calendar, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Invoices() {
  const { t, dir } = useLanguage();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: invoices, isLoading } = trpc.invoices.list.useQuery();
  const { data: invoiceHtml, isLoading: isLoadingPdf } = trpc.invoices.downloadPdf.useQuery(
    { id: selectedInvoiceId! },
    { enabled: !!selectedInvoiceId && showPreview }
  );

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
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "default", label: "Pending" },
      paid: { variant: "default", label: "Paid" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      expired: { variant: "outline", label: "Expired" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDownloadPdf = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setShowPreview(true);
  };

  const handlePrintPdf = () => {
    if (invoiceHtml?.html) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(invoiceHtml.html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Breadcrumb />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8" dir={dir}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Invoices</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your investment invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices?.filter((inv) => inv.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>All your investment invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{invoice.shares.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPdf(invoice.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              <p className="text-sm mt-2">Invoices will appear here after you make an investment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {isLoadingPdf ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoiceHtml?.html ? (
            <div>
              <div className="flex gap-2 mb-4">
                <Button onClick={handlePrintPdf} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Download / Print
                </Button>
              </div>
              <div
                className="border rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: invoiceHtml.html }}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Failed to load invoice
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
