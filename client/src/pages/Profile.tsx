import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import KYCProgressIndicator from "@/components/KYCProgressIndicator";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import RecentActivity from "@/components/RecentActivity";
import { APP_LOGO, APP_TITLE } from "@/const";
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
import { LANGUAGES, CURRENCIES } from "@/const";
import KYCWizard from "@/components/KYCWizard";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import { TrustedDevicesManager } from "@/components/TrustedDevicesManager";
import { ChangePassword } from "@/components/ChangePassword";
import { CustomFieldsForm } from "@/components/CustomFieldsForm";
import { Breadcrumb } from "@/components/Breadcrumb";
import Navigation from "@/components/Navigation";

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, refetch: refetchProfile } = trpc.profile.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: verificationStatus } = trpc.profile.getVerificationStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: recentActivity, isLoading: isLoadingActivity } = trpc.profile.getRecentActivity.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      refetchProfile();
      setIsEditing(false);
      toast.success(t.profile.messages.updateSuccess);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateProfileMutation.mutate({
      firstNameEn: formData.get("firstNameEn") as string || undefined,
      lastNameEn: formData.get("lastNameEn") as string || undefined,
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
      preferredCurrency: formData.get("preferredCurrency") as "USD" | "EGP" | "EUR" | "GBP" | "SAR" | "AED" || undefined,
    });
  };

  const getVerificationLevelBadge = () => {
    if (!verificationStatus) return null;

    const level = verificationStatus.level;
    const variant = level === "level_2" ? "default" : level === "level_1" ? "secondary" : "outline";
    const label = level === "level_2" ? t.status.approved : level === "level_1" ? t.profile.verification.level : t.status.pending;

    return <Badge variant={variant}>{label}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Breadcrumb />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t.nav.login}</CardTitle>
            <CardDescription>
              {t.profile.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={"/login"}>
              <Button className="w-full">{t.nav.login}</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Navigation Menu */}
      <Navigation />
      
      {/* Page Header */}
      <div className="border-b bg-muted/30">
        <div className="container py-6">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{t.profile.title}</h1>
              <p className="text-muted-foreground">
                {t.profile.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Picture Section */}
          <ProfilePictureUpload
            currentPicture={profile?.profilePicture}
            userName={user?.name || undefined}
            onUploadSuccess={() => {
              // Refetch profile to get updated picture
              refetchProfile();
            }}
          />
        </div>
        
        <KYCProgressIndicator />
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">{t.profile.tabs.overview}</TabsTrigger>
            <TabsTrigger value="personal">{t.profile.tabs.personal}</TabsTrigger>
            <TabsTrigger value="verification">{t.profile.tabs.verification}</TabsTrigger>
            <TabsTrigger value="security">{language === 'ar' ? 'الأمان' : 'Security'}</TabsTrigger>
            <TabsTrigger value="preferences">{t.profile.tabs.preferences}</TabsTrigger>
            <TabsTrigger value="additional">{language === 'ar' ? 'إضافي' : 'Additional'}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.profile.overview.accountInfo}</CardTitle>
                  <CardDescription>{t.profile.overview.accountDesc}</CardDescription>
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
                      <span>{user?.email || t.profile.overview.notProvided}</span>
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
                      <span>{profile?.preferredCurrency || "EGP"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t.profile.overview.verificationStatus}</CardTitle>
                    {getVerificationLevelBadge()}
                  </div>
                  <CardDescription>{t.profile.overview.verificationDesc}</CardDescription>
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
                        <span className="text-sm">{t.profile.overview.emailVerified}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationStatus?.phoneVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{t.profile.overview.phoneVerified}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationStatus?.documentsVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{t.profile.overview.documentsVerified}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {verificationStatus?.questionnaireCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{t.profile.overview.questionnaireCompleted}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.profile.overview.investmentAccess}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {verificationStatus?.canInvest ? (
                        <span className="text-primary font-medium">{t.profile.overview.canInvest}</span>
                      ) : (
                        <span>{t.profile.overview.completeVerification}</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Complete KYC Call-to-Action */}
            {verificationStatus && !verificationStatus.canInvest && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {t.profile.kyc.completeTitle || "Complete Your KYC Verification"}
                  </CardTitle>
                  <CardDescription>
                    {t.profile.kyc.completeDesc || "Complete your KYC questionnaire to unlock full investment features and start building your property portfolio."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/kyc-questionnaire">
                    <Button className="w-full md:w-auto">
                      <Shield className="h-4 w-4 mr-2" />
                      {t.profile.kyc.completeButton || "Complete KYC Now"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <RecentActivity 
              activities={recentActivity || []} 
              isLoading={isLoadingActivity}
            />
          </TabsContent>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t.profile.personalInfo.title}</CardTitle>
                    <CardDescription>{t.profile.personalInfo.subtitle}</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>{t.profile.personalInfo.editProfile}</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstNameEn">{t.profile.personalInfo.firstNameEn}</Label>
                      <Input
                        id="firstNameEn"
                        name="firstNameEn"
                        defaultValue={profile?.firstNameEn || ""}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastNameEn">{t.profile.personalInfo.lastNameEn}</Label>
                      <Input
                        id="lastNameEn"
                        name="lastNameEn"
                        defaultValue={profile?.lastNameEn || ""}
                        disabled={!isEditing}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstNameAr">{t.profile.personalInfo.firstNameAr}</Label>
                      <Input
                        id="firstNameAr"
                        name="firstNameAr"
                        defaultValue={profile?.firstNameAr || ""}
                        disabled={!isEditing}
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastNameAr">{t.profile.personalInfo.lastNameAr}</Label>
                      <Input
                        id="lastNameAr"
                        name="lastNameAr"
                        defaultValue={profile?.lastNameAr || ""}
                        disabled={!isEditing}
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">{t.profile.personalInfo.nationality}</Label>
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
                        <Label htmlFor="addressLine1">{t.profile.personalInfo.addressLine1}</Label>
                        <Input
                          id="addressLine1"
                          name="addressLine1"
                          defaultValue={profile?.addressLine1 || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="addressLine2">{t.profile.personalInfo.addressLine2}</Label>
                        <Input
                          id="addressLine2"
                          name="addressLine2"
                          defaultValue={profile?.addressLine2 || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">{t.profile.personalInfo.city}</Label>
                        <Input
                          id="city"
                          name="city"
                          defaultValue={profile?.city || ""}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">{t.profile.personalInfo.country}</Label>
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
                        {t.profile.personalInfo.cancel}
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
          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <ChangePassword />
            <TwoFactorSettings />
            <TrustedDevicesManager />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.profile.preferences.title}</CardTitle>
                <CardDescription>{t.profile.preferences.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="preferredLanguage">{t.profile.preferences.language}</Label>
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
                      <Label htmlFor="preferredCurrency">{t.profile.preferences.currency}</Label>
                      <Select
                        name="preferredCurrency"
                        defaultValue={profile?.preferredCurrency || "EGP"}
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
                      t.profile.preferences.savePreferences
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional Custom Fields Tab */}
          <TabsContent value="additional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Fill in additional custom fields for your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && (
                  <CustomFieldsForm
                    module="users"
                    recordId={user.id}
                    showInContext="user"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
