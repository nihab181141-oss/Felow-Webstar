// Utilities for external WhatsApp & Facebook contact links and Bangladesh contact normalization

export const DEFAULT_TUTOR_WHATSAPP_MESSAGE =
  'Hello, I found your tutor profile on Tutorly. I would like to discuss tuition opportunities.';

const ALLOWED_FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'mbasic.facebook.com',
  'web.facebook.com',
  'fb.com',
  'www.fb.com'
]);

/**
 * Normalizes Bangladeshi mobile numbers into strict E.164 digits without '+'
 * suitable for https://wa.me/8801XXXXXXXXX links.
 * Accepts formats like:
 * - 01712345678
 * - +880 1712-345678
 * - 8801712345678
 * - 008801712345678
 * - 8808801712345678 (strips duplicate country code)
 * - 1712345678 (10 digits starting with 1)
 */
function convertBengaliDigitsToAscii(input: string): string {
  return input.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6));
}

export function normalizeBdPhoneForWhatsApp(rawPhone?: string): string | null {
  if (!rawPhone) return null;
  let digits = convertBengaliDigitsToAscii(rawPhone).replace(/\D/g, '');
  if (!digits) return null;

  // Strip international dialing prefix 00
  if (digits.startsWith('00880')) {
    digits = digits.slice(2);
  }

  // Strip duplicate 880 prefix (e.g. 8808801...)
  while (digits.startsWith('880880')) {
    digits = digits.slice(3);
  }

  // Handle 88001XXXXXXXXX (extra 0 after 880)
  if (digits.startsWith('88001') && digits.length === 14) {
    digits = `880${digits.slice(4)}`;
  }

  // Normalize 01XXXXXXXXX -> 8801XXXXXXXXX
  if (digits.startsWith('01') && digits.length === 11) {
    digits = `88${digits}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    // Normalize 1XXXXXXXXX -> 8801XXXXXXXXX
    digits = `880${digits}`;
  }

  // Strictly enforce Bangladeshi mobile format: 8801[3-9]XXXXXXXX (13 digits)
  if (/^8801[3-9]\d{8}$/.test(digits)) {
    return digits;
  }

  return null;
}

export function isValidBdWhatsAppNumber(rawPhone?: string): boolean {
  return normalizeBdPhoneForWhatsApp(rawPhone) !== null;
}

export function formatBdPhoneDisplay(rawPhone?: string): string {
  const normalized = normalizeBdPhoneForWhatsApp(rawPhone);
  if (!normalized) return rawPhone?.trim() || '';
  // 880 1712-345678
  const local = normalized.slice(2); // 01XXXXXXXXX
  return `+880 ${local.slice(1, 5)}-${local.slice(5)}`;
}

export function buildWhatsAppUrl(
  phone?: string,
  message: string = DEFAULT_TUTOR_WHATSAPP_MESSAGE
): string | null {
  const normalized = normalizeBdPhoneForWhatsApp(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  const trimmedMsg = message?.trim();
  if (trimmedMsg) {
    return `${base}?text=${encodeURIComponent(trimmedMsg)}`;
  }
  return base;
}

/**
 * Opens a pre-built WhatsApp URL cleanly in a new tab/app with anchor fallback
 * for Android WebViews and strict popup blockers. Returns true if dispatched.
 */
export function launchWhatsAppUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url) return false;
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) return true;

  // Fallback synthetic anchor click for browsers blocking window.open after async calls
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFacebookUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject unsafe schemes immediately
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed.replace(/^http:\/\//i, 'https://')
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'https:') return null;

    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_FACEBOOK_HOSTS.has(host)) {
      return null;
    }

    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    if (!cleanPath || cleanPath === '') {
      return null;
    }

    // Require an actual profile ID for profile.php URLs
    if (cleanPath.toLowerCase() === '/profile.php') {
      const id = parsed.searchParams.get('id');
      if (!id || !/^\d{5,}$/.test(id)) return null;
      return `https://www.facebook.com/profile.php?id=${id}`;
    }

    if (cleanPath.replace(/\//g, '').length < 2) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function formatBDT(amount?: number): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '৳0';
  return `৳${amount.toLocaleString('en-US')}`;
}
