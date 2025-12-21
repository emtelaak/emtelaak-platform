import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { countries, type Country } from "@shared/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CountrySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Country Selector Component with Search
 * Displays countries with flags and supports bilingual names
 */
export function CountrySelector({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: CountrySelectorProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    
    const lowerQuery = searchQuery.toLowerCase();
    return countries.filter((country) => {
      const nameEn = country.nameEn.toLowerCase();
      const nameAr = country.nameAr.toLowerCase();
      const code = country.code.toLowerCase();
      return nameEn.includes(lowerQuery) || nameAr.includes(lowerQuery) || code.includes(lowerQuery);
    });
  }, [searchQuery]);

  // Get selected country
  const selectedCountry = countries.find((c) => c.code === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{language === "en" ? selectedCountry.nameEn : selectedCountry.nameAr}</span>
            </div>
          ) : (
            placeholder || (language === "en" ? "Select a country" : "اختر دولة")
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Search Input */}
        <div className="p-2 border-b sticky top-0 bg-background">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "en" ? "Search countries..." : "ابحث عن دولة..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Countries List */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{language === "en" ? country.nameEn : country.nameAr}</span>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {language === "en" ? "No countries found" : "لم يتم العثور على دول"}
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
