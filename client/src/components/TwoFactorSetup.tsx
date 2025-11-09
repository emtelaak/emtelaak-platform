import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onSuccess, onCancel }: TwoFactorSetupProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Setup mutation
  const setupMutation = trpc.twoFactor.setup.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep("verify");
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Setup Failed" : "فشل الإعداد",
        { description: error.message }
      );
    },
  });

  // Enable mutation
  const enableMutation = trpc.twoFactor.enable.useMutation({
    onSuccess: () => {
      toast.success(
        language === "en" ? "2FA Enabled Successfully" : "تم تفعيل المصادقة الثنائية بنجاح",
        {
          description: language === "en"
            ? "Your account is now protected with two-factor authentication"
            : "حسابك الآن محمي بالمصادقة الثنائية"
        }
      );
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Verification Failed" : "فشل التحقق",
        { description: error.message }
      );
    },
  });

  const handleStartSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error(
        language === "en" ? "Invalid Code" : "رمز غير صالح",
        { description: language === "en" ? "Please enter a 6-digit code" : "الرجاء إدخال رمز مكون من 6 أرقام" }
      );
      return;
    }

    enableMutation.mutate({ code: verificationCode });
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopiedBackupCodes(true);
    toast.success(
      language === "en" ? "Backup Codes Copied" : "تم نسخ رموز الاسترداد",
      { description: language === "en" ? "Save these codes in a secure location" : "احفظ هذه الرموز في مكان آمن" }
    );
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  if (step === "setup") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>
              {language === "en" ? "Enable Two-Factor Authentication" : "تفعيل المصادقة الثنائية"}
            </CardTitle>
          </div>
          <CardDescription>
            {language === "en"
              ? "Add an extra layer of security to your account"
              : "أضف طبقة إضافية من الأمان لحسابك"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "en"
                ? "You'll need an authenticator app like Google Authenticator or Authy to scan the QR code."
                : "ستحتاج إلى تطبيق مصادقة مثل Google Authenticator أو Authy لمسح رمز QR."}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">
              {language === "en" ? "What is 2FA?" : "ما هي المصادقة الثنائية؟"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "Two-factor authentication (2FA) adds an extra layer of security by requiring a code from your phone in addition to your password when logging in."
                : "تضيف المصادقة الثنائية (2FA) طبقة إضافية من الأمان من خلال طلب رمز من هاتفك بالإضافة إلى كلمة المرور عند تسجيل الدخول."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStartSetup}
              disabled={setupMutation.isPending}
              className="flex-1"
            >
              {setupMutation.isPending
                ? (language === "en" ? "Setting up..." : "جاري الإعداد...")
                : (language === "en" ? "Start Setup" : "بدء الإعداد")}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                {language === "en" ? "Cancel" : "إلغاء"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === "en" ? "Scan QR Code" : "مسح رمز QR"}
        </CardTitle>
        <CardDescription>
          {language === "en"
            ? "Follow these steps to complete 2FA setup"
            : "اتبع هذه الخطوات لإكمال إعداد المصادقة الثنائية"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Scan QR Code */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </div>
            <h4 className="font-medium">
              {language === "en" ? "Scan QR Code" : "مسح رمز QR"}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground ml-8">
            {language === "en"
              ? "Open your authenticator app and scan this QR code"
              : "افتح تطبيق المصادقة وامسح رمز QR هذا"}
          </p>
          {qrCode && (
            <div className="flex justify-center p-4 bg-white rounded-lg ml-8">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
          )}
        </div>

        {/* Step 2: Save Backup Codes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </div>
            <h4 className="font-medium">
              {language === "en" ? "Save Backup Codes" : "حفظ رموز الاسترداد"}
            </h4>
          </div>
          <Alert className="ml-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "en"
                ? "Save these backup codes in a secure location. You can use them to access your account if you lose your phone."
                : "احفظ رموز الاسترداد هذه في مكان آمن. يمكنك استخدامها للوصول إلى حسابك إذا فقدت هاتفك."}
            </AlertDescription>
          </Alert>
          <div className="ml-8 p-4 bg-muted rounded-lg font-mono text-sm space-y-1">
            {backupCodes.map((code, index) => (
              <div key={index}>{code}</div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBackupCodes}
            className="ml-8"
          >
            {copiedBackupCodes ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {language === "en" ? "Copied!" : "تم النسخ!"}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                {language === "en" ? "Copy Codes" : "نسخ الرموز"}
              </>
            )}
          </Button>
        </div>

        {/* Step 3: Verify */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </div>
            <h4 className="font-medium">
              {language === "en" ? "Verify Setup" : "التحقق من الإعداد"}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground ml-8">
            {language === "en"
              ? "Enter the 6-digit code from your authenticator app"
              : "أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة"}
          </p>
          <div className="ml-8 space-y-2">
            <Label htmlFor="verification-code">
              {language === "en" ? "Verification Code" : "رمز التحقق"}
            </Label>
            <Input
              id="verification-code"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={enableMutation.isPending || verificationCode.length !== 6}
            className="flex-1"
          >
            {enableMutation.isPending
              ? (language === "en" ? "Verifying..." : "جاري التحقق...")
              : (language === "en" ? "Enable 2FA" : "تفعيل المصادقة الثنائية")}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
