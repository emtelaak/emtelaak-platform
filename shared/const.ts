export const COOKIE_NAME = "emtelaak_session";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Brand colors from Emtelaak brand manual
export const BRAND_COLORS = {
  limeYellow: "#D4FF00",
  oxfordBlue: "#002B49",
} as const;

// Investment constants
export const MIN_SHARES = 1; // Minimum 1 share
export const DEFAULT_CURRENCY = "EGP"; // Egyptian Pound as default

// Property types
export const PROPERTY_TYPES = {
  residential: "Residential",
  commercial: "Commercial",
  administrative: "Administrative",
  hospitality: "Hospitality",
  education: "Education",
  logistics: "Logistics",
  medical: "Medical",
} as const;

// Investment types
export const INVESTMENT_TYPES = {
  buy_to_let: "Buy to Let (High Yield)",
  buy_to_sell: "Buy to Sell (Capital Growth)",
} as const;

// Distribution frequencies
export const DISTRIBUTION_FREQUENCIES = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
} as const;

// KYC document types
export const KYC_DOCUMENT_TYPES = {
  id_card: "ID Card",
  passport: "Passport",
  proof_of_address: "Proof of Address",
  income_verification: "Income Verification",
  accreditation: "Accreditation Documents",
} as const;

// Currency codes
export const CURRENCIES = {
  EGP: "EGP",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  SAR: "SAR",
  AED: "AED",
} as const;

// Language codes
export const LANGUAGES = {
  en: "English",
  ar: "العربية",
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  fawry: "Fawry",
  efinance: "eFinance",
  stripe: "Stripe",
  bank_transfer: "Bank Transfer",
  instapay: "Instapay",
} as const;

// File upload limits
export const FILE_UPLOAD_LIMITS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  allowedDocumentTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
} as const;
