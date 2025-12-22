import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Edit, Building2, Image, Eye, EyeOff, Lock, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminPropertyManagement() {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newSharePrice, setNewSharePrice] = useState("");

  const { data: properties, isLoading, refetch } = trpc.propertyManagement.list.useQuery();

  const updateSharePriceMutation = trpc.propertyManagement.updateSharePrice.useMutation({
    onSuccess: () => {
      toast.success("Share price updated successfully");
      setEditDialogOpen(false);
      setSelectedProperty(null);
      setNewSharePrice("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update share price");
    },
  });

  const toggleVisibilityMutation = trpc.propertyManagement.toggleVisibility.useMutation({
    onSuccess: (_, variables) => {
      const isPublic = variables.visibility === "public";
      toast.success(isPublic ? "Property is now public" : "Property is now login-only");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  const handleToggleVisibility = (property: any) => {
    const newVisibility = property.visibility === "public" ? "authenticated" : "public";
    toggleVisibilityMutation.mutate({
      propertyId: property.id,
      visibility: newVisibility,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const handleEditSharePrice = (property: any) => {
    setSelectedProperty(property);
    setNewSharePrice((property.sharePrice / 100).toString());
    setEditDialogOpen(true);
  };

  const handleSaveSharePrice = () => {
    if (!selectedProperty) return;

    const priceInCents = Math.round(parseFloat(newSharePrice) * 100);
    
    if (isNaN(priceInCents) || priceInCents < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    updateSharePriceMutation.mutate({
      propertyId: selectedProperty.id,
      sharePrice: priceInCents,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "funded":
        return "bg-blue-500";
      case "coming_soon":
        return "bg-yellow-500";
      case "exited":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Breadcrumb />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Management</h1>
        <p className="text-muted-foreground">
          Manage property details and share prices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>
            View and update property share prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Total Shares</TableHead>
                <TableHead>Available Shares</TableHead>
                <TableHead>Share Price</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties && properties.length > 0 ? (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.city}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(property.status)}>
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={property.visibility === "public"}
                          onCheckedChange={() => handleToggleVisibility(property)}
                          disabled={toggleVisibilityMutation.isPending}
                        />
                        <span className="flex items-center gap-1 text-sm">
                          {property.visibility === "public" ? (
                            <><Globe className="h-4 w-4 text-green-500" /> Public</>
                          ) : (
                            <><Lock className="h-4 w-4 text-orange-500" /> Login Only</>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{property.totalShares.toLocaleString()}</TableCell>
                    <TableCell>{property.availableShares.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(property.sharePrice)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(property.totalValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSharePrice(property)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Price
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/properties/${property.id}/images`}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Images
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No properties found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Share Price Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Share Price</DialogTitle>
            <DialogDescription>
              Update the share price for {selectedProperty?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sharePrice">Share Price (EGP)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sharePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newSharePrice}
                  onChange={(e) => setNewSharePrice(e.target.value)}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Current price: {selectedProperty && formatCurrency(selectedProperty.sharePrice)}
              </p>
            </div>

            {newSharePrice && !isNaN(parseFloat(newSharePrice)) && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New Share Price</span>
                  <span className="font-medium">
                    {formatCurrency(Math.round(parseFloat(newSharePrice) * 100))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Shares</span>
                  <span className="font-medium">
                    {selectedProperty?.totalShares.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">New Total Value</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        Math.round(parseFloat(newSharePrice) * 100) * selectedProperty?.totalShares
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Warning:</strong> Changing the share price will affect all future investment calculations for this property. Existing investments will retain their original share price.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateSharePriceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSharePrice}
              disabled={updateSharePriceMutation.isPending || !newSharePrice}
            >
              {updateSharePriceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
