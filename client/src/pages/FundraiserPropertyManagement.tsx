import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Search, MapPin, DollarSign, TrendingUp, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function FundraiserPropertyManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: properties, isLoading } = trpc.properties.list.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Breadcrumb />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredProperties = properties?.filter((property) =>
    (property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.country?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Property Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your properties and create new investment opportunities
          </p>
        </div>
        <Link href="/admin/add-property">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add New Property
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{properties?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {properties?.filter(p => p.status === 'available').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Funded Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {properties?.filter(p => p.status === 'funded').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${properties?.reduce((sum, p) => sum + (Number(p.totalValue) / 100), 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "No properties match your search criteria."
                  : "Get started by adding your first property."}
              </p>
              <Link href="/admin/property-management/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Property
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{property.name || property.nameAr || `Property #${property.id}`}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {[property.city, property.country].filter(Boolean).join(', ') || 'Location not specified'}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      property.status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : property.status === 'funded'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {property.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Price
                    </span>
                    <span className="font-semibold">${(Number(property.totalValue) / 100).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Total Shares
                    </span>
                    <span className="font-semibold">{property.totalShares?.toLocaleString() || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Share Price</span>
                    <span className="font-semibold">
                      ${property.sharePrice ? Number(property.sharePrice).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <Link href={`/admin/property-management/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
