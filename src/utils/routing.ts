export type RouteView =
  | 'landing'
  | 'tutors'
  | 'tutor-detail'
  | 'tuitions'
  | 'tuition-detail'
  | 'how-it-works'
  | 'about'
  | 'login'
  | 'tutor-onboarding'
  | 'dashboard'
  | 'admin'
  | 'not-found';

export const PRODUCTION_BASE_URL = 'https://felow-webstar.vercel.app';

export interface ParsedAppRoute {
  view: RouteView;
  directoryTab: 'tutors' | 'tuitions';
  tutorId?: string;
  tuitionId?: string;
}

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned || '/';
}

export function parseAppRoute(pathname: string): ParsedAppRoute {
  const path = normalizePathname(pathname);

  if (path === '/') {
    return { view: 'landing', directoryTab: 'tutors' };
  }
  if (path === '/tutors') {
    return { view: 'tutors', directoryTab: 'tutors' };
  }
  if (path === '/tuitions') {
    return { view: 'tuitions', directoryTab: 'tuitions' };
  }
  if (path === '/how-it-works') {
    return { view: 'how-it-works', directoryTab: 'tutors' };
  }
  if (path === '/about') {
    return { view: 'about', directoryTab: 'tutors' };
  }
  if (path === '/login') {
    return { view: 'login', directoryTab: 'tutors' };
  }
  if (path === '/tutor-onboarding') {
    return { view: 'tutor-onboarding', directoryTab: 'tutors' };
  }
  if (path === '/dashboard') {
    return { view: 'dashboard', directoryTab: 'tutors' };
  }
  if (path === '/admin') {
    return { view: 'admin', directoryTab: 'tutors' };
  }

  if (path.startsWith('/tutors/')) {
    const id = decodeURIComponent(path.slice('/tutors/'.length)).trim();
    if (id && !id.includes('/')) {
      return { view: 'tutor-detail', directoryTab: 'tutors', tutorId: id };
    }
  }

  if (path.startsWith('/tuitions/')) {
    const id = decodeURIComponent(path.slice('/tuitions/'.length)).trim();
    if (id && !id.includes('/')) {
      return { view: 'tuition-detail', directoryTab: 'tuitions', tuitionId: id };
    }
  }

  return { view: 'not-found', directoryTab: 'tutors' };
}

export function buildPathForView(
  view: RouteView,
  options?: { tutorId?: string | null; tuitionId?: string | null }
): string {
  switch (view) {
    case 'landing':
      return '/';
    case 'tutors':
      return '/tutors';
    case 'tuitions':
      return '/tuitions';
    case 'tutor-detail':
      return options?.tutorId ? `/tutors/${encodeURIComponent(options.tutorId)}` : '/tutors';
    case 'tuition-detail':
      return options?.tuitionId ? `/tuitions/${encodeURIComponent(options.tuitionId)}` : '/tuitions';
    case 'how-it-works':
      return '/how-it-works';
    case 'about':
      return '/about';
    case 'login':
      return '/login';
    case 'tutor-onboarding':
      return '/tutor-onboarding';
    case 'dashboard':
      return '/dashboard';
    case 'admin':
      return '/admin';
    case 'not-found':
    default:
      return typeof window !== 'undefined' ? normalizePathname(window.location.pathname) : '/';
  }
}
