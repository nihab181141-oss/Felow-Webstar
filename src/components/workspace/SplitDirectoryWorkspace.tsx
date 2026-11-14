import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  Briefcase,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BD_DISTRICTS_BY_DIVISION, POPULAR_SUBJECTS } from '../../data/bangladeshData';
import {
  TutorProfile,
  TutorPrivateContact,
  TuitionPost,
  isTutorVerified,
  DEFAULT_PLACEHOLDER_AVATAR
} from '../../types';
import {
  buildWhatsAppUrl,
  launchWhatsAppUrl,
  sanitizeFacebookUrl,
  DEFAULT_TUTOR_WHATSAPP_MESSAGE
} from '../../utils/contactLinks';

const ALL_DISTRICTS = Array.from(new Set(Object.values(BD_DISTRICTS_BY_DIVISION).flat())).sort();

interface TutorCardItemProps {
  tutor: TutorProfile;
  index: number;
  isSelected: boolean;
  isSaved: boolean;
  openingWa: boolean;
  onPreview: (tutor: TutorProfile) => void;
  onOpenFullProfile: (tutor: TutorProfile) => void;
  onToggleSave: (tutorId: string) => void;
  onWhatsApp: (tutor: TutorProfile, e: React.MouseEvent) => void;
}

const TutorCardItem = memo<TutorCardItemProps>(({
  tutor,
  index,
  isSelected,
  isSaved,
  openingWa,
  onPreview,
  onOpenFullProfile,
  onToggleSave,
  onWhatsApp
}) => {
  const verified = isTutorVerified(tutor);
  const extraAreas = Math.max(0, tutor.preferredAreas.length - 3);

  const handleCardClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
      onPreview(tutor);
    } else {
      onOpenFullProfile(tutor);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`ivory-card ivory-card-hover p-4 sm:p-5 cursor-pointer space-y-4 ${
        isSelected
          ? 'xl:border-[#F47C68] xl:ring-1 xl:ring-[#F47C68] xl:bg-[#DCEBFA]/20'
          : ''
      }`}
    >
      {/* Top Identity Row */}
      <div className="flex items-start gap-3.5 sm:gap-4">
        <img
          src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
          alt={tutor.name}
          referrerPolicy="no-referrer"
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
          className="w-20 h-24 sm:w-28 sm:h-32 rounded-2xl object-cover object-top border border-[#F1E1DC] shrink-0 bg-[#FFF3EF]"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#252525] leading-snug break-words">
                  {tutor.name}
                </h3>
                {verified && (
                  <BadgeCheck
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#F47C68] shrink-0"
                    aria-label="Verified Tutor"
                  />
                )}
              </div>
              <p className="text-xs sm:text-[13px] font-semibold text-[#C94A35] leading-snug break-words mt-0.5">
                {tutor.university || 'University Tutor'}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(tutor.id);
              }}
              aria-label={isSaved ? 'Remove saved tutor' : 'Save tutor'}
              className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFF3EF] cursor-pointer shrink-0 transition-colors ${
                isSaved ? 'text-[#C94A35] bg-[#FFF3EF]' : 'text-[#858585]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#F47C68]' : ''}`} />
            </button>
          </div>

          <div className="text-xs text-[#252525] leading-relaxed break-words">
            {[
              tutor.department,
              tutor.academicYear,
              tutor.gpa ? `CGPA ${tutor.gpa}` : ''
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>

          {(tutor.collegeName || tutor.hscGpa || tutor.sscGpa) && (
            <div className="text-xs text-[#858585] leading-relaxed break-words">
              {[
                tutor.collegeName,
                tutor.hscGpa ? `HSC ${tutor.hscGpa}` : '',
                tutor.sscGpa ? `SSC ${tutor.sscGpa}` : ''
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}

          <div className="pt-0.5 flex items-start gap-1.5 text-xs text-[#252525] font-medium leading-snug">
            <MapPin className="w-3.5 h-3.5 text-[#F47C68] shrink-0 mt-0.5" />
            <span className="break-words">
              {tutor.preferredAreas.slice(0, 3).join(', ') || tutor.district}
              {extraAreas > 0 ? ` (+${extraAreas})` : ''}, {tutor.district}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#858585] tabular-nums">
            {tutor.rating > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#252525]">
                <Star className="w-3.5 h-3.5 text-[#F5A04E] fill-[#F5A04E] shrink-0" />
                <span>{tutor.rating.toFixed(1)}</span>
                <span className="text-[#858585] font-normal">({tutor.reviewCount})</span>
              </span>
            )}
            {tutor.rating > 0 && <span aria-hidden="true">·</span>}
            <span>
              {tutor.experienceYears > 0 ? `${tutor.experienceYears} yrs exp` : 'New Tutor'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#15803D]">{tutor.availability}</span>
          </div>
        </div>
      </div>

      {/* Headline & Bio Summary */}
      {(tutor.headline || tutor.bio) && (
        <div className="border-t border-[#F1E1DC] pt-3 space-y-1">
          {tutor.headline && (
            <p className="text-xs sm:text-[13px] font-semibold text-[#252525] leading-snug break-words">
              {tutor.headline}
            </p>
          )}
          {tutor.bio && (
            <p className="text-xs text-[#858585] leading-relaxed line-clamp-2 break-words">
              {tutor.bio}
            </p>
          )}
        </div>
      )}

      {/* Teaching Spec Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFF3EF] rounded-2xl p-3.5 text-xs">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-[#858585]">Subjects</div>
          <div className="font-semibold text-[#252525] mt-0.5 leading-snug break-words">
            {tutor.subjects.slice(0, 4).join(', ')}
            {tutor.subjects.length > 4 ? ` +${tutor.subjects.length - 4} more` : ''}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-[#858585]">Classes & Levels</div>
          <div className="font-semibold text-[#252525] mt-0.5 leading-snug break-words">
            {tutor.classes.slice(0, 3).join(', ')}
            {tutor.classes.length > 3 ? ` +${tutor.classes.length - 3} more` : ''}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-[#858585]">Medium & Mode</div>
          <div className="text-[#252525] mt-0.5 leading-snug break-words">
            {tutor.mediums.join(', ')} · {tutor.tuitionTypes.join(', ')}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-[#858585]">
            {tutor.achievements && tutor.achievements.length > 0
              ? 'Highlights'
              : 'Schedule & Gender'}
          </div>
          <div className="text-[#252525] mt-0.5 leading-snug break-words">
            {tutor.achievements && tutor.achievements.length > 0
              ? tutor.achievements.slice(0, 2).join(' · ')
              : `${tutor.daysPerWeek.join('–')} days/wk · ${tutor.gender} Tutor`}
          </div>
        </div>
      </div>

      {/* Footer: Salary Range + Smooth Rounded-Full Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="font-mono text-sm sm:text-base font-bold text-[#252525] tabular-nums">
            ৳{tutor.expectedSalaryMin.toLocaleString()}–
            {tutor.expectedSalaryMax.toLocaleString()}
            <span className="text-xs font-sans font-normal text-[#858585]"> /month</span>
          </div>
          {tutor.completedTuitionsCount > 0 && (
            <div className="text-[11px] text-[#858585] tabular-nums">
              {tutor.completedTuitionsCount} tuitions completed · {tutor.gender} Tutor
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFullProfile(tutor);
            }}
            className="h-10 px-4 rounded-full bg-[#DCEBFA]/70 hover:bg-[#DCEBFA] text-[#252525] text-xs font-semibold flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            View Full Profile
          </button>

          <button
            type="button"
            disabled={openingWa}
            onClick={(e) => onWhatsApp(tutor, e)}
            className="h-10 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>{openingWa ? '...' : 'WhatsApp'}</span>
          </button>
        </div>
      </div>
    </article>
  );
});

TutorCardItem.displayName = 'TutorCardItem';

interface TuitionCardItemProps {
  post: TuitionPost;
  isSelected: boolean;
  isSaved: boolean;
  alreadyApplied: boolean;
  isOwn: boolean;
  onPreview: (post: TuitionPost) => void;
  onOpenFullDetail: (post: TuitionPost) => void;
  onToggleSave: (postId: string) => void;
  onApply: (post: TuitionPost, e: React.MouseEvent) => void;
}

const TuitionCardItem = memo<TuitionCardItemProps>(({
  post,
  isSelected,
  isSaved,
  alreadyApplied,
  isOwn,
  onPreview,
  onOpenFullDetail,
  onToggleSave,
  onApply
}) => {
  const initials = (post.learnerName || 'G')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleCardClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
      onPreview(post);
    } else {
      onOpenFullDetail(post);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`ivory-card ivory-card-hover p-4 cursor-pointer space-y-3 ${
        isSelected
          ? 'xl:border-[#F47C68] xl:ring-1 xl:ring-[#F47C68] xl:bg-[#DCEBFA]/20'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[#DCEBFA] text-[#252525] font-bold text-xs flex items-center justify-center shrink-0">
          {initials}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-sm sm:text-base font-bold text-[#252525] leading-snug break-words">
              {post.title}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(post.id);
              }}
              aria-label={isSaved ? 'Unsave post' : 'Save post'}
              className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFF3EF] cursor-pointer shrink-0 transition-colors ${
                isSaved ? 'text-[#C94A35] bg-[#FFF3EF]' : 'text-[#858585]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#F47C68]' : ''}`} />
            </button>
          </div>

          <div className="text-xs text-[#858585] leading-relaxed break-words">
            <span className="font-semibold text-[#252525]">{post.learnerName}</span>
            <span> · {post.area}, {post.district}</span>
            <span> · {post.postedDate}</span>
          </div>

          <div className="text-xs text-[#252525] leading-snug break-words">
            <span className="font-semibold">{post.classGrade}</span>
            <span className="text-[#858585]"> · {post.subjects.join(', ')}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
            <div className="text-xs text-[#858585] tabular-nums">
              <span className="font-mono text-sm font-bold text-[#252525]">
                ৳{post.salaryOfferBDT.toLocaleString()}/mo
              </span>
              <span> · {post.daysPerWeek} days/wk · {post.tuitionType}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFullDetail(post);
                }}
                className="h-9 px-3.5 rounded-full bg-[#DCEBFA]/70 hover:bg-[#DCEBFA] text-[#252525] text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
              >
                Details
              </button>

              {isOwn ? (
                <span className="text-xs font-semibold text-[#C94A35] whitespace-nowrap tabular-nums px-2">
                  {post.totalApplicants} applicants
                </span>
              ) : alreadyApplied ? (
                <span className="text-xs font-semibold text-[#15803D] whitespace-nowrap px-2">
                  Applied
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => onApply(post, e)}
                  className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold cursor-pointer whitespace-nowrap transition-all active:scale-[0.98]"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

TuitionCardItem.displayName = 'TuitionCardItem';

export const SplitDirectoryWorkspace: React.FC = () => {
  const {
    tutors,
    tuitionPosts,
    applications,
    directoryTab,
    setDirectoryTab,
    districtFilter,
    setDistrictFilter,
    searchQuery,
    setSearchQuery,
    selectedTutor,
    setSelectedTutor,
    selectedTuition,
    setSelectedTuition,
    viewTutorDetail,
    viewTuitionDetail,
    savedTutorIds,
    toggleSaveTutor,
    savedTuitionIds,
    toggleSaveTuition,
    canViewTutorWhatsApp,
    canViewLearnerWhatsApp,
    getTutorContactInfo,
    getTuitionPrivateContact,
    hasAppliedToPost,
    getUserApplicationForPost,
    withdrawApplication,
    updateApplicationStatus,
    sendInvitation,
    setIsApplyModalOpen,
    openEditTuitionModal,
    deleteTuitionPost,
    openCreateTuitionModal,
    currentUser,
    currentRole,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    activateDualRole,
    submitReport,
    showToast,
    language
  } = useApp();

  const [subjectFilter, setSubjectFilter] = useState('All');
  const [openingWaId, setOpeningWaId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'about' | 'reviews'>('about');
  const [privateContact, setPrivateContact] = useState<TutorPrivateContact | null>(null);
  const [activeTuitionPrivateWa, setActiveTuitionPrivateWa] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Invite modal state for invite-gated tutors
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [inviteClass, setInviteClass] = useState('');
  const [inviteSubject, setInviteSubject] = useState('');
  const [inviteOfferBDT, setInviteOfferBDT] = useState(8000);
  const [inviteMessage, setInviteMessage] = useState('');

  const q = searchQuery.trim().toLowerCase();

  const filteredTutors = useMemo(() => {
    return tutors.filter(tutor => {
      if (tutor.isPublished === false || tutor.profileVisibility === 'hidden') return false;
      if (districtFilter !== 'All' && tutor.district !== districtFilter) return false;
      if (subjectFilter !== 'All' && !tutor.subjects.includes(subjectFilter)) return false;
      if (q) {
        const hay = [
          tutor.name,
          tutor.university,
          tutor.department,
          tutor.district,
          ...tutor.preferredAreas,
          ...tutor.subjects,
          ...tutor.classes
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tutors, districtFilter, subjectFilter, q]);

  const filteredTuitions = useMemo(() => {
    return tuitionPosts.filter(post => {
      if (post.status !== 'open') return false;
      if (districtFilter !== 'All' && post.district !== districtFilter) return false;
      if (subjectFilter !== 'All' && !post.subjects.includes(subjectFilter)) return false;
      if (q) {
        const hay = [
          post.title,
          post.learnerName,
          post.classGrade,
          post.district,
          post.area,
          ...post.subjects
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tuitionPosts, districtFilter, subjectFilter, q]);

  useEffect(() => {
    setVisibleCount(10);
  }, [directoryTab, districtFilter, subjectFilter, q]);

  const activeFeedLength =
    directoryTab === 'tutors' ? filteredTutors.length : filteredTuitions.length;
  const visibleTutors = useMemo(
    () => filteredTutors.slice(0, visibleCount),
    [filteredTutors, visibleCount]
  );
  const visibleTuitions = useMemo(
    () => filteredTuitions.slice(0, visibleCount),
    [filteredTuitions, visibleCount]
  );
  const hasMoreItems = visibleCount < activeFeedLength;

  useEffect(() => {
    if (!hasMoreItems) return;
    const node = loadMoreRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev => Math.min(activeFeedLength, prev + 10));
        }
      },
      { rootMargin: '450px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreItems, activeFeedLength, visibleCount]);

  const activeTutor: TutorProfile | null = useMemo(() => {
    if (selectedTutor && filteredTutors.some(t => t.id === selectedTutor.id)) {
      return filteredTutors.find(t => t.id === selectedTutor.id) || selectedTutor;
    }
    return filteredTutors[0] || null;
  }, [selectedTutor, filteredTutors]);

  const activeTuition: TuitionPost | null = useMemo(() => {
    if (selectedTuition && filteredTuitions.some(p => p.id === selectedTuition.id)) {
      return filteredTuitions.find(p => p.id === selectedTuition.id) || selectedTuition;
    }
    return filteredTuitions[0] || null;
  }, [selectedTuition, filteredTuitions]);

  useEffect(() => {
    let active = true;
    setPrivateContact(null);
    if (!activeTutor) return;
    const canView = canViewTutorWhatsApp(activeTutor);
    if (
      isAuthenticated &&
      canView &&
      !activeTutor.isSample &&
      (!activeTutor.whatsappNumber || !activeTutor.facebookUrl)
    ) {
      getTutorContactInfo(activeTutor.uid || activeTutor.id).then(info => {
        if (active && info) setPrivateContact(info);
      });
    }
    return () => {
      active = false;
    };
  }, [
    activeTutor?.id,
    activeTutor?.uid,
    activeTutor?.isSample,
    activeTutor?.whatsappNumber,
    activeTutor?.facebookUrl,
    isAuthenticated,
    canViewTutorWhatsApp,
    getTutorContactInfo
  ]);

  const activeTuitionCanViewWa = activeTuition ? canViewLearnerWhatsApp(activeTuition.learnerId) : false;

  useEffect(() => {
    let active = true;
    setActiveTuitionPrivateWa('');
    if (
      !activeTuition ||
      !isAuthenticated ||
      !activeTuitionCanViewWa ||
      activeTuition.whatsappNumber ||
      activeTuition.isSample ||
      activeTuition.id.startsWith('post-')
    ) {
      return;
    }
    getTuitionPrivateContact(activeTuition.id).then(priv => {
      if (active && priv?.whatsappNumber) {
        setActiveTuitionPrivateWa(priv.whatsappNumber);
      }
    });
    return () => {
      active = false;
    };
  }, [
    activeTuition?.id,
    activeTuition?.whatsappNumber,
    activeTuition?.isSample,
    isAuthenticated,
    activeTuitionCanViewWa,
    getTuitionPrivateContact
  ]);

  const openMyPosts = tuitionPosts.filter(
    p => p.learnerId === currentUser.id && p.status === 'open'
  );

  const openInviteForTutor = (tutor: TutorProfile) => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    const defaultPost = openMyPosts[0];
    setSelectedPostId(defaultPost?.id || '');
    setInviteClass(defaultPost?.classGrade || tutor.classes[0] || 'Class 11 - 12 (HSC)');
    setInviteSubject(
      defaultPost?.subjects.join(', ') || tutor.subjects.slice(0, 2).join(', ') || 'Mathematics'
    );
    setInviteOfferBDT(defaultPost?.salaryOfferBDT || tutor.expectedSalaryMin || 8000);
    setInviteMessage('');
    setIsInviteOpen(true);
  };

  const openTutorWhatsApp = async (tutor: TutorProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Sign in with Google to message tutors on WhatsApp.', 'info');
      return;
    }

    if (!canViewTutorWhatsApp(tutor)) {
      setSelectedTutor(tutor);
      openInviteForTutor(tutor);
      showToast('Send a quick invite to unlock WhatsApp contact with this tutor.', 'info');
      return;
    }

    let phone =
      (activeTutor?.id === tutor.id
        ? privateContact?.normalizedWhatsappNumber || privateContact?.whatsappNumber
        : undefined) ||
      tutor.normalizedWhatsappNumber ||
      tutor.whatsappNumber ||
      tutor.phone;

    if (!phone && !tutor.isSample) {
      setOpeningWaId(tutor.id);
      try {
        const priv = await getTutorContactInfo(tutor.uid || tutor.id);
        phone = priv?.normalizedWhatsappNumber || priv?.whatsappNumber || '';
      } finally {
        setOpeningWaId(null);
      }
    }

    const url = buildWhatsAppUrl(
      phone,
      `${DEFAULT_TUTOR_WHATSAPP_MESSAGE} (Tutor: ${tutor.name})`
    );
    if (url) {
      const opened = launchWhatsAppUrl(url);
      if (!opened) {
        showToast('Could not open WhatsApp automatically. Please allow popups and try again.', 'info');
      }
    } else {
      viewTutorDetail(tutor);
      showToast('WhatsApp number is not available on this profile yet.', 'info');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTutor) return;
    await sendInvitation(
      activeTutor,
      inviteMessage.trim() ||
        `Hello ${activeTutor.name}, we would like to discuss tuition for ${inviteClass} (${inviteSubject}).`,
      Number(inviteOfferBDT),
      inviteClass,
      inviteSubject
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      selectedPostId || undefined,
      openMyPosts.find(p => p.id === selectedPostId)?.preferredTime || '3 days/week'
    );
    setIsInviteOpen(false);
    setInviteMessage('');
  };

  const hasFilters = districtFilter !== 'All' || subjectFilter !== 'All' || q.length > 0;

  const resetAllFilters = () => {
    setDistrictFilter('All');
    setSubjectFilter('All');
    setSearchQuery('');
  };

  const activeTutorVerified = activeTutor ? isTutorVerified(activeTutor) : false;
  const activeTutorSaved = activeTutor ? savedTutorIds.includes(activeTutor.id) : false;
  const activeTutorCanWa = activeTutor ? canViewTutorWhatsApp(activeTutor) : false;
  const activeTutorFb = sanitizeFacebookUrl(
    privateContact?.facebookUrl || activeTutor?.facebookUrl
  );

  const activeTuitionSaved = activeTuition ? savedTuitionIds.includes(activeTuition.id) : false;
  const activeTuitionOwn = activeTuition ? activeTuition.learnerId === currentUser.id : false;
  const activeTuitionApp = activeTuition ? getUserApplicationForPost(activeTuition.id) : undefined;
  const activeTuitionApps = activeTuition
    ? applications.filter(a => a.tuitionPostId === activeTuition.id && a.status !== 'withdrawn')
    : [];
  const activeTuitionResolvedPhone = activeTuition
    ? activeTuition.whatsappNumber || activeTuitionApp?.guardianWhatsApp || activeTuitionPrivateWa
    : '';
  const activeTuitionWa =
    activeTuition && activeTuitionCanViewWa && activeTuitionResolvedPhone
      ? buildWhatsAppUrl(
          activeTuitionResolvedPhone,
          `Assalamu Alaikum ${activeTuition.learnerName}, following up on "${activeTuition.title}" on Tutorly.`
        )
      : null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FFFFFF] py-5 px-3 sm:px-5 text-left">
      <div className="max-w-[1440px] mx-auto flex flex-col xl:flex-row gap-6 items-start">
        {/* MASTER LIST PANE */}
        <section className="w-full max-w-3xl mx-auto xl:mx-0 xl:w-[540px] 2xl:w-[600px] shrink-0 space-y-4">
          {/* Mobile Full-Width Search + District Filter */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center bg-[#FFF3EF] rounded-full border border-[#F3D5CC] focus-within:border-[#F47C68] focus-within:bg-white px-3.5 h-11 transition-colors">
              <Search className="w-4 h-4 text-[#858585] shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'টিউটর, বিষয় বা এলাকা খুঁজুন...'
                    : 'Search tutor, subject, area...'
                }
                className="flex-1 min-w-0 bg-transparent px-2.5 text-sm text-[#252525] placeholder:text-[#858585] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="w-7 h-7 rounded-full bg-[#FFE6DD] flex items-center justify-center text-[#252525] cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              aria-label="Filter by district"
              className="w-full h-10 px-4 rounded-full bg-[#FFF3EF] border border-[#F3D5CC] text-xs font-semibold text-[#252525] focus:border-[#F47C68] focus:outline-none"
            >
              <option value="All">All Districts in Bangladesh</option>
              {ALL_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Quiet Guest / Quick Action Strip */}
          {!isAuthenticated ? (
            <div className="ivory-card bg-[#FFF3EF]/55 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold text-[#252525]">
                  {language === 'bn' ? 'সরাসরি WhatsApp-এ যোগাযোগ করুন' : 'Connect directly on WhatsApp'}
                </div>
                <div className="text-xs text-[#858585] leading-snug">
                  {language === 'bn'
                    ? 'টিউটর পেজ খুলতে বা মেসেজ দিতে সাইন ইন করুন'
                    : 'Sign in with Google to message or post'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 transition-all"
              >
                {language === 'bn' ? 'সাইন ইন' : 'Sign In'}
              </button>
            </div>
          ) : currentRole !== 'tutor' && currentRole !== 'admin' ? (
            <div className="ivory-card bg-[#FFF3EF]/55 px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[#858585]">
                {language === 'bn' ? 'টিউটর হিসেবে পড়াতে চান?' : 'Teach students in your area?'}
              </span>
              <button
                type="button"
                onClick={() => activateDualRole('tutor')}
                className="text-xs font-bold text-[#C94A35] hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                {language === 'bn' ? 'টিউটর পেজ খুলুন →' : 'Create Tutor Page →'}
              </button>
            </div>
          ) : null}

          {/* Instant Tutors | Tuitions Segmented Switch + Subject Filter */}
          <div className="ivory-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 bg-[#FFF3EF] p-1 rounded-full self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDirectoryTab('tutors')}
                className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                  directoryTab === 'tutors'
                    ? 'bg-[#DCEBFA] text-[#252525] shadow-xs font-bold'
                    : 'text-[#858585] hover:text-[#252525]'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'bn' ? 'টিউটর' : 'Tutors'}</span>
                <span className="tabular-nums opacity-75">({filteredTutors.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDirectoryTab('tuitions')}
                className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                  directoryTab === 'tuitions'
                    ? 'bg-[#DCEBFA] text-[#252525] shadow-xs font-bold'
                    : 'text-[#858585] hover:text-[#252525]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'bn' ? 'টিউশন' : 'Tuitions'}</span>
                <span className="tabular-nums opacity-75">({filteredTuitions.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                aria-label="Filter by subject"
                className="flex-1 sm:flex-initial h-9 px-3.5 rounded-full bg-[#FFF3EF] text-xs font-semibold text-[#252525] border border-[#F3D5CC] focus:border-[#F47C68] focus:outline-none cursor-pointer sm:max-w-[200px]"
              >
                <option value="All">{language === 'bn' ? 'সকল বিষয়' : 'All Subjects'}</option>
                {POPULAR_SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-9 px-3.5 rounded-full bg-[#DCEBFA] text-xs font-semibold text-[#252525] hover:bg-[#CBE0F7] cursor-pointer whitespace-nowrap shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Detailed Feed Stream */}
          {directoryTab === 'tutors' ? (
            filteredTutors.length === 0 ? (
              <div className="ivory-card p-8 text-center space-y-3">
                <div className="text-base font-bold text-[#252525]">No matching tutors</div>
                <p className="text-xs sm:text-sm text-[#858585]">
                  Try another subject, district, or clear your search.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Show All Tutors
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleTutors.map((tutor, idx) => (
                  <TutorCardItem
                    key={tutor.id}
                    tutor={tutor}
                    index={idx}
                    isSelected={activeTutor?.id === tutor.id}
                    isSaved={savedTutorIds.includes(tutor.id)}
                    openingWa={openingWaId === tutor.id}
                    onPreview={(t) => {
                      setSelectedTutor(t);
                      setInspectorTab('about');
                    }}
                    onOpenFullProfile={viewTutorDetail}
                    onToggleSave={toggleSaveTutor}
                    onWhatsApp={openTutorWhatsApp}
                  />
                ))}
              </div>
            )
          ) : filteredTuitions.length === 0 ? (
            <div className="ivory-card p-8 text-center space-y-3">
              <div className="text-base font-bold text-[#252525]">No matching tuition posts</div>
              <p className="text-xs sm:text-sm text-[#858585]">
                Try clearing filters or post a new tuition request.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold cursor-pointer"
              >
                Show All Tuitions
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleTuitions.map(post => (
                <TuitionCardItem
                  key={post.id}
                  post={post}
                  isSelected={activeTuition?.id === post.id}
                  isSaved={savedTuitionIds.includes(post.id)}
                  alreadyApplied={hasAppliedToPost(post.id)}
                  isOwn={post.learnerId === currentUser.id}
                  onPreview={setSelectedTuition}
                  onOpenFullDetail={viewTuitionDetail}
                  onToggleSave={toggleSaveTuition}
                  onApply={(p, e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                      return;
                    }
                    setSelectedTuition(p);
                    setIsApplyModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Endless Feed Sentinel & Manual Load More */}
          {activeFeedLength > 0 && (
            <div ref={loadMoreRef} className="pt-2 pb-8 text-center space-y-2">
              {hasMoreItems ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => Math.min(activeFeedLength, prev + 10))}
                  className="h-10 px-6 rounded-full bg-[#FFF3EF] border border-[#F3D5CC] hover:bg-[#FFE6DD] text-xs font-semibold text-[#252525] cursor-pointer tabular-nums transition-colors"
                >
                  Show more ({Math.min(visibleCount, activeFeedLength)} of {activeFeedLength})
                </button>
              ) : (
                <p className="text-xs text-[#858585] tabular-nums">
                  Showing all {activeFeedLength} {directoryTab === 'tutors' ? 'tutors' : 'tuition posts'}
                </p>
              )}
            </div>
          )}
        </section>

        {/* RIGHT STICKY QUICK-PREVIEW INSPECTOR */}
        <section className="hidden xl:block flex-1 min-w-0 xl:sticky xl:top-[80px] xl:max-h-[calc(100vh-96px)] xl:overflow-y-auto pr-0.5">
          {directoryTab === 'tutors' ? (
            activeTutor ? (
              <div className="ivory-card overflow-hidden">
                {/* Warm Friendly EdTech Cover Header */}
                <div className="h-24 bg-gradient-to-r from-[#FFF3EF] via-[#FFE2D9] to-[#DCEBFA] px-5 pt-3.5 flex justify-end items-start border-b border-[#F1E1DC]">
                  <button
                    type="button"
                    onClick={() => viewTutorDetail(activeTutor)}
                    className="h-8 px-3.5 rounded-full bg-white/90 hover:bg-white text-[#252525] text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Open Full Profile</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="px-6 pb-6">
                  <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-4 -mt-14">
                    <div className="flex items-end gap-4 min-w-0">
                      <img
                        src={
                          activeTutor.profilePhotoURL ||
                          activeTutor.avatar ||
                          DEFAULT_PLACEHOLDER_AVATAR
                        }
                        alt={activeTutor.name}
                        referrerPolicy="no-referrer"
                        className="w-28 h-32 rounded-2xl object-cover object-top border-4 border-white shadow-sm bg-[#FFF3EF] shrink-0"
                      />
                      <div className="pb-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-display text-xl font-bold text-[#252525] leading-snug break-words">
                            {activeTutor.name}
                          </h2>
                          {activeTutorVerified && (
                            <BadgeCheck
                              className="w-5 h-5 text-[#F47C68] shrink-0"
                              aria-label="Verified Tutor"
                            />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-[#858585] leading-snug break-words mt-0.5">
                          {activeTutor.university}
                          {activeTutor.department ? ` · ${activeTutor.department}` : ''}
                          {activeTutor.academicYear ? ` · ${activeTutor.academicYear}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={openingWaId === activeTutor.id}
                        onClick={() => openTutorWhatsApp(activeTutor)}
                        className="h-10 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all active:scale-[0.98]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          {openingWaId === activeTutor.id ? 'Opening...' : 'Contact via WhatsApp'}
                        </span>
                      </button>

                      {!activeTutorCanWa && (
                        <button
                          type="button"
                          onClick={() => openInviteForTutor(activeTutor)}
                          className="h-10 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Invite</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleSaveTutor(activeTutor.id)}
                        aria-label={activeTutorSaved ? 'Unsave tutor' : 'Save tutor'}
                        className={`h-10 px-4 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                          activeTutorSaved
                            ? 'bg-[#FFF3EF] border-[#F47C68]/50 text-[#C94A35]'
                            : 'bg-white border-[#F1E1DC] hover:bg-[#FFF3EF] text-[#252525]'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${activeTutorSaved ? 'fill-[#F47C68]' : ''}`} />
                        <span>{activeTutorSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean 2-Tab Switch */}
                  <div className="border-b border-[#F1E1DC] mt-5 flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => setInspectorTab('about')}
                      className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        inspectorTab === 'about'
                          ? 'border-[#F47C68] text-[#252525]'
                          : 'border-transparent text-[#858585] hover:text-[#252525]'
                      }`}
                    >
                      Overview & Education
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('reviews')}
                      className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        inspectorTab === 'reviews'
                          ? 'border-[#F47C68] text-[#252525]'
                          : 'border-transparent text-[#858585] hover:text-[#252525]'
                      }`}
                    >
                      Reviews ({activeTutor.reviews?.length || 0})
                    </button>
                  </div>

                  {inspectorTab === 'about' ? (
                    <div className="pt-4 space-y-4">
                      {activeTutor.headline && (
                        <p className="text-sm text-[#252525] leading-relaxed">
                          {activeTutor.headline}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2.5 text-xs">
                        <div className="p-3 rounded-2xl bg-[#DCEBFA]/70">
                          <div className="text-[#252525] flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Monthly Fee</span>
                          </div>
                          <div className="font-mono font-bold text-sm text-[#252525] mt-1 tabular-nums">
                            ৳{activeTutor.expectedSalaryMin.toLocaleString()}–
                            {activeTutor.expectedSalaryMax.toLocaleString()}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FFF3EF]">
                          <div className="text-[#858585] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#F47C68]" />
                            <span>Location</span>
                          </div>
                          <div className="font-semibold text-[#252525] mt-1 leading-snug break-words">
                            {activeTutor.district} · {activeTutor.preferredAreas.slice(0, 2).join(', ')}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FFF3EF]">
                          <div className="text-[#858585] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#F47C68] shrink-0" />
                            <span>Status</span>
                          </div>
                          <div className="font-semibold text-[#252525] mt-1">
                            {activeTutorVerified ? 'Verified Tutor' : 'Profile Active'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm border-t border-[#F1E1DC] pt-4">
                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-[#F47C68] shrink-0 mt-1" />
                          <div className="space-y-1.5">
                            <div>
                              <strong className="text-[#252525]">Subjects: </strong>
                              <span className="text-[#858585]">{activeTutor.subjects.join(', ')}</span>
                            </div>
                            <div>
                              <strong className="text-[#252525]">Classes: </strong>
                              <span className="text-[#858585]">{activeTutor.classes.join(', ')}</span>
                            </div>
                            <div>
                              <strong className="text-[#252525]">Medium & Mode: </strong>
                              <span className="text-[#858585]">
                                {activeTutor.mediums.join(', ')} · {activeTutor.tuitionTypes.join(', ')}
                              </span>
                            </div>
                            <div>
                              <strong className="text-[#252525]">Experience: </strong>
                              <span className="text-[#858585]">
                                {activeTutor.experienceYears > 0
                                  ? `${activeTutor.experienceYears} years`
                                  : 'New Tutor'}
                                {activeTutor.experienceSummary
                                  ? ` — ${activeTutor.experienceSummary}`
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {activeTutor.bio && (
                        <p className="text-sm text-[#858585] leading-relaxed border-t border-[#F1E1DC] pt-3">
                          {activeTutor.bio}
                        </p>
                      )}

                      {(activeTutor.collegeName ||
                        activeTutor.hscGpa ||
                        activeTutor.schoolName ||
                        activeTutor.sscGpa) && (
                        <div className="grid grid-cols-2 gap-2.5 text-xs border-t border-[#F1E1DC] pt-3">
                          {(activeTutor.collegeName || activeTutor.hscGpa) && (
                            <div className="p-3 rounded-2xl bg-[#FFF3EF]">
                              <div className="text-[#858585]">College / HSC</div>
                              <div className="font-bold text-[#252525] mt-0.5">
                                {activeTutor.collegeName || 'Provided'}
                              </div>
                              {activeTutor.hscGpa && (
                                <div className="text-[#858585] font-mono">GPA: {activeTutor.hscGpa}</div>
                              )}
                            </div>
                          )}
                          {(activeTutor.schoolName || activeTutor.sscGpa) && (
                            <div className="p-3 rounded-2xl bg-[#FFF3EF]">
                              <div className="text-[#858585]">School / SSC</div>
                              <div className="font-bold text-[#252525] mt-0.5">
                                {activeTutor.schoolName || 'Provided'}
                              </div>
                              {activeTutor.sscGpa && (
                                <div className="text-[#858585] font-mono">GPA: {activeTutor.sscGpa}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#F1E1DC] text-xs">
                        {activeTutorFb ? (
                          <a
                            href={activeTutorFb}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#C94A35] hover:underline"
                          >
                            <span>Facebook Profile</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            submitReport({
                              reportedItemType: 'tutor',
                              targetTitle: `${activeTutor.name} (${activeTutor.university})`,
                              targetId: activeTutor.id,
                              reportedBy: currentUser.name,
                              reportedById: currentUser.id,
                              reason: 'Reported from Tutor Inspector'
                            })
                          }
                          className="text-[#858585] hover:text-[#252525] hover:underline cursor-pointer"
                        >
                          Report profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 space-y-3">
                      {!activeTutor.reviews || activeTutor.reviews.length === 0 ? (
                        <p className="text-sm text-[#858585]">No reviews posted yet.</p>
                      ) : (
                        activeTutor.reviews.map(rev => (
                          <div key={rev.id} className="p-3.5 rounded-2xl bg-[#FFF3EF] space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="text-sm font-bold text-[#252525]">
                                  {rev.learnerName}
                                </div>
                                <div className="text-xs text-[#858585]">
                                  {rev.learnerRole} · {rev.classGrade}
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 text-[#252525] text-xs font-mono font-bold tabular-nums">
                                <Star className="w-3.5 h-3.5 text-[#F5A04E] fill-[#F5A04E]" />
                                <span>{rev.rating}.0</span>
                              </div>
                            </div>
                            <p className="text-sm text-[#252525] leading-relaxed">{rev.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="ivory-card p-10 text-center space-y-2">
                <div className="text-base font-bold text-[#252525]">Select a tutor to inspect</div>
                <p className="text-sm text-[#858585]">
                  Choose any tutor from the list to view subjects, university background, and WhatsApp contact.
                </p>
              </div>
            )
          ) : activeTuition ? (
            <div className="ivory-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-bold text-[#C94A35] uppercase">
                    {activeTuition.status} · {activeTuition.tuitionType}
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#252525] leading-snug break-words">
                    {activeTuition.title}
                  </h2>
                  <div className="text-xs text-[#858585] flex flex-wrap items-center gap-2">
                    <span>
                      Posted by <strong className="text-[#252525]">{activeTuition.learnerName}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#F47C68]" />
                      <span>
                        {activeTuition.area}, {activeTuition.district}
                      </span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeTuition.postedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => viewTuitionDetail(activeTuition)}
                    className="h-9 px-3.5 rounded-full bg-[#DCEBFA]/70 hover:bg-[#DCEBFA] text-xs font-semibold text-[#252525] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Page</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSaveTuition(activeTuition.id)}
                    aria-label={activeTuitionSaved ? 'Unsave post' : 'Save post'}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${
                      activeTuitionSaved
                        ? 'bg-[#FFF3EF] border-[#F47C68]/50 text-[#C94A35]'
                        : 'bg-white border-[#F1E1DC] hover:bg-[#FFF3EF] text-[#858585]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${activeTuitionSaved ? 'fill-[#F47C68]' : ''}`} />
                  </button>

                  {activeTuitionOwn && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditTuitionModal(activeTuition)}
                        className="w-9 h-9 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] flex items-center justify-center cursor-pointer"
                        title="Edit post"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTuitionPost(activeTuition.id)}
                        className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-[#FFF3EF]">
                  <div className="text-[#858585]">Class</div>
                  <div className="font-bold text-[#252525] mt-0.5">{activeTuition.classGrade}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF3EF]">
                  <div className="text-[#858585]">Medium</div>
                  <div className="font-bold text-[#252525] mt-0.5">{activeTuition.medium}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF3EF]">
                  <div className="text-[#858585]">Schedule</div>
                  <div className="font-bold text-[#252525] mt-0.5">
                    {activeTuition.daysPerWeek} days/wk
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#DCEBFA]/75">
                  <div className="text-[#252525] font-semibold">Monthly Salary</div>
                  <div className="font-mono font-bold text-[#252525] mt-0.5 tabular-nums">
                    ৳{activeTuition.salaryOfferBDT.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-[#252525] leading-relaxed">
                  {activeTuition.requirementsDescription}
                </p>
                <div className="text-xs text-[#858585] space-y-1 pt-1">
                  <div>
                    <strong className="text-[#252525]">Subjects: </strong>
                    {activeTuition.subjects.join(', ')}
                  </div>
                  {activeTuition.preferredTutorGender !== 'Any' && (
                    <div>
                      <strong className="text-[#252525]">Preferred Tutor: </strong>
                      {activeTuition.preferredTutorGender}
                    </div>
                  )}
                </div>
              </div>

              {!activeTuitionOwn ? (
                <div className="pt-4 border-t border-[#F1E1DC] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeTuitionApp ? (
                      <>
                        <div className="h-10 px-4 rounded-full bg-[#DCEBFA] text-[#252525] text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                          <span>Applied ({activeTuitionApp.status})</span>
                        </div>
                        {(activeTuitionApp.status === 'pending' ||
                          activeTuitionApp.status === 'shortlisted') && (
                          <button
                            type="button"
                            onClick={() => withdrawApplication(activeTuitionApp.id)}
                            className="h-10 px-4 rounded-full bg-[#FFF3EF] hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                          >
                            Withdraw
                          </button>
                        )}
                      </>
                    ) : activeTuition.status === 'open' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            setAuthModalMode('login');
                            setIsAuthModalOpen(true);
                            return;
                          }
                          setSelectedTuition(activeTuition);
                          setIsApplyModalOpen(true);
                        }}
                        className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Apply for Tuition</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-[#858585]">
                        Applications Closed
                      </span>
                    )}

                    {activeTuitionWa && (
                      <a
                        href={activeTuitionWa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp Guardian</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      submitReport({
                        reportedItemType: 'tuition',
                        targetTitle: activeTuition.title,
                        targetId: activeTuition.id,
                        reportedBy: currentUser.name,
                        reportedById: currentUser.id,
                        reason: 'Flagged tuition post'
                      })
                    }
                    className="text-xs text-[#858585] hover:text-[#252525] hover:underline cursor-pointer"
                  >
                    Report post
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#F1E1DC] space-y-3">
                  <h3 className="font-display text-sm font-bold text-[#252525]">
                    Tutor Applicants ({activeTuitionApps.length})
                  </h3>
                  {activeTuitionApps.length === 0 ? (
                    <p className="text-xs text-[#858585]">
                      No applicants yet. Tutors will appear here when they apply.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeTuitionApps.map(app => {
                        const matchedTutor = tutors.find(
                          t => t.id === app.tutorId || t.uid === app.tutorId
                        );
                        const isUnlockedByStatus =
                          app.status === 'shortlisted' ||
                          app.status === 'invited' ||
                          app.status === 'accepted';
                        const canShowTutorWa = matchedTutor
                          ? canViewTutorWhatsApp(matchedTutor) ||
                            (isUnlockedByStatus &&
                              matchedTutor.whatsappConsent !== false &&
                              matchedTutor.contactVisibility !== 'hidden')
                          : Boolean(app.tutorWhatsApp);
                        const tutorWa = canShowTutorWa
                          ? buildWhatsAppUrl(
                              app.tutorWhatsApp || matchedTutor?.whatsappNumber || matchedTutor?.phone,
                              `Hello ${app.tutorName}, regarding "${activeTuition.title}" on Tutorly.`
                            )
                          : null;

                        return (
                          <div key={app.id} className="p-3.5 rounded-2xl bg-[#FFF3EF] space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={app.tutorAvatar || DEFAULT_PLACEHOLDER_AVATAR}
                                  alt={app.tutorName}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-full object-cover border border-[#F1E1DC]"
                                />
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (matchedTutor) {
                                        viewTutorDetail(matchedTutor);
                                      }
                                    }}
                                    className="text-sm font-bold text-[#252525] hover:underline cursor-pointer text-left"
                                  >
                                    {app.tutorName}
                                  </button>
                                  <div className="text-xs text-[#858585]">
                                    {app.tutorUniversity} ·{' '}
                                    <span className="font-mono tabular-nums">
                                      ৳{app.proposedSalaryBDT.toLocaleString()}/mo
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-bold uppercase text-[#C94A35]">
                                {app.status}
                              </span>
                            </div>

                            <p className="text-xs text-[#252525] leading-relaxed">
                              {app.coverLetter}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              {tutorWa && (
                                <a
                                  href={tutorWa}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 px-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                              {app.status !== 'accepted' && app.status !== 'rejected' && (
                                <>
                                  {app.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                                      className="h-8 px-3.5 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#252525] text-xs font-semibold cursor-pointer"
                                    >
                                      Shortlist
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                    className="h-8 px-3.5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                    className="h-8 px-3.5 rounded-full bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="ivory-card p-10 text-center space-y-3">
              <div className="text-base font-bold text-[#252525]">No tuition post selected</div>
              <p className="text-sm text-[#858585]">
                Post your tuition requirement so qualified tutors can apply directly.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                    return;
                  }
                  openCreateTuitionModal();
                }}
                className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold cursor-pointer"
              >
                Post Tuition Need
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Invite Modal for Invite-Gated Tutors */}
      {isInviteOpen && activeTutor && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsInviteOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#F1E1DC] max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-[#252525]">
              Invite {activeTutor.name}
            </h3>
            <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
              {openMyPosts.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">
                    Tuition Post (Optional)
                  </label>
                  <select
                    value={selectedPostId}
                    onChange={(e) => {
                      setSelectedPostId(e.target.value);
                      const chosen = openMyPosts.find(p => p.id === e.target.value);
                      if (chosen) {
                        setInviteClass(chosen.classGrade);
                        setInviteSubject(chosen.subjects.join(', '));
                        setInviteOfferBDT(chosen.salaryOfferBDT);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525]"
                  >
                    <option value="">Direct Invitation</option>
                    {openMyPosts.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Class *</label>
                  <input
                    type="text"
                    required
                    value={inviteClass}
                    onChange={(e) => setInviteClass(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Offer (৳/mo) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={inviteOfferBDT}
                    onChange={(e) => setInviteOfferBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Subjects *</label>
                <input
                  type="text"
                  required
                  value={inviteSubject}
                  onChange={(e) => setInviteSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Message</label>
                <textarea
                  rows={2}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Share area, timing, or demo request..."
                  className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] placeholder:text-[#858585]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="h-10 px-5 rounded-full bg-[#FFF3EF] text-[#252525] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
