export { COOKIE_NAME, ONE_YEAR_MS, BRAND_COLORS, PROPERTY_TYPES, INVESTMENT_TYPES, DISTRIBUTION_FREQUENCIES, KYC_DOCUMENT_TYPES, CURRENCIES, LANGUAGES, PAYMENT_METHODS, FILE_UPLOAD_LIMITS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/brand/logos/logo-en-trimmed.png";

// Login URL - direct path to login page (OAuth removed)
export const LOGIN_URL = "/login";
