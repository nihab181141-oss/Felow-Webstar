import { TutorProfile } from '../types';

export function buildTutorSearchHaystack(tutor: TutorProfile, extraEmail?: string): string {
  return [
    tutor.name,
    tutor.headline,
    tutor.bio,
    tutor.university,
    tutor.degree,
    tutor.department,
    tutor.academicYear,
    tutor.semester,
    tutor.passingYear,
    tutor.schoolName,
    tutor.collegeName,
    tutor.division,
    tutor.district,
    tutor.upazila,
    tutor.availability,
    tutor.gender,
    tutor.experienceSummary,
    tutor.teachingStyleSummary,
    extraEmail,
    ...(tutor.preferredAreas || []),
    ...(tutor.subjects || []),
    ...(tutor.classes || []),
    ...(tutor.mediums || []),
    ...(tutor.tuitionTypes || []),
    ...(tutor.achievements || []),
    ...(tutor.badges || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesTutorSearchQuery(
  tutor: TutorProfile,
  rawQuery: string,
  extraEmail?: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = buildTutorSearchHaystack(tutor, extraEmail);
  return tokens.every(token => haystack.includes(token));
}

export function scoreTutorSearchMatch(tutor: TutorProfile, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;
  const name = (tutor.name || '').toLowerCase();
  const university = (tutor.university || '').toLowerCase();
  const department = (tutor.department || '').toLowerCase();
  const subjects = (tutor.subjects || []).join(' ').toLowerCase();
  const district = (tutor.district || '').toLowerCase();

  let score = 0;
  if (name === q) score += 120;
  else if (name.startsWith(q)) score += 90;
  else if (name.includes(q)) score += 65;

  if (university.includes(q)) score += 35;
  if (department.includes(q)) score += 25;
  if (subjects.includes(q)) score += 20;
  if (district.includes(q)) score += 15;

  const tokens = q.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (name.includes(token)) score += 20;
    if (university.includes(token)) score += 10;
  }

  return score;
}
