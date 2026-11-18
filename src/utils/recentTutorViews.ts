import { DEFAULT_PLACEHOLDER_AVATAR, TutorProfile, isTutorVerified } from '../types';

export interface RecentTutorViewEntry {
  id: string;
  name: string;
  avatar: string;
  university: string;
  department: string;
  district: string;
  verified: boolean;
  visitedAt: number;
}

export const RECENT_TUTOR_VIEWS_KEY = 'felow_recent_tutor_profiles_v1';
export const MAX_RECENT_TUTOR_VIEWS = 6;

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadRecentTutorViews(): RecentTutorViewEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_TUTOR_VIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentTutorViewEntry =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          item.id.trim().length > 0 &&
          typeof item.name === 'string' &&
          item.name.trim().length > 0
      )
      .slice(0, MAX_RECENT_TUTOR_VIEWS);
  } catch {
    return [];
  }
}

function persistRecentTutorViews(entries: RecentTutorViewEntry[]): RecentTutorViewEntry[] {
  const sliced = entries.slice(0, MAX_RECENT_TUTOR_VIEWS);
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(RECENT_TUTOR_VIEWS_KEY, JSON.stringify(sliced));
    } catch {
      // Ignore storage quota or private browsing errors cleanly
    }
  }
  return sliced;
}

export function recordRecentTutorView(tutor: TutorProfile): RecentTutorViewEntry[] {
  if (!tutor?.id || !tutor?.name) return loadRecentTutorViews();
  const nextEntry: RecentTutorViewEntry = {
    id: tutor.id,
    name: tutor.name,
    avatar: tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR,
    university: tutor.university || '',
    department: tutor.department || '',
    district: tutor.district || '',
    verified: isTutorVerified(tutor),
    visitedAt: Date.now()
  };

  const existing = loadRecentTutorViews().filter(item => item.id !== tutor.id);
  return persistRecentTutorViews([nextEntry, ...existing]);
}

export function removeRecentTutorView(tutorId: string): RecentTutorViewEntry[] {
  const next = loadRecentTutorViews().filter(item => item.id !== tutorId);
  return persistRecentTutorViews(next);
}

export function clearRecentTutorViews(): RecentTutorViewEntry[] {
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(RECENT_TUTOR_VIEWS_KEY);
    } catch {
      // Ignore storage errors
    }
  }
  return [];
}
