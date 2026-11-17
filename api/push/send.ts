import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import webpush from 'web-push';

interface VerifiedFirebaseUser {
  localId: string;
  email?: string;
  emailVerified?: boolean;
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

function getFirebaseConfig(): { apiKey: string; projectId: string; databaseId: string } {
  try {
    const raw = readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as {
      apiKey?: string;
      projectId?: string;
      firestoreDatabaseId?: string;
    };
    return {
      apiKey: (process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || parsed.apiKey || '').trim(),
      projectId: (process.env.VITE_FIREBASE_PROJECT_ID || parsed.projectId || '').trim(),
      databaseId: (process.env.VITE_FIREBASE_DATABASE_ID || parsed.firestoreDatabaseId || '(default)').trim()
    };
  } catch {
    return {
      apiKey: (process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || '').trim(),
      projectId: (process.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
      databaseId: (process.env.VITE_FIREBASE_DATABASE_ID || '(default)').trim()
    };
  }
}

async function verifyFirebaseIdToken(
  authHeader?: string
): Promise<{ user: VerifiedFirebaseUser; idToken: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return null;

  const { apiKey } = getFirebaseConfig();
  if (!apiKey) return null;

  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );
  if (!resp.ok) return null;
  const data = (await resp.json()) as { users?: VerifiedFirebaseUser[] };
  const user = data.users?.[0];
  return user?.localId ? { user, idToken } : null;
}

async function fetchUserSubscriptionsFromFirestore(
  targetUserId: string,
  idToken: string
): Promise<PushSubscriptionPayload[]> {
  const { projectId, databaseId } = getFirebaseConfig();
  if (!projectId) return [];

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents:runQuery`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'pushSubscriptions' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'userId' },
            op: 'EQUAL',
            value: { stringValue: targetUserId }
          }
        },
        limit: 10
      }
    })
  });

  if (!resp.ok) return [];
  const rows = (await resp.json()) as Array<{
    document?: {
      fields?: {
        endpoint?: { stringValue?: string };
        keys?: {
          mapValue?: {
            fields?: {
              p256dh?: { stringValue?: string };
              auth?: { stringValue?: string };
            };
          };
        };
      };
    };
  }>;

  const subs: PushSubscriptionPayload[] = [];
  for (const row of rows) {
    const f = row.document?.fields;
    const endpoint = f?.endpoint?.stringValue;
    const p256dh = f?.keys?.mapValue?.fields?.p256dh?.stringValue;
    const auth = f?.keys?.mapValue?.fields?.auth?.stringValue;
    if (endpoint && endpoint.startsWith('https://') && p256dh && auth) {
      subs.push({ endpoint, keys: { p256dh, auth } });
    }
  }
  return subs;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicKey = (
    process.env.VAPID_PUBLIC_KEY ||
    process.env.VITE_VAPID_PUBLIC_KEY ||
    ''
  ).trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (
    process.env.VAPID_SUBJECT ||
    'mailto:admin@felow-webstar.vercel.app'
  ).trim();

  if (!publicKey || !privateKey) {
    return res.status(503).json({
      configured: false,
      error:
        'Server Web Push is not configured yet. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in Vercel Environment Variables.'
    });
  }

  const verified = await verifyFirebaseIdToken(req.headers?.authorization);
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized: valid Firebase ID token required.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const title = String(body.title || 'FeLoW WebStaR').trim().slice(0, 128);
  const message = String(body.body || body.message || '').trim().slice(0, 512);
  const targetUrl =
    typeof body.url === 'string' && body.url.startsWith('/') ? body.url : '/dashboard';
  const targetUserId =
    typeof body.targetUserId === 'string' && body.targetUserId.trim()
      ? body.targetUserId.trim()
      : verified.user.localId;

  if (!message) {
    return res.status(400).json({ error: 'Notification message body is required.' });
  }

  const isAdminEmail =
    verified.user.email === 'nihabalmahjabin@gmail.com' && verified.user.emailVerified === true;
  if (targetUserId !== verified.user.localId && !isAdminEmail) {
    return res
      .status(403)
      .json({ error: 'Forbidden: cross-user push delivery requires admin authorization.' });
  }

  const subscriptions: PushSubscriptionPayload[] = [];
  if (
    targetUserId === verified.user.localId &&
    body.subscription &&
    typeof body.subscription.endpoint === 'string' &&
    body.subscription.endpoint.startsWith('https://') &&
    body.subscription.keys?.p256dh &&
    body.subscription.keys?.auth
  ) {
    subscriptions.push(body.subscription as PushSubscriptionPayload);
  } else {
    const storedSubs = await fetchUserSubscriptionsFromFirestore(targetUserId, verified.idToken);
    subscriptions.push(...storedSubs);
  }

  if (subscriptions.length === 0) {
    return res.status(404).json({
      error: 'No active push subscription found for this account/device.'
    });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const payload = JSON.stringify({
    title,
    body: message,
    url: targetUrl,
    tag: typeof body.tag === 'string' ? body.tag : `felow-push-${Date.now()}`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png'
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => webpush.sendNotification(sub, payload))
  );

  const delivered = results.filter((r) => r.status === 'fulfilled').length;
  const expiredCount = results.filter(
    (r) =>
      r.status === 'rejected' &&
      ((r.reason as { statusCode?: number })?.statusCode === 404 ||
        (r.reason as { statusCode?: number })?.statusCode === 410)
  ).length;

  if (delivered === 0) {
    return res.status(502).json({
      error: 'Push delivery failed or subscription expired.',
      expiredCount
    });
  }

  return res.status(200).json({
    ok: true,
    delivered,
    expiredCount
  });
}
