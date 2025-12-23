import { useState } from "react";
import { useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import PropertyImageUpload from "@/components/PropertyImageUpload";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function AdminPropertyImages() {
  const [, params] = useRoute("/admin/properties/:id/images");
  const propertyId = params?.id ? parseInt(params.id) : 0;

  const { data: property, isLoading } = trpc.propertyManagement.list.useQuery(undefined, {
    select: (properties) => properties?.find((p: any) => p.id === propertyId),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Property Not Found</CardTitle>
            <CardDescription>The requested property could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/properties">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Properties", href: "/admin/properties" },
          { label: property.name, href: `/properties/${propertyId}` },
          { label: "Images" },
        ]}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{property.name}</h1>
          <p className="text-muted-foreground mt-1">Manage property images</p>
        </div>
        <Link href="/admin/properties">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Images</CardTitle>
          <CardDescription>
            Upload and manage images for this property. The first image will be set as the primary image by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyImageUpload propertyId={propertyId} />
        </CardContent>
      </Card>
    </div>
  );
}
