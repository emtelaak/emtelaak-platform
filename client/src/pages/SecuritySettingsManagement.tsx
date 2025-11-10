import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, Shield, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function SecuritySettingsManagement() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading, refetch } = trpc.securitySettings.getSettings.useQuery();

  // Update settings mutation
  const updateSettings = trpc.securitySettings.updateSettings.useMutation({
    onSuccess: () => {
      toast.success(
        isRTL
          ? "تم تحديث إعدادات الأمان بنجاح"
          : "Security settings updated successfully"
      );
      refetch();
      setShowSaveDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Reset to defaults mutation
  const resetToDefaults = trpc.securitySettings.resetToDefaults.useMutation({
    onSuccess: () => {
      toast.success(
        isRTL
          ? "تم استعادة الإعدادات الافتراضية"
          : "Settings reset to defaults"
      );
      refetch();
      setShowResetDialog(false);
      setFormData({});
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Initialize form data when settings load
  if (settings && Object.keys(formData).length === 0) {
    const initialData: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      initialData[key] = value.value;
    }
    setFormData(initialData);
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // Validate all values are positive integers
    for (const [key, value] of Object.entries(formData)) {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue <= 0) {
        toast.error(
          isRTL
            ? `قيمة غير صالحة لـ ${getSettingLabel(key)}`
            : `Invalid value for ${getSettingLabel(key)}`
        );
        return;
      }
    }

    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    updateSettings.mutate({ settings: formData });
  };

  const confirmReset = () => {
    resetToDefaults.mutate();
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, { en: string; ar: string }> = {
      failed_login_threshold: {
        en: "Failed Login Threshold",
        ar: "عتبة تسجيل الدخول الفاشل",
      },
      failed_login_window_minutes: {
        en: "Failed Login Time Window (minutes)",
        ar: "نافذة وقت تسجيل الدخول الفاشل (دقائق)",
      },
      rate_limit_threshold: {
        en: "Rate Limit Threshold",
        ar: "عتبة حد المعدل",
      },
      rate_limit_window_minutes: {
        en: "Rate Limit Time Window (minutes)",
        ar: "نافذة وقت حد المعدل (دقائق)",
      },
      suspicious_activity_threshold: {
        en: "Suspicious Activity Threshold",
        ar: "عتبة النشاط المشبوه",
      },
      suspicious_activity_window_minutes: {
        en: "Suspicious Activity Time Window (minutes)",
        ar: "نافذة وقت النشاط المشبوه (دقائق)",
      },
      auto_block_expiry_hours: {
        en: "Auto-Block Expiry (hours)",
        ar: "انتهاء الحظر التلقائي (ساعات)",
      },
    };

    return isRTL ? labels[key]?.ar || key : labels[key]?.en || key;
  };

  const getSettingDescription = (key: string): string => {
    if (!settings || !settings[key]) return "";
    return settings[key].description;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Breadcrumb />
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          {isRTL ? "إعدادات الأمان" : "Security Settings"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isRTL
            ? "إدارة عتبات الحظر التلقائي لعناوين IP"
            : "Manage automatic IP blocking thresholds"}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Failed Login Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? "إعدادات تسجيل الدخول الفاشل" : "Failed Login Settings"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? "حظر عناوين IP بعد محاولات تسجيل دخول فاشلة متعددة"
                : "Block IPs after multiple failed login attempts"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="failed_login_threshold">
                  {getSettingLabel("failed_login_threshold")}
                </Label>
                <Input
                  id="failed_login_threshold"
                  type="number"
                  min="1"
                  value={formData.failed_login_threshold || ""}
                  onChange={(e) =>
                    handleInputChange("failed_login_threshold", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("failed_login_threshold")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="failed_login_window_minutes">
                  {getSettingLabel("failed_login_window_minutes")}
                </Label>
                <Input
                  id="failed_login_window_minutes"
                  type="number"
                  min="1"
                  value={formData.failed_login_window_minutes || ""}
                  onChange={(e) =>
                    handleInputChange("failed_login_window_minutes", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("failed_login_window_minutes")}
                </p>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {isRTL ? (
                <>
                  سيتم حظر عناوين IP بعد{" "}
                  <strong>{formData.failed_login_threshold || "؟"}</strong> محاولات
                  فاشلة خلال{" "}
                  <strong>{formData.failed_login_window_minutes || "؟"}</strong> دقيقة
                </>
              ) : (
                <>
                  IPs will be blocked after{" "}
                  <strong>{formData.failed_login_threshold || "?"}</strong> failed
                  attempts within{" "}
                  <strong>{formData.failed_login_window_minutes || "?"}</strong>{" "}
                  minutes
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? "إعدادات حد المعدل" : "Rate Limit Settings"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? "حظر عناوين IP بعد تجاوز حدود المعدل المتعددة"
                : "Block IPs after multiple rate limit violations"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate_limit_threshold">
                  {getSettingLabel("rate_limit_threshold")}
                </Label>
                <Input
                  id="rate_limit_threshold"
                  type="number"
                  min="1"
                  value={formData.rate_limit_threshold || ""}
                  onChange={(e) =>
                    handleInputChange("rate_limit_threshold", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("rate_limit_threshold")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate_limit_window_minutes">
                  {getSettingLabel("rate_limit_window_minutes")}
                </Label>
                <Input
                  id="rate_limit_window_minutes"
                  type="number"
                  min="1"
                  value={formData.rate_limit_window_minutes || ""}
                  onChange={(e) =>
                    handleInputChange("rate_limit_window_minutes", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("rate_limit_window_minutes")}
                </p>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {isRTL ? (
                <>
                  سيتم حظر عناوين IP بعد{" "}
                  <strong>{formData.rate_limit_threshold || "؟"}</strong> تجاوزات
                  خلال <strong>{formData.rate_limit_window_minutes || "؟"}</strong>{" "}
                  دقيقة
                </>
              ) : (
                <>
                  IPs will be blocked after{" "}
                  <strong>{formData.rate_limit_threshold || "?"}</strong> violations
                  within{" "}
                  <strong>{formData.rate_limit_window_minutes || "?"}</strong>{" "}
                  minutes
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Suspicious Activity Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? "إعدادات النشاط المشبوه" : "Suspicious Activity Settings"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? "حظر عناوين IP بعد أنشطة مشبوهة متعددة"
                : "Block IPs after multiple suspicious activities"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suspicious_activity_threshold">
                  {getSettingLabel("suspicious_activity_threshold")}
                </Label>
                <Input
                  id="suspicious_activity_threshold"
                  type="number"
                  min="1"
                  value={formData.suspicious_activity_threshold || ""}
                  onChange={(e) =>
                    handleInputChange("suspicious_activity_threshold", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("suspicious_activity_threshold")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suspicious_activity_window_minutes">
                  {getSettingLabel("suspicious_activity_window_minutes")}
                </Label>
                <Input
                  id="suspicious_activity_window_minutes"
                  type="number"
                  min="1"
                  value={formData.suspicious_activity_window_minutes || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "suspicious_activity_window_minutes",
                      e.target.value
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription("suspicious_activity_window_minutes")}
                </p>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {isRTL ? (
                <>
                  سيتم حظر عناوين IP بعد{" "}
                  <strong>{formData.suspicious_activity_threshold || "؟"}</strong>{" "}
                  أنشطة مشبوهة خلال{" "}
                  <strong>
                    {formData.suspicious_activity_window_minutes || "؟"}
                  </strong>{" "}
                  دقيقة
                </>
              ) : (
                <>
                  IPs will be blocked after{" "}
                  <strong>{formData.suspicious_activity_threshold || "?"}</strong>{" "}
                  suspicious activities within{" "}
                  <strong>
                    {formData.suspicious_activity_window_minutes || "?"}
                  </strong>{" "}
                  minutes
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto-Block Expiry Settings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? "إعدادات انتهاء الحظر" : "Block Expiry Settings"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? "مدة الحظر التلقائي قبل انتهاء الصلاحية"
                : "Duration of automatic blocks before expiry"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auto_block_expiry_hours">
                {getSettingLabel("auto_block_expiry_hours")}
              </Label>
              <Input
                id="auto_block_expiry_hours"
                type="number"
                min="1"
                value={formData.auto_block_expiry_hours || ""}
                onChange={(e) =>
                  handleInputChange("auto_block_expiry_hours", e.target.value)
                }
              />
              <p className="text-sm text-muted-foreground">
                {getSettingDescription("auto_block_expiry_hours")}
              </p>
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {isRTL ? (
                <>
                  سيتم إلغاء حظر عناوين IP تلقائيًا بعد{" "}
                  <strong>{formData.auto_block_expiry_hours || "؟"}</strong> ساعة
                </>
              ) : (
                <>
                  Blocked IPs will be automatically unblocked after{" "}
                  <strong>{formData.auto_block_expiry_hours || "?"}</strong> hours
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={resetToDefaults.isPending}
          >
            {resetToDefaults.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            {isRTL ? "استعادة الافتراضيات" : "Reset to Defaults"}
          </Button>

          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isRTL ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? "تأكيد التغييرات" : "Confirm Changes"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? "هل أنت متأكد من أنك تريد تحديث إعدادات الأمان؟ ستؤثر هذه التغييرات على سلوك الحظر التلقائي فورًا."
                : "Are you sure you want to update the security settings? These changes will affect automatic blocking behavior immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRTL ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              {isRTL ? "تأكيد" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? "استعادة الإعدادات الافتراضية" : "Reset to Defaults"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? "هل أنت متأكد من أنك تريد استعادة جميع إعدادات الأمان إلى القيم الافتراضية؟ سيتم فقدان جميع التخصيصات."
                : "Are you sure you want to reset all security settings to default values? All customizations will be lost."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRTL ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>
              {isRTL ? "استعادة" : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
