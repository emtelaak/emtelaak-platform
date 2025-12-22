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
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import MobileBottomNav from "@/components/MobileBottomNav";
import Navigation from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import PortfolioPerformanceChart from "@/components/PortfolioPerformanceChart";
import SwipeIndicator from "@/components/SwipeIndicator";
import { useSwipeable } from "react-swipeable";
import { useState } from "react";

export default function Portfolio() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("investments");

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
      currency: 'EGP',
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

  // Swipe navigation for mobile
  const tabs = ["investments", "performance", "income", "transactions"];
  const currentTabIndex = tabs.indexOf(activeTab);

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1]);
    } else if (direction === "right" && currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("left"),
    onSwipedRight: () => handleSwipe("right"),
    trackMouse: false, // Only track touch, not mouse
    preventScrollOnSwipe: false, // Allow vertical scrolling
    delta: 50, // Minimum swipe distance
  });

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
            <a href={"/login"}>
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
        <div className="container py-4 md:py-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-12 md:h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 truncate">{t.portfolio.title}</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                {t.portfolio.subtitle}
              </p>
            </div>
            <LanguageSwitcher />
            <div className="hidden md:flex gap-3">
              <Link href="/properties">
                <Button variant="outline">{t.nav.properties}</Button>
              </Link>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
            {/* Mobile: Show only export button */}
            <div className="md:hidden">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4 md:py-8 px-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium truncate">{t.portfolio.overview.totalInvested}</CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {summaryLoading ? (
                <Skeleton className="h-6 md:h-8 w-20 md:w-32" />
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold truncate">
                    {formatCurrency(portfolioSummary?.totalInvested || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {t.portfolio.overview.activeProperties}: {portfolioSummary?.activeInvestments || 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium truncate">{t.portfolio.income.title}</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {incomeLoading ? (
                <Skeleton className="h-6 md:h-8 w-20 md:w-32" />
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold text-primary truncate">
                    {formatCurrency(calculateTotalIncome())}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {incomeHistory?.length || 0} distributions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium truncate">ROI</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {summaryLoading || incomeLoading ? (
                <Skeleton className="h-6 md:h-8 w-16 md:w-24" />
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold text-primary truncate">
                    {calculateROI()}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Return
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium truncate">Active</CardTitle>
              <Building2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="investments" className="text-xs md:text-sm py-3 md:py-2">Investments</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs md:text-sm py-3 md:py-2">Performance</TabsTrigger>
            <TabsTrigger value="income" className="text-xs md:text-sm py-3 md:py-2">Income</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs md:text-sm py-3 md:py-2">Transactions</TabsTrigger>
          </TabsList>

          {/* Swipeable container for mobile */}
          <div {...swipeHandlers} className="md:pointer-events-none">

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

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <PortfolioPerformanceChart 
              investments={portfolioSummary?.investments}
              incomeHistory={incomeHistory}
            />
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
          </div>
        </Tabs>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Swipe Tutorial Indicator */}
      <SwipeIndicator />
    </div>
  );
}
