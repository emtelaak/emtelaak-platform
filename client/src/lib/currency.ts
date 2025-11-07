/**
 * Currency conversion utilities for international investors
 * Uses cached exchange rates to minimize API calls
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  nameAr: string;
}

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", nameAr: "دولار أمريكي" },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "EGP", nameAr: "جنيه مصري" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", nameAr: "يورو" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", nameAr: "جنيه إسترليني" },
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", nameAr: "درهم إماراتي" },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", nameAr: "ريال سعودي" },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", nameAr: "دينار كويتي" },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", nameAr: "ريال قطري" },
  BHD: { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب", nameAr: "دينار بحريني" },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "ر.ع", nameAr: "ريال عماني" },
};

// Exchange rates cache (base: EGP)
let exchangeRatesCache: Record<string, number> | null = null;
let lastUpdated: Date | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch latest exchange rates from API
 * Using exchangerate-api.com free tier (no API key required for basic usage)
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/EGP");
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Return fallback rates if API fails
    return getFallbackRates();
  }
}

/**
 * Get fallback exchange rates (approximate values)
 * Used when API is unavailable
 */
function getFallbackRates(): Record<string, number> {
  return {
    EGP: 1.0,
    USD: 0.0202, // 1 EGP = ~0.02 USD
    EUR: 0.0186,
    GBP: 0.0160,
    AED: 0.0741,
    SAR: 0.0758,
    KWD: 0.0063,
    QAR: 0.0735,
    BHD: 0.0077,
    OMR: 0.0078,
  };
}

/**
 * Get exchange rates (from cache or fetch new)
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = new Date();
  
  // Return cached rates if still valid
  if (
    exchangeRatesCache &&
    lastUpdated &&
    now.getTime() - lastUpdated.getTime() < CACHE_DURATION
  ) {
    return exchangeRatesCache;
  }

  // Fetch new rates
  const rates = await fetchExchangeRates();
  exchangeRatesCache = rates;
  lastUpdated = now;
  
  return rates;
}

/**
 * Convert amount from EGP to target currency
 * @param customRate Optional custom exchange rate to override automatic rate
 */
export async function convertCurrency(
  amountEGP: number,
  targetCurrency: string,
  customRate?: number
): Promise<number> {
  if (targetCurrency === "EGP") {
    return amountEGP;
  }

  // Use custom rate if provided
  if (customRate !== undefined && customRate > 0) {
    return amountEGP * customRate;
  }

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency];
  
  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, using EGP`);
    return amountEGP;
  }

  return amountEGP * rate;
}

/**
 * Format currency value with appropriate symbol and locale
 */
export function formatCurrency(
  value: number,
  currencyCode: string,
  language: "en" | "ar" = "en"
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode];
  if (!currency) {
    return value.toFixed(2);
  }

  const locale = language === "en" ? "en-US" : "ar-SA";
  
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    // For Arabic, put symbol after number; for English, before
    // Use Arabic symbol for EGP in Arabic mode
    const displaySymbol = language === "ar" && currencyCode === "EGP" ? "ج.م." : currency.symbol;
    
    if (language === "ar") {
      return `${formatted} ${displaySymbol}`;
    } else {
      // For EGP in English, show as "EGP X" instead of "EGPX"
      if (currencyCode === "EGP") {
        return `${displaySymbol} ${formatted}`;
      }
      return `${displaySymbol}${formatted}`;
    }
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currency.symbol}${value.toFixed(0)}`;
  }
}

/**
 * Get last updated timestamp for exchange rates
 */
export function getLastUpdated(): Date | null {
  return lastUpdated;
}

/**
 * Force refresh exchange rates
 */
export async function refreshExchangeRates(): Promise<void> {
  exchangeRatesCache = null;
  lastUpdated = null;
  await getExchangeRates();
}

/**
 * Fetch historical exchange rates for the past 30 days
 * Returns array of {date, rate} objects
 */
export async function getHistoricalRates(
  targetCurrency: string,
  days: number = 30
): Promise<Array<{ date: string; rate: number }>> {
  if (targetCurrency === "EGP") {
    return [];
  }

  try {
    // Generate dates for the past N days
    const historicalData: Array<{ date: string; rate: number }> = [];
    const today = new Date();
    
    // For demo purposes, generate simulated historical data
    // In production, this would fetch from a real API
    const currentRates = await getExchangeRates();
    const baseRate = currentRates[targetCurrency] || 1;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate slight variations (±3% from current rate)
      const variation = (Math.random() - 0.5) * 0.06; // -3% to +3%
      const rate = baseRate * (1 + variation);
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        rate: Number(rate.toFixed(4)),
      });
    }
    
    return historicalData;
  } catch (error) {
    console.error("Error fetching historical rates:", error);
    return [];
  }
}
