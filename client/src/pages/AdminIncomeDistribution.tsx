import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminIncomeDistribution() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [distributionDate, setDistributionDate] = useState<Date>(new Date());
  const [distributionType, setDistributionType] = useState<"rental_income" | "capital_gain" | "exit_proceeds">("rental_income");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Queries
  const { data: properties } = trpc.properties.list.useQuery({});
  const { data: investorPreview } = trpc.incomeDistribution.getInvestorPreview.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );
  const { data: distributionHistory, refetch: refetchHistory } = trpc.incomeDistribution.getDistributionHistory.useQuery({
    limit: 20,
  });

  // Mutations
  const distributeIncome = trpc.incomeDistribution.distributeIncome.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully distributed to ${data.totalDistributions} investors!`);
      setAmount("");
      setSelectedPropertyId(null);
      setShowConfirmDialog(false);
      refetchHistory();
    },
    onError: (error) => {
      toast.error(`Distribution failed: ${error.message}`);
    },
  });

  const handleDistribute = () => {
    if (!selectedPropertyId || !amount) {
      toast.error("Please select a property and enter an amount");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmDistribution = () => {
    const amountInCents = Math.round(parseFloat(amount) * 100);

    distributeIncome.mutate({
      propertyId: selectedPropertyId!,
      totalAmount: amountInCents,
      distributionType,
      distributionDate,
    });
  };

  const selectedProperty = properties?.find((p) => p.id === selectedPropertyId);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Breadcrumb />
      <div>
        <h1 className="text-3xl font-bold">Income Distribution</h1>
        <p className="text-muted-foreground mt-2">
          Distribute rental income, capital gains, or exit proceeds to property investors
        </p>
      </div>

      {/* Distribution Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Distribution</CardTitle>
          <CardDescription>
            Select a property and enter the amount to distribute to all investors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select
              value={selectedPropertyId?.toString() || ""}
              onValueChange={(value) => setSelectedPropertyId(parseInt(value))}
            >
              <SelectTrigger id="property">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distribution Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Distribution Type</Label>
            <Select
              value={distributionType}
              onValueChange={(value: any) => setDistributionType(value)}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rental_income">Rental Income</SelectItem>
                <SelectItem value="capital_gain">Capital Gain</SelectItem>
                <SelectItem value="exit_proceeds">Exit Proceeds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Distribution Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !distributionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {distributionDate ? format(distributionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={distributionDate}
                  onSelect={(date) => date && setDistributionDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Investor Preview */}
          {selectedPropertyId && investorPreview && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Investor Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Investors</span>
                  </div>
                  <span className="font-semibold">{investorPreview?.totalInvestors || 0}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Ownership</span>
                  </div>
                  <span className="font-semibold">
                    {((investorPreview.totalOwnership / 10000) || 0).toFixed(2)}%
                  </span>
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Amount per Investor (avg)</span>
                    <span className="font-semibold">
                      ${(parseFloat(amount) / (investorPreview?.totalInvestors || 1)).toFixed(2)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleDistribute}
            disabled={!selectedPropertyId || !amount || distributeIncome.isPending}
            className="w-full"
          >
            {distributeIncome.isPending ? "Distributing..." : "Distribute Income"}
          </Button>
        </CardContent>
      </Card>

      {/* Distribution History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Distributions</CardTitle>
          <CardDescription>View the latest income distributions</CardDescription>
        </CardHeader>
        <CardContent>
          {distributionHistory && distributionHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributionHistory.map((dist: any) => (
                  <TableRow key={dist.id}>
                    <TableCell>{format(new Date(dist.distributionDate), "PPP")}</TableCell>
                    <TableCell className="capitalize">
                      {dist.distributionType.replace("_", " ")}
                    </TableCell>
                    <TableCell>${(dist.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                          dist.status === "processed"
                            ? "bg-green-50 text-green-700"
                            : dist.status === "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        )}
                      >
                        {dist.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {dist.processedAt ? format(new Date(dist.processedAt), "PPP") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No distributions yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Distribution</DialogTitle>
            <DialogDescription>
              Please review the distribution details before confirming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                This will distribute <span className="font-semibold text-foreground">${amount}</span> to{" "}
                <span className="font-semibold text-foreground">
                  {investorPreview?.totalInvestors || 0} investors
                </span>{" "}
                of <span className="font-semibold text-foreground">{selectedProperty?.name}</span>.
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Property:</span>
                <span className="font-medium">{selectedProperty?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{distributionType.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">${amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{format(distributionDate, "PPP")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Investors:</span>
                <span className="font-medium">{investorPreview?.totalInvestors || 0}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDistribution} disabled={distributeIncome.isPending}>
              {distributeIncome.isPending ? "Processing..." : "Confirm Distribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
