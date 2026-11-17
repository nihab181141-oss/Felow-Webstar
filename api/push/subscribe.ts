import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface VerifiedFirebaseUser {
  localId: string;
  email?: string;
  emailVerified?: boolean;
}

function getFirebaseWebApiKey(): string {
  const fromEnv = (
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY ||
    ''
  ).trim();
  if (fromEnv) return fromEnv;

  try {
    const raw = readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return (parsed.apiKey || '').trim();
  } catch {
    return '';
  }
}

async function verifyFirebaseBearerToken(authHeader?: string): Promise<VerifiedFirebaseUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return null;

  const apiKey = getFirebaseWebApiKey();
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
  return data.users?.[0] || null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const verifiedUser = await verifyFirebaseBearerToken(req.headers?.authorization);
  if (!verifiedUser || !verifiedUser.localId) {
    return res.status(401).json({ error: 'Unauthorized: valid Firebase ID token is required.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const sub = body.subscription;

  if (
    !sub ||
    typeof sub.endpoint !== 'string' ||
    !sub.endpoint.startsWith('https://') ||
    !sub.keys ||
    typeof sub.keys.p256dh !== 'string' ||
    typeof sub.keys.auth !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid PushSubscription payload.' });
  }

  return res.status(200).json({
    ok: true,
    uid: verifiedUser.localId,
    endpointHost: new URL(sub.endpoint).host
  });
}
