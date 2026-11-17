export type RecentSearchKind = 'location' | 'subject' | 'query';

export interface RecentSearchEntry {
  id: string;
  kind: RecentSearchKind;
  label: string;
  query?: string;
  district?: string;
  subject?: string;
  timestamp: number;
}

export const RECENT_SEARCHES_STORAGE_KEY = 'felow_recent_searches_v1';
export const MAX_RECENT_SEARCHES = 5;

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function buildEntryId(kind: RecentSearchKind, label: string): string {
  return `${kind}:${label.trim().toLowerCase()}`;
}

export function loadRecentSearches(): RecentSearchEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentSearchEntry =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          (item.kind === 'location' || item.kind === 'subject' || item.kind === 'query') &&
          typeof item.label === 'string' &&
          item.label.trim().length > 0
      )
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function persistRecentSearches(entries: RecentSearchEntry[]): RecentSearchEntry[] {
  const sliced = entries.slice(0, MAX_RECENT_SEARCHES);
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(sliced));
    } catch {
      // Ignore storage quota or private-browsing errors cleanly
    }
  }
  return sliced;
}

export function saveRecentSearch(input: {
  kind: RecentSearchKind;
  label: string;
  query?: string;
  district?: string;
  subject?: string;
}): RecentSearchEntry[] {
  const cleanLabel = input.label.trim().slice(0, 64);
  if (!cleanLabel) return loadRecentSearches();

  const id = buildEntryId(input.kind, cleanLabel);
  const existing = loadRecentSearches().filter(item => item.id !== id);
  const nextEntry: RecentSearchEntry = {
    id,
    kind: input.kind,
    label: cleanLabel,
    ...(input.query ? { query: input.query.trim().slice(0, 80) } : {}),
    ...(input.district ? { district: input.district } : {}),
    ...(input.subject ? { subject: input.subject } : {}),
    timestamp: Date.now()
  };

  return persistRecentSearches([nextEntry, ...existing]);
}

export function removeRecentSearch(id: string): RecentSearchEntry[] {
  const next = loadRecentSearches().filter(item => item.id !== id);
  return persistRecentSearches(next);
}

export function clearRecentSearches(): RecentSearchEntry[] {
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions
    }
  }
  return [];
}
