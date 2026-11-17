import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Module-level store so dynamically mounted menus/drawers never miss an early beforeinstallprompt event
let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;
let sharedIsInstalled = false;
let listenersInitialized = false;
const promptListeners = new Set<() => void>();

function notifyPromptListeners() {
  promptListeners.forEach((cb) => cb());
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function ensureInstallListeners() {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;
  sharedIsInstalled = detectStandalone();

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    sharedDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });

  window.addEventListener('appinstalled', () => {
    sharedIsInstalled = true;
    sharedDeferredPrompt = null;
    notifyPromptListeners();
  });

  const displayMedia = window.matchMedia('(display-mode: standalone)');
  displayMedia.addEventListener?.('change', (ev) => {
    if (ev.matches) {
      sharedIsInstalled = true;
      sharedDeferredPrompt = null;
      notifyPromptListeners();
    }
  });
}

if (typeof window !== 'undefined') {
  ensureInstallListeners();
}

export function usePWAInstall() {
  const [, setTick] = useState(0);
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIPadOS =
      navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return /iphone|ipad|ipod/.test(ua) || isIPadOS;
  });

  useEffect(() => {
    ensureInstallListeners();
    const bump = () => setTick((t) => t + 1);
    promptListeners.add(bump);
    return () => {
      promptListeners.delete(bump);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!sharedDeferredPrompt) return false;
    await sharedDeferredPrompt.prompt();
    const { outcome } = await sharedDeferredPrompt.userChoice;
    if (outcome === 'accepted') {
      sharedIsInstalled = true;
      sharedDeferredPrompt = null;
      notifyPromptListeners();
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(sharedDeferredPrompt),
    isInstalled: sharedIsInstalled || detectStandalone(),
    isIOS,
    install
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
