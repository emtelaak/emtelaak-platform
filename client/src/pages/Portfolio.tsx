import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Building2, Calendar, ArrowUpRight, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import MobileBottomNav from "@/components/MobileBottomNav";
import Navigation from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Portfolio() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: portfolioSummary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: incomeHistory, isLoading: incomeLoading } = trpc.portfolio.incomeHistory.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: transactions, isLoading: transactionsLoading } = trpc.portfolio.transactions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotalIncome = () => {
    if (!incomeHistory) return 0;
    return incomeHistory.reduce((sum, dist) => sum + dist.amount, 0);
  };

  const calculateROI = () => {
    if (!portfolioSummary || portfolioSummary.totalInvested === 0) return 0;
    const totalIncome = calculateTotalIncome();
    return ((totalIncome / portfolioSummary.totalInvested) * 100).toFixed(2);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t.nav.login}</CardTitle>
            <CardDescription>
              {t.portfolio.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">{t.nav.login}</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{t.portfolio.title}</h1>
              <p className="text-muted-foreground">
                {t.portfolio.subtitle}
              </p>
            </div>
            <LanguageSwitcher />
            <div className="flex gap-3">
              <Link href="/properties">
                <Button variant="outline">{t.nav.properties}</Button>
              </Link>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.portfolio.overview.totalInvested}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(portfolioSummary?.totalInvested || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.portfolio.overview.activeProperties}: {portfolioSummary?.activeInvestments || 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.portfolio.income.title}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {incomeLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateTotalIncome())}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {incomeHistory?.length || 0} distributions received
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {summaryLoading || incomeLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {calculateROI()}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Return on investment
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {portfolioSummary?.activeInvestments || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Properties owned
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="investments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="income">Income History</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Investments</CardTitle>
                <CardDescription>
                  All your property investments in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : portfolioSummary?.investments && portfolioSummary.investments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Investment Amount</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead>Ownership</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolioSummary.investments.map((investment) => (
                        <TableRow key={investment.id}>
                          <TableCell className="font-medium">
                            Property #{investment.propertyId}
                          </TableCell>
                          <TableCell>{formatCurrency(investment.investmentAmount)}</TableCell>
                          <TableCell>{investment.numberOfShares.toLocaleString()}</TableCell>
                          <TableCell>
                            {investment.ownershipPercentage ? (investment.ownershipPercentage / 10000).toFixed(4) : '0.0000'}%
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                investment.status === "active"
                                  ? "default"
                                  : investment.status === "pending"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {investment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(investment.createdAt)}</TableCell>
                          <TableCell>
                            <Link href={`/properties/${investment.propertyId}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Investments Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start building your real estate portfolio today
                    </p>
                    <Link href="/properties">
                      <Button>Browse Properties</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income History Tab */}
          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Income Distributions</CardTitle>
                <CardDescription>
                  History of all income received from your investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incomeLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : incomeHistory && incomeHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Investment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeHistory.map((distribution) => (
                        <TableRow key={distribution.id}>
                          <TableCell>{formatDate(distribution.distributionDate)}</TableCell>
                          <TableCell>Investment #{distribution.investmentId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {distribution.distributionType.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            +{formatCurrency(distribution.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                distribution.status === "processed"
                                  ? "default"
                                  : distribution.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {distribution.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Income Yet</h3>
                    <p className="text-muted-foreground">
                      Income distributions will appear here once your investments start generating returns
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Complete history of all your financial transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description || `${transaction.type} transaction`}
                          </TableCell>
                          <TableCell className="font-semibold">
                            <span className={transaction.type === "payout" ? "text-primary" : ""}>
                              {transaction.type === "payout" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "default"
                                  : transaction.status === "pending"
                                  ? "secondary"
                                  : transaction.status === "failed"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                    <p className="text-muted-foreground">
                      Your transaction history will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
