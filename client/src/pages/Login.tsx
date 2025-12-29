import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const { language, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: async () => {
      toast.success("Login successful!");
      
      // Wait for cookie to be set and refetch auth state
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refetch user data to confirm login
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    loginMutation.mutate({ email, password, rememberMe });
  };

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
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your {APP_TITLE} account
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={loginMutation.isPending}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me for 30 days
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-[#003366] hover:text-[#004080]"
                onClick={() => setLocation("/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-[#003366] hover:bg-[#004080]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-[#003366] hover:text-[#004080] font-semibold"
                onClick={() => setLocation("/register")}
              >
                Create account
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
