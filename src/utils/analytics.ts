// Privacy-safe Google Analytics 4 instrumentation.
// Only activates when VITE_GA_MEASUREMENT_ID is configured and never sends PII.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEventName =
  | 'page_view'
  | 'sign_up'
  | 'login'
  | 'tutor_profile_view'
  | 'tutor_search'
  | 'tuition_view'
  | 'tuition_application'
  | 'whatsapp_contact_click'
  | 'share_content';

const GA_MEASUREMENT_ID =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || ''
    : '';

let isGaInitialized = false;

function isDoNotTrackEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1';
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(GA_MEASUREMENT_ID && /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID));
}

export function initAnalytics(): void {
  if (typeof window === 'undefined' || isGaInitialized || !isAnalyticsConfigured() || isDoNotTrackEnabled()) {
    return;
  }
  isGaInitialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

// Defensive sanitizer: strips any accidental PII keys before sending to gtag
const BLOCKED_PARAM_KEYS = new Set([
  'email',
  'phone',
  'whatsapp',
  'whatsappNumber',
  'name',
  'userName',
  'facebookUrl',
  'token',
  'uid',
  'address'
]);

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  params: Record<string, string | number | boolean | undefined> = {}
): void {
  if (typeof window === 'undefined' || !isAnalyticsConfigured() || isDoNotTrackEnabled()) {
    return;
  }
  initAnalytics();
  if (typeof window.gtag !== 'function') return;

  const cleanParams: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (BLOCKED_PARAM_KEYS.has(key) || value === undefined || value === '') continue;
    cleanParams[key] = value;
  }

  window.gtag('event', eventName, cleanParams);
}
