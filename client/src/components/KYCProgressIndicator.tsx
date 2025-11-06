import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function KYCProgressIndicator() {
  const { data: progress } = trpc.kyc.getProgress.useQuery();
  const { data: verificationStatus } = trpc.profile.getVerificationStatus.useQuery();

  if (!progress || verificationStatus?.documentsVerified) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">KYC Verification in Progress</h3>
              <span className="text-sm text-muted-foreground">
                {progress.completionPercentage}% Complete
              </span>
            </div>
            <Progress value={progress.completionPercentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Last saved {formatDistanceToNow(new Date(progress.lastSavedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
