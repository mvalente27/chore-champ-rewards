import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Share, Plus, MoreVertical, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Already Installed!</h1>
        <p className="text-muted-foreground mb-6">ChoreQuest is installed on your device.</p>
        <Button onClick={() => navigate('/auth')}>
          Open App
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center pt-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🪙</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">ChoreQuest</h1>
          <p className="text-muted-foreground mt-2">Install the app for the best experience</p>
        </div>

        {/* Install Button (Android/Desktop) */}
        {deferredPrompt && (
          <Button 
            onClick={handleInstallClick} 
            size="lg" 
            className="w-full gap-2 text-lg py-6"
          >
            <Download className="w-5 h-5" />
            Install App
          </Button>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Install on iPhone/iPad
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for <Share className="w-4 h-4" /> at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Scroll down and tap</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    "Add to Home Screen" <Plus className="w-4 h-4" />
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tap "Add"</p>
                  <p className="text-sm text-muted-foreground">The app will appear on your home screen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Instructions (fallback if no prompt) */}
        {isAndroid && !deferredPrompt && (
          <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Install on Android
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tap the menu button</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for <MoreVertical className="w-4 h-4" /> in Chrome
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Tap "Install app"</p>
                  <p className="text-sm text-muted-foreground">Or "Add to Home screen"</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Install on Desktop
            </h2>
            <p className="text-muted-foreground">
              Look for the install icon <Download className="w-4 h-4 inline" /> in your browser's address bar, or use the browser menu to install this app.
            </p>
          </div>
        )}

        {/* Skip */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            Continue in browser
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
