import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PROPERTY_TYPES, INVESTMENT_TYPES } from "@/const";
import { Building2, MapPin, TrendingUp, Calendar, ArrowRight, Search } from "lucide-react";
import { Link } from "wouter";

export default function Properties() {
  const [filters, setFilters] = useState({
    propertyType: undefined as string | undefined,
    investmentType: undefined as string | undefined,
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
  });

  const { data: properties, isLoading } = trpc.properties.list.useQuery(filters);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatPercentage = (value: number) => {
    return `${(value / 100).toFixed(2)}%`;
  };

  const calculateFundingProgress = (totalValue: number, availableValue: number) => {
    return ((totalValue - availableValue) / totalValue) * 100;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Investment Properties</h1>
              <p className="text-muted-foreground">
                Browse our curated selection of premium real estate opportunities
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                className="pl-9"
              />
            </div>

            <Select
              value={filters.propertyType}
              onValueChange={(value) => setFilters({ ...filters, propertyType: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(PROPERTY_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.investmentType}
              onValueChange={(value) => setFilters({ ...filters, investmentType: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Investment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {Object.entries(INVESTMENT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setFilters({
                propertyType: undefined,
                investmentType: undefined,
                minValue: undefined,
                maxValue: undefined,
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Property Grid */}
      <div className="container py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <>
            <div className="mb-6 text-sm text-muted-foreground">
              Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => {
                const fundingProgress = calculateFundingProgress(property.totalValue, property.availableValue);
                const yieldValue = property.rentalYield || property.expectedAppreciation || 0;

                return (
                  <Card key={property.id} className="property-card-hover overflow-hidden">
                    <div className="relative h-48 bg-muted">
                      {/* Placeholder for property image - will be replaced with actual images */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-background/90">
                          {PROPERTY_TYPES[property.propertyType as keyof typeof PROPERTY_TYPES]}
                        </Badge>
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary text-primary-foreground">
                          {property.investmentType === "buy_to_let" ? "High Yield" : "Capital Growth"}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-1">{property.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.city}, {property.country}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Value</p>
                          <p className="font-semibold">{formatCurrency(property.totalValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expected Yield</p>
                          <p className="font-semibold text-primary flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatPercentage(yieldValue)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Funding Progress</span>
                          <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${fundingProgress}%` }}
                          />
                        </div>
                      </div>

                      {property.fundingDeadline && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Deadline: {new Date(property.fundingDeadline).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Link href={`/properties/${property.id}`} className="w-full">
                        <Button className="w-full">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or check back later for new opportunities.
            </p>
            <Button
              variant="outline"
              onClick={() => setFilters({
                propertyType: undefined,
                investmentType: undefined,
                minValue: undefined,
                maxValue: undefined,
              })}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
