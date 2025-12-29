import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Investment {
  id: number;
  propertyId: number;
  amount?: number;
  investmentAmount?: number;
  shares?: number;
  numberOfShares?: number;
  status: string;
  createdAt: Date | string;
}

interface IncomeDistribution {
  id: number;
  amount: number;
  distributionDate: Date | string;
  distributionType: string;
}

interface PortfolioPerformanceChartProps {
  investments?: Investment[];
  incomeHistory?: IncomeDistribution[];
}

export default function PortfolioPerformanceChart({
  investments = [],
  incomeHistory = [],
}: PortfolioPerformanceChartProps) {
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";
  
  // Generate monthly data for portfolio value over time
  const portfolioValueData = useMemo(() => {
    if (!investments || investments.length === 0) return [];

    // Get date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 11); // Last 12 months

    const monthlyData: Array<{ month: string; value: number; income: number }> = [];

    // Generate data for each month
    for (let i = 0; i < 12; i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + i);
      
      const monthKey = currentDate.toLocaleDateString("en-US", { 
        month: "short", 
        year: "2-digit" 
      });

      // Calculate total invested up to this month
      const investedUpToMonth = investments
        .filter((inv) => {
          const invDate = new Date(inv.createdAt);
          return invDate <= currentDate;
        })
        .reduce((sum, inv) => sum + (inv.amount || inv.investmentAmount || 0), 0);

      // Calculate total income received up to this month
      const incomeUpToMonth = incomeHistory
        .filter((dist) => {
          const distDate = new Date(dist.distributionDate);
          return distDate <= currentDate;
        })
        .reduce((sum, dist) => sum + dist.amount, 0);

      monthlyData.push({
        month: monthKey,
        value: (investedUpToMonth + incomeUpToMonth) / 100, // Convert from cents
        income: incomeUpToMonth / 100,
      });
    }

    return monthlyData;
  }, [investments, incomeHistory]);

  // Generate income by property data
  const incomeByPropertyData = useMemo(() => {
    if (!incomeHistory || incomeHistory.length === 0) return [];

    // Group income by distribution type
    const incomeByType: Record<string, number> = {};
    
    incomeHistory.forEach((dist) => {
      const type = dist.distributionType || "other";
      incomeByType[type] = (incomeByType[type] || 0) + dist.amount;
    });

    return Object.entries(incomeByType).map(([type, amount]) => ({
      type: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      amount: amount / 100, // Convert from cents
    }));
  }, [incomeHistory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateTotalGrowth = () => {
    if (portfolioValueData.length < 2) return 0;
    const firstValue = portfolioValueData[0].value;
    const lastValue = portfolioValueData[portfolioValueData.length - 1].value;
    if (firstValue === 0) return 0;
    return (((lastValue - firstValue) / firstValue) * 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Value Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio Value Over Time</CardTitle>
              <CardDescription>
                Track your investment growth over the last 12 months
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">
                +{calculateTotalGrowth()}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {portfolioValueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioValueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `EGP ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Portfolio Value"
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Total Income"
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No investment data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Income by Type</CardTitle>
          <CardDescription>
            Breakdown of income received from different sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomeByPropertyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeByPropertyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `EGP ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  name="Income Amount"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No income distributions received yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
