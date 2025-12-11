import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_TITLE } from '@/const';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Don't show again for 7 days after dismissal
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] User ${outcome} the install prompt`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Track installation
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  const content = {
    en: {
      title: 'Install Emtelaak App',
      description: 'Get quick access to your property investments. Install our app for a better experience!',
      benefits: [
        'Faster access to your portfolio',
        'Work offline',
        'Receive instant notifications',
      ],
      install: 'Install App',
      dismiss: 'Maybe Later',
    },
    ar: {
      title: 'تثبيت تطبيق إمتلاك',
      description: 'احصل على وصول سريع لاستثماراتك العقارية. قم بتثبيت تطبيقنا للحصول على تجربة أفضل!',
      benefits: [
        'وصول أسرع إلى محفظتك',
        'العمل دون اتصال بالإنترنت',
        'تلقي الإشعارات الفورية',
      ],
      install: 'تثبيت التطبيق',
      dismiss: 'ربما لاحقاً',
    },
  };

  const t = content[language];

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <Card className="border-2 border-primary shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm">{t.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                {t.description}
              </p>

              <ul className="space-y-1 mb-4">
                {t.benefits.map((benefit, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  className="flex-1 h-9"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t.install}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="h-9"
                  size="sm"
                >
                  {t.dismiss}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * iOS Install Instructions Component
 * Shows manual installation instructions for iOS users
 */
export function IOSInstallInstructions() {
  const [showInstructions, setShowInstructions] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('ios-install-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      // Show after 45 seconds (after PWA prompt timeout)
      setTimeout(() => {
        setShowInstructions(true);
      }, 45000);
    }
  }, []);

  const handleDismiss = () => {
    setShowInstructions(false);
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  if (!showInstructions) {
    return null;
  }

  const content = {
    en: {
      title: 'Install on iPhone',
      steps: [
        'Tap the Share button',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install',
      ],
      dismiss: 'Got it',
    },
    ar: {
      title: 'التثبيت على iPhone',
      steps: [
        'اضغط على زر المشاركة',
        'مرر لأسفل واضغط على "إضافة إلى الشاشة الرئيسية"',
        'اضغط على "إضافة" للتثبيت',
      ],
      dismiss: 'فهمت',
    },
  };

  const t = content[language];

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <Card className="border-2 border-blue-500 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm">{t.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ol className="space-y-2 mb-4">
                {t.steps.map((step, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              <Button
                onClick={handleDismiss}
                className="w-full h-9"
                size="sm"
                variant="outline"
              >
                {t.dismiss}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
