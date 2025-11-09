/**
 * FINANCIAL CALCULATIONS FOR OFFERINGS
 * Phase 1: Core Offering Management
 * 
 * Provides accurate financial modeling calculations including:
 * - Internal Rate of Return (IRR)
 * - Return on Investment (ROI)
 * - Cash-on-Cash Return
 * - Equity Multiple
 * - Rental Yield Projections
 * - Appreciation Projections
 */

// ============================================
// IRR CALCULATION (Newton-Raphson Method)
// ============================================

/**
 * Calculate Internal Rate of Return using Newton-Raphson method
 * @param cashFlows Array of cash flows (negative for outflows, positive for inflows)
 * @param guess Initial guess for IRR (default 0.1 = 10%)
 * @param maxIterations Maximum iterations for convergence
 * @param tolerance Convergence tolerance
 * @returns IRR as decimal (e.g., 0.15 = 15%)
 */
export function calculateIRR(
  cashFlows: number[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 0.0001
): number | null {
  if (cashFlows.length < 2) return null;

  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv += (-t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    rate = newRate;
  }

  // If no convergence, return null
  return null;
}

/**
 * Calculate IRR for a property investment
 * @param initialInvestment Initial investment amount (positive number)
 * @param annualCashFlows Array of annual cash flows
 * @param exitValue Final sale/exit value
 * @returns IRR as percentage * 10000 (e.g., 1250 = 12.50%)
 */
export function calculatePropertyIRR(
  initialInvestment: number,
  annualCashFlows: number[],
  exitValue: number
): number | null {
  const cashFlows = [
    -initialInvestment, // Year 0: outflow
    ...annualCashFlows.slice(0, -1), // Years 1 to n-1: cash flows
    annualCashFlows[annualCashFlows.length - 1] + exitValue, // Year n: final cash flow + exit
  ];

  const irr = calculateIRR(cashFlows);
  return irr !== null ? Math.round(irr * 10000) : null;
}

// ============================================
// ROI CALCULATION
// ============================================

/**
 * Calculate Return on Investment
 * @param initialInvestment Initial investment amount
 * @param finalValue Final value (including all returns)
 * @returns ROI as percentage * 10000 (e.g., 2500 = 25.00%)
 */
export function calculateROI(
  initialInvestment: number,
  finalValue: number
): number {
  if (initialInvestment === 0) return 0;
  const roi = (finalValue - initialInvestment) / initialInvestment;
  return Math.round(roi * 10000);
}

/**
 * Calculate annualized ROI
 * @param initialInvestment Initial investment amount
 * @param finalValue Final value
 * @param years Number of years
 * @returns Annualized ROI as percentage * 10000
 */
export function calculateAnnualizedROI(
  initialInvestment: number,
  finalValue: number,
  years: number
): number {
  if (initialInvestment === 0 || years === 0) return 0;
  const totalReturn = finalValue / initialInvestment;
  const annualizedReturn = Math.pow(totalReturn, 1 / years) - 1;
  return Math.round(annualizedReturn * 10000);
}

// ============================================
// CASH-ON-CASH RETURN
// ============================================

/**
 * Calculate Cash-on-Cash Return
 * @param annualCashFlow Annual pre-tax cash flow
 * @param initialInvestment Initial cash investment
 * @returns Cash-on-Cash return as percentage * 10000
 */
export function calculateCashOnCash(
  annualCashFlow: number,
  initialInvestment: number
): number {
  if (initialInvestment === 0) return 0;
  const coc = annualCashFlow / initialInvestment;
  return Math.round(coc * 10000);
}

// ============================================
// EQUITY MULTIPLE
// ============================================

/**
 * Calculate Equity Multiple
 * @param totalReturns Total returns (cash flows + exit value)
 * @param initialInvestment Initial investment
 * @returns Equity multiple * 100 (e.g., 180 = 1.80x)
 */
export function calculateEquityMultiple(
  totalReturns: number,
  initialInvestment: number
): number {
  if (initialInvestment === 0) return 0;
  const multiple = totalReturns / initialInvestment;
  return Math.round(multiple * 100);
}

// ============================================
// RENTAL YIELD PROJECTIONS
// ============================================

/**
 * Project rental yields over multiple years
 * @param initialYield Initial rental yield (percentage * 10000)
 * @param annualGrowthRate Annual growth rate (percentage * 10000)
 * @param years Number of years to project
 * @returns Array of projected yields for each year
 */
export function projectRentalYields(
  initialYield: number,
  annualGrowthRate: number,
  years: number
): number[] {
  const yields: number[] = [];
  const growthDecimal = annualGrowthRate / 10000;

  for (let year = 0; year < years; year++) {
    const projectedYield = initialYield * Math.pow(1 + growthDecimal, year);
    yields.push(Math.round(projectedYield));
  }

  return yields;
}

/**
 * Calculate net rental yield after fees
 * @param grossYield Gross rental yield (percentage * 10000)
 * @param managementFee Management fee (percentage * 10000)
 * @param otherCosts Other costs (percentage * 10000)
 * @returns Net yield (percentage * 10000)
 */
export function calculateNetRentalYield(
  grossYield: number,
  managementFee: number,
  otherCosts: number
): number {
  const grossDecimal = grossYield / 10000;
  const feeDecimal = (managementFee + otherCosts) / 10000;
  const netYield = grossDecimal - feeDecimal;
  return Math.round(netYield * 10000);
}

// ============================================
// APPRECIATION PROJECTIONS
// ============================================

/**
 * Project property appreciation over multiple years
 * @param initialValue Initial property value
 * @param annualAppreciationRate Annual appreciation rate (percentage * 10000)
 * @param years Number of years to project
 * @returns Array of projected values for each year
 */
export function projectAppreciation(
  initialValue: number,
  annualAppreciationRate: number,
  years: number
): number[] {
  const values: number[] = [];
  const rateDecimal = annualAppreciationRate / 10000;

  for (let year = 0; year < years; year++) {
    const projectedValue = initialValue * Math.pow(1 + rateDecimal, year + 1);
    values.push(Math.round(projectedValue));
  }

  return values;
}

/**
 * Calculate total appreciation percentage
 * @param initialValue Initial value
 * @param finalValue Final value
 * @returns Appreciation percentage * 10000
 */
export function calculateAppreciationPercentage(
  initialValue: number,
  finalValue: number
): number {
  if (initialValue === 0) return 0;
  const appreciation = (finalValue - initialValue) / initialValue;
  return Math.round(appreciation * 10000);
}

// ============================================
// CASH FLOW PROJECTIONS
// ============================================

/**
 * Project annual cash flows for buy-to-let property
 * @param propertyValue Property value
 * @param rentalYields Array of rental yields for each year (percentage * 10000)
 * @param managementFee Management fee (percentage * 10000)
 * @param otherCosts Other costs (percentage * 10000)
 * @returns Array of projected cash flows
 */
export function projectBuyToLetCashFlows(
  propertyValue: number,
  rentalYields: number[],
  managementFee: number,
  otherCosts: number
): number[] {
  return rentalYields.map((yield_) => {
    const grossIncome = (propertyValue * yield_) / 10000;
    const fees = (propertyValue * (managementFee + otherCosts)) / 10000;
    return Math.round(grossIncome - fees);
  });
}

/**
 * Project cash flows for buy-to-sell property
 * @param propertyValue Property value
 * @param holdingPeriodYears Holding period in years
 * @param appreciationRate Annual appreciation rate (percentage * 10000)
 * @param annualCosts Annual holding costs
 * @returns Object with annual cash flows and exit value
 */
export function projectBuyToSellCashFlows(
  propertyValue: number,
  holdingPeriodYears: number,
  appreciationRate: number,
  annualCosts: number
): { cashFlows: number[]; exitValue: number } {
  const cashFlows: number[] = [];

  // Annual cash flows are negative (holding costs)
  for (let year = 0; year < holdingPeriodYears; year++) {
    cashFlows.push(-annualCosts);
  }

  // Calculate exit value
  const exitValue = Math.round(
    propertyValue * Math.pow(1 + appreciationRate / 10000, holdingPeriodYears)
  );

  return { cashFlows, exitValue };
}

// ============================================
// DISTRIBUTION SCHEDULE
// ============================================

export type DistributionFrequency = "monthly" | "quarterly" | "semi_annual" | "annual";

/**
 * Calculate distribution schedule
 * @param annualDistribution Total annual distribution amount
 * @param frequency Distribution frequency
 * @param startDate First distribution date
 * @param years Number of years
 * @returns Array of distribution dates and amounts
 */
export function generateDistributionSchedule(
  annualDistribution: number,
  frequency: DistributionFrequency,
  startDate: Date,
  years: number
): Array<{ date: Date; amount: number }> {
  const schedule: Array<{ date: Date; amount: number }> = [];

  const frequencyMap = {
    monthly: { count: 12, months: 1 },
    quarterly: { count: 4, months: 3 },
    semi_annual: { count: 2, months: 6 },
    annual: { count: 1, months: 12 },
  };

  const { count, months } = frequencyMap[frequency];
  const distributionAmount = Math.round(annualDistribution / count);

  for (let year = 0; year < years; year++) {
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + year * 12 + i * months);
      schedule.push({ date, amount: distributionAmount });
    }
  }

  return schedule;
}

// ============================================
// SENSITIVITY ANALYSIS
// ============================================

/**
 * Perform sensitivity analysis on IRR
 * @param baseCase Base case parameters
 * @param variableRanges Ranges for each variable
 * @returns Best, base, and worst case IRR
 */
export function performSensitivityAnalysis(
  initialInvestment: number,
  baseAnnualCashFlows: number[],
  baseExitValue: number,
  variationPercentage: number = 20 // +/- 20%
): { bestCase: number | null; baseCase: number | null; worstCase: number | null } {
  const variation = variationPercentage / 100;

  // Base case
  const baseCase = calculatePropertyIRR(
    initialInvestment,
    baseAnnualCashFlows,
    baseExitValue
  );

  // Best case: +20% cash flows and exit value
  const bestCashFlows = baseAnnualCashFlows.map((cf) => cf * (1 + variation));
  const bestExitValue = baseExitValue * (1 + variation);
  const bestCase = calculatePropertyIRR(
    initialInvestment,
    bestCashFlows,
    bestExitValue
  );

  // Worst case: -20% cash flows and exit value
  const worstCashFlows = baseAnnualCashFlows.map((cf) => cf * (1 - variation));
  const worstExitValue = baseExitValue * (1 - variation);
  const worstCase = calculatePropertyIRR(
    initialInvestment,
    worstCashFlows,
    worstExitValue
  );

  return { bestCase, baseCase, worstCase };
}

// ============================================
// FEE IMPACT CALCULATION
// ============================================

/**
 * Calculate total fee impact on returns
 * @param grossReturn Gross return (percentage * 10000)
 * @param fees Object containing all fee percentages
 * @returns Net return after fees (percentage * 10000)
 */
export function calculateFeeImpact(
  grossReturn: number,
  fees: {
    platformFeePercentage: number;
    managementFeePercentage: number;
    performanceFeePercentage: number;
    maintenanceFeePercentage: number;
  }
): { netReturn: number; totalFeeImpact: number } {
  const grossDecimal = grossReturn / 10000;

  // Calculate total fee percentage
  const totalFeePercentage =
    fees.platformFeePercentage +
    fees.managementFeePercentage +
    fees.maintenanceFeePercentage;

  // Performance fee applies only to returns above hurdle
  const performanceFeeImpact =
    grossDecimal > 0 ? (grossDecimal * fees.performanceFeePercentage) / 10000 : 0;

  const totalFeeDecimal = totalFeePercentage / 10000 + performanceFeeImpact;
  const netReturn = grossDecimal - totalFeeDecimal;

  return {
    netReturn: Math.round(netReturn * 10000),
    totalFeeImpact: Math.round(totalFeeDecimal * 10000),
  };
}

/**
 * Calculate estimated annual fees
 * @param propertyValue Property value
 * @param fees Fee structure
 * @returns Estimated annual fees in cents
 */
export function calculateEstimatedAnnualFees(
  propertyValue: number,
  fees: {
    platformFeePercentage: number;
    platformFeeFixed: number;
    managementFeePercentage: number;
    managementFeeFixed: number;
    maintenanceFeePercentage: number;
    maintenanceFeeFixed: number;
  }
): number {
  const percentageFees =
    (propertyValue *
      (fees.platformFeePercentage +
        fees.managementFeePercentage +
        fees.maintenanceFeePercentage)) /
    10000;

  const fixedFees =
    fees.platformFeeFixed + fees.managementFeeFixed + fees.maintenanceFeeFixed;

  return Math.round(percentageFees + fixedFees);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert percentage stored as * 10000 to decimal
 * @param percentage Percentage * 10000 (e.g., 1250 = 12.50%)
 * @returns Decimal (e.g., 0.125)
 */
export function percentageToDecimal(percentage: number): number {
  return percentage / 10000;
}

/**
 * Convert decimal to percentage * 10000
 * @param decimal Decimal (e.g., 0.125)
 * @returns Percentage * 10000 (e.g., 1250)
 */
export function decimalToPercentage(decimal: number): number {
  return Math.round(decimal * 10000);
}

/**
 * Format percentage for display
 * @param percentage Percentage * 10000 (e.g., 1250 = 12.50%)
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "12.50%")
 */
export function formatPercentage(percentage: number, decimals: number = 2): string {
  const value = percentage / 100;
  return `${value.toFixed(decimals)}%`;
}
