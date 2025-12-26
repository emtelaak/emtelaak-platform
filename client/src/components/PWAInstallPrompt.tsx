import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt if not standalone, not dismissed recently (7 days)
    if (!standalone && daysSinceDismissed > 7) {
      // Listen for beforeinstallprompt event (Android/Desktop)
      const handler = (e: Event) => {
        // Only prevent default if we're going to show our custom prompt
        if (!iOS || daysSinceDismissed > 7) {
          e.preventDefault();
          setDeferredPrompt(e as BeforeInstallPromptEvent);
          setShowPrompt(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handler);

      // For iOS, show manual instructions after 3 seconds
      if (iOS) {
        setTimeout(() => setShowPrompt(true), 3000);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 md:bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 max-w-sm`}>
      <div className="bg-white rounded-lg shadow-2xl border-2 border-[#CDE428] p-4">
        <button
          onClick={handleDismiss}
          className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} text-gray-400 hover:text-gray-600`}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-[#032941] flex items-center justify-center flex-shrink-0">
            <Download className="h-6 w-6 text-[#CDE428]" />
          </div>
          <div>
            <h3 className="font-bold text-[#032941] text-lg">
              {language === 'ar' ? 'ثبّت التطبيق' : 'Install App'}
            </h3>
            <p className="text-sm text-gray-600">
              {language === 'ar'
                ? 'احصل على تجربة أفضل مع التطبيق'
                : 'Get a better experience with our app'}
            </p>
          </div>
        </div>

        {isIOS ? (
          // iOS instructions
          <div className="text-xs text-gray-600 mb-3 space-y-1">
            <p className="font-semibold">
              {language === 'ar' ? 'للتثبيت على iOS:' : 'To install on iOS:'}
            </p>
            <ol className={`list-decimal ${isRTL ? 'pr-4' : 'pl-4'} space-y-1`}>
              <li>
                {language === 'ar'
                  ? 'اضغط على زر المشاركة'
                  : 'Tap the Share button'}
                {' '}
                <span className="inline-block">
                  <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                  </svg>
                </span>
              </li>
              <li>
                {language === 'ar'
                  ? 'اختر "إضافة إلى الشاشة الرئيسية"'
                  : 'Select "Add to Home Screen"'}
              </li>
            </ol>
          </div>
        ) : (
          // Android/Desktop install button
          <Button
            onClick={handleInstallClick}
            className="w-full bg-[#032941] hover:bg-[#064B66] text-white"
          >
            <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'ثبّت الآن' : 'Install Now'}
          </Button>
        )}
      </div>
    </div>
  );
}
