import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, TrendingUp, DollarSign, Calendar, BarChart3, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  SUPPORTED_CURRENCIES,
  convertCurrency,
  formatCurrency as formatCurrencyWithSymbol,
  getLastUpdated,
  refreshExchangeRates,
  getHistoricalRates,
  getExchangeRates,
} from "@/lib/currency";
import {
  PROPERTY_TYPES,
  calculateROI,
  getBestForTags,
  type ROICalculation,
} from "@/lib/propertyTypes";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ROICalculatorProps {
  defaultPropertyType?: string;
  defaultPropertyValue?: number;
  defaultInvestmentAmount?: number;
  compact?: boolean;
}

export default function ROICalculator({
  defaultPropertyType = "commercial",
  defaultPropertyValue = 1000000,
  defaultInvestmentAmount = 5000,
  compact = false,
}: ROICalculatorProps) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [investmentAmount, setInvestmentAmount] = useState(defaultInvestmentAmount);
  const [propertyValue, setPropertyValue] = useState(defaultPropertyValue);
  const [selectedPropertyType, setSelectedPropertyType] = useState(defaultPropertyType);
  const [selectedCurrency, setSelectedCurrency] = useState("EGP");
  const [convertedValues, setConvertedValues] = useState<Record<string, number>>({});
  const [isConverting, setIsConverting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRate, setCustomRate] = useState<number>(0);
  const [currentAutoRate, setCurrentAutoRate] = useState<number>(0);
  const [historicalRates, setHistoricalRates] = useState<Array<{ date: string; rate: number }>>([]);
  const [showRateChart, setShowRateChart] = useState(false);

  // Calculate ROI for selected property type
  const calculation = useMemo(() => {
    if (investmentAmount > 0 && propertyValue > 0 && investmentAmount <= propertyValue) {
      return calculateROI(investmentAmount, propertyValue, selectedPropertyType);
    }
    return null;
  }, [investmentAmount, propertyValue, selectedPropertyType]);

  // Convert currency values when currency changes
  useEffect(() => {
    async function convertValues() {
      if (!calculation) return;
      
      setIsConverting(true);
      try {
        // Get current automatic rate for display
        const rates = await getExchangeRates();
        const autoRate = rates[selectedCurrency] || 1;
        setCurrentAutoRate(autoRate);
        
        const rateToUse = useCustomRate ? customRate : undefined;
        const converted = {
          monthlyIncome: await convertCurrency(calculation.monthlyIncome, selectedCurrency, rateToUse),
          investorAnnualIncome: await convertCurrency(calculation.investorAnnualIncome, selectedCurrency, rateToUse),
          totalReturn5Year: await convertCurrency(calculation.totalReturn5Year, selectedCurrency, rateToUse),
          totalReturn10Year: await convertCurrency(calculation.totalReturn10Year, selectedCurrency, rateToUse),
          annualGrossRent: await convertCurrency(calculation.annualGrossRent, selectedCurrency, rateToUse),
          annualManagementFee: await convertCurrency(calculation.annualManagementFee, selectedCurrency, rateToUse),
          annualOtherCosts: await convertCurrency(calculation.annualOtherCosts, selectedCurrency, rateToUse),
          annualNetRent: await convertCurrency(calculation.annualNetRent, selectedCurrency, rateToUse),
        };
        setConvertedValues(converted);
        setLastUpdated(getLastUpdated());
      } catch (error) {
        console.error("Error converting currency:", error);
      } finally {
        setIsConverting(false);
      }
    }
    convertValues();
  }, [calculation, selectedCurrency, useCustomRate, customRate]);

  const handleRefreshRates = async () => {
    setIsConverting(true);
    try {
      await refreshExchangeRates();
      setLastUpdated(getLastUpdated());
      // Trigger re-conversion
      setSelectedCurrency(selectedCurrency);
    } catch (error) {
      console.error("Error refreshing rates:", error);
    } finally {
      setIsConverting(false);
    }
  };

  // Calculate ROI for all property types for comparison
  const allCalculations = useMemo(() => {
    if (investmentAmount > 0 && propertyValue > 0 && investmentAmount <= propertyValue) {
      return Object.keys(PROPERTY_TYPES).map((typeId) => ({
        typeId,
        calculation: calculateROI(investmentAmount, propertyValue, typeId),
      }));
    }
    return [];
  }, [investmentAmount, propertyValue]);

  // Prepare data for comparison chart
  const comparisonChartData = useMemo(() => {
    return allCalculations.map(({ typeId, calculation }) => {
      const propertyType = PROPERTY_TYPES[typeId];
      return {
        name: language === "en" ? propertyType.name : propertyType.nameAr,
        "Annual Income": calculation.investorAnnualIncome,
        "5-Year Return": calculation.totalReturn5Year,
        "10-Year Return": calculation.totalReturn10Year,
        ROI: calculation.roi,
      };
    });
  }, [allCalculations, language]);

  // Prepare data for projected income chart
  const projectedIncomeData = useMemo(() => {
    if (!calculation) return [];
    return calculation.projectedIncome.map((item) => ({
      year: `Year ${item.year}`,
      income: item.amount,
    }));
  }, [calculation]);

  const formatCurrency = (value: number) => {
    return formatCurrencyWithSymbol(value, selectedCurrency, language);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {language === "en" ? "ROI Calculator" : "حاسبة العائد على الاستثمار"}
            </CardTitle>
            <CardDescription>
              {language === "en"
                ? "Compare returns across different property types"
                : "قارن العوائد عبر أنواع العقارات المختلفة"}
            </CardDescription>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investment-amount">
                {language === "en" ? "Investment Amount ($)" : "مبلغ الاستثمار ($)"}
              </Label>
              <Input
                id="investment-amount"
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                min={100}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-value">
                {language === "en" ? "Property Value ($)" : "قيمة العقار ($)"}
              </Label>
              <Input
                id="property-value"
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value))}
                min={1000}
                step={1000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-type">
                {language === "en" ? "Property Type" : "نوع العقار"}
              </Label>
              <select
                id="property-type"
                value={selectedPropertyType}
                onChange={(e) => setSelectedPropertyType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Object.values(PROPERTY_TYPES).map((type) => (
                  <option key={type.id} value={type.id}>
                    {language === "en" ? type.name : type.nameAr} -{" "}
                    {formatPercentage(type.baseRentalYield * 100)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">
                {language === "en" ? "Currency" : "العملة"}
              </Label>
              <div className="flex gap-2">
                <select
                  id="currency"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isConverting}
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {language === "en" ? currency.name : currency.nameAr}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshRates}
                  disabled={isConverting}
                  title={language === "en" ? "Refresh exchange rates" : "تحديث أسعار الصرف"}
                >
                  <RefreshCw className={`h-4 w-4 ${isConverting ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  {language === "en" ? "Updated: " : "آخر تحديث: "}
                  {lastUpdated.toLocaleTimeString(language === "en" ? "en-US" : "ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Custom Exchange Rate */}
          {selectedCurrency !== "EGP" && (
            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-custom-rate" className="cursor-pointer">
                  {language === "en" ? "Use Custom Exchange Rate" : "استخدام سعر صرف مخصص"}
                </Label>
                <input
                  type="checkbox"
                  id="use-custom-rate"
                  checked={useCustomRate}
                  onChange={(e) => setUseCustomRate(e.target.checked)}
                  className="h-4 w-4 cursor-pointer"
                />
              </div>
              
              {useCustomRate && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="custom-rate">
                      {language === "en" 
                        ? `Custom Rate (1 USD = ? ${selectedCurrency})` 
                        : `سعر مخصص (1 دولار = ? ${selectedCurrency})`}
                    </Label>
                    <Dialog open={showRateChart} onOpenChange={setShowRateChart}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const data = await getHistoricalRates(selectedCurrency, 30);
                            setHistoricalRates(data);
                            setShowRateChart(true);
                          }}
                          className="h-8 px-2"
                        >
                          <TrendingUp className="h-4 w-4" />
                          <span className="ml-1 text-xs">
                            {language === "en" ? "Trend" : "الاتجاه"}
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {language === "en" 
                              ? `USD to ${selectedCurrency} - 30 Day Trend` 
                              : `دولار إلى ${selectedCurrency} - اتجاه 30 يوم`}
                          </DialogTitle>
                          <DialogDescription>
                            {language === "en"
                              ? "Historical exchange rate trends for the past 30 days"
                              : "اتجاهات سعر الصرف التاريخية للـ 30 يومًا الماضية"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalRates}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                  const date = new Date(value);
                                  return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }}
                                domain={['auto', 'auto']}
                              />
                              <Tooltip 
                                formatter={(value: number) => value.toFixed(4)}
                                labelFormatter={(label) => {
                                  const date = new Date(label);
                                  return date.toLocaleDateString(language === "en" ? "en-US" : "ar-SA");
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                dot={false}
                                name={language === "en" ? "Exchange Rate" : "سعر الصرف"}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="custom-rate"
                    type="number"
                    value={customRate || ""}
                    onChange={(e) => setCustomRate(Number(e.target.value))}
                    min={0}
                    step={0.01}
                    placeholder={language === "en" ? "Enter custom rate" : "أدخل السعر المخصص"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "en" ? "Current automatic rate: " : "السعر التلقائي الحالي: "}
                    <span className="font-medium">1 USD = {currentAutoRate.toFixed(4)} {selectedCurrency}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Validation Message */}
          {investmentAmount > propertyValue && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              {language === "en"
                ? "Investment amount cannot exceed property value"
                : "لا يمكن أن يتجاوز مبلغ الاستثمار قيمة العقار"}
            </div>
          )}

          {calculation && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">
                  {language === "en" ? "Summary" : "ملخص"}
                </TabsTrigger>
                <TabsTrigger value="comparison">
                  {language === "en" ? "Comparison" : "مقارنة"}
                </TabsTrigger>
                <TabsTrigger value="projections">
                  {language === "en" ? "Projections" : "التوقعات"}
                </TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {language === "en" ? "Monthly Income" : "الدخل الشهري"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(convertedValues.monthlyIncome || calculation.monthlyIncome)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {language === "en" ? "Annual Income" : "الدخل السنوي"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(convertedValues.investorAnnualIncome || calculation.investorAnnualIncome)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {language === "en" ? "Annual ROI" : "العائد السنوي"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(calculation.roi)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        {language === "en" ? "10-Year Return" : "العائد لـ 10 سنوات"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(convertedValues.totalReturn10Year || calculation.totalReturn10Year)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Best For Tags */}
                <div className="flex flex-wrap gap-2">
                  {getBestForTags(selectedPropertyType, language).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "en" ? "Ownership Percentage" : "نسبة الملكية"}
                    </span>
                    <span className="font-medium">
                      {formatPercentage(calculation.ownershipPercentage * 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "en" ? "Annual Gross Rent" : "الإيجار الإجمالي السنوي"}
                    </span>
                    <span className="font-medium">{formatCurrency(convertedValues.annualGrossRent || calculation.annualGrossRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "en" ? "Management Fees" : "رسوم الإدارة"}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(convertedValues.annualManagementFee || calculation.annualManagementFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "en" ? "Other Costs" : "تكاليف أخرى"}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(convertedValues.annualOtherCosts || calculation.annualOtherCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">
                      {language === "en" ? "Net Annual Rent" : "صافي الإيجار السنوي"}
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(convertedValues.annualNetRent || calculation.annualNetRent)}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Comparison Tab */}
              <TabsContent value="comparison" className="space-y-4">
                {/* Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">
                          {language === "en" ? "Property Type" : "نوع العقار"}
                        </th>
                        <th className="text-right p-2">
                          {language === "en" ? "Base Yield" : "العائد الأساسي"}
                        </th>
                        <th className="text-right p-2">
                          {language === "en" ? "Monthly Income" : "الدخل الشهري"}
                        </th>
                        <th className="text-right p-2">
                          {language === "en" ? "Annual ROI" : "العائد السنوي"}
                        </th>
                        <th className="text-right p-2">
                          {language === "en" ? "10-Year Return" : "عائد 10 سنوات"}
                        </th>
                        <th className="text-left p-2">
                          {language === "en" ? "Best For" : "الأفضل لـ"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCalculations
                        .sort((a, b) => b.calculation.roi - a.calculation.roi)
                        .map(({ typeId, calculation: calc }) => {
                          const propertyType = PROPERTY_TYPES[typeId];
                          const bestForTags = getBestForTags(typeId, language);
                          return (
                            <tr
                              key={typeId}
                              className={`border-b hover:bg-muted/50 ${
                                typeId === selectedPropertyType ? "bg-muted" : ""
                              }`}
                            >
                              <td className="p-2">
                                <div className="font-medium">
                                  {language === "en" ? propertyType.name : propertyType.nameAr}
                                </div>
                              </td>
                              <td className="text-right p-2">
                                {formatPercentage(propertyType.baseRentalYield * 100)}
                              </td>
                              <td className="text-right p-2 font-medium">
                                {formatCurrency(calc.monthlyIncome)}
                              </td>
                              <td className="text-right p-2 font-bold text-green-600">
                                {formatPercentage(calc.roi)}
                              </td>
                              <td className="text-right p-2 font-bold text-blue-600">
                                {formatCurrency(calc.totalReturn10Year)}
                              </td>
                              <td className="p-2">
                                <div className="flex flex-wrap gap-1">
                                  {bestForTags.slice(0, 1).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Comparison Bar Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar
                        dataKey="Annual Income"
                        fill="#10B981"
                        name={language === "en" ? "Annual Income" : "الدخل السنوي"}
                      />
                      <Bar
                        dataKey="10-Year Return"
                        fill="#3B82F6"
                        name={language === "en" ? "10-Year Return" : "عائد 10 سنوات"}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* Projections Tab */}
              <TabsContent value="projections" className="space-y-4">
                {/* Projected Income Line Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectedIncomeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10B981"
                        strokeWidth={2}
                        name={language === "en" ? "Annual Income" : "الدخل السنوي"}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Projected Income Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">{language === "en" ? "Year" : "السنة"}</th>
                        <th className="text-right p-2">
                          {language === "en" ? "Annual Income" : "الدخل السنوي"}
                        </th>
                        <th className="text-right p-2">
                          {language === "en" ? "Cumulative Income" : "الدخل التراكمي"}
                        </th>
                        <th className="text-right p-2">
                          {language === "en" ? "Property Value" : "قيمة العقار"}
                        </th>
                        <th className="text-right p-2">
                          {language === "en" ? "Total Return" : "العائد الإجمالي"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.projectedIncome.map((item, index) => {
                        const cumulativeIncome = calculation.projectedIncome
                          .slice(0, index + 1)
                          .reduce((sum, i) => sum + i.amount, 0);
                        const propertyValue = calculation.projectedValue[index].value;
                        const totalReturn =
                          cumulativeIncome + (propertyValue - calculation.investmentAmount);
                        return (
                          <tr key={item.year} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">
                              {language === "en" ? `Year ${item.year}` : `السنة ${item.year}`}
                            </td>
                            <td className="text-right p-2">{formatCurrency(item.amount)}</td>
                            <td className="text-right p-2 font-medium">
                              {formatCurrency(cumulativeIncome)}
                            </td>
                            <td className="text-right p-2">{formatCurrency(propertyValue)}</td>
                            <td className="text-right p-2 font-bold text-blue-600">
                              {formatCurrency(totalReturn)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      )}
    </Card>
  );
}
