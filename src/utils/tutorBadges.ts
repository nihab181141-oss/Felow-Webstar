import { TutorProfile, isTutorVerified } from '../types';

export type TutorMilestoneId = 'verified' | 'top-rated' | 'super-tutor' | 'identity' | 'institution' | 'qualification' | 'custom';

export interface TutorBadgeInfo {
  id: string;
  kind: TutorMilestoneId;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  tone: 'gold' | 'violet' | 'coral' | 'sky' | 'emerald';
}

/**
 * Computes earned trust badges and milestone achievements for a tutor profile.
 * Merges live verification/rating milestones with explicit Firestore `tutor.badges`.
 */
export function computeTutorMilestones(tutor: TutorProfile): {
  isGoldVerified: boolean;
  isTopRated: boolean;
  isSuperTutor: boolean;
  badges: TutorBadgeInfo[];
} {
  const explicit = new Set(
    (Array.isArray(tutor.badges) ? tutor.badges : []).map(b => b.trim().toLowerCase())
  );

  const isGoldVerified = isTutorVerified(tutor) || explicit.has('verified');
  const reviewCount = Math.max(tutor.reviewCount || 0, tutor.reviews?.length || 0);
  const isTopRated =
    (tutor.rating >= 4.7 && reviewCount >= 3) || explicit.has('top rated');
  const isSuperTutor =
    (isGoldVerified && tutor.rating >= 4.8 && (tutor.completedTuitionsCount || 0) >= 3) ||
    explicit.has('super tutor');

  const badges: TutorBadgeInfo[] = [];

  if (isGoldVerified) {
    badges.push({
      id: 'verified',
      kind: 'verified',
      title: 'Verified Tutor',
      titleBn: 'ভেরিফাইড টিউটর',
      description: 'Identity (NID) and University Student ID reviewed and approved by admin.',
      descriptionBn: 'জাতীয় পরিচয়পত্র এবং বিশ্ববিদ্যালয় আইডি কার্ড অ্যাডমিন দ্বারা যাচাইকৃত।',
      tone: 'gold'
    });
  } else {
    if (tutor.verification?.institution?.status === 'verified' || explicit.has('university verified')) {
      badges.push({
        id: 'institution',
        kind: 'institution',
        title: 'University Verified',
        titleBn: 'বিশ্ববিদ্যালয় ভেরিফাইড',
        description: 'University Student ID verified with academic institution records.',
        descriptionBn: 'বিশ্ববিদ্যালয়ের শিক্ষার্থী আইডি যাচাইকৃত।',
        tone: 'sky'
      });
    }
    if (tutor.verification?.identity?.status === 'verified' || explicit.has('identity verified')) {
      badges.push({
        id: 'identity',
        kind: 'identity',
        title: 'Identity Verified',
        titleBn: 'পরিচয় যাচাইকৃত',
        description: 'National ID card verified for guardian safety and trust.',
        descriptionBn: 'অভিভাবকদের নিরাপত্তার জন্য জাতীয় পরিচয়পত্র যাচাইকৃত।',
        tone: 'emerald'
      });
    }
  }

  if (tutor.verification?.qualification?.status === 'verified' || explicit.has('qualification verified')) {
    badges.push({
      id: 'qualification',
      kind: 'qualification',
      title: 'Qualification Verified',
      titleBn: 'যোগ্যতা সনদ যাচাইকৃত',
      description: 'Academic transcripts or teaching certificates verified.',
      descriptionBn: 'একাডেমিক সনদ ও যোগ্যতা যাচাইকৃত।',
      tone: 'sky'
    });
  }

  if (isTopRated) {
    badges.push({
      id: 'top-rated',
      kind: 'top-rated',
      title: 'Top Rated',
      titleBn: 'টপ রেটেড',
      description: `Maintains a ${tutor.rating.toFixed(1)}★ rating across verified student and guardian reviews.`,
      descriptionBn: `অভিভাবক ও শিক্ষার্থীদের রিভিউতে ${tutor.rating.toFixed(1)}★ রেটিং অর্জন।`,
      tone: 'coral'
    });
  }

  if (isSuperTutor) {
    badges.push({
      id: 'super-tutor',
      kind: 'super-tutor',
      title: 'Super Tutor',
      titleBn: 'সুপার টিউটর',
      description: 'Elite verified mentor with consistently top ratings and multiple completed tuitions.',
      descriptionBn: 'সফলভাবে সম্পন্ন একাধিক টিউশন ও সর্বোচ্চ রেটিংপ্রাপ্ত বিশেষজ্ঞ টিউটর।',
      tone: 'violet'
    });
  }

  // Append any remaining custom badges set in Firestore
  const handledLabels = new Set([
    'verified',
    'verified tutor',
    'identity verified',
    'university verified',
    'qualification verified',
    'top rated',
    'super tutor'
  ]);

  if (Array.isArray(tutor.badges)) {
    tutor.badges.forEach((rawLabel, idx) => {
      const label = rawLabel.trim();
      if (!label || handledLabels.has(label.toLowerCase())) return;
      handledLabels.add(label.toLowerCase());
      badges.push({
        id: `custom-${idx}-${label.toLowerCase().replace(/\s+/g, '-')}`,
        kind: 'custom',
        title: label,
        titleBn: label,
        description: 'Platform recognition awarded for tutor excellence.',
        descriptionBn: 'টিউশন দক্ষতার জন্য প্ল্যাটফর্ম স্বীকৃতি।',
        tone: 'violet'
      });
    });
  }

  return {
    isGoldVerified,
    isTopRated,
    isSuperTutor,
    badges
  };
}
