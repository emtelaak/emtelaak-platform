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
  EUR: { code: "EUR", name: "Euro", symbol: "€", nameAr: "يورو" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", nameAr: "جنيه إسترليني" },
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", nameAr: "درهم إماراتي" },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", nameAr: "ريال سعودي" },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", nameAr: "دينار كويتي" },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", nameAr: "ريال قطري" },
  BHD: { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب", nameAr: "دينار بحريني" },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "ر.ع", nameAr: "ريال عماني" },
};

// Exchange rates cache (base: USD)
let exchangeRatesCache: Record<string, number> | null = null;
let lastUpdated: Date | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch latest exchange rates from API
 * Using exchangerate-api.com free tier (no API key required for basic usage)
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
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
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    AED: 3.67,
    SAR: 3.75,
    KWD: 0.31,
    QAR: 3.64,
    BHD: 0.38,
    OMR: 0.38,
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
 * Convert amount from USD to target currency
 */
export async function convertCurrency(
  amountUSD: number,
  targetCurrency: string
): Promise<number> {
  if (targetCurrency === "USD") {
    return amountUSD;
  }

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency];
  
  if (!rate) {
    console.warn(`Exchange rate not found for ${targetCurrency}, using USD`);
    return amountUSD;
  }

  return amountUSD * rate;
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
    if (language === "ar") {
      return `${formatted} ${currency.symbol}`;
    } else {
      return `${currency.symbol}${formatted}`;
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
