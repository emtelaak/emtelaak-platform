import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, RefreshCw, Copy, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { TwoFactorSetup } from "./TwoFactorSetup";

export function TwoFactorSettings() {
  const { t, language } = useLanguage();
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Get 2FA status
  const { data: status, refetch } = trpc.twoFactor.getStatus.useQuery();

  // Disable mutation
  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      toast.success(
        language === "en" ? "2FA Disabled" : "تم تعطيل المصادقة الثنائية",
        { description: language === "en" ? "Two-factor authentication has been disabled" : "تم تعطيل المصادقة الثنائية" }
      );
      setShowDisableDialog(false);
      setDisableCode("");
      refetch();
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Failed to Disable 2FA" : "فشل تعطيل المصادقة الثنائية",
        { description: error.message }
      );
    },
  });

  // Regenerate backup codes mutation
  const regenerateMutation = trpc.twoFactor.regenerateBackupCodes.useMutation({
    onSuccess: (data) => {
      setNewBackupCodes(data.backupCodes);
      toast.success(
        language === "en" ? "Backup Codes Regenerated" : "تم إعادة إنشاء رموز الاسترداد",
        { description: language === "en" ? "Your old backup codes are no longer valid" : "رموز الاسترداد القديمة لم تعد صالحة" }
      );
      setRegenerateCode("");
      refetch();
    },
    onError: (error) => {
      toast.error(
        language === "en" ? "Failed to Regenerate Codes" : "فشل إعادة إنشاء الرموز",
        { description: error.message }
      );
    },
  });

  const handleDisable = () => {
    if (!disableCode || disableCode.length !== 6) {
      toast.error(
        language === "en" ? "Invalid Code" : "رمز غير صالح",
        { description: language === "en" ? "Please enter a 6-digit code" : "الرجاء إدخال رمز مكون من 6 أرقام" }
      );
      return;
    }

    disableMutation.mutate({ code: disableCode });
  };

  const handleRegenerate = () => {
    if (!regenerateCode || regenerateCode.length !== 6) {
      toast.error(
        language === "en" ? "Invalid Code" : "رمز غير صالح",
        { description: language === "en" ? "Please enter a 6-digit code" : "الرجاء إدخال رمز مكون من 6 أرقام" }
      );
      return;
    }

    regenerateMutation.mutate({ code: regenerateCode });
  };

  const handleCopyBackupCodes = () => {
    const codesText = newBackupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success(
      language === "en" ? "Backup Codes Copied" : "تم نسخ رموز الاسترداد",
      { description: language === "en" ? "Save these codes in a secure location" : "احفظ هذه الرموز في مكان آمن" }
    );
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        onSuccess={() => {
          setShowSetup(false);
          refetch();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>
                {language === "en" ? "Two-Factor Authentication" : "المصادقة الثنائية"}
              </CardTitle>
            </div>
            {status?.enabled ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {language === "en" ? "Enabled" : "مفعل"}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                {language === "en" ? "Disabled" : "معطل"}
              </Badge>
            )}
          </div>
          <CardDescription>
            {language === "en"
              ? "Add an extra layer of security to your account with two-factor authentication"
              : "أضف طبقة إضافية من الأمان لحسابك باستخدام المصادقة الثنائية"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {language === "en"
                    ? "Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in."
                    : "حسابك محمي بالمصادقة الثنائية. ستحتاج إلى إدخال رمز من تطبيق المصادقة عند تسجيل الدخول."}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">
                      {language === "en" ? "Backup Codes" : "رموز الاسترداد"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "en"
                        ? `${status.remainingBackupCodes} codes remaining`
                        : `${status.remainingBackupCodes} رموز متبقية`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRegenerateDialog(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === "en" ? "Regenerate" : "إعادة إنشاء"}
                  </Button>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
                className="w-full"
              >
                {language === "en" ? "Disable 2FA" : "تعطيل المصادقة الثنائية"}
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === "en"
                    ? "Two-factor authentication is not enabled. Enable it now to add an extra layer of security to your account."
                    : "المصادقة الثنائية غير مفعلة. قم بتفعيلها الآن لإضافة طبقة إضافية من الأمان لحسابك."}
                </AlertDescription>
              </Alert>

              <Button onClick={() => setShowSetup(true)} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                {language === "en" ? "Enable 2FA" : "تفعيل المصادقة الثنائية"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Disable Two-Factor Authentication" : "تعطيل المصادقة الثنائية"}
            </DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Enter your 6-digit verification code to disable 2FA"
                : "أدخل رمز التحقق المكون من 6 أرقام لتعطيل المصادقة الثنائية"}
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "en"
                ? "Warning: Disabling 2FA will make your account less secure."
                : "تحذير: تعطيل المصادقة الثنائية سيجعل حسابك أقل أمانًا."}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="disable-code">
              {language === "en" ? "Verification Code" : "رمز التحقق"}
            </Label>
            <Input
              id="disable-code"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              {language === "en" ? "Cancel" : "إلغاء"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableMutation.isPending || disableCode.length !== 6}
            >
              {disableMutation.isPending
                ? (language === "en" ? "Disabling..." : "جاري التعطيل...")
                : (language === "en" ? "Disable 2FA" : "تعطيل المصادقة الثنائية")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={(open) => {
        setShowRegenerateDialog(open);
        if (!open) {
          setNewBackupCodes([]);
          setRegenerateCode("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Regenerate Backup Codes" : "إعادة إنشاء رموز الاسترداد"}
            </DialogTitle>
            <DialogDescription>
              {newBackupCodes.length > 0
                ? (language === "en"
                    ? "Save these new backup codes. Your old codes are no longer valid."
                    : "احفظ رموز الاسترداد الجديدة هذه. رموزك القديمة لم تعد صالحة.")
                : (language === "en"
                    ? "Enter your 6-digit verification code to generate new backup codes"
                    : "أدخل رمز التحقق المكون من 6 أرقام لإنشاء رموز استرداد جديدة")}
            </DialogDescription>
          </DialogHeader>

          {newBackupCodes.length > 0 ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === "en"
                    ? "Save these codes in a secure location. Each code can only be used once."
                    : "احفظ هذه الرموز في مكان آمن. كل رمز يمكن استخدامه مرة واحدة فقط."}
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-1">
                {newBackupCodes.map((code, index) => (
                  <div key={index}>{code}</div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleCopyBackupCodes}
                className="w-full"
              >
                {copiedCodes ? (
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="regenerate-code">
                {language === "en" ? "Verification Code" : "رمز التحقق"}
              </Label>
              <Input
                id="regenerate-code"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={regenerateCode}
                onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRegenerateDialog(false);
                setNewBackupCodes([]);
                setRegenerateCode("");
              }}
            >
              {newBackupCodes.length > 0
                ? (language === "en" ? "Done" : "تم")
                : (language === "en" ? "Cancel" : "إلغاء")}
            </Button>
            {newBackupCodes.length === 0 && (
              <Button
                onClick={handleRegenerate}
                disabled={regenerateMutation.isPending || regenerateCode.length !== 6}
              >
                {regenerateMutation.isPending
                  ? (language === "en" ? "Generating..." : "جاري الإنشاء...")
                  : (language === "en" ? "Regenerate" : "إعادة إنشاء")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
