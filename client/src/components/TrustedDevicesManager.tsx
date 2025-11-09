import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Smartphone, Trash2, Shield, Clock, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function TrustedDevicesManager() {
  const { language } = useLanguage();
  const [deviceToRemove, setDeviceToRemove] = useState<number | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const { data: devices = [], isLoading, refetch } = trpc.trustedDevices.listTrustedDevices.useQuery();

  const removeMutation = trpc.trustedDevices.removeTrustedDevice.useMutation({
    onSuccess: () => {
      toast.success(
        language === "en" ? "Device Removed" : "تم إزالة الجهاز",
        {
          description: language === "en"
            ? "This device will require 2FA on next login"
            : "سيتطلب هذا الجهاز المصادقة الثنائية عند تسجيل الدخول التالي"
        }
      );
      refetch();
      setDeviceToRemove(null);
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Failed to Remove Device" : "فشل إزالة الجهاز",
        { description: error.message }
      );
    },
  });

  const revokeAllMutation = trpc.trustedDevices.removeAllTrustedDevices.useMutation({
    onSuccess: () => {
      toast.success(
        language === "en" ? "All Devices Revoked" : "تم إلغاء جميع الأجهزة",
        {
          description: language === "en"
            ? "All devices will require 2FA on next login"
            : "ستتطلب جميع الأجهزة المصادقة الثنائية عند تسجيل الدخول التالي"
        }
      );
      refetch();
      setShowRevokeAllDialog(false);
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Failed to Revoke Devices" : "فشل إلغاء الأجهزة",
        { description: error.message }
      );
    },
  });

  const handleRemoveDevice = (deviceId: number) => {
    removeMutation.mutate({ deviceId });
  };

  const handleRevokeAll = () => {
    revokeAllMutation.mutate();
  };

  const formatDate = (date: Date) => {
    const locale = language === "ar" ? ar : enUS;
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {language === "en" ? "Trusted Devices" : "الأجهزة الموثوقة"}
          </CardTitle>
          <CardDescription>
            {language === "en"
              ? "Loading your trusted devices..."
              : "جاري تحميل أجهزتك الموثوقة..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {language === "en" ? "Trusted Devices" : "الأجهزة الموثوقة"}
                {devices.length > 0 && (
                  <Badge variant="secondary">{devices.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Devices that don't require 2FA for 30 days"
                  : "الأجهزة التي لا تتطلب المصادقة الثنائية لمدة 30 يومًا"}
              </CardDescription>
            </div>
            {devices.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={revokeAllMutation.isPending}
              >
                <Shield className="h-4 w-4 mr-2" />
                {language === "en" ? "Revoke All" : "إلغاء الكل"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {language === "en"
                  ? "No trusted devices yet. Check 'Remember this device' when logging in with 2FA to add a device."
                  : "لا توجد أجهزة موثوقة بعد. حدد 'تذكر هذا الجهاز' عند تسجيل الدخول باستخدام المصادقة الثنائية لإضافة جهاز."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {device.deviceName || (language === "en" ? "Unknown Device" : "جهاز غير معروف")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {language === "en" ? "IP:" : "عنوان IP:"} {device.ipAddress}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {language === "en" ? "Last used" : "آخر استخدام"}{" "}
                          {formatDate(device.lastUsed)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {language === "en" ? "Added" : "تمت الإضافة"}{" "}
                          {formatDate(device.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {language === "en" ? "Expires" : "تنتهي"}{" "}
                          {formatDate(device.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeviceToRemove(device.id)}
                    disabled={removeMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Single Device Dialog */}
      <AlertDialog open={deviceToRemove !== null} onOpenChange={(open) => !open && setDeviceToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "en" ? "Remove Trusted Device?" : "إزالة الجهاز الموثوق؟"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "en"
                ? "This device will require 2FA verification on the next login. You can add it back by checking 'Remember this device' during login."
                : "سيتطلب هذا الجهاز التحقق من المصادقة الثنائية عند تسجيل الدخول التالي. يمكنك إضافته مرة أخرى عن طريق تحديد 'تذكر هذا الجهاز' أثناء تسجيل الدخول."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "en" ? "Cancel" : "إلغاء"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deviceToRemove && handleRemoveDevice(deviceToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "en" ? "Remove Device" : "إزالة الجهاز"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Devices Dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "en" ? "Revoke All Trusted Devices?" : "إلغاء جميع الأجهزة الموثوقة؟"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "en"
                ? `This will remove all ${devices.length} trusted devices. All devices will require 2FA verification on the next login.`
                : `سيؤدي هذا إلى إزالة جميع الأجهزة الموثوقة (${devices.length}). ستتطلب جميع الأجهزة التحقق من المصادقة الثنائية عند تسجيل الدخول التالي.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "en" ? "Cancel" : "إلغاء"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "en" ? "Revoke All" : "إلغاء الكل"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
