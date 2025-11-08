import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function KYCStatusBanner() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  const { data: verificationStatus } = trpc.profile.getVerificationStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Don't show banner if:
  // - User is not authenticated
  // - KYC is already completed (canInvest means fully verified)
  // - User has dismissed the banner
  if (!isAuthenticated || !verificationStatus || verificationStatus.canInvest || dismissed) {
    return null;
  }

  return (
    <Alert className="border-primary/50 bg-primary/10 mb-6">
      <Shield className="h-4 w-4 text-primary" />
      <AlertTitle className="flex items-center justify-between">
        <span>{(t.kyc as any)?.banner?.title || "Complete Your KYC Verification"}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between gap-4">
        <span className="text-sm">
          {(t.kyc as any)?.banner?.description || "Complete your KYC questionnaire to unlock full investment features and start building your property portfolio."}
        </span>
        <Link href="/kyc-questionnaire">
          <Button size="sm" className="whitespace-nowrap">
            {(t.kyc as any)?.banner?.button || "Complete KYC"}
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
