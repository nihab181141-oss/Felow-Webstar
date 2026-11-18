import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Briefcase,
  Calendar,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  Users,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BD_DISTRICTS_BY_DIVISION } from '../../data/bangladeshData';
import { TuitionPost } from '../../types';
import { getLocationByDistrict } from '../../utils/routing';

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

interface TuitionBentoHeroProps {
  tuitionPosts: TuitionPost[];
  subjectFilter: string;
  setSubjectFilter: (subject: string) => void;
  savedTuitionIds: string[];
  onToggleSaveTuition: (tuitionId: string) => void;
  onOpenTuitionDetail: (tuition: TuitionPost) => void;
  onScrollToDirectory: () => void;
}

export const TuitionBentoHero: React.FC<TuitionBentoHeroProps> = ({
  tuitionPosts,
  subjectFilter,
  setSubjectFilter,
  savedTuitionIds,
  onToggleSaveTuition,
  onOpenTuitionDetail,
  onScrollToDirectory
}) => {
  const {
    language,
    isAuthenticated,
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
    openLoginForPortal
  } = useApp();

  const isBn = language === 'bn';
  const activeLocationInfo = getLocationByDistrict(districtFilter);

  const openTuitions = React.useMemo(
    () => tuitionPosts.filter(p => p.status === 'open'),
    [tuitionPosts]
  );

  const spotlightTuitions = React.useMemo(
    () => openTuitions.slice(0, 4),
    [openTuitions]
  );

  const handleSwitchToTutors = () => {
    setDirectoryTab('tutors');
    setActiveView('tutors');
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
      aria-label={isBn ? 'খোলা টিউশন বিজ্ঞপ্তি' : 'Open tuition opportunities'}
      className="bg-[#FCFBFA] border-b border-[#EFEAE7]"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 pt-4 pb-6 sm:pt-6 sm:pb-8 space-y-6">
        {/* Top 12-Column Tuitions Bento Mosaic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* Left Hero Column: Tuition Board Headline + Search + Quick Subject Filters */}
          <div className="lg:col-span-6 bg-white rounded-[28px] border border-[#EFEAE7] shadow-[0_6px_28px_rgba(24,24,27,0.04)] p-5 sm:p-7 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-medium text-[#6B6B6B] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-semibold text-[#18181B]">
                  {isBn ? 'টিউশন সার্কুলার বোর্ড' : 'Live Tuition Board'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{isBn ? 'বিনা কমিশন · সরাসরি আবেদন' : 'Zero Commission · Direct Apply'}</span>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight text-[#18181B] leading-[1.12] text-balance max-w-xl"
                style={{ fontSize: 'clamp(1.65rem, 2.75vw, 2.45rem)' }}
              >
                {activeLocationInfo
                  ? isBn
                    ? `${activeLocationInfo.banglaName}-য় খোলা হোম ও অনলাইন টিউশন`
                    : `Open Home & Online Tuition Jobs in ${activeLocationInfo.displayName}`
                  : isBn
                    ? 'বাংলাদেশ জুড়ে খোলা হোম ও অনলাইন টিউশন সার্কুলার'
                    : 'Open Home & Online Tuition Circulars Across Bangladesh'}
              </h1>

              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed max-w-lg">
                {activeLocationInfo
                  ? isBn
                    ? `এলাকা: ${activeLocationInfo.highlights}। সম্মানী ও সময়সূচি দেখে সরাসরি আবেদন করুন।`
                    : `Covering ${activeLocationInfo.highlights}. Review salary, schedule, and apply directly.`
                  : isBn
                    ? 'শিক্ষার্থী ও অভিভাবকদের দেওয়া টিউশন বিজ্ঞপ্তি দেখুন, বেতন ও ক্লাস যাচাই করে সরাসরি আবেদন করুন।'
                    : 'Browse real tuition requests from guardians and students, compare monthly salary & schedule upfront, and apply directly.'}
              </p>
            </div>

            {/* Integrated Search + District Filter Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onScrollToDirectory();
              }}
              className="bg-[#F6F4F3] rounded-2xl sm:rounded-full p-1.5 border border-[#EAE4E1] flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5"
            >
              <div className="flex-1 min-w-0 flex items-center px-3 h-10">
                <Search className="w-4 h-4 text-[#858585] shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isBn ? 'টিউশন, ক্লাস, বিষয় বা এলাকা...' : 'Search tuition, class, subject, area...'
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

            {/* Quick Subject Filter Tiles */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-display font-bold text-[#18181B]">
                  {isBn ? 'বিষয় অনুযায়ী টিউশন' : 'Filter Tuitions by Subject'}
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

          {/* Right Bento Mosaic Tailored for Tuition Circulars */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3.5 sm:gap-4">
            {/* Tall Featured Tuitions Card */}
            <div className="row-span-2 bg-[#FFF6F3] rounded-[28px] border border-[#F5E4DF] p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-11 h-11 rounded-full bg-white text-[#EB624B] flex items-center justify-center shadow-2xs shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#F5E4DF] text-[11px] font-bold text-[#18181B]">
                    <span>{isBn ? 'লাইভ বোর্ড' : 'Live Board'}</span>
                  </span>
                </div>

                <div className="bg-white rounded-[20px] border border-[#F5E4DF] p-3.5 sm:p-4 space-y-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                    {isBn ? 'চলমান টিউশন' : 'Open Circulars'}
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#18181B] tabular-nums">
                    {openTuitions.length > 0 ? openTuitions.length : '64'}
                    <span className="text-xs sm:text-sm font-semibold text-[#6B6B6B] ml-1.5">
                      {openTuitions.length > 0
                        ? isBn
                          ? 'টি সক্রিয়'
                          : 'active posts'
                        : isBn
                          ? 'জেলা জুড়ে'
                          : 'districts'}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-[#EFEAE7] space-y-1.5 text-[11px] sm:text-xs text-[#52525B]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#EB624B] shrink-0" />
                      <span>{isBn ? 'হোম ও অনলাইন শিডিউল স্পষ্ট' : 'Clear salary & weekly schedule'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                      <span>{isBn ? 'সরাসরি অভিভাবকের সাথে সংযোগ' : 'Direct guardian WhatsApp on shortlist'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onScrollToDirectory}
                  className="w-full h-11 px-4 rounded-2xl bg-[#EB624B] hover:bg-[#DC533D] text-white font-display text-xs sm:text-sm font-bold flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <span>{isBn ? 'টিউশন দেখুন' : 'Browse Tuitions'}</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Top-Right Lavender Tile: Post Tuition Free */}
            <button
              type="button"
              onClick={handlePostTuition}
              className="bg-[#EAE6FF] hover:bg-[#E0DAFF] rounded-[26px] border border-[#DFD8FE] p-4 sm:p-5 flex flex-col justify-between text-left cursor-pointer transition-all duration-150 active:scale-[0.98] min-h-[132px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center shadow-2xs shrink-0">
                  <Plus className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#18181B]/60 shrink-0" />
              </div>

              <div className="pt-3">
                <div className="font-display text-sm sm:text-base font-extrabold text-[#18181B] leading-tight">
                  {isBn ? 'টিউশন পোস্ট করুন' : 'Post a Tuition'}
                </div>
                <div className="text-[11px] sm:text-xs text-[#52525B] mt-0.5">
                  {isBn ? 'বিনা খরচে · ২ মিনিটে' : 'Free · Get tutor proposals'}
                </div>
              </div>
            </button>

            {/* Middle-Right Warm Buttercream Tile: Switch to Tutors Directory */}
            <button
              type="button"
              onClick={handleSwitchToTutors}
              className="bg-[#FFF2CC] hover:bg-[#FFE9AA] rounded-[26px] border border-[#F5E2AC] p-4 sm:p-5 flex flex-col justify-between text-left cursor-pointer transition-all duration-150 active:scale-[0.98] min-h-[132px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center shadow-2xs shrink-0">
                  <Users className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#18181B]/60 shrink-0" />
              </div>

              <div className="pt-3">
                <div className="font-display text-sm sm:text-base font-extrabold text-[#18181B] leading-tight">
                  {isBn ? 'টিউটর পেজে যান' : 'Browse Tutors'}
                </div>
                <div className="text-[11px] sm:text-xs text-[#52525B] mt-0.5">
                  {isBn ? 'বিশ্ববিদ্যালয় টিউটর দেখুন' : 'Explore tutor profiles'}
                </div>
              </div>
            </button>

            {/* Bottom-Spanning Sky Blue Card: Tutor Profile / Apply Readiness */}
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
                        ? 'আমার টিউটর ড্যাশবোর্ড ও আবেদন'
                        : 'My Tutor Dashboard & Applications'
                      : isBn
                        ? 'টিউশনে আবেদন করতে টিউটর পেজ খুলুন'
                        : 'Create Tutor Profile to Apply'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#52525B] truncate">
                    {currentRole === 'tutor'
                      ? isBn
                        ? 'আপনার আবেদন ও ইনভাইট স্ট্যাটাস দেখুন'
                        : 'Track submitted proposals & guardian invitations'
                      : isBn
                        ? 'বিশ্ববিদ্যালয়ের তথ্য দিয়ে টিউটর অ্যাকাউন্ট চালু করুন'
                        : 'Publish your academic profile & apply with one click'}
                  </div>
                </div>
              </div>

              <span className="w-9 h-9 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Latest Open Tuitions Spotlight Strip */}
        {spotlightTuitions.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base sm:text-lg font-extrabold text-[#18181B]">
                {isBn ? 'সাম্প্রতিক খোলা টিউশন' : 'Latest Open Tuitions'}
              </h2>
              <button
                type="button"
                onClick={onScrollToDirectory}
                className="text-xs font-bold text-[#18181B] hover:text-[#EB624B] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
              >
                <span>{isBn ? 'সব দেখুন' : 'See all'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex lg:grid lg:grid-cols-4 gap-3.5 overflow-x-auto lg:overflow-visible pb-1 snap-x snap-mandatory no-scrollbar">
              {spotlightTuitions.map((post, idx) => {
                const frameClass = SPOTLIGHT_FRAMES[idx % SPOTLIGHT_FRAMES.length];
                const isSaved = savedTuitionIds.includes(post.id);
                return (
                  <article
                    key={post.id}
                    onClick={() => onOpenTuitionDetail(post)}
                    className={`snap-start shrink-0 w-[250px] sm:w-[270px] lg:w-auto rounded-[24px] border p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 ${frameClass}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#52525B]">
                        <span className="truncate">{post.tuitionType || 'Home Tuition'}</span>
                        <span className="font-mono font-bold text-[#18181B] tabular-nums shrink-0">
                          ৳{post.salaryOfferBDT.toLocaleString()}/mo
                        </span>
                      </div>

                      <h3 className="font-display text-sm font-extrabold text-[#18181B] line-clamp-2 leading-snug">
                        {post.title}
                      </h3>

                      <div className="text-xs font-medium text-[#52525B] truncate">
                        {post.classGrade}
                      </div>

                      <div className="text-[11px] text-[#52525B] truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#EB624B] shrink-0" />
                        <span className="truncate">
                          {post.area ? `${post.area}, ${post.district}` : post.district}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveTuition(post.id);
                        }}
                        aria-label={isSaved ? 'Remove saved tuition' : 'Save tuition'}
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
                          onOpenTuitionDetail(post);
                        }}
                        className="flex-1 h-8 px-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold inline-flex items-center justify-center cursor-pointer transition-colors whitespace-nowrap"
                      >
                        {isBn ? 'বিস্তারিত' : 'View Tuition'}
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
