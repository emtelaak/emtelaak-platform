import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = trpc.localAuth.verifyEmail.useMutation({
    onSuccess: () => {
      setVerificationStatus("success");
    },
    onError: (error) => {
      setVerificationStatus("error");
      setErrorMessage(error.message);
    },
  });

  const resendMutation = trpc.localAuth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      setErrorMessage("Verification email sent! Please check your inbox.");
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
      // Automatically verify when token is present
      verifyMutation.mutate({ token: tokenParam });
    } else {
      setVerificationStatus("error");
      setErrorMessage("No verification token provided");
    }
  }, []);

  const handleResendEmail = () => {
    resendMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {verificationStatus === "loading" && "Verifying Your Email"}
            {verificationStatus === "success" && "Email Verified!"}
            {verificationStatus === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {verificationStatus === "loading" && "Please wait while we verify your email address..."}
            {verificationStatus === "success" && "Your email has been successfully verified"}
            {verificationStatus === "error" && "We couldn't verify your email address"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {verificationStatus === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-[#003366] mb-4" />
              <p className="text-sm text-gray-600">Verifying your email...</p>
            </div>
          )}

          {verificationStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-green-100 p-4 mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <p className="text-center text-gray-600 mb-4">
                Your email has been successfully verified. You can now access all platform features!
              </p>
            </div>
          )}

          {verificationStatus === "error" && (
            <>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-red-100 p-4 mb-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              {errorMessage.includes("expired") && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Your verification link has expired. Click below to receive a new verification email.
                  </p>
                  <Button
                    onClick={handleResendEmail}
                    disabled={resendMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {resendMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          {verificationStatus === "success" && (
            <Button
              onClick={() => setLocation("/")}
              className="w-full bg-[#003366] hover:bg-[#004080]"
            >
              Continue to Dashboard
            </Button>
          )}

          {verificationStatus === "error" && !errorMessage.includes("expired") && (
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
