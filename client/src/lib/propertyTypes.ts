/**
 * Property Types Configuration based on Investment Module Specifications
 * Each property type has specific yield characteristics and investment parameters
 */

export interface PropertyTypeConfig {
  id: string;
  name: string;
  nameAr: string;
  baseRentalYield: number; // Annual percentage
  yieldRange: { min: number; max: number };
  managementFee: number; // Percentage of gross rental income
  otherCosts: number; // Percentage of property value annually
  annualYieldIncrease: number; // Projected annual increase
  annualAppreciationRate: number; // Capital appreciation rate
  minInvestment: number;
  typicalRange: { min: number; max: number };
  icon: string;
  color: string;
  description: string;
  descriptionAr: string;
}

export const PROPERTY_TYPES: Record<string, PropertyTypeConfig> = {
  commercial: {
    id: "commercial",
    name: "Commercial",
    nameAr: "تجاري",
    baseRentalYield: 0.10, // 10%
    yieldRange: { min: 0.08, max: 0.12 },
    managementFee: 0.08,
    otherCosts: 0.02,
    annualYieldIncrease: 0.10,
    annualAppreciationRate: 0.15,
    minInvestment: 100,
    typicalRange: { min: 100, max: 50000 },
    icon: "Building2",
    color: "#3B82F6",
    description: "Office buildings, retail spaces, and business centers",
    descriptionAr: "المباني المكتبية والمساحات التجارية ومراكز الأعمال",
  },
  residential: {
    id: "residential",
    name: "Residential",
    nameAr: "سكني",
    baseRentalYield: 0.06, // 6%
    yieldRange: { min: 0.04, max: 0.08 },
    managementFee: 0.06,
    otherCosts: 0.015,
    annualYieldIncrease: 0.10,
    annualAppreciationRate: 0.15,
    minInvestment: 100,
    typicalRange: { min: 100, max: 25000 },
    icon: "Home",
    color: "#10B981",
    description: "Apartments, villas, and residential complexes",
    descriptionAr: "الشقق والفلل والمجمعات السكنية",
  },
  medical: {
    id: "medical",
    name: "Medical",
    nameAr: "طبي",
    baseRentalYield: 0.125, // 12.5%
    yieldRange: { min: 0.10, max: 0.15 },
    managementFee: 0.10,
    otherCosts: 0.025,
    annualYieldIncrease: 0.10,
    annualAppreciationRate: 0.15,
    minInvestment: 100,
    typicalRange: { min: 100, max: 75000 },
    icon: "Hospital",
    color: "#EF4444",
    description: "Hospitals, clinics, and medical centers",
    descriptionAr: "المستشفيات والعيادات والمراكز الطبية",
  },
  administrative: {
    id: "administrative",
    name: "Administrative",
    nameAr: "إداري",
    baseRentalYield: 0.09, // 9%
    yieldRange: { min: 0.07, max: 0.11 },
    managementFee: 0.07,
    otherCosts: 0.02,
    annualYieldIncrease: 0.10,
    annualAppreciationRate: 0.15,
    minInvestment: 100,
    typicalRange: { min: 100, max: 40000 },
    icon: "Briefcase",
    color: "#8B5CF6",
    description: "Government buildings and administrative offices",
    descriptionAr: "المباني الحكومية والمكاتب الإدارية",
  },
  educational: {
    id: "educational",
    name: "Educational",
    nameAr: "تعليمي",
    baseRentalYield: 0.115, // 11.5%
    yieldRange: { min: 0.09, max: 0.14 },
    managementFee: 0.09,
    otherCosts: 0.025,
    annualYieldIncrease: 0.10,
    annualAppreciationRate: 0.15,
    minInvestment: 100,
    typicalRange: { min: 100, max: 60000 },
    icon: "GraduationCap",
    color: "#F59E0B",
    description: "Schools, universities, and training centers",
    descriptionAr: "المدارس والجامعات ومراكز التدريب",
  },
  hotel: {
    id: "hotel",
    name: "Hotel",
    nameAr: "فندقي",
    baseRentalYield: 0.15, // 15%
    yieldRange: { min: 0.12, max: 0.18 },
    managementFee: 0.12,
    otherCosts: 0.03,
    annualAppreciationRate: 0.15,
    annualYieldIncrease: 0.10,
    minInvestment: 100,
    typicalRange: { min: 100, max: 100000 },
    icon: "Hotel",
    color: "#EC4899",
    description: "Hotels, resorts, and hospitality properties",
    descriptionAr: "الفنادق والمنتجعات وعقارات الضيافة",
  },
};

/**
 * Calculate ROI metrics for a given investment
 */
export interface ROICalculation {
  investmentAmount: number;
  propertyValue: number;
  propertyType: string;
  ownershipPercentage: number;
  annualGrossRent: number;
  annualManagementFee: number;
  annualOtherCosts: number;
  annualNetRent: number;
  investorAnnualIncome: number;
  monthlyIncome: number;
  roi: number; // Annual ROI percentage
  projectedIncome: { year: number; amount: number }[];
  projectedValue: { year: number; value: number }[];
  totalReturn5Year: number;
  totalReturn10Year: number;
}

export function calculateROI(
  investmentAmount: number,
  propertyValue: number,
  propertyTypeId: string,
  years: number = 10
): ROICalculation {
  const propertyType = PROPERTY_TYPES[propertyTypeId];
  if (!propertyType) {
    throw new Error(`Invalid property type: ${propertyTypeId}`);
  }

  const ownershipPercentage = investmentAmount / propertyValue;
  const annualGrossRent = propertyValue * propertyType.baseRentalYield;
  const annualManagementFee = annualGrossRent * propertyType.managementFee;
  const annualOtherCosts = propertyValue * propertyType.otherCosts;
  const annualNetRent = annualGrossRent - annualManagementFee - annualOtherCosts;
  const investorAnnualIncome = annualNetRent * ownershipPercentage;
  const monthlyIncome = investorAnnualIncome / 12;
  const roi = (investorAnnualIncome / investmentAmount) * 100;

  // Calculate projected income over time
  const projectedIncome: { year: number; amount: number }[] = [];
  const projectedValue: { year: number; value: number }[] = [];
  
  for (let year = 1; year <= years; year++) {
    const yearlyGrossRent = annualGrossRent * Math.pow(1 + propertyType.annualYieldIncrease, year);
    const yearlyManagementFee = yearlyGrossRent * propertyType.managementFee;
    const yearlyOtherCosts = propertyValue * propertyType.otherCosts * Math.pow(1 + 0.03, year); // 3% cost inflation
    const yearlyNetRent = yearlyGrossRent - yearlyManagementFee - yearlyOtherCosts;
    const yearlyIncome = yearlyNetRent * ownershipPercentage;
    
    projectedIncome.push({ year, amount: yearlyIncome });
    
    const appreciatedValue = propertyValue * Math.pow(1 + propertyType.annualAppreciationRate, year);
    const investorPropertyValue = appreciatedValue * ownershipPercentage;
    projectedValue.push({ year, value: investorPropertyValue });
  }

  // Calculate total returns
  const totalIncome5Year = projectedIncome.slice(0, 5).reduce((sum, item) => sum + item.amount, 0);
  const capitalGain5Year = projectedValue[4].value - investmentAmount;
  const totalReturn5Year = totalIncome5Year + capitalGain5Year;

  const totalIncome10Year = projectedIncome.reduce((sum, item) => sum + item.amount, 0);
  const capitalGain10Year = projectedValue[9].value - investmentAmount;
  const totalReturn10Year = totalIncome10Year + capitalGain10Year;

  return {
    investmentAmount,
    propertyValue,
    propertyType: propertyTypeId,
    ownershipPercentage,
    annualGrossRent,
    annualManagementFee,
    annualOtherCosts,
    annualNetRent,
    investorAnnualIncome,
    monthlyIncome,
    roi,
    projectedIncome,
    projectedValue,
    totalReturn5Year,
    totalReturn10Year,
  };
}

/**
 * Determine "Best For" tags based on property type characteristics
 */
export function getBestForTags(propertyTypeId: string, language: "en" | "ar" = "en"): string[] {
  const tags: Record<string, { en: string[]; ar: string[] }> = {
    commercial: {
      en: ["Balanced Returns", "Stable Income"],
      ar: ["عوائد متوازنة", "دخل مستقر"],
    },
    residential: {
      en: ["Low Risk", "Long-term Growth"],
      ar: ["منخفض المخاطر", "نمو طويل الأجل"],
    },
    medical: {
      en: ["High Yield", "Recession-Resistant"],
      ar: ["عائد مرتفع", "مقاوم للركود"],
    },
    administrative: {
      en: ["Government-Backed", "Reliable"],
      ar: ["مدعوم حكومياً", "موثوق"],
    },
    educational: {
      en: ["Consistent Demand", "High Returns"],
      ar: ["طلب ثابت", "عوائد عالية"],
    },
    hotel: {
      en: ["Highest Yield", "Premium Returns"],
      ar: ["أعلى عائد", "عوائد ممتازة"],
    },
  };

  return tags[propertyTypeId]?.[language] || [];
}
