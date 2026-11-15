import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Loader2,
  MessageSquarePlus,
  Star,
  Trash2,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Review, TutorProfile } from '../../types';

interface TutorReviewsSectionProps {
  tutor: TutorProfile;
  compact?: boolean;
}

const RATING_LABELS_EN: Record<number, string> = {
  1: 'Needs improvement',
  2: 'Fair experience',
  3: 'Good tutor',
  4: 'Very good teaching',
  5: 'Excellent mentor'
};

const RATING_LABELS_BN: Record<number, string> = {
  1: 'উন্নতি প্রয়োজন',
  2: 'মোটামুটি',
  3: 'ভালো পড়ান',
  4: 'খুব ভালো শিক্ষণ',
  5: 'অসাধারণ মেন্টর'
};

export const TutorReviewsSection: React.FC<TutorReviewsSectionProps> = ({
  tutor,
  compact = false
}) => {
  const {
    language,
    currentUser,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    loadTutorReviews,
    submitTutorReview,
    deleteTutorReview
  } = useApp();

  const isBn = language === 'bn';
  const reviews: Review[] = useMemo(() => tutor.reviews || [], [tutor.reviews]);

  const isOwnProfile = Boolean(
    isAuthenticated &&
      (currentUser.id === tutor.id || (tutor.uid && currentUser.id === tutor.uid))
  );

  const myExistingReview = useMemo(() => {
    if (!isAuthenticated) return undefined;
    return reviews.find(r => r.learnerId === currentUser.id || r.id === currentUser.id);
  }, [isAuthenticated, reviews, currentUser.id]);

  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [learnerRole, setLearnerRole] = useState<string>(
    currentUser.learnerSubtype === 'student' ? 'Student' : 'Guardian'
  );
  const [classGrade, setClassGrade] = useState<string>(tutor.classes?.[0] || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(tutor.subjects?.[0] || '');
  const [comment, setComment] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [starFilter, setStarFilter] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setStarFilter(null);
    setConfirmDelete(false);
    setFormError('');

    if (!tutor.isSample) {
      setIsLoadingReviews(true);
      loadTutorReviews(tutor.id)
        .catch(() => {
          // Non-blocking fallback
        })
        .finally(() => {
          if (active) setIsLoadingReviews(false);
        });
    } else {
      setIsLoadingReviews(false);
    }

    return () => {
      active = false;
    };
  }, [tutor.id, tutor.isSample]);

  // Sync form state when switching tutor or opening editor
  useEffect(() => {
    if (myExistingReview) {
      setRating(myExistingReview.rating);
      setLearnerRole(myExistingReview.learnerRole || 'Student / Guardian');
      setClassGrade(myExistingReview.classGrade || tutor.classes?.[0] || '');
      setSelectedSubject(myExistingReview.subjects?.[0] || tutor.subjects?.[0] || '');
      setComment(myExistingReview.comment || '');
      setIsComposerOpen(false);
    } else {
      setRating(0);
      setLearnerRole(currentUser.learnerSubtype === 'student' ? 'Student' : 'Guardian');
      setClassGrade(tutor.classes?.[0] || '');
      setSelectedSubject(tutor.subjects?.[0] || '');
      setComment('');
      setIsComposerOpen(false);
    }
    setHoverRating(0);
    setFormError('');
    setConfirmDelete(false);
  }, [tutor.id, myExistingReview?.id, myExistingReview?.updatedAt, currentUser.learnerSubtype]);

  // Compute star distribution from written reviews
  const distribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rounded = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      count: counts[star],
      percent: reviews.length > 0 ? Math.round((counts[star] / total) * 100) : 0
    }));
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!starFilter) return reviews;
    return reviews.filter(r => Math.round(Number(r.rating) || 0) === starFilter);
  }, [reviews, starFilter]);

  const displayRating =
    tutor.rating > 0
      ? tutor.rating
      : reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;
  const displayReviewCount = Math.max(tutor.reviewCount || 0, reviews.length);

  const activeStarValue = hoverRating || rating;
  const activeRatingLabel = activeStarValue
    ? (isBn ? RATING_LABELS_BN[activeStarValue] : RATING_LABELS_EN[activeStarValue])
    : isBn
    ? 'রেটিং দিতে তারায় ক্লিক করুন'
    : 'Select 1 to 5 stars';

  const handleOpenComposer = () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    if (myExistingReview) {
      setRating(myExistingReview.rating);
      setLearnerRole(myExistingReview.learnerRole || 'Student / Guardian');
      setClassGrade(myExistingReview.classGrade || tutor.classes?.[0] || '');
      setSelectedSubject(myExistingReview.subjects?.[0] || tutor.subjects?.[0] || '');
      setComment(myExistingReview.comment || '');
    } else if (rating === 0) {
      setRating(5);
    }
    setFormError('');
    setIsComposerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (rating < 1 || rating > 5) {
      setFormError(isBn ? 'অনুগ্রহ করে ১ থেকে ৫ এর মধ্যে স্টার রেটিং দিন।' : 'Please choose a star rating from 1 to 5.');
      return;
    }
    const trimmed = comment.trim();
    if (trimmed.length < 10) {
      setFormError(
        isBn
          ? 'অনুগ্রহ করে অন্তত ১০ অক্ষরের একটি স্পষ্ট মতামত লিখুন।'
          : 'Please write at least 10 characters sharing your learning experience.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await submitTutorReview(tutor.id, {
        rating,
        comment: trimmed,
        classGrade: classGrade.trim() || 'General',
        subjects: selectedSubject ? [selectedSubject] : tutor.subjects?.slice(0, 1) || [],
        learnerRole: learnerRole.trim() || 'Student / Guardian'
      });
      setIsComposerOpen(false);
    } catch {
      // Toast handled in AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTutorReview(tutor.id);
      setConfirmDelete(false);
      setIsComposerOpen(false);
      setRating(0);
      setComment('');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      aria-labelledby="tutor-reviews-heading"
      className={compact ? 'pt-4 space-y-4' : 'ivory-card p-5 sm:p-6 space-y-5'}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="tutor-reviews-heading"
            className={`font-display font-bold text-[#252525] ${
              compact ? 'text-base' : 'text-lg'
            }`}
          >
            {isBn ? 'শিক্ষার্থী ও অভিভাবকদের রিভিউ' : 'Student & Guardian Reviews'}
          </h2>
          <p className="text-xs text-[#858585] mt-0.5 tabular-nums">
            {displayReviewCount > 0
              ? isBn
                ? `মোট ${displayReviewCount}টি রেটিং`
                : `${displayReviewCount} verified ${displayReviewCount === 1 ? 'rating' : 'ratings'}`
              : isBn
              ? 'প্রথম শিক্ষার্থী হিসেবে মতামত দিন'
              : 'Be the first student or guardian to review this tutor'}
          </p>
        </div>

        {!isOwnProfile && !isComposerOpen && (
          <button
            type="button"
            onClick={handleOpenComposer}
            className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            {myExistingReview ? (
              <>
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span>{isBn ? 'রিভিউ সম্পাদনা' : 'Edit Your Review'}</span>
              </>
            ) : (
              <>
                <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" />
                <span>{isBn ? 'রিভিউ ও রেটিং দিন' : 'Write a Review'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Rating Summary & Star Breakdown */}
      <div
        className={`rounded-2xl bg-[#FFF3EF] border border-[#F1E1DC] ${
          compact ? 'p-3.5' : 'p-4 sm:p-5'
        }`}
      >
        <div
          className={`grid gap-4 items-center ${
            compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-[170px_1fr]'
          }`}
        >
          {/* Aggregate Numeric Score */}
          <div className="flex sm:flex-col items-center sm:items-start justify-between gap-2 sm:border-r sm:border-[#F1E1DC] sm:pr-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#252525] tabular-nums leading-none">
                  {displayRating > 0 ? displayRating.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs font-semibold text-[#858585]">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 mt-2" aria-label={`Rated ${displayRating.toFixed(1)} out of 5`}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(displayRating)
                        ? 'text-[#F5A04E] fill-[#F5A04E]'
                        : 'text-[#D8CCC8] fill-[#F1E1DC]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs font-medium text-[#858585] tabular-nums">
              {displayReviewCount}{' '}
              {displayReviewCount === 1
                ? isBn
                  ? 'টি রিভিউ'
                  : 'review'
                : isBn
                ? 'টি রিভিউ'
                : 'reviews'}
            </div>
          </div>

          {/* Clickable Star Distribution Bars */}
          <div className="space-y-1.5">
            {distribution.map(row => {
              const isSelected = starFilter === row.star;
              return (
                <button
                  key={row.star}
                  type="button"
                  onClick={() => setStarFilter(prev => (prev === row.star ? null : row.star))}
                  className={`w-full flex items-center gap-2.5 text-xs py-0.5 px-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#FFE2D9]/80 font-bold' : 'hover:bg-white/60'
                  }`}
                  title={`Filter ${row.star}-star reviews`}
                >
                  <span className="w-8 flex items-center gap-0.5 font-mono font-semibold text-[#252525] tabular-nums shrink-0">
                    <span>{row.star}</span>
                    <Star className="w-3 h-3 text-[#F5A04E] fill-[#F5A04E]" />
                  </span>
                  <span className="flex-1 h-2 rounded-full bg-[#F1E1DC] overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-[#F5A04E] transition-all duration-300"
                      style={{ width: `${row.percent}%` }}
                    />
                  </span>
                  <span className="w-8 text-right font-mono text-[#858585] tabular-nums shrink-0">
                    {row.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Own-Profile Info Notice */}
      {isOwnProfile && (
        <div className="p-3.5 rounded-2xl bg-[#DCEBFA]/60 border border-[#C7DDF6] text-xs text-[#252525] flex items-start gap-2.5">
          <UserCheck className="w-4 h-4 text-[#252525] shrink-0 mt-0.5" />
          <span>
            {isBn
              ? 'এটি আপনার টিউটর প্রোফাইলের পাবলিক রিভিউ সেকশন। শিক্ষার্থীরা ও অভিভাবকরা এখানে আপনার শিক্ষণ সম্পর্কে রেটিং দিতে পারবেন।'
              : 'This is your public feedback section. Verified students and guardians can leave star ratings and feedback after studying with you.'}
          </span>
        </div>
      )}

      {/* Interactive Review & Star Rating Form */}
      {isComposerOpen && !isOwnProfile && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white border border-[#F47C68]/50 shadow-2xs p-4 sm:p-5 space-y-4 animate-fade-up"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#252525]">
                {myExistingReview
                  ? isBn
                    ? 'আপনার রিভিউ আপডেট করুন'
                    : 'Update Your Review'
                  : isBn
                  ? `${tutor.name}-কে রেটিং দিন`
                  : `Rate & Review ${tutor.name}`}
              </h3>
              <p className="text-xs text-[#858585] mt-0.5">
                {isBn
                  ? 'আপনার সৎ অভিজ্ঞতা অন্যান্য অভিভাবক ও শিক্ষার্থীদের সঠিক টিউটর খুঁজে পেতে সাহায্য করবে।'
                  : 'Your honest feedback helps other students and guardians choose the right tutor.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="text-xs font-semibold text-[#858585] hover:text-[#252525] cursor-pointer px-2 py-1"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
          </div>

          {/* Interactive Star Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#252525]">
              {isBn ? 'আপনার স্টার রেটিং *' : 'Your Star Rating *'}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="radiogroup"
                aria-label="Star rating"
                className="inline-flex items-center gap-1 bg-[#FFF3EF] px-3 py-2 rounded-xl border border-[#F1E1DC]"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map(starValue => {
                  const filled = starValue <= activeStarValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      role="radio"
                      aria-checked={rating === starValue}
                      aria-label={`${starValue} ${starValue === 1 ? 'star' : 'stars'}`}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onClick={() => {
                        setRating(starValue);
                        if (formError) setFormError('');
                      }}
                      className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C68] cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          filled
                            ? 'text-[#F5A04E] fill-[#F5A04E]'
                            : 'text-[#D0C4C0] fill-transparent hover:text-[#F5A04E]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-semibold text-[#C94A35]">
                {activeStarValue > 0 ? `${activeStarValue}.0 · ` : ''}
                {activeRatingLabel}
              </span>
            </div>
          </div>

          {/* Context Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                {isBn ? 'আপনার পরিচয়' : 'Reviewing as'}
              </label>
              <select
                value={learnerRole}
                onChange={e => setLearnerRole(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#F1E1DC] bg-[#FFF3EF]/50 text-xs font-medium text-[#252525] focus:outline-none focus:border-[#F47C68]"
              >
                <option value="Student">Student</option>
                <option value="Guardian">Guardian / Parent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                {isBn ? 'শ্রেণি / লেভেল' : 'Class / Level'}
              </label>
              <input
                type="text"
                maxLength={64}
                value={classGrade}
                onChange={e => setClassGrade(e.target.value)}
                placeholder="e.g. Class 11 - 12 (HSC)"
                className="w-full h-10 px-3 rounded-xl border border-[#F1E1DC] bg-[#FFF3EF]/50 text-xs text-[#252525] focus:outline-none focus:border-[#F47C68]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                {isBn ? 'বিষয়' : 'Subject Studied'}
              </label>
              {tutor.subjects && tutor.subjects.length > 0 ? (
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#F1E1DC] bg-[#FFF3EF]/50 text-xs font-medium text-[#252525] focus:outline-none focus:border-[#F47C68]"
                >
                  {tutor.subjects.map(subj => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                  <option value="General Mentoring">General Mentoring</option>
                </select>
              ) : (
                <input
                  type="text"
                  maxLength={64}
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  placeholder="e.g. Physics"
                  className="w-full h-10 px-3 rounded-xl border border-[#F1E1DC] bg-[#FFF3EF]/50 text-xs text-[#252525] focus:outline-none focus:border-[#F47C68]"
                />
              )}
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={`review-comment-${tutor.id}`} className="text-xs font-semibold text-[#252525]">
                {isBn ? 'আপনার মতামত *' : 'Written Feedback *'}
              </label>
              <span className="text-[11px] font-mono text-[#858585] tabular-nums">
                {comment.length} / 600
              </span>
            </div>
            <textarea
              id={`review-comment-${tutor.id}`}
              rows={compact ? 3 : 4}
              maxLength={600}
              value={comment}
              onChange={e => {
                setComment(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder={
                isBn
                  ? 'টিউটরের বোঝানোর ধরন, সময়ানুবর্তিতা এবং ফলাফলের উন্নতি সম্পর্কে লিখুন...'
                  : 'Share how clearly the tutor explains topics, punctuality, and study progress...'
              }
              className="w-full p-3 rounded-xl border border-[#F1E1DC] bg-[#FFF3EF]/40 text-sm text-[#252525] leading-relaxed focus:outline-none focus:border-[#F47C68] resize-none"
            />
            {formError && (
              <p className="text-xs font-medium text-[#C94A35] mt-1.5">{formError}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {myExistingReview ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#C94A35] font-semibold">
                    {isBn ? 'নিশ্চিত মুছবেন?' : 'Delete your review?'}
                  </span>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="h-8 px-3 rounded-full bg-[#C94A35] text-white text-xs font-semibold cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="h-8 px-2.5 text-xs text-[#858585] hover:text-[#252525] cursor-pointer"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#858585] hover:text-[#C94A35] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'রিভিউ মুছুন' : 'Delete review'}</span>
                </button>
              )
            ) : (
              <span className="text-[11px] text-[#858585]">
                {isBn
                  ? 'ভেরিফায়েড গুগল অ্যাকাউন্ট থেকে প্রকাশিত হবে।'
                  : 'Published under your verified FeLoW WebStaR account.'}
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] disabled:opacity-60 text-[#252525] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {myExistingReview
                      ? isBn
                        ? 'আপডেট সেভ করুন'
                        : 'Save Changes'
                      : isBn
                      ? 'রিভিউ পোস্ট করুন'
                      : 'Submit Review'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Active Star Filter Chip */}
      {starFilter !== null && (
        <div className="flex items-center justify-between text-xs bg-[#FFF3EF] px-3 py-2 rounded-xl border border-[#F1E1DC]">
          <span className="text-[#252525] font-medium">
            Showing {starFilter}-star reviews ({filteredReviews.length})
          </span>
          <button
            type="button"
            onClick={() => setStarFilter(null)}
            className="font-semibold text-[#C94A35] hover:underline cursor-pointer"
          >
            Show all
          </button>
        </div>
      )}

      {/* Reviews Feed */}
      {isLoadingReviews ? (
        <div className="space-y-3">
          {[1, 2].map(idx => (
            <div key={idx} className="p-4 rounded-2xl bg-[#FFF3EF]/60 animate-pulse space-y-2">
              <div className="h-4 w-36 bg-[#F1E1DC] rounded" />
              <div className="h-3 w-full bg-[#F1E1DC] rounded" />
              <div className="h-3 w-2/3 bg-[#F1E1DC] rounded" />
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-5 rounded-2xl bg-[#FFF3EF]/60 border border-[#F1E1DC] text-center space-y-2">
          <p className="text-sm text-[#858585]">
            {starFilter
              ? `No ${starFilter}-star written reviews yet.`
              : isBn
              ? 'এখনো কোনো লিখিত রিভিউ নেই।'
              : 'No written reviews yet. Have you taken a class with this tutor?'}
          </p>
          {starFilter ? (
            <button
              type="button"
              onClick={() => setStarFilter(null)}
              className="text-xs font-semibold text-[#C94A35] hover:underline cursor-pointer"
            >
              View all reviews
            </button>
          ) : (
            !isOwnProfile &&
            !isComposerOpen && (
              <button
                type="button"
                onClick={handleOpenComposer}
                className="text-xs font-bold text-[#C94A35] hover:underline cursor-pointer"
              >
                {isAuthenticated ? 'Write the first review →' : 'Sign in to leave a review →'}
              </button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map(rev => {
            const isMine = isAuthenticated && (rev.learnerId === currentUser.id || rev.id === currentUser.id);
            const initial = (rev.learnerName || 'S').trim().charAt(0).toUpperCase();
            return (
              <article
                key={rev.id}
                className={`p-4 rounded-2xl border space-y-2 transition-colors ${
                  isMine
                    ? 'bg-[#FFF3EF] border-[#F47C68]/50'
                    : 'bg-[#FFF3EF]/60 border-[#F1E1DC]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rev.learnerAvatar ? (
                      <img
                        src={rev.learnerAvatar}
                        alt={rev.learnerName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-[#F1E1DC] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#FFE2D9] text-[#C94A35] text-xs font-bold flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-[#252525] truncate">
                          {rev.learnerName}
                        </span>
                        {isMine && (
                          <span className="text-[11px] font-semibold text-[#C94A35]">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#858585] truncate">
                        {[
                          rev.learnerRole,
                          rev.classGrade,
                          rev.subjects && rev.subjects.length > 0 ? rev.subjects.join(', ') : '',
                          rev.date
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" aria-label={`${rev.rating} out of 5 stars`}>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(rev.rating)
                              ? 'text-[#F5A04E] fill-[#F5A04E]'
                              : 'text-[#D8CCC8] fill-[#F1E1DC]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono font-bold text-[#252525] tabular-nums ml-1">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                <p className="text-sm text-[#252525] leading-relaxed">{rev.comment}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
