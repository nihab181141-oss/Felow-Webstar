import { registerSW } from 'virtual:pwa-register';

let registrationStarted = false;
let updateServiceWorkerFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let needRefreshState = false;
const updateListeners = new Set<(needRefresh: boolean) => void>();

function notifyUpdateListeners() {
  updateListeners.forEach((listener) => listener(needRefreshState));
}

export function registerPWA(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  if (registrationStarted) return;
  registrationStarted = true;

  updateServiceWorkerFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefreshState = true;
      notifyUpdateListeners();
    },
    onOfflineReady() {
      // App shell precached cleanly; offline fallback ready
    },
    onRegisterError(error) {
      console.warn('Service worker registration error:', error);
    }
  });
}

export async function applyPWAUpdate(): Promise<void> {
  if (!updateServiceWorkerFn) {
    window.location.reload();
    return;
  }
  needRefreshState = false;
  notifyUpdateListeners();
  await updateServiceWorkerFn(true);
}

export function subscribePWAUpdateState(
  listener: (needRefresh: boolean) => void
): () => void {
  updateListeners.add(listener);
  listener(needRefreshState);
  return () => {
    updateListeners.delete(listener);
  };
}
