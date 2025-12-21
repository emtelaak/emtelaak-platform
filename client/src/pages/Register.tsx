import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, Eye, EyeOff, Check, X, ArrowLeft, ArrowRight } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created successfully!");
      
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
      setError("Please fill in all required fields");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-gray-500"}`}>
      {met ? <Check size={16} /> : <X size={16} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244] p-4">
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
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join {APP_TITLE} and start investing today
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={registerMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  disabled={registerMutation.isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1 p-3 bg-gray-50 rounded-md">
                  <RequirementItem met={passwordRequirements.length} text="At least 8 characters" />
                  <RequirementItem met={passwordRequirements.uppercase} text="One uppercase letter" />
                  <RequirementItem met={passwordRequirements.lowercase} text="One lowercase letter" />
                  <RequirementItem met={passwordRequirements.number} text="One number" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  disabled={registerMutation.isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-[#003366] hover:text-[#004080] font-semibold"
                onClick={() => setLocation("/login")}
              >
                Sign in
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
