import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function TermsAcceptanceModal() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only check terms acceptance if user is authenticated
  const isAuthenticated = !!user && !authLoading;

  // Check if user needs to accept terms - only when authenticated
  const { data: acceptanceStatus, isLoading: checkingAcceptance, refetch } = trpc.terms.checkAcceptance.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: isAuthenticated,
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

  // Check scroll position
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
      if (isAtBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleAccept = () => {
    if (!termsContent?.version) return;
    acceptTermsMutation.mutate({ version: termsContent.version });
  };

  // Don't render anything if not authenticated or still checking
  if (!isAuthenticated || checkingAcceptance || !acceptanceStatus?.needsAcceptance) {
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
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 border rounded-lg p-4 overflow-y-auto"
              style={{ maxHeight: "50vh" }}
            >
              <div className={`prose prose-sm max-w-none ${language === "ar" ? "prose-rtl text-right" : ""}`}>
                <ReactMarkdown>{content || ""}</ReactMarkdown>
              </div>
            </div>

            {!hasScrolledToBottom && (
              <p className="text-sm text-muted-foreground text-center py-2">
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
