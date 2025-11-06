import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Globe, DollarSign, Shield, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl, LANGUAGES, CURRENCIES } from "@/const";
import KYCWizard from "@/components/KYCWizard";

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, refetch: refetchProfile } = trpc.profile.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: verificationStatus } = trpc.profile.getVerificationStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      refetchProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateProfileMutation.mutate({
      firstNameEn: formData.get("firstNameEn") as string,
      lastNameEn: formData.get("lastNameEn") as string,
      firstNameAr: formData.get("firstNameAr") as string || undefined,
      lastNameAr: formData.get("lastNameAr") as string || undefined,
      nationality: formData.get("nationality") as string || undefined,
      addressLine1: formData.get("addressLine1") as string || undefined,
      addressLine2: formData.get("addressLine2") as string || undefined,
      city: formData.get("city") as string || undefined,
      country: formData.get("country") as string || undefined,
      postalCode: formData.get("postalCode") as string || undefined,
      employmentStatus: formData.get("employmentStatus") as string || undefined,
      annualIncomeRange: formData.get("annualIncomeRange") as string || undefined,
      preferredLanguage: formData.get("preferredLanguage") as "en" | "ar" || undefined,
      preferredCurrency: formData.get("preferredCurrency") as "USD" | "EGP" || undefined,
    });
  };

  const getVerificationLevelBadge = () => {
    if (!verificationStatus) return null;

    const level = verificationStatus.level;
    const variant = level === "level_2" ? "default" : level === "level_1" ? "secondary" : "outline";
    const label = level === "level_2" ? "Fully Verified" : level === "level_1" ? "Basic Verification" : "Unverified";

    return <Badge variant={variant}>{label}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              Please log in to view your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">Login to Continue</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your account settings and verification status
              </p>
            </div>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your basic account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {profile?.firstNameEn} {profile?.lastNameEn || user?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{user?.role}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.email || "Not provided"}</span>
                    </div>
                    {profile?.city && profile?.country && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.city}, {profile.country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{LANGUAGES[profile?.preferredLanguage || "en"]}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{profile?.preferredCurrency || "USD"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Verification Status</CardTitle>
                    {getVerificationLevelBadge()}
                  </div>
                  <CardDescription>Your account verification progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationStatus?.emailVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">Email Verified</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationStatus?.phoneVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">Phone Verified</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationStatus?.documentsVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">Documents Verified</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationStatus?.questionnaireCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">Questionnaire Completed</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Investment Access</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {verificationStatus?.canInvest ? (
                        <span className="text-primary font-medium">✓ You can invest in properties</span>
                      ) : (
                        <span>Complete verification to start investing</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstNameEn">First Name (English)</Label>
                      <Input
                        id="firstNameEn"
                        name="firstNameEn"
                        defaultValue={profile?.firstNameEn || ""}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastNameEn">Last Name (English)</Label>
                      <Input
                        id="lastNameEn"
                        name="lastNameEn"
                        defaultValue={profile?.lastNameEn || ""}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstNameAr">First Name (Arabic)</Label>
                      <Input
                        id="firstNameAr"
                        name="firstNameAr"
                        defaultValue={profile?.firstNameAr || ""}
                        disabled={!isEditing}
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastNameAr">Last Name (Arabic)</Label>
                      <Input
                        id="lastNameAr"
                        name="lastNameAr"
                        defaultValue={profile?.lastNameAr || ""}
                        disabled={!isEditing}
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        name="nationality"
                        defaultValue={profile?.nationality || ""}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus">Employment Status</Label>
                      <Select
                        name="employmentStatus"
                        defaultValue={profile?.employmentStatus || ""}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self_employed">Self-Employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Address</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          name="addressLine1"
                          defaultValue={profile?.addressLine1 || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="addressLine2">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          name="addressLine2"
                          defaultValue={profile?.addressLine2 || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          defaultValue={profile?.city || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          defaultValue={profile?.country || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          defaultValue={profile?.postalCode || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="annualIncomeRange">Annual Income Range</Label>
                        <Select
                          name="annualIncomeRange"
                          defaultValue={profile?.annualIncomeRange || ""}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under_25k">Under $25,000</SelectItem>
                            <SelectItem value="25k_50k">$25,000 - $50,000</SelectItem>
                            <SelectItem value="50k_100k">$50,000 - $100,000</SelectItem>
                            <SelectItem value="100k_250k">$100,000 - $250,000</SelectItem>
                            <SelectItem value="over_250k">Over $250,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3">
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <KYCWizard />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your platform experience</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="preferredLanguage">Preferred Language</Label>
                      <Select
                        name="preferredLanguage"
                        defaultValue={profile?.preferredLanguage || "en"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LANGUAGES).map(([code, name]) => (
                            <SelectItem key={code} value={code}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredCurrency">Preferred Currency</Label>
                      <Select
                        name="preferredCurrency"
                        defaultValue={profile?.preferredCurrency || "USD"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CURRENCIES).map(([code, name]) => (
                            <SelectItem key={code} value={code}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
