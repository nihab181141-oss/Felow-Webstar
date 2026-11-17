import { TutorProfile, TuitionPost } from '../types';
import { PRODUCTION_BASE_URL } from './routing';

export function buildPublicShareUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'felow-webstar.vercel.app') {
      return `${window.location.origin}${cleanPath}`;
    }
  }
  return `${PRODUCTION_BASE_URL}${cleanPath}`;
}

export function buildTutorSharePayload(tutor: TutorProfile) {
  const shareUrl = buildPublicShareUrl(`/tutors/${encodeURIComponent(tutor.id)}`);
  const subjects = tutor.subjects.slice(0, 4).join(', ');
  const uniPart = tutor.university ? ` (${tutor.university})` : '';
  const locPart = tutor.district ? ` in ${tutor.district}` : '';
  const feePart =
    tutor.expectedSalaryMin > 0
      ? `Fee: ৳${tutor.expectedSalaryMin.toLocaleString()}–${tutor.expectedSalaryMax.toLocaleString()}/mo.`
      : '';

  const shareText = [
    `${tutor.name}${uniPart} — Tutor Profile on FeLoW WebStaR${locPart}.`,
    subjects ? `Subjects: ${subjects}.` : '',
    feePart
  ]
    .filter(Boolean)
    .join(' ');

  const instagramCaption = [
    `Meet ${tutor.name}${uniPart} on FeLoW WebStaR!`,
    subjects ? `Teaching: ${subjects}` : '',
    tutor.district ? `Location: ${tutor.district}` : '',
    feePart,
    `View full tutor profile & contact via WhatsApp:`
  ]
    .filter(Boolean)
    .join('\n');

  return {
    title: `${tutor.name} — Tutor Profile`,
    subtitle: [tutor.university, tutor.department, tutor.district].filter(Boolean).join(' · '),
    shareUrl,
    shareText,
    instagramCaption,
    badgeLabel: 'Share Tutor Profile',
    contentType: 'tutor' as const
  };
}

export function buildTuitionSharePayload(post: TuitionPost) {
  const shareUrl = buildPublicShareUrl(`/tuitions/${encodeURIComponent(post.id)}`);
  const subjects = post.subjects.slice(0, 4).join(', ');
  const location = [post.area, post.district].filter(Boolean).join(', ');

  const shareText = [
    `Tuition Opportunity: "${post.title}" on FeLoW WebStaR.`,
    `Class: ${post.classGrade}${subjects ? ` · Subjects: ${subjects}` : ''}.`,
    location ? `Location: ${location}.` : '',
    `Salary: ৳${post.salaryOfferBDT.toLocaleString()}/mo (${post.daysPerWeek} days/wk).`
  ]
    .filter(Boolean)
    .join(' ');

  const instagramCaption = [
    `New Tuition Opportunity on FeLoW WebStaR!`,
    `${post.title}`,
    `Class: ${post.classGrade}${subjects ? ` | ${subjects}` : ''}`,
    location ? `Area: ${location}` : '',
    `Monthly Salary: ৳${post.salaryOfferBDT.toLocaleString()}/mo`,
    `Apply directly on FeLoW WebStaR:`
  ]
    .filter(Boolean)
    .join('\n');

  return {
    title: post.title,
    subtitle: [post.classGrade, location, `৳${post.salaryOfferBDT.toLocaleString()}/mo`]
      .filter(Boolean)
      .join(' · '),
    shareUrl,
    shareText,
    instagramCaption,
    badgeLabel: 'Share Tuition Post',
    contentType: 'tuition' as const
  };
}
