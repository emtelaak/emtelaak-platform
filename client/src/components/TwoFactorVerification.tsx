import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Key } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface TwoFactorVerificationProps {
  open: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function TwoFactorVerification({ open, onSuccess, onCancel }: TwoFactorVerificationProps) {
  const { t, language } = useLanguage();
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const utils = trpc.useUtils();

  const addTrustedDeviceMutation = trpc.trustedDevices.addTrustedDevice.useMutation();

  const verifyMutation = trpc.twoFactor.verifyLogin.useMutation({
    onSuccess: async (data) => {
      // Add device to trusted devices if remember was checked
      if (rememberDevice) {
        try {
          await addTrustedDeviceMutation.mutateAsync({ expiryDays: 30 });
          toast.success(
            language === "en" ? "Device Remembered" : "تم تذكر الجهاز",
            {
              description: language === "en"
                ? "You won't need 2FA on this device for 30 days"
                : "لن تحتاج إلى المصادقة الثنائية على هذا الجهاز لمدة 30 يومًا"
            }
          );
        } catch (error) {
          console.error("Failed to add trusted device:", error);
        }
      }

      if (data.method === "backup") {
        toast.success(
          language === "en" ? "Backup Code Used" : "تم استخدام رمز الاسترداد",
          {
            description: language === "en"
              ? `${data.remainingBackupCodes} backup codes remaining`
              : `${data.remainingBackupCodes} رموز استرداد متبقية`
          }
        );
      } else {
        toast.success(
          language === "en" ? "Verification Successful" : "نجح التحقق"
        );
      }
      setCode("");
      
      // Refresh auth state
      await utils.auth.me.invalidate();
      
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Verification Failed" : "فشل التحقق",
        { description: error.message }
      );
    },
  });

  const handleVerify = () => {
    if (!code || (useBackupCode ? code.length !== 8 : code.length !== 6)) {
      toast.error(
        language === "en" ? "Invalid Code" : "رمز غير صالح",
        {
          description: useBackupCode
            ? (language === "en" ? "Backup codes are 8 characters" : "رموز الاسترداد مكونة من 8 أحرف")
            : (language === "en" ? "Verification codes are 6 digits" : "رموز التحقق مكونة من 6 أرقام")
        }
      );
      return;
    }

    verifyMutation.mutate({ code, rememberDevice });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>
              {language === "en" ? "Two-Factor Authentication" : "المصادقة الثنائية"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {useBackupCode
              ? (language === "en"
                  ? "Enter one of your backup codes to continue"
                  : "أدخل أحد رموز الاسترداد للمتابعة")
              : (language === "en"
                  ? "Enter the 6-digit code from your authenticator app"
                  : "أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "en"
                ? "Your account is protected with two-factor authentication. Please verify your identity to continue."
                : "حسابك محمي بالمصادقة الثنائية. يرجى التحقق من هويتك للمتابعة."}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="2fa-code">
              {useBackupCode
                ? (language === "en" ? "Backup Code" : "رمز الاسترداد")
                : (language === "en" ? "Verification Code" : "رمز التحقق")}
            </Label>
            <Input
              id="2fa-code"
              type="text"
              maxLength={useBackupCode ? 8 : 6}
              placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
              value={code}
              onChange={(e) => {
                const value = useBackupCode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/\D/g, "");
                setCode(value);
              }}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
            }}
            className="w-full"
          >
            <Key className="h-4 w-4 mr-2" />
            {useBackupCode
              ? (language === "en" ? "Use authenticator code instead" : "استخدم رمز المصادقة بدلاً من ذلك")
              : (language === "en" ? "Use backup code instead" : "استخدم رمز الاسترداد بدلاً من ذلك")}
          </Button>

          {/* Remember Device Option */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="remember-device"
              checked={rememberDevice}
              onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
            />
            <Label
              htmlFor="remember-device"
              className="text-sm font-normal cursor-pointer"
            >
              {language === "en"
                ? "Remember this device for 30 days"
                : "تذكر هذا الجهاز لمدة 30 يومًا"}
            </Label>
          </div>
        </div>

        <DialogFooter>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
          )}
          <Button
            onClick={handleVerify}
            disabled={verifyMutation.isPending || !code || (useBackupCode ? code.length !== 8 : code.length !== 6)}
          >
            {verifyMutation.isPending
              ? (language === "en" ? "Verifying..." : "جاري التحقق...")
              : (language === "en" ? "Verify" : "تحقق")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
