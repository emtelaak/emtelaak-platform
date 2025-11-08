import { useState, useEffect } from "react";
import { useLocation, useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResetPassword() {
  const { t, dir } = useLanguage();
  const [location] = useLocation();
  const [, setLocation] = useRouter();
  const [token, setToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);

  // Validate token
  const { data: tokenValidation, isLoading: isValidating } = trpc.auth.validateResetToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setResetSuccess(true);
      toast.success(t.resetPassword.success.message);
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  // Password strength calculation
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const getStrengthLabel = (strength: number): string => {
    if (strength < 40) return t.resetPassword.weak;
    if (strength < 70) return t.resetPassword.medium;
    return t.resetPassword.strong;
  };

  // Validation
  const passwordRequirements = [
    { label: t.resetPassword.requirements.length, met: newPassword.length >= 8 },
    { label: t.resetPassword.requirements.uppercase, met: /[A-Z]/.test(newPassword) },
    { label: t.resetPassword.requirements.lowercase, met: /[a-z]/.test(newPassword) },
    { label: t.resetPassword.requirements.number, met: /[0-9]/.test(newPassword) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error(t.resetPassword.errors.requirementsFailed);
      return;
    }

    if (!doPasswordsMatch) {
      toast.error(t.resetPassword.errors.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    resetPasswordMutation.mutate({ token, newPassword });
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100" dir={dir}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t.resetPassword.validating}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!token || (tokenValidation && !tokenValidation.valid)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100" dir={dir}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-12" />
            </div>
            <CardTitle className="text-center text-red-600">{t.resetPassword.invalidToken.title}</CardTitle>
            <CardDescription className="text-center">
              {tokenValidation?.message || t.resetPassword.invalidToken.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {t.resetPassword.invalidToken.description}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/")}
              className="w-full mt-4"
              variant="outline"
            >
              {t.resetPassword.invalidToken.returnHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100" dir={dir}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-12" />
            </div>
            <CardTitle className="text-center text-green-600">{t.resetPassword.success.title}</CardTitle>
            <CardDescription className="text-center">
              {t.resetPassword.success.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t.resetPassword.success.description}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" dir={dir}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12" />
          </div>
          <CardTitle className="text-center">{t.resetPassword.title}</CardTitle>
          <CardDescription className="text-center">
            {t.resetPassword.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.resetPassword.newPassword}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.resetPassword.newPasswordPlaceholder}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${dir === 'rtl' ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{t.resetPassword.passwordStrength}</span>
                    <span className={`font-medium ${
                      passwordStrength < 40 ? "text-red-600" :
                      passwordStrength < 70 ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {getStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength < 40 ? "bg-red-500" :
                        passwordStrength < 70 ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className="space-y-1 text-xs">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-slate-400" />
                    )}
                    <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.resetPassword.confirmPassword}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.resetPassword.confirmPasswordPlaceholder}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${dir === 'rtl' ? 'left-3' : 'right-3'}`}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {doPasswordsMatch ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">{t.resetPassword.passwordsMatch}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{t.resetPassword.passwordsDontMatch}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isPasswordValid || !doPasswordsMatch || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.resetPassword.resetting}
                </>
              ) : (
                t.resetPassword.resetButton
              )}
            </Button>

            {/* Back to Home */}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setLocation("/")}
              disabled={isSubmitting}
            >
              {t.resetPassword.backToHome}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
