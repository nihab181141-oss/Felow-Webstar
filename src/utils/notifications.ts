export type BrowserNotifPermission = NotificationPermission | 'unsupported';

export function getBrowserNotificationPermission(): BrowserNotifPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotifPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

export async function showBrowserNotification(
  title: string,
  body: string,
  options?: {
    tag?: string;
    onClick?: () => void;
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: '/og-share-brand.png',
      badge: '/og-share-brand.png',
      tag: options?.tag
    });
    notif.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore focus restriction
      }
      options?.onClick?.();
      notif.close();
    };
    return true;
  } catch {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, {
            body,
            icon: '/og-share-brand.png',
            badge: '/og-share-brand.png',
            tag: options?.tag
          });
          return true;
        }
      } catch {
        // ignore fallback failure
      }
    }
    return false;
  }
}

export function formatRelativeTime(isoDate?: string, fallback = 'Recently'): string {
  if (!isoDate) return fallback;
  const ms = Date.parse(isoDate);
  if (!Number.isFinite(ms)) return fallback;
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function isWithinLast24Hours(isoDate?: string): boolean {
  if (!isoDate) return false;
  const ms = Date.parse(isoDate);
  if (!Number.isFinite(ms)) return false;
  const ageMs = Date.now() - ms;
  return ageMs >= -60_000 && ageMs <= 24 * 60 * 60 * 1000;
}
