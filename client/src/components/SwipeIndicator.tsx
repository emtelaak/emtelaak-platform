import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "portfolio-swipe-tutorial-dismissed";

export default function SwipeIndicator() {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the tutorial
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    
    // Only show on mobile devices and if not previously dismissed
    const isMobile = window.innerWidth < 768;
    
    if (!isDismissed && isMobile) {
      // Show after a short delay for better UX
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1000);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none md:hidden">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-500" />
      
      {/* Swipe indicator container */}
      <div className="absolute bottom-24 left-0 right-0 flex items-center justify-center px-4 pointer-events-auto">
        <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl p-4 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-500">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
            aria-label="Dismiss tutorial"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Tutorial content */}
          <div className="text-center pt-2">
            <p className="text-sm font-semibold mb-3">
              {language === "en" 
                ? "💡 Swipe to navigate tabs" 
                : "💡 اسحب للتنقل بين التبويبات"}
            </p>
            
            {/* Animated arrows */}
            <div className="flex items-center justify-center gap-8 mb-3">
              <div className={`flex flex-col items-center ${isAnimating ? "animate-pulse" : ""}`}>
                <ChevronLeft className="h-8 w-8 mb-1" />
                <span className="text-xs">
                  {language === "en" ? "Previous" : "السابق"}
                </span>
              </div>
              
              <div className="h-px w-12 bg-primary-foreground/30" />
              
              <div className={`flex flex-col items-center ${isAnimating ? "animate-pulse" : ""}`}>
                <ChevronRight className="h-8 w-8 mb-1" />
                <span className="text-xs">
                  {language === "en" ? "Next" : "التالي"}
                </span>
              </div>
            </div>

            {/* Dismiss button */}
            <Button
              onClick={handleDismiss}
              variant="secondary"
              size="sm"
              className="w-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            >
              {language === "en" ? "Got it!" : "فهمت!"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
