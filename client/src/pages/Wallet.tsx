import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, Building2, Smartphone, Upload, Trash2 } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import MobileBottomNav from "@/components/MobileBottomNav";
import Navigation from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Wallet() {
  const { user, loading, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [addBankAccountDialogOpen, setAddBankAccountDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"bank_transfer" | "fawry" | "card">("bank_transfer");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Queries
  const { data: walletData, isLoading: walletLoading } = trpc.wallet.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: transactions, isLoading: transactionsLoading } = trpc.wallet.getTransactions.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );
  const { data: bankAccounts, isLoading: bankAccountsLoading } = trpc.wallet.getBankAccounts.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const addBankAccountMutation = trpc.wallet.addBankAccount.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Bank account added successfully" : "تمت إضافة الحساب البنكي بنجاح");
      setAddBankAccountDialogOpen(false);
      trpc.useUtils().wallet.getBankAccounts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to add bank account" : "فشل في إضافة الحساب البنكي"));
    },
  });

  const depositBankTransferMutation = trpc.wallet.depositBankTransfer.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setDepositDialogOpen(false);
      trpc.useUtils().wallet.getBalance.invalidate();
      trpc.useUtils().wallet.getTransactions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to process deposit" : "فشل في معالجة الإيداع"));
    },
  });

  const depositFawryMutation = trpc.wallet.depositFawry.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setDepositDialogOpen(false);
      trpc.useUtils().wallet.getBalance.invalidate();
      trpc.useUtils().wallet.getTransactions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to process Fawry payment" : "فشل في معالجة دفع فوري"));
    },
  });

  const depositCardMutation = trpc.wallet.depositCard.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setDepositDialogOpen(false);
      trpc.useUtils().wallet.getBalance.invalidate();
      trpc.useUtils().wallet.getTransactions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to process card payment" : "فشل في معالجة الدفع بالبطاقة"));
    },
  });

  const withdrawMutation = trpc.wallet.requestWithdrawal.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setWithdrawDialogOpen(false);
      trpc.useUtils().wallet.getBalance.invalidate();
      trpc.useUtils().wallet.getTransactions.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to process withdrawal" : "فشل في معالجة السحب"));
    },
  });

  const deleteBankAccountMutation = trpc.wallet.deleteBankAccount.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Bank account deleted successfully" : "تم حذف الحساب البنكي بنجاح");
      trpc.useUtils().wallet.getBankAccounts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || (language === "en" ? "Failed to delete bank account" : "فشل في حذف الحساب البنكي"));
    },
  });

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  if (loading || walletLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === "en" ? "Loading wallet..." : "جاري تحميل المحفظة..."}
          </p>
        </div>
      </div>
    );
  }

  const handleAddBankAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addBankAccountMutation.mutate({
      bankName: formData.get("bankName") as string,
      accountNumber: formData.get("accountNumber") as string,
      iban: formData.get("iban") as string || undefined,
      accountHolderName: formData.get("accountHolderName") as string,
      isDefault: formData.get("isDefault") === "on",
    });
  };

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);

    if (selectedPaymentMethod === "bank_transfer") {
      const receiptFile = formData.get("receipt") as File;
      if (!receiptFile) {
        toast.error(language === "en" ? "Please upload a receipt" : "يرجى تحميل إيصال");
        return;
      }
      
      try {
        setUploadingReceipt(true);
        toast.info(language === "en" ? "Uploading receipt..." : "جاري تحميل الإيصال...");
        
        // Upload receipt to S3 using fetch to storage API
        const receiptBuffer = await receiptFile.arrayBuffer();
        const receiptBlob = new Blob([receiptBuffer], { type: receiptFile.type });
        
        // Create form data for upload
        const uploadFormData = new FormData();
        uploadFormData.append("file", receiptBlob, receiptFile.name);
        uploadFormData.append("key", `receipts/${user?.id}-${Date.now()}-${receiptFile.name}`);
        uploadFormData.append("contentType", receiptFile.type);

        // Note: In a real implementation, you would call a backend endpoint to upload to S3
        // For now, we'll use a placeholder URL
        const receiptUrl = `https://storage.emtelaak.com/receipts/${user?.id}-${Date.now()}-${receiptFile.name}`;

        depositBankTransferMutation.mutate({
          amount,
          receiptUrl,
          reference: formData.get("reference") as string || undefined,
        });
      } catch (error) {
        toast.error(language === "en" ? "Failed to upload receipt" : "فشل في تحميل الإيصال");
      } finally {
        setUploadingReceipt(false);
      }
    } else if (selectedPaymentMethod === "fawry") {
      depositFawryMutation.mutate({
        amount,
        reference: formData.get("reference") as string,
      });
    } else if (selectedPaymentMethod === "card") {
      depositCardMutation.mutate({
        amount,
        reference: `CARD-${Date.now()}`,
      });
    }
  };

  const handleWithdraw = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const bankAccountId = parseInt(formData.get("bankAccountId") as string);

    withdrawMutation.mutate({ amount, bankAccountId });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(language === "en" ? "en-US" : "ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      case "cancelled":
        return "text-gray-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    if (language === "ar") {
      switch (status) {
        case "completed": return "مكتمل";
        case "pending": return "قيد الانتظار";
        case "failed": return "فشل";
        case "cancelled": return "ملغي";
        default: return status;
      }
    }
    return status;
  };

  const getTypeText = (type: string) => {
    if (language === "ar") {
      switch (type) {
        case "deposit": return "إيداع";
        case "withdrawal": return "سحب";
        case "investment": return "استثمار";
        case "distribution": return "توزيع";
        case "refund": return "استرداد";
        default: return type;
      }
    }
    return type;
  };

  const getPaymentMethodText = (method: string | null) => {
    if (!method) return "-";
    if (language === "ar") {
      switch (method) {
        case "bank_transfer": return "تحويل بنكي";
        case "instapay": return "إنستاباي";
        case "fawry": return "فوري";
        case "card": return "بطاقة";
        case "wallet": return "محفظة";
        default: return method;
      }
    }
    return method.replace("_", " ");
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-20 cursor-pointer" />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-muted-foreground hidden md:inline">
              {language === "en" ? "Welcome" : "مرحباً"}, {user?.name}
            </span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-6 w-6" />
              {language === "en" ? "Wallet Balance" : "رصيد المحفظة"}
            </CardTitle>
            <CardDescription>
              {language === "en" ? "Your available balance" : "رصيدك المتاح"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-bold">
                  {language === "en" ? "EGP" : "جنيه"} {walletData?.balanceEGP.toLocaleString(language === "en" ? "en-US" : "ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{walletData?.currency}</p>
              </div>
              <div className="flex gap-4">
                <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <ArrowDownLeft className="mr-2 h-4 w-4" />
                      {language === "en" ? "Deposit" : "إيداع"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{language === "en" ? "Deposit Funds" : "إيداع أموال"}</DialogTitle>
                      <DialogDescription>
                        {language === "en" ? "Choose a payment method to add funds to your wallet" : "اختر طريقة الدفع لإضافة أموال إلى محفظتك"}
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs value={selectedPaymentMethod} onValueChange={(v) => setSelectedPaymentMethod(v as any)}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="bank_transfer">
                          <Building2 className="mr-2 h-4 w-4" />
                          {language === "en" ? "Bank Transfer" : "تحويل بنكي"}
                        </TabsTrigger>
                        <TabsTrigger value="fawry">
                          <Smartphone className="mr-2 h-4 w-4" />
                          {language === "en" ? "Fawry" : "فوري"}
                        </TabsTrigger>
                        <TabsTrigger value="card">
                          <CreditCard className="mr-2 h-4 w-4" />
                          {language === "en" ? "Card" : "بطاقة"}
                        </TabsTrigger>
                      </TabsList>

                      <form onSubmit={handleDeposit} className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="amount">
                            {language === "en" ? "Amount (EGP)" : "المبلغ (جنيه)"}
                          </Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder={language === "en" ? "Enter amount" : "أدخل المبلغ"}
                            required
                          />
                        </div>

                        <TabsContent value="bank_transfer" className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <p className="font-semibold">
                              {language === "en" ? "Platform Bank Account:" : "الحساب البنكي للمنصة:"}
                            </p>
                            <p>{language === "en" ? "Bank: National Bank of Egypt (NBE)" : "البنك: البنك الأهلي المصري"}</p>
                            <p>{language === "en" ? "Account Number:" : "رقم الحساب:"} 1234567890</p>
                            <p>IBAN: EG380002000156789012345678901</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              {language === "en" 
                                ? "Transfer funds to this account and upload the receipt below"
                                : "قم بتحويل الأموال إلى هذا الحساب وتحميل الإيصال أدناه"}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="reference">
                              {language === "en" ? "Reference (Optional)" : "المرجع (اختياري)"}
                            </Label>
                            <Input 
                              id="reference" 
                              name="reference" 
                              placeholder={language === "en" ? "Transaction reference" : "مرجع المعاملة"} 
                            />
                          </div>
                          <div>
                            <Label htmlFor="receipt">
                              {language === "en" ? "Upload Receipt *" : "تحميل الإيصال *"}
                            </Label>
                            <Input id="receipt" name="receipt" type="file" accept="image/*,.pdf" required />
                            <p className="text-xs text-muted-foreground mt-1">
                              {language === "en"
                                ? "Upload InstaPay receipt or bank transfer confirmation"
                                : "قم بتحميل إيصال إنستاباي أو تأكيد التحويل البنكي"}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="fawry" className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <p className="font-semibold">
                              {language === "en" ? "Fawry Payment Code:" : "كود الدفع فوري:"}
                            </p>
                            <p className="text-2xl font-mono">9876543</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              {language === "en"
                                ? "Visit any Fawry outlet or use the Fawry app to complete payment"
                                : "قم بزيارة أي منفذ فوري أو استخدم تطبيق فوري لإتمام الدفع"}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="reference">
                              {language === "en" ? "Fawry Reference Number *" : "رقم مرجع فوري *"}
                            </Label>
                            <Input
                              id="reference"
                              name="reference"
                              placeholder={language === "en" ? "Enter Fawry reference number" : "أدخل رقم مرجع فوري"}
                              required
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="card" className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <p className="font-semibold">
                              {language === "en" ? "Accepted Cards:" : "البطاقات المقبولة:"}
                            </p>
                            <div className="flex gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-6 w-6" />
                                <span>Visa</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-6 w-6" />
                                <span>Mastercard</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-6 w-6" />
                                <span>Meeza</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {language === "en"
                              ? "You will be redirected to a secure payment gateway to complete your transaction"
                              : "سيتم توجيهك إلى بوابة دفع آمنة لإتمام معاملتك"}
                          </p>
                        </TabsContent>

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={uploadingReceipt || depositBankTransferMutation.isPending || depositFawryMutation.isPending || depositCardMutation.isPending}
                        >
                          {(uploadingReceipt || depositBankTransferMutation.isPending || depositFawryMutation.isPending || depositCardMutation.isPending)
                            ? (language === "en" ? "Processing..." : "جاري المعالجة...")
                            : (language === "en" ? "Submit Deposit" : "إرسال الإيداع")}
                        </Button>
                      </form>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      {language === "en" ? "Withdraw" : "سحب"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === "en" ? "Withdraw Funds" : "سحب أموال"}</DialogTitle>
                      <DialogDescription>
                        {language === "en" 
                          ? "Transfer funds from your wallet to your bank account"
                          : "قم بتحويل الأموال من محفظتك إلى حسابك البنكي"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWithdraw} className="space-y-4">
                      <div>
                        <Label htmlFor="withdraw-amount">
                          {language === "en" ? "Amount (EGP)" : "المبلغ (جنيه)"}
                        </Label>
                        <Input
                          id="withdraw-amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="1"
                          max={walletData?.balanceEGP}
                          placeholder={language === "en" ? "Enter amount" : "أدخل المبلغ"}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "en" ? "Available:" : "المتاح:"} {language === "en" ? "EGP" : "جنيه"} {walletData?.balanceEGP.toLocaleString(language === "en" ? "en-US" : "ar-EG", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="bankAccountId">
                          {language === "en" ? "Bank Account" : "الحساب البنكي"}
                        </Label>
                        <Select name="bankAccountId" required>
                          <SelectTrigger>
                            <SelectValue placeholder={language === "en" ? "Select bank account" : "اختر الحساب البنكي"} />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts?.map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.bankName} - {account.accountNumber.slice(-4)}
                                {account.isDefault && (language === "en" ? " (Default)" : " (افتراضي)")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full" disabled={withdrawMutation.isPending}>
                        {withdrawMutation.isPending 
                          ? (language === "en" ? "Processing..." : "جاري المعالجة...") 
                          : (language === "en" ? "Request Withdrawal" : "طلب سحب")}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Accounts & Transactions */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Bank Accounts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{language === "en" ? "Bank Accounts" : "الحسابات البنكية"}</CardTitle>
                <Dialog open={addBankAccountDialogOpen} onOpenChange={setAddBankAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      {language === "en" ? "Add Account" : "إضافة حساب"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === "en" ? "Add Bank Account" : "إضافة حساب بنكي"}</DialogTitle>
                      <DialogDescription>
                        {language === "en"
                          ? "Add a new bank account for deposits and withdrawals"
                          : "أضف حساباً بنكياً جديداً للإيداعات والسحوبات"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddBankAccount} className="space-y-4">
                      <div>
                        <Label htmlFor="bankName">
                          {language === "en" ? "Bank Name" : "اسم البنك"}
                        </Label>
                        <Input 
                          id="bankName" 
                          name="bankName" 
                          placeholder={language === "en" ? "e.g., National Bank of Egypt" : "مثال: البنك الأهلي المصري"} 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">
                          {language === "en" ? "Account Number" : "رقم الحساب"}
                        </Label>
                        <Input 
                          id="accountNumber" 
                          name="accountNumber" 
                          placeholder={language === "en" ? "Enter account number" : "أدخل رقم الحساب"} 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="iban">
                          {language === "en" ? "IBAN (Optional)" : "IBAN (اختياري)"}
                        </Label>
                        <Input id="iban" name="iban" placeholder="EG..." />
                      </div>
                      <div>
                        <Label htmlFor="accountHolderName">
                          {language === "en" ? "Account Holder Name" : "اسم صاحب الحساب"}
                        </Label>
                        <Input
                          id="accountHolderName"
                          name="accountHolderName"
                          placeholder={language === "en" ? "Full name as on account" : "الاسم الكامل كما في الحساب"}
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isDefault" name="isDefault" className="rounded" />
                        <Label htmlFor="isDefault" className="cursor-pointer">
                          {language === "en" ? "Set as default account" : "تعيين كحساب افتراضي"}
                        </Label>
                      </div>
                      <Button type="submit" className="w-full" disabled={addBankAccountMutation.isPending}>
                        {addBankAccountMutation.isPending 
                          ? (language === "en" ? "Adding..." : "جاري الإضافة...") 
                          : (language === "en" ? "Add Bank Account" : "إضافة حساب بنكي")}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {bankAccountsLoading ? (
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Loading bank accounts..." : "جاري تحميل الحسابات البنكية..."}
                </p>
              ) : bankAccounts && bankAccounts.length > 0 ? (
                <div className="space-y-4">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{account.bankName}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.accountNumber}
                          {account.isDefault && (
                            <span className="ml-2 text-primary">
                              ({language === "en" ? "Default" : "افتراضي"})
                            </span>
                          )}
                        </p>
                        {account.iban && <p className="text-xs text-muted-foreground mt-1">{account.iban}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(language === "en" 
                            ? "Are you sure you want to delete this bank account?" 
                            : "هل أنت متأكد من حذف هذا الحساب البنكي؟")) {
                            deleteBankAccountMutation.mutate({ accountId: account.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "No bank accounts added yet" : "لم تتم إضافة حسابات بنكية بعد"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Recent Transactions" : "المعاملات الأخيرة"}</CardTitle>
              <CardDescription>
                {language === "en" ? "Your latest wallet activity" : "نشاط محفظتك الأخير"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Loading transactions..." : "جاري تحميل المعاملات..."}
                </p>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {tx.type === "deposit" ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{getTypeText(tx.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.createdAt)} - {getPaymentMethodText(tx.paymentMethod)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "deposit" ? "+" : "-"}{language === "en" ? "EGP" : "جنيه"} {(tx.amount / 100).toFixed(2)}
                        </p>
                        <p className={`text-xs ${getStatusColor(tx.status)}`}>
                          {getStatusText(tx.status)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "No transactions yet" : "لا توجد معاملات بعد"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
