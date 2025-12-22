import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";

export default function ActivateAccount() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const code = searchParams.get("code") || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate invitation code
  const { data: validation, isLoading: validating, error: validationError } = trpc.accessRequests.validateInvitation.useQuery(
    { code },
    { enabled: !!code }
  );

  // Activate account mutation
  const activateMutation = trpc.accessRequests.activateAccount.useMutation({
    onSuccess: () => {
      setSuccess(true);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError(language === "ar" ? "كلمة المرور لا تستوفي المتطلبات" : "Password does not meet requirements");
      return;
    }

    if (!passwordsMatch) {
      setError(language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    activateMutation.mutate({ code, password });
  };

  const isRTL = language === "ar";

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#032941] to-[#0a4a6e] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or missing code
  if (!code || (validation && !validation.valid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#032941] to-[#0a4a6e] flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">
              {language === "ar" ? "رمز الدعوة غير صالح" : "Invalid Invitation Code"}
            </CardTitle>
            <CardDescription>
              {validation?.alreadyRegistered 
                ? (language === "ar" ? "الحساب موجود بالفعل. يرجى تسجيل الدخول." : "Account already exists. Please login instead.")
                : (language === "ar" ? "رمز الدعوة غير صالح أو منتهي الصلاحية" : "The invitation code is invalid or has expired")
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to={validation?.alreadyRegistered ? "/login" : "/"}>
              <Button>
                {validation?.alreadyRegistered 
                  ? (language === "ar" ? "تسجيل الدخول" : "Go to Login")
                  : (language === "ar" ? "العودة للرئيسية" : "Back to Home")
                }
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#032941] to-[#0a4a6e] flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">
              {language === "ar" ? "تم إنشاء الحساب بنجاح!" : "Account Created Successfully!"}
            </CardTitle>
            <CardDescription>
              {language === "ar" 
                ? "تم إرسال رسالة تحقق إلى بريدك الإلكتروني. يرجى التحقق من بريدك لتفعيل حسابك."
                : "A verification email has been sent to your email address. Please check your inbox to verify your account."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar" ? "جاري توجيهك إلى لوحة التحكم..." : "Redirecting to dashboard..."}
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#032941] to-[#0a4a6e] flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
          <ArrowLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
          {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/logo.svg" alt="Emtelaak" className="h-10" />
            </div>
            <CardTitle className="text-2xl">
              {language === "ar" ? "تفعيل حسابك" : "Activate Your Account"}
            </CardTitle>
            <CardDescription>
              {language === "ar" 
                ? "مرحباً! أنشئ كلمة مرور لتفعيل حسابك"
                : "Welcome! Create a password to activate your account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* User Info Display */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "الاسم:" : "Name:"}</span>
                  <span className="font-medium">{validation?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "البريد الإلكتروني:" : "Email:"}</span>
                  <span className="font-medium">{validation?.email}</span>
                </div>
                {validation?.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ar" ? "الهاتف:" : "Phone:"}</span>
                    <span className="font-medium">{validation?.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === "ar" ? "كلمة المرور" : "Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language === "ar" ? "أدخل كلمة المرور" : "Enter password"}
                    className={`${isRTL ? "pr-10" : "pr-10"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${isRTL ? "left-3" : "right-3"}`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-1 text-sm">
                <div className={`flex items-center gap-2 ${passwordChecks.length ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordChecks.length ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {language === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.uppercase ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordChecks.uppercase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {language === "ar" ? "حرف كبير واحد" : "One uppercase letter"}
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.lowercase ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordChecks.lowercase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {language === "ar" ? "حرف صغير واحد" : "One lowercase letter"}
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.number ? "text-green-600" : "text-muted-foreground"}`}>
                  {passwordChecks.number ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {language === "ar" ? "رقم واحد" : "One number"}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                    className={`${isRTL ? "pr-10" : "pr-10"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${isRTL ? "left-3" : "right-3"}`}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-2 text-sm ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                    {passwordsMatch ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {passwordsMatch 
                      ? (language === "ar" ? "كلمات المرور متطابقة" : "Passwords match")
                      : (language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match")
                    }
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#CDE428] hover:bg-[#b8cc24] text-[#032941]"
                disabled={!isPasswordValid || !passwordsMatch || activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    {language === "ar" ? "جاري التفعيل..." : "Activating..."}
                  </>
                ) : (
                  language === "ar" ? "تفعيل الحساب" : "Activate Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
