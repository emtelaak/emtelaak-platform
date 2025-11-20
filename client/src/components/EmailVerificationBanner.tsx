import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({ email, onDismiss }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const resendMutation = trpc.localAuth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success("Verification email sent! Please check your inbox.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleResend = () => {
    resendMutation.mutate();
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) {
    return null;
  }

  return (
    <Alert className="border-yellow-500 bg-yellow-50 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-yellow-100 rounded-full transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-yellow-700" />
      </button>
      
      <div className="flex items-start gap-3 pr-8">
        <Mail className="h-5 w-5 text-yellow-700 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-yellow-800">
            <strong>Verify your email address</strong>
            <p className="mt-1">
              We sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to access all platform features.
            </p>
            <Button
              onClick={handleResend}
              disabled={resendMutation.isPending}
              variant="link"
              className="p-0 h-auto text-yellow-700 hover:text-yellow-900 font-semibold mt-2"
            >
              {resendMutation.isPending ? "Sending..." : "Resend verification email"}
            </Button>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
