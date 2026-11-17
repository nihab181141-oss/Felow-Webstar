import {
  deletePushSubscriptionFromFirestore,
  getCurrentUserIdToken,
  savePushSubscriptionInFirestore
} from '../services/firebase';
import { registerPWA } from './pwaRegister';

export interface WebPushStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  endpoint: string | null;
  serverConfigured: boolean;
  publicKey: string | null;
}

export interface WebPushActionResult {
  ok: boolean;
  message: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function fetchJsonSafely<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ status: number; data: T | null; isJson: boolean }> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { status: res.status, data: null, isJson: false };
  }
  const data = (await res.json()) as T;
  return { status: res.status, data, isJson: true };
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getVapidServerConfig(): Promise<{
  configured: boolean;
  publicKey: string | null;
  endpointReachable: boolean;
}> {
  const clientEnvPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();
  try {
    const { status, data, isJson } = await fetchJsonSafely<{
      configured?: boolean;
      publicKey?: string | null;
    }>('/api/push/config', { method: 'GET', cache: 'no-store' });

    if (!isJson || !data) {
      return {
        configured: Boolean(clientEnvPublicKey),
        publicKey: clientEnvPublicKey || null,
        endpointReachable: false
      };
    }

    return {
      configured: Boolean(status === 200 && data.configured),
      publicKey: (data.publicKey || clientEnvPublicKey || '').trim() || null,
      endpointReachable: true
    };
  } catch {
    return {
      configured: Boolean(clientEnvPublicKey),
      publicKey: clientEnvPublicKey || null,
      endpointReachable: false
    };
  }
}

async function getReadyServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  registerPWA();
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.ready;
}

export async function getWebPushStatus(): Promise<WebPushStatus> {
  if (!isWebPushSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      isSubscribed: false,
      endpoint: null,
      serverConfigured: false,
      publicKey: null
    };
  }

  const [config, existingReg] = await Promise.all([
    getVapidServerConfig(),
    navigator.serviceWorker.getRegistration()
  ]);

  let currentSub: PushSubscription | null = null;
  if (existingReg && 'pushManager' in existingReg) {
    currentSub = await existingReg.pushManager.getSubscription();
  }

  return {
    supported: true,
    permission: Notification.permission,
    isSubscribed: Boolean(currentSub),
    endpoint: currentSub?.endpoint || null,
    serverConfigured: config.configured,
    publicKey: config.publicKey
  };
}

function serializeSubscription(
  sub: PushSubscription
): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return null;
  }
  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    }
  };
}

export async function subscribeToWebPush(uid: string): Promise<WebPushActionResult> {
  if (!uid) {
    return { ok: false, message: 'Please sign in first to enable push notifications.' };
  }
  if (!isWebPushSupported()) {
    return {
      ok: false,
      message: 'This browser does not support Service Worker Web Push notifications.'
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      message:
        permission === 'denied'
          ? 'Notifications are blocked in your browser site settings. Please allow notifications to subscribe.'
          : 'Notification permission was dismissed.'
    };
  }

  const serverConfig = await getVapidServerConfig();
  if (!serverConfig.publicKey) {
    return {
      ok: false,
      message:
        'VAPID public key is not configured yet. Set VITE_VAPID_PUBLIC_KEY, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY on Vercel to activate Web Push.'
    };
  }

  let reg: ServiceWorkerRegistration;
  try {
    reg = await getReadyServiceWorkerRegistration();
  } catch {
    return {
      ok: false,
      message: 'Service worker is not active yet. Reload once and try again.'
    };
  }

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(serverConfig.publicKey)
    });
  }

  const serialized = serializeSubscription(subscription);
  if (!serialized) {
    return { ok: false, message: 'Failed to read PushSubscription keys from browser.' };
  }

  await savePushSubscriptionInFirestore(uid, serialized);

  // Best-effort validation against backend endpoint when serverless API routes are active
  try {
    const idToken = await getCurrentUserIdToken();
    if (idToken) {
      await fetchJsonSafely('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ subscription: serialized })
      });
    }
  } catch {
    // Firestore persistence already completed; serverless check only runs on Vercel/API runtime
  }

  return {
    ok: true,
    message: 'Push notifications enabled and synced for this device.'
  };
}

export async function unsubscribeFromWebPush(uid: string): Promise<WebPushActionResult> {
  if (!isWebPushSupported()) {
    return { ok: false, message: 'Push notifications are not supported in this browser.' };
  }

  const reg = await navigator.serviceWorker.getRegistration();
  const subscription = reg ? await reg.pushManager.getSubscription() : null;
  const endpoint = subscription?.endpoint;

  if (subscription) {
    await subscription.unsubscribe();
  }
  if (uid && endpoint) {
    await deletePushSubscriptionFromFirestore(uid, endpoint);
  }

  return { ok: true, message: 'Push notifications disabled on this device.' };
}

export async function sendTestWebPush(
  title = 'FeLoW WebStaR',
  body = 'Push notifications are active for your FeLoW WebStaR account.',
  url = '/dashboard'
): Promise<WebPushActionResult> {
  if (!isWebPushSupported()) {
    return { ok: false, message: 'Web Push is not supported in this browser.' };
  }

  const idToken = await getCurrentUserIdToken();
  if (!idToken) {
    return { ok: false, message: 'Sign in with Google to send a verified push alert.' };
  }

  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  const serialized = sub ? serializeSubscription(sub) : null;

  try {
    const { status, data, isJson } = await fetchJsonSafely<{
      ok?: boolean;
      delivered?: number;
      error?: string;
    }>('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({
        title,
        body,
        url,
        subscription: serialized || undefined
      })
    });

    if (!isJson || !data) {
      return {
        ok: false,
        message:
          'Serverless /api/push/send is unavailable in Vite-only dev mode. Deploy on Vercel with VAPID environment variables to test live push delivery.'
      };
    }

    if (status >= 200 && status < 300 && data.ok) {
      return {
        ok: true,
        message: `Web Push delivered (${data.delivered || 1} active subscription).`
      };
    }

    return {
      ok: false,
      message: data.error || `Push delivery returned status ${status}.`
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Failed to contact push server.'
    };
  }
}
