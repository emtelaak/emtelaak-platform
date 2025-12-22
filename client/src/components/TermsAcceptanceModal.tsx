import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function TermsAcceptanceModal() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  // Check if user needs to accept terms
  const { data: acceptanceStatus, isLoading: checkingAcceptance, refetch } = trpc.terms.checkAcceptance.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Get active terms content
  const { data: termsContent, isLoading: loadingTerms } = trpc.terms.getActiveTerms.useQuery(
    undefined,
    {
      enabled: acceptanceStatus?.needsAcceptance === true,
    }
  );

  // Accept terms mutation
  const acceptTermsMutation = trpc.terms.acceptTerms.useMutation({
    onSuccess: () => {
      toast.success(
        language === "ar" ? "تم قبول الشروط والأحكام" : "Terms accepted successfully"
      );
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(
        language === "ar" ? "حدث خطأ" : "Error",
        { description: error.message }
      );
    },
  });

  // Show modal when user needs to accept terms
  useEffect(() => {
    if (acceptanceStatus?.needsAcceptance) {
      setIsOpen(true);
    }
  }, [acceptanceStatus]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (!termsContent?.version) return;
    acceptTermsMutation.mutate({ version: termsContent.version });
  };

  if (checkingAcceptance || !acceptanceStatus?.needsAcceptance) {
    return null;
  }

  const title = language === "ar" ? termsContent?.titleAr : termsContent?.titleEn;
  const content = language === "ar" ? termsContent?.contentAr : termsContent?.contentEn;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {title || (language === "ar" ? "الشروط والأحكام" : "Terms and Conditions")}
              </DialogTitle>
              <DialogDescription>
                {language === "ar" 
                  ? "يرجى قراءة والموافقة على الشروط والأحكام للمتابعة"
                  : "Please read and accept the terms and conditions to continue"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingTerms ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ScrollArea 
              className="flex-1 border rounded-lg p-4 max-h-[50vh]"
              onScrollCapture={handleScroll}
            >
              <div className={`prose prose-sm max-w-none ${language === "ar" ? "prose-rtl" : ""}`}>
                <ReactMarkdown>{content || ""}</ReactMarkdown>
              </div>
            </ScrollArea>

            {!hasScrolledToBottom && (
              <p className="text-sm text-muted-foreground text-center">
                {language === "ar" 
                  ? "يرجى التمرير لأسفل لقراءة جميع الشروط"
                  : "Please scroll down to read all terms"}
              </p>
            )}

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-terms"
                  checked={hasAccepted}
                  onCheckedChange={(checked) => setHasAccepted(checked === true)}
                  disabled={!hasScrolledToBottom}
                />
                <label 
                  htmlFor="accept-terms" 
                  className={`text-sm cursor-pointer ${!hasScrolledToBottom ? "text-muted-foreground" : ""}`}
                >
                  {language === "ar"
                    ? "لقد قرأت وأوافق على الشروط والأحكام"
                    : "I have read and agree to the Terms and Conditions"}
                </label>
              </div>

              <Button
                onClick={handleAccept}
                disabled={!hasAccepted || !hasScrolledToBottom || acceptTermsMutation.isPending}
                className="w-full"
              >
                {acceptTermsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {language === "ar" ? "قبول والمتابعة" : "Accept and Continue"}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
