import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  Star,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BD_DISTRICTS_BY_DIVISION } from '../../data/bangladeshData';
import { DEFAULT_PLACEHOLDER_AVATAR, TuitionPost, TutorProfile, isTutorVerified } from '../../types';
import { getLocationByDistrict } from '../../utils/routing';
import { filterAndRankTutors } from '../../utils/tutorSearch';
import heroTutorBento from '../../assets/images/hero_tutor_bento_1794837005690.jpg';

const ALL_DISTRICTS = Array.from(new Set(Object.values(BD_DISTRICTS_BY_DIVISION).flat())).sort();

const QUICK_SUBJECTS = [
  { id: 'Mathematics', labelEn: 'Mathematics', labelBn: 'গণিত', code: '01', circleBg: 'bg-[#FFE4A0]' },
  { id: 'Physics', labelEn: 'Physics', labelBn: 'পদার্থ', code: '02', circleBg: 'bg-[#FFD5B8]' },
  { id: 'Chemistry', labelEn: 'Chemistry', labelBn: 'রসায়ন', code: '03', circleBg: 'bg-[#DBEAFE]' },
  { id: 'English', labelEn: 'English', labelBn: 'ইংরেজি', code: '04', circleBg: 'bg-[#D1FAE5]' },
  { id: 'Biology', labelEn: 'Biology', labelBn: 'জীববিজ্ঞান', code: '05', circleBg: 'bg-[#EDE9FE]' },
  { id: 'ICT', labelEn: 'ICT', labelBn: 'আইসিটি', code: '06', circleBg: 'bg-[#FFE0E6]' }
] as const;

const SPOTLIGHT_FRAMES = [
  'bg-[#EFEAFF] border-[#E1D8FF]',
  'bg-[#FFF4D6] border-[#F8E4AE]',
  'bg-[#DCEBFA] border-[#C5DDF6]',
  'bg-[#FFEBE6] border-[#FAD5CB]'
] as const;

interface HomeBentoHeroProps {
  tutors: TutorProfile[];
  tuitionPosts: TuitionPost[];
  subjectFilter: string;
  setSubjectFilter: (subject: string) => void;
  savedTutorIds: string[];
  onToggleSaveTutor: (tutorId: string) => void;
  onOpenTutorProfile: (tutor: TutorProfile) => void;
  onScrollToDirectory: () => void;
}

export const HomeBentoHero: React.FC<HomeBentoHeroProps> = ({
  tutors,
  tuitionPosts,
  subjectFilter,
  setSubjectFilter,
  savedTutorIds,
  onToggleSaveTutor,
  onOpenTutorProfile,
  onScrollToDirectory
}) => {
  const {
    language,
    isAuthenticated,
    currentUser,
    currentRole,
    searchQuery,
    setSearchQuery,
    districtFilter,
    setDistrictFilter,
    setDirectoryTab,
    setActiveView,
    openCreateTuitionModal,
    setIsAuthModalOpen,
    setAuthModalMode,
    setIsTutorSearchOpen,
    openLoginForPortal
  } = useApp();

  const isBn = language === 'bn';
  const activeLocationInfo = getLocationByDistrict(districtFilter);
  const [heroSearchFocused, setHeroSearchFocused] = React.useState(false);
  const heroSearchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(e.target as Node)) {
        setHeroSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const publishedTutors = React.useMemo(
    () => tutors.filter(t => t.isPublished !== false && t.profileVisibility !== 'hidden'),
    [tutors]
  );

  const allQuickMatchedTutors = React.useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return [];
    return filterAndRankTutors(publishedTutors, trimmed);
  }, [publishedTutors, searchQuery]);

  const quickMatchedTutors = React.useMemo(
    () => allQuickMatchedTutors.slice(0, 6),
    [allQuickMatchedTutors]
  );

  const openTuitions = React.useMemo(
    () => tuitionPosts.filter(p => p.status === 'open'),
    [tuitionPosts]
  );

  const featuredTutors = React.useMemo(() => {
    return [...publishedTutors]
      .sort((a, b) => {
        const aScore = (isTutorVerified(a) ? 2 : 0) + (a.rating || 0);
        const bScore = (isTutorVerified(b) ? 2 : 0) + (b.rating || 0);
        return bScore - aScore;
      })
      .slice(0, 4);
  }, [publishedTutors]);

  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : '';

  const handleBrowseTutors = () => {
    setDirectoryTab('tutors');
    onScrollToDirectory();
  };

  const handleBrowseTuitions = () => {
    setDirectoryTab('tuitions');
    setActiveView('tuitions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostTuition = () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    openCreateTuitionModal();
  };

  const handleTutorAction = async () => {
    if (isAuthenticated && currentRole === 'tutor') {
      setActiveView('dashboard');
      return;
    }
    await openLoginForPortal('tutor', 'register');
  };

  return (
    <section
      aria-label={isBn ? 'টিউটর ও টিউশন অন্বেষণ' : 'Explore tutors and tuitions'}
      className="bg-[#FCFBFA] border-b border-[#EFEAE7]"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 pt-4 pb-6 sm:pt-6 sm:pb-8 space-y-6">
        {/* Top 12-Column Bento Hero Mosaic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* Left Hero Column: Editorial Headline + Integrated Search + Subject Bento Chips */}
          <div className="lg:col-span-6 bg-white rounded-[28px] border border-[#EFEAE7] shadow-[0_6px_28px_rgba(24,24,27,0.04)] p-5 sm:p-7 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-medium text-[#6B6B6B] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-semibold text-[#18181B]">
                  {isAuthenticated && firstName
                    ? isBn
                      ? `স্বাগতম, ${firstName}`
                      : `Hello, ${firstName}`
                    : isBn
                      ? 'বাংলাদেশ টিউশন প্ল্যাটফর্ম'
                      : 'Bangladesh Tutor & Tuition Hub'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{isBn ? '৬৪ জেলা · সরাসরি WhatsApp' : '64 Districts · Direct WhatsApp'}</span>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight text-[#18181B] leading-[1.12] text-balance max-w-xl"
                style={{ fontSize: 'clamp(1.65rem, 2.75vw, 2.45rem)' }}
              >
                {activeLocationInfo
                  ? isBn
                    ? `${activeLocationInfo.banglaName}-য় হোম ও অনলাইন টিউটর`
                    : `Home & Online Tutors in ${activeLocationInfo.displayName}, Bangladesh`
                  : isBn
                    ? 'সেরা বিশ্ববিদ্যালয় টিউটর ও টিউশন খুঁজুন সহজেই'
                    : 'Find Verified University Tutors & Tuitions Across Bangladesh'}
              </h1>

              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed max-w-lg">
                {activeLocationInfo
                  ? isBn
                    ? `এলাকা: ${activeLocationInfo.highlights}। বিশ্ববিদ্যালয় ও বিষয় দেখে সরাসরি WhatsApp-এ যোগাযোগ করুন।`
                    : `Covering ${activeLocationInfo.highlights}. Compare university profiles and connect directly on WhatsApp.`
                  : isBn
                    ? 'বিশ্ববিদ্যালয়, বিভাগ ও বিষয় দেখে সরাসরি WhatsApp-এ কথা বলুন অথবা বিনা খরচে টিউশন পোস্ট করুন।'
                    : 'Compare university credentials, subjects, and monthly honorariums upfront—then connect directly on WhatsApp.'}
              </p>
            </div>

            {/* Integrated Search + District Filter Bar + Instant Tutor Profile Quick-Jump */}
            <div ref={heroSearchRef} className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setHeroSearchFocused(false);
                  setDirectoryTab('tutors');
                  onScrollToDirectory();
                }}
                className="bg-[#F6F4F3] rounded-2xl sm:rounded-full p-1.5 border border-[#EAE4E1] flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5"
              >
                <div className="flex-1 min-w-0 flex items-center px-3 h-10">
                  <Search className="w-4 h-4 text-[#858585] shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setHeroSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHeroSearchFocused(true);
                    }}
                    placeholder={
                      isBn
                        ? 'টিউটরের নাম, প্রোফাইল, বিষয় বা এলাকা...'
                        : 'Search tutor name, profile, subject, area...'
                    }
                    className="w-full min-w-0 bg-transparent px-2.5 text-sm text-[#18181B] placeholder:text-[#858585] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center text-[#858585] hover:text-[#18181B] cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="hidden sm:block w-px h-6 bg-[#E2DCD8] shrink-0" aria-hidden="true" />

                <div className="flex items-center gap-1.5 px-1 sm:px-0">
                  <div className="flex-1 sm:flex-initial flex items-center gap-1.5 px-2.5 h-10 rounded-xl sm:rounded-full bg-white/80 sm:bg-transparent">
                    <MapPin className="w-3.5 h-3.5 text-[#EB624B] shrink-0 pointer-events-none" />
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      aria-label="Select district"
                      className="w-full sm:w-auto bg-transparent text-xs font-semibold text-[#18181B] focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="All">{isBn ? 'সকল জেলা' : 'All Districts'}</option>
                      {ALL_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl sm:rounded-full bg-[#18181B] hover:bg-[#27272A] text-white font-display text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap shrink-0"
                  >
                    {isBn ? 'খুঁজুন' : 'Search'}
                  </button>
                </div>
              </form>

              {heroSearchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white rounded-2xl border border-[#EFEAE7] shadow-[0_14px_36px_rgba(24,24,27,0.12)] z-30 overflow-hidden">
                  <div className="px-3.5 py-2 bg-[#F8F6F5] border-b border-[#EFEAE7] flex items-center justify-between text-[11px] font-bold text-[#52525B]">
                    <span>
                      {isBn
                        ? `টিউটর অ্যাকাউন্ট (${allQuickMatchedTutors.length})`
                        : `Matching Tutor Profiles (${allQuickMatchedTutors.length})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroSearchFocused(false);
                        if (allQuickMatchedTutors.length > quickMatchedTutors.length) {
                          setIsTutorSearchOpen(true);
                        } else {
                          setDirectoryTab('tutors');
                          onScrollToDirectory();
                        }
                      }}
                      className="text-[#C94A35] hover:underline cursor-pointer"
                    >
                      {allQuickMatchedTutors.length > quickMatchedTutors.length
                        ? isBn
                          ? `সব ${allQuickMatchedTutors.length} জন দেখুন →`
                          : `See all ${allQuickMatchedTutors.length} →`
                        : isBn
                          ? 'সব দেখুন →'
                          : 'See all →'}
                    </button>
                  </div>
                  {quickMatchedTutors.length === 0 ? (
                    <div className="px-3.5 py-3 text-xs text-[#6B6B6B]">
                      {isBn
                        ? 'এই নামে কোনো টিউটর প্রোফাইল পাওয়া যায়নি।'
                        : 'No matching tutor accounts found.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F6F4F3] max-h-64 overflow-y-auto">
                      {quickMatchedTutors.map(tutor => (
                        <button
                          key={tutor.id}
                          type="button"
                          onClick={() => {
                            setHeroSearchFocused(false);
                            onOpenTutorProfile(tutor);
                          }}
                          className="w-full px-3.5 py-2.5 hover:bg-[#FFF6F3] flex items-center justify-between gap-2.5 text-left cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                              alt={tutor.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-[#EFEAE7] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#18181B] flex items-center gap-1 truncate">
                                <span className="truncate">{tutor.name}</span>
                                {isTutorVerified(tutor) && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-[#F47C68] shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B6B6B] truncate">
                                {[
                                  tutor.university,
                                  tutor.department,
                                  tutor.subjects.slice(0, 2).join(', '),
                                  tutor.district
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#858585] shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Subject Filter Tiles (Dribbble Image 4 Style) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-display font-bold text-[#18181B]">
                  {isBn ? 'জনপ্রিয় বিষয়সমূহ' : 'Popular Subjects'}
                </span>
                {subjectFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setSubjectFilter('All')}
                    className="text-xs font-semibold text-[#C94A35] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    {isBn ? 'সব বিষয়' : 'Clear subject'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_SUBJECTS.map(subj => {
                  const isActive = subjectFilter === subj.id;
                  return (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => {
                        setSubjectFilter(isActive ? 'All' : subj.id);
                        onScrollToDirectory();
                      }}
                      className={`h-11 px-2.5 rounded-2xl border text-left flex items-center gap-2.5 cursor-pointer transition-all duration-150 active:scale-[0.98] min-w-0 ${
                        isActive
                          ? 'bg-[#18181B] border-[#18181B] text-white shadow-sm'
                          : 'bg-[#FAFAFA] hover:bg-white border-[#EFEAE7] hover:border-[#E2DCD8] text-[#18181B]'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 text-[#18181B] ${subj.circleBg}`}
                      >
                        {subj.code}
                      </span>
                      <span className="text-xs font-semibold truncate">
                        {isBn ? subj.labelBn : subj.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Bento Mosaic (Dribbble Image 3 & Image 4 Inspired) */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3.5 sm:gap-4">
            {/* Tall Featured Illustration + Browse Tutors Card */}
            <div className="row-span-2 bg-[#FFF8F5] rounded-[28px] border border-[#F1E1DC] p-3.5 sm:p-4 flex flex-col justify-between gap-3">
              <div className="relative rounded-[20px] overflow-hidden bg-[#FFF3EF] flex-1 min-h-[175px] sm:min-h-[210px]">
                <img
                  src={heroTutorBento}
                  alt={isBn ? 'বিশ্ববিদ্যালয় টিউটর ও শিক্ষার্থীর পাঠদান' : 'University tutor mentoring a student'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center block select-none"
                />
              </div>

              <div className="space-y-2.5 pt-0.5">
                <div className="px-1">
                  <div className="font-display text-sm sm:text-base font-extrabold text-[#18181B] leading-snug">
                    {isBn ? 'টিউটর ডিরেক্টরি' : 'Tutor Directory'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#6B6B6B] tabular-nums">
                    {publishedTutors.length > 0
                      ? isBn
                        ? `${publishedTutors.length} জন সক্রিয় টিউটর`
                        : `${publishedTutors.length} active profiles`
                      : isBn
                        ? 'সরাসরি প্রোফাইল দেখুন'
                        : 'Verified academic profiles'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBrowseTutors}
                  className="w-full h-11 px-4 rounded-2xl bg-[#EB624B] hover:bg-[#DC533D] text-white font-display text-xs sm:text-sm font-bold flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <span>{isBn ? 'টিউটর দেখুন' : 'Browse Tutors'}</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Top-Right Lavender Tile: Open Tuitions */}
            <button
              type="button"
              onClick={handleBrowseTuitions}
              className="bg-[#EAE6FF] hover:bg-[#E0DAFF] rounded-[26px] border border-[#DFD8FE] p-4 sm:p-5 flex flex-col justify-between text-left cursor-pointer transition-all duration-150 active:scale-[0.98] min-h-[132px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center shadow-2xs shrink-0">
                  <Briefcase className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#18181B]/60 shrink-0" />
              </div>

              <div className="pt-3">
                <div className="font-display text-sm sm:text-base font-extrabold text-[#18181B] leading-tight">
                  {isBn ? 'খোলা টিউশন' : 'Open Tuitions'}
                </div>
                <div className="text-[11px] sm:text-xs text-[#52525B] mt-0.5 tabular-nums">
                  {openTuitions.length > 0
                    ? isBn
                      ? `${openTuitions.length}টি চলমান পোস্ট`
                      : `${openTuitions.length} open posts`
                    : isBn
                      ? 'হোম ও অনলাইন টিউশন'
                      : 'Home & online circulars'}
                </div>
              </div>
            </button>

            {/* Middle-Right Warm Buttercream Tile: Post Tuition */}
            <button
              type="button"
              onClick={handlePostTuition}
              className="bg-[#FFF2CC] hover:bg-[#FFE9AA] rounded-[26px] border border-[#F5E2AC] p-4 sm:p-5 flex flex-col justify-between text-left cursor-pointer transition-all duration-150 active:scale-[0.98] min-h-[132px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center shadow-2xs shrink-0">
                  <Plus className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#18181B]/60 shrink-0" />
              </div>

              <div className="pt-3">
                <div className="font-display text-sm sm:text-base font-extrabold text-[#18181B] leading-tight">
                  {isBn ? 'টিউশন পোস্ট' : 'Post Tuition'}
                </div>
                <div className="text-[11px] sm:text-xs text-[#52525B] mt-0.5">
                  {isBn ? 'বিনা খরচে · ২ মিনিটে' : 'Free · Reach tutors fast'}
                </div>
              </div>
            </button>

            {/* Bottom-Spanning Sky Blue Card: Become a Tutor / Tutor Dashboard */}
            <button
              type="button"
              onClick={handleTutorAction}
              className="col-span-2 bg-[#DCEBFA] hover:bg-[#CEE3F8] rounded-[24px] border border-[#C6DDF5] px-4 sm:px-5 py-4 flex items-center justify-between gap-3 text-left cursor-pointer transition-all duration-150 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center shadow-2xs shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-sm sm:text-base font-extrabold text-[#18181B] truncate">
                    {currentRole === 'tutor'
                      ? isBn
                        ? 'আমার টিউটর ড্যাশবোর্ড'
                        : 'Open Tutor Dashboard'
                      : isBn
                        ? 'টিউটর হিসেবে যোগ দিন'
                        : 'Become a Tutor'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#52525B] truncate">
                    {currentRole === 'tutor'
                      ? isBn
                        ? 'প্রোফাইল ও টিউশন আবেদন পরিচালনা করুন'
                        : 'Manage your profile, verification & applications'
                      : isBn
                        ? 'প্রোফাইল প্রকাশ করে টিউশনির আবেদন করুন'
                        : 'Publish your university profile & apply to tuitions'}
                  </div>
                </div>
              </div>

              <span className="w-9 h-9 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Popular Tutors Spotlight Strip (Dribbble Image 3 Community Cards + Image 4 Carousel) */}
        {featuredTutors.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold text-[#18181B]">
                  {isBn ? 'জনপ্রিয় ও যাচাইকৃত টিউটর' : 'Popular Tutors'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleBrowseTutors}
                className="text-xs font-bold text-[#18181B] hover:text-[#EB624B] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
              >
                <span>{isBn ? 'সব দেখুন' : 'See all'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex lg:grid lg:grid-cols-4 gap-3.5 overflow-x-auto lg:overflow-visible pb-1 snap-x snap-mandatory no-scrollbar">
              {featuredTutors.map((tutor, idx) => {
                const frameClass = SPOTLIGHT_FRAMES[idx % SPOTLIGHT_FRAMES.length];
                const isSaved = savedTutorIds.includes(tutor.id);
                const verified = isTutorVerified(tutor);
                return (
                  <article
                    key={tutor.id}
                    onClick={() => onOpenTutorProfile(tutor)}
                    className={`snap-start shrink-0 w-[238px] sm:w-[255px] lg:w-auto rounded-[24px] border p-2.5 flex flex-col justify-between gap-2.5 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 ${frameClass}`}
                  >
                    <div className="space-y-2.5">
                      <div className="relative aspect-[4/3] w-full rounded-[18px] overflow-hidden bg-white">
                        <img
                          src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                          alt={`${tutor.name} — ${tutor.university || 'University'} tutor`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top block"
                        />
                      </div>

                      <div className="px-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <h3 className="font-display text-sm font-extrabold text-[#18181B] truncate">
                              {tutor.name}
                            </h3>
                            {verified && (
                              <BadgeCheck
                                className="w-3.5 h-3.5 text-[#EB624B] shrink-0"
                                aria-label="Verified Tutor"
                              />
                            )}
                          </div>
                          {tutor.rating > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#18181B] tabular-nums shrink-0">
                              <Star className="w-3 h-3 text-[#F5A04E] fill-[#F5A04E]" />
                              <span>{tutor.rating.toFixed(1)}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-[#52525B] truncate">
                          {tutor.university || tutor.district}
                        </p>

                        <div className="text-[11px] text-[#52525B] truncate tabular-nums">
                          {tutor.subjects.slice(0, 2).join(' · ')}
                          {tutor.expectedSalaryMin > 0
                            ? ` · ৳${tutor.expectedSalaryMin.toLocaleString()}/mo`
                            : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-1 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveTutor(tutor.id);
                        }}
                        aria-label={isSaved ? 'Remove saved tutor' : 'Save tutor'}
                        className={`h-8 px-3 rounded-full bg-white hover:bg-[#FFFBF9] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                          isSaved ? 'text-[#C94A35]' : 'text-[#18181B]'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#EB624B]' : ''}`} />
                        <span>{isSaved ? (isBn ? 'সেভড' : 'Saved') : (isBn ? 'সেভ' : 'Save')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTutorProfile(tutor);
                        }}
                        className="flex-1 h-8 px-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer transition-colors whitespace-nowrap"
                      >
                        {isBn ? 'প্রোফাইল' : 'View Profile'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
