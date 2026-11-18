import { TutorProfile } from '../types';

const UNIVERSITY_SYNONYM_GROUPS: readonly string[][] = [
  ['du', 'university of dhaka', 'dhaka university', 'ঢাকা বিশ্ববিদ্যালয়', 'ঢাবি'],
  ['buet', 'bangladesh university of engineering and technology', 'বুয়েট'],
  ['dmc', 'dhaka medical college', 'ঢাকা মেডিকেল কলেজ'],
  ['ssmc', 'sir salimullah medical college'],
  ['cmc', 'chittagong medical college', 'chattogram medical college'],
  ['rmc', 'rajshahi medical college'],
  ['somc', 'sylhet mag osmani medical college', 'osmani medical college'],
  ['cuet', 'chittagong university of engineering and technology', 'chattogram university of engineering and technology'],
  ['ruet', 'rajshahi university of engineering and technology'],
  ['kuet', 'khulna university of engineering and technology'],
  ['sust', 'shahjalal university of science and technology'],
  ['ju', 'jahangirnagar university', 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়'],
  ['cu', 'university of chittagong', 'chittagong university', 'university of chattogram', 'chattogram university'],
  ['ru', 'university of rajshahi', 'rajshahi university'],
  ['ku', 'khulna university'],
  ['jnu', 'jagannath university'],
  ['iut', 'islamic university of technology'],
  ['nsu', 'north south university'],
  ['bracu', 'brac university', 'brac'],
  ['aiub', 'american international university bangladesh'],
  ['ewu', 'east west university'],
  ['iub', 'independent university bangladesh'],
  ['aust', 'ahsanullah university of science and technology'],
  ['mist', 'military institute of science and technology'],
  ['bup', 'bangladesh university of professionals'],
  ['bau', 'bangladesh agricultural university'],
  ['uiu', 'united international university'],
  ['diu', 'daffodil international university'],
  ['just', 'jashore university of science and technology', 'jessore university of science and technology'],
  ['mbstu', 'mawlana bhashani science and technology university'],
  ['nstu', 'noakhali science and technology university'],
  ['hstu', 'hajee mohammad danesh science and technology university'],
  ['pstu', 'patuakhali science and technology university'],
  ['cvasu', 'chattogram veterinary and animal sciences university'],
  ['iu', 'islamic university kushtia'],
  ['bsmmu', 'bangabandhu sheikh mujib medical university'],
  ['butex', 'bangladesh university of textiles']
];

export function normalizeSearchText(value: string): string {
  return (value || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.\-_,'’`"/()|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandUniversityAliases(universityRaw: string): string[] {
  const norm = normalizeSearchText(universityRaw);
  if (!norm) return [];
  const padded = ` ${norm} `;
  const aliases: string[] = [];

  for (const group of UNIVERSITY_SYNONYM_GROUPS) {
    const matched = group.some(term => {
      if (term.length <= 5 && /^[a-z0-9]+$/.test(term)) {
        return padded.includes(` ${term} `);
      }
      return norm.includes(term);
    });
    if (matched) {
      aliases.push(...group);
    }
  }
  return aliases;
}

export function buildTutorSearchHaystack(tutor: TutorProfile, extraEmail?: string): string {
  const compactName = normalizeSearchText(tutor.name).replace(/\s+/g, '');
  const universityAliases = expandUniversityAliases(tutor.university || '');

  const rawJoined = [
    tutor.name,
    compactName,
    tutor.headline,
    tutor.bio,
    tutor.university,
    ...universityAliases,
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
    .join(' ');

  const rawLower = rawJoined.toLowerCase();
  const normalized = normalizeSearchText(rawJoined);
  return `${rawLower} ${normalized}`;
}

export function matchesTutorSearchQuery(
  tutor: TutorProfile,
  rawQuery: string,
  extraEmail?: string
): boolean {
  const normQuery = normalizeSearchText(rawQuery);
  if (!normQuery) return true;
  const tokens = normQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = buildTutorSearchHaystack(tutor, extraEmail);
  return tokens.every(token => haystack.includes(token));
}

export function scoreTutorSearchMatch(tutor: TutorProfile, rawQuery: string): number {
  const q = normalizeSearchText(rawQuery);
  if (!q) return 0;

  const name = normalizeSearchText(tutor.name || '');
  const compactName = name.replace(/\s+/g, '');
  const compactQ = q.replace(/\s+/g, '');
  const university = normalizeSearchText(tutor.university || '');
  const uniAliases = expandUniversityAliases(tutor.university || '').join(' ');
  const department = normalizeSearchText(tutor.department || '');
  const subjects = normalizeSearchText((tutor.subjects || []).join(' '));
  const district = normalizeSearchText(tutor.district || '');
  const areas = normalizeSearchText((tutor.preferredAreas || []).join(' '));

  let score = 0;

  // Name matches weigh highest so searching a person's name surfaces their account first
  if (name === q || compactName === compactQ) {
    score += 240;
  } else if (name.startsWith(q) || compactName.startsWith(compactQ)) {
    score += 170;
  } else if (` ${name} `.includes(` ${q}`)) {
    score += 130;
  } else if (name.includes(q) || compactName.includes(compactQ)) {
    score += 95;
  }

  if (university.includes(q) || ` ${uniAliases} `.includes(` ${q} `)) score += 45;
  if (department.includes(q)) score += 30;
  if (subjects.includes(q)) score += 25;
  if (areas.includes(q)) score += 22;
  if (district.includes(q)) score += 18;

  const tokens = q.split(' ').filter(Boolean);
  for (const token of tokens) {
    if (` ${name} `.includes(` ${token}`)) score += 32;
    else if (name.includes(token)) score += 22;
    if (university.includes(token) || ` ${uniAliases} `.includes(` ${token} `)) score += 14;
    if (department.includes(token)) score += 10;
    if (subjects.includes(token)) score += 8;
  }

  // Gentle quality tie-breaker among equal matches
  score += Math.min(8, Number(tutor.rating) || 0);
  return score;
}

export function filterAndRankTutors(
  tutors: TutorProfile[],
  rawQuery: string,
  options?: { includeHiddenAndDrafts?: boolean }
): TutorProfile[] {
  const includeHidden = Boolean(options?.includeHiddenAndDrafts);
  const visible = includeHidden
    ? tutors
    : tutors.filter(t => t.isPublished !== false && t.profileVisibility !== 'hidden');

  const trimmed = rawQuery.trim();
  if (!trimmed) return visible;

  return visible
    .filter(t => matchesTutorSearchQuery(t, trimmed, includeHidden ? t.email : undefined))
    .sort((a, b) => scoreTutorSearchMatch(b, trimmed) - scoreTutorSearchMatch(a, trimmed));
}
