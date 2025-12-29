import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, Eye, EyeOff, Check, X, ArrowLeft, ArrowRight, Lock, UserPlus } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { language, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Get platform access mode
  const { data: accessModeData, isLoading: isLoadingAccessMode } = trpc.platformSettings.getAccessMode.useQuery();
  
  const isPrivateMode = accessModeData?.isPrivate ?? true; // Default to private for safety

  // Extract invitation code from URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const code = params.get('code');
    if (code) {
      setFormData(prev => ({ ...prev, invitationCode: code }));
    }
  }, [searchString]);

  const utils = trpc.useUtils();

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: async () => {
      toast.success(isRTL ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!");
      
      // Wait for cookie to be set and refetch auth state
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refetch user data to confirm registration
      await utils.auth.me.refetch();
      
      // Additional delay to ensure cookie is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to home page
      window.location.href = "/";
    },
    onError: (error) => {
      setError(error.message);
      toast.error(error.message);
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    // Check invitation code in private mode
    if (isPrivateMode && !formData.invitationCode) {
      setError(isRTL ? "رمز الدعوة مطلوب للتسجيل" : "Invitation code is required to register");
      return;
    }

    if (!isPasswordValid) {
      setError(isRTL ? "كلمة المرور لا تستوفي المتطلبات" : "Password does not meet requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(isRTL ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      invitationCode: isPrivateMode ? formData.invitationCode : undefined,
    });
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-gray-500"}`}>
      {met ? <Check size={16} /> : <X size={16} />}
      <span>{text}</span>
    </div>
  );

  // Show loading state while checking access mode
  if (isLoadingAccessMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Show private mode notice if no invitation code and platform is private
  if (isPrivateMode && !formData.invitationCode) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244] p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Back to Home Link */}
        <Button
          variant="ghost"
          className={`absolute top-4 text-white hover:text-[#CDE428] hover:bg-white/10 ${
            isRTL ? 'right-4' : 'left-4'
          }`}
          onClick={() => setLocation("/")}
        >
          {isRTL ? (
            <>
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للرئيسية
            </>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </>
          )}
        </Button>

        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-16" />
            </div>
            <div className="mx-auto w-16 h-16 bg-[#003366]/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-[#003366]" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isRTL ? 'التسجيل بدعوة فقط' : 'Invitation Only'}
            </CardTitle>
            <CardDescription className="text-base">
              {isRTL 
                ? 'منصة إمتلاك متاحة حالياً بالدعوة فقط. يمكنك طلب الانضمام وسنراجع طلبك.'
                : 'Emtelaak is currently available by invitation only. You can request access and we will review your application.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                {isRTL 
                  ? 'إذا كان لديك رمز دعوة، يمكنك إدخاله أدناه للتسجيل مباشرة.'
                  : 'If you have an invitation code, you can enter it below to register directly.'
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invitationCode">
                {isRTL ? 'رمز الدعوة' : 'Invitation Code'}
              </Label>
              <Input
                id="invitationCode"
                type="text"
                placeholder={isRTL ? 'أدخل رمز الدعوة' : 'Enter your invitation code'}
                value={formData.invitationCode}
                onChange={(e) => handleChange("invitationCode", e.target.value.toUpperCase())}
                className="text-center font-mono text-lg tracking-wider"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full bg-[#003366] hover:bg-[#004080]"
              disabled={!formData.invitationCode}
              onClick={() => {
                if (formData.invitationCode) {
                  // Code entered, show registration form
                  setFormData(prev => ({ ...prev }));
                }
              }}
            >
              {isRTL ? 'متابعة التسجيل' : 'Continue to Register'}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  {isRTL ? 'أو' : 'or'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white"
              onClick={() => setLocation("/request-access")}
            >
              <UserPlus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isRTL ? 'طلب الانضمام' : 'Request Access'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-[#003366] hover:text-[#004080] font-semibold"
                onClick={() => setLocation("/login")}
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign in'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244] p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Back to Home Link */}
      <Button
        variant="ghost"
        className={`absolute top-4 text-white hover:text-[#CDE428] hover:bg-white/10 ${
          isRTL ? 'right-4' : 'left-4'
        }`}
        onClick={() => setLocation("/")}
      >
        {isRTL ? (
          <>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </>
        ) : (
          <>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </>
        )}
      </Button>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRTL ? 'إنشاء حساب' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isRTL 
              ? `انضم إلى ${APP_TITLE} وابدأ الاستثمار اليوم`
              : `Join ${APP_TITLE} and start investing today`
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Show invitation code field if in private mode */}
            {isPrivateMode && (
              <div className="space-y-2">
                <Label htmlFor="invitationCode">
                  {isRTL ? 'رمز الدعوة *' : 'Invitation Code *'}
                </Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder={isRTL ? 'أدخل رمز الدعوة' : 'Enter your invitation code'}
                  value={formData.invitationCode}
                  onChange={(e) => handleChange("invitationCode", e.target.value.toUpperCase())}
                  disabled={registerMutation.isPending}
                  className="text-center font-mono tracking-wider"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                {isRTL ? 'الاسم الكامل *' : 'Full Name *'}
              </Label>
              <Input
                id="name"
                type="text"
                placeholder={isRTL ? 'أحمد محمد' : 'John Doe'}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {isRTL ? 'البريد الإلكتروني *' : 'Email *'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={registerMutation.isPending}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                {isRTL ? 'الهاتف (اختياري)' : 'Phone (Optional)'}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+20 100 000 0000"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={registerMutation.isPending}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {isRTL ? 'كلمة المرور *' : 'Password *'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isRTL ? 'أنشئ كلمة مرور قوية' : 'Create a strong password'}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  disabled={registerMutation.isPending}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ${
                    isRTL ? 'left-3' : 'right-3'
                  }`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1 p-3 bg-gray-50 rounded-md">
                  <RequirementItem 
                    met={passwordRequirements.length} 
                    text={isRTL ? '8 أحرف على الأقل' : 'At least 8 characters'} 
                  />
                  <RequirementItem 
                    met={passwordRequirements.uppercase} 
                    text={isRTL ? 'حرف كبير واحد' : 'One uppercase letter'} 
                  />
                  <RequirementItem 
                    met={passwordRequirements.lowercase} 
                    text={isRTL ? 'حرف صغير واحد' : 'One lowercase letter'} 
                  />
                  <RequirementItem 
                    met={passwordRequirements.number} 
                    text={isRTL ? 'رقم واحد' : 'One number'} 
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {isRTL ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={isRTL ? 'أكد كلمة المرور' : 'Confirm your password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  disabled={registerMutation.isPending}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ${
                    isRTL ? 'left-3' : 'right-3'
                  }`}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">
                  {isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-[#003366] hover:bg-[#004080]"
              disabled={registerMutation.isPending || !isPasswordValid}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {isRTL ? 'جاري إنشاء الحساب...' : 'Creating account...'}
                </>
              ) : (
                isRTL ? 'إنشاء حساب' : 'Create Account'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-[#003366] hover:text-[#004080] font-semibold"
                onClick={() => setLocation("/login")}
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign in'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
