export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicKey = (
    process.env.VAPID_PUBLIC_KEY ||
    process.env.VITE_VAPID_PUBLIC_KEY ||
    ''
  ).trim();
  const privateKeyConfigured = Boolean((process.env.VAPID_PRIVATE_KEY || '').trim());

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    configured: Boolean(publicKey && privateKeyConfigured),
    publicKey: publicKey || null
  });
}
