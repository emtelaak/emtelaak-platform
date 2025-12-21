import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Image as ImageIcon, Loader2, Settings, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";

export default function AdminSettings() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: currentLogo, refetch: refetchLogo } = trpc.admin.settings.getLogo.useQuery(
    undefined,
    { enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin") }
  );

  const uploadLogoMutation = trpc.admin.settings.uploadLogo.useMutation({
    onSuccess: (data) => {
      toast.success("Logo uploaded successfully!");
      setLogoPreview(data.url);
      refetchLogo();
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB for logo)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo size must be less than 2MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      
      // Upload to server
      setIsUploading(true);
      uploadLogoMutation.mutate({
        imageData: result,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access admin settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={"/login"}>
              <Button className="w-full">Login to Continue</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto cursor-pointer" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Admin Settings</h1>
                <Badge variant="default">Admin</Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                Manage platform configuration and branding
              </p>
            </div>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Breadcrumb 
            items={[
              { label: "Admin", labelAr: "الإدارة", href: "/admin/dashboard" },
              { label: "Settings", labelAr: "الإعدادات" }
            ]} 
          />
          {/* Logo Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Platform Logo</CardTitle>
              </div>
              <CardDescription>
                Upload and manage the platform logo displayed across the site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Logo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Current Logo</h3>
                  <div className="border rounded-lg p-6 bg-muted/30 flex items-center justify-center min-h-[200px]">
                    {currentLogo || logoPreview ? (
                      <img
                        src={logoPreview || currentLogo || ""}
                        alt="Platform Logo"
                        className="max-h-32 w-auto object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No logo uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Upload New Logo</h3>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or SVG (max. 2MB)
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Select Logo File
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium">Logo Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Recommended size: 200x60 pixels (or similar aspect ratio)</li>
                  <li>Transparent background (PNG) works best</li>
                  <li>Logo will be displayed in navigation bars across all pages</li>
                  <li>Maximum file size: 2MB</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Other Settings (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Other Settings</CardTitle>
              <CardDescription>
                Additional platform configuration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                More settings coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
