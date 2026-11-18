import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BD_DISTRICTS_BY_DIVISION } from '../../data/bangladeshData';
import { fetchTutorProfileById } from '../../services/firebase';
import { DEFAULT_PLACEHOLDER_AVATAR, TutorProfile, isTutorVerified } from '../../types';
import {
  RecentTutorViewEntry,
  clearRecentTutorViews,
  loadRecentTutorViews,
  removeRecentTutorView
} from '../../utils/recentTutorViews';
import { filterAndRankTutors } from '../../utils/tutorSearch';

const ALL_DISTRICTS = Array.from(new Set(Object.values(BD_DISTRICTS_BY_DIVISION).flat())).sort();

export const TutorAccountSearchModal: React.FC = () => {
  const {
    isTutorSearchOpen,
    setIsTutorSearchOpen,
    tutors,
    adminTutorProfiles,
    currentUser,
    currentRole,
    searchQuery,
    setSearchQuery,
    setDistrictFilter,
    setDirectoryTab,
    setActiveView,
    viewTutorDetail,
    openAdminUserProfile,
    showToast,
    language
  } = useApp();

  const isBn = language === 'bn';
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [localDistrict, setLocalDistrict] = useState('All');
  const [recentViews, setRecentViews] = useState<RecentTutorViewEntry[]>(() =>
    loadRecentTutorViews()
  );
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (!isTutorSearchOpen) return;
    setLocalQuery(searchQuery);
    setRecentViews(loadRecentTutorViews());
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTutorSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isTutorSearchOpen, searchQuery, setIsTutorSearchOpen]);

  const tutorPool = useMemo(() => {
    const map = new Map<string, TutorProfile>();
    tutors.forEach(t => {
      if (t.isPublished !== false && t.profileVisibility !== 'hidden') {
        map.set(t.id, t);
      }
    });
    if (currentRole === 'admin') {
      adminTutorProfiles.forEach(t => {
        map.set(t.id, t);
      });
    }
    return Array.from(map.values());
  }, [tutors, adminTutorProfiles, currentRole]);

  const districtScopedPool = useMemo(() => {
    if (localDistrict === 'All') return tutorPool;
    return tutorPool.filter(t => t.district === localDistrict);
  }, [tutorPool, localDistrict]);

  const matchingTutors = useMemo(() => {
    const trimmed = localQuery.trim();
    if (!trimmed) return [];
    return filterAndRankTutors(districtScopedPool, trimmed, {
      includeHiddenAndDrafts: currentRole === 'admin'
    });
  }, [districtScopedPool, localQuery, currentRole]);

  const suggestedTutors = useMemo(() => {
    return [...districtScopedPool]
      .sort((a, b) => {
        const aScore = (isTutorVerified(a) ? 3 : 0) + (Number(a.rating) || 0) + (a.isFeatured ? 1 : 0);
        const bScore = (isTutorVerified(b) ? 3 : 0) + (Number(b.rating) || 0) + (b.isFeatured ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 10);
  }, [districtScopedPool]);

  if (!isTutorSearchOpen) return null;

  const openTutorAccount = async (tutor: TutorProfile) => {
    setIsTutorSearchOpen(false);
    if (tutor.isPublished === false && currentRole === 'admin') {
      openAdminUserProfile(tutor.uid || tutor.id);
      return;
    }
    viewTutorDetail(tutor);
  };

  const openRecentEntry = async (entry: RecentTutorViewEntry) => {
    const found = tutorPool.find(t => t.id === entry.id || t.uid === entry.id);
    if (found) {
      await openTutorAccount(found);
      return;
    }
    setOpeningId(entry.id);
    try {
      const remote = await fetchTutorProfileById(entry.id);
      if (remote) {
        setIsTutorSearchOpen(false);
        viewTutorDetail(remote);
      } else {
        setRecentViews(removeRecentTutorView(entry.id));
        showToast(
          isBn ? 'এই প্রোফাইলটি বর্তমানে প্রকাশিত নয়।' : 'This tutor profile is currently unavailable.',
          'info'
        );
      }
    } finally {
      setOpeningId(null);
    }
  };

  const handleBrowseAllInDirectory = () => {
    setSearchQuery(localQuery.trim());
    if (localDistrict !== 'All') {
      setDistrictFilter(localDistrict);
    }
    setDirectoryTab('tutors');
    setActiveView('tutors');
    setIsTutorSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchingTutors.length === 1) {
      void openTutorAccount(matchingTutors[0]);
      return;
    }
    if (localQuery.trim().length > 0 && matchingTutors.length > 0) {
      handleBrowseAllInDirectory();
    }
  };

  const trimmedQuery = localQuery.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isBn ? 'টিউটর অ্যাকাউন্ট সার্চ' : 'Search Tutor Accounts'}
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-stretch sm:items-start sm:justify-center sm:pt-12 sm:p-4"
      onClick={() => setIsTutorSearchOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full sm:h-auto sm:max-h-[82vh] sm:max-w-2xl bg-white sm:rounded-[28px] sm:border sm:border-[#EFEAE7] shadow-[0_24px_64px_rgba(24,24,27,0.2)] flex flex-col overflow-hidden animate-fade-up"
      >
        {/* Top Social-Style Search Bar */}
        <div className="px-3 sm:px-5 pt-3 pb-3 border-b border-[#EFEAE7] bg-white space-y-2.5 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTutorSearchOpen(false)}
              aria-label={isBn ? 'বন্ধ করুন' : 'Close search'}
              className="w-11 h-11 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] text-[#18181B] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0 flex items-center h-11 px-3.5 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] focus-within:bg-white focus-within:border-[#18181B] transition-colors">
              <Search className="w-4 h-4 text-[#6B6B6B] shrink-0 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder={
                  isBn
                    ? 'টিউটরের নাম, প্রোফাইল, বিশ্ববিদ্যালয় বা বিষয় লিখুন...'
                    : 'Search tutor name, profile, university, subject...'
                }
                className="flex-1 min-w-0 bg-transparent px-2.5 text-sm text-[#18181B] placeholder:text-[#858585] focus:outline-none"
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search text"
                  className="w-7 h-7 rounded-full hover:bg-[#EAE4E1] flex items-center justify-center text-[#52525B] cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-between gap-2 pl-1">
            <div className="text-[11px] font-medium text-[#6B6B6B] truncate">
              {trimmedQuery
                ? isBn
                  ? `"${trimmedQuery}" — ${matchingTutors.length} টি টিউটর অ্যাকাউন্ট পাওয়া গেছে`
                  : `${matchingTutors.length} tutor ${matchingTutors.length === 1 ? 'account' : 'accounts'} found`
                : isBn
                  ? `নাম লিখে সার্চ করুন — মোট ${districtScopedPool.length} জন টিউটর`
                  : `Search any tutor by name across ${districtScopedPool.length} profiles`}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#EB624B] shrink-0" />
              <select
                value={localDistrict}
                onChange={(e) => setLocalDistrict(e.target.value)}
                aria-label="Filter tutor search by district"
                className="h-8 px-2.5 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] text-xs font-semibold text-[#18181B] focus:outline-none focus:border-[#18181B] cursor-pointer max-w-[140px]"
              >
                <option value="All">{isBn ? 'সকল জেলা' : 'All Districts'}</option>
                {ALL_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F6F4F3] bg-[#FCFBFA]">
          {trimmedQuery.length === 0 ? (
            <>
              {/* Recent Profile Views (Facebook/Instagram style) */}
              {recentViews.length > 0 && (
                <div className="bg-white">
                  <div className="px-4 sm:px-5 py-2.5 bg-[#F8F6F5] border-b border-[#EFEAE7] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#52525B] inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#EB624B]" />
                      <span>{isBn ? 'সাম্প্রতিক দেখা প্রোফাইল' : 'Recent Profile Searches'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRecentViews(clearRecentTutorViews())}
                      className="text-[11px] font-semibold text-[#C94A35] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isBn ? 'সব মুছুন' : 'Clear'}</span>
                    </button>
                  </div>
                  <div className="divide-y divide-[#F6F4F3]">
                    {recentViews.map(entry => (
                      <div
                        key={entry.id}
                        className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2 hover:bg-[#FFF6F3] transition-colors"
                      >
                        <button
                          type="button"
                          disabled={openingId === entry.id}
                          onClick={() => void openRecentEntry(entry)}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer py-1"
                        >
                          <img
                            src={entry.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                            alt={entry.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-full object-cover border border-[#EFEAE7] shrink-0 bg-[#F6F4F3]"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#18181B] flex items-center gap-1 truncate">
                              <span className="truncate">{entry.name}</span>
                              {entry.verified && (
                                <BadgeCheck className="w-4 h-4 text-[#EB624B] shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-[#6B6B6B] truncate">
                              {[entry.university, entry.department, entry.district]
                                .filter(Boolean)
                                .join(' · ') || 'Tutor Profile'}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecentViews(removeRecentTutorView(entry.id))}
                          aria-label={`Remove ${entry.name} from recent`}
                          className="w-9 h-9 rounded-full hover:bg-[#EAE4E1] flex items-center justify-center text-[#858585] hover:text-[#18181B] cursor-pointer shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested / Active Tutor Accounts */}
              <div className="bg-white">
                <div className="px-4 sm:px-5 py-2.5 bg-[#F8F6F5] border-b border-[#EFEAE7] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#52525B] inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#EB624B]" />
                    <span>{isBn ? 'জনপ্রিয় ও ভেরিফায়েড টিউটর' : 'Suggested Tutor Accounts'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleBrowseAllInDirectory}
                    className="text-[11px] font-bold text-[#C94A35] hover:underline cursor-pointer"
                  >
                    {isBn ? 'সব টিউটর দেখুন →' : 'Browse All →'}
                  </button>
                </div>

                {suggestedTutors.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#6B6B6B]">
                    {isBn ? 'এই জেলায় এখনো কোনো টিউটর প্রোফাইল নেই।' : 'No published tutor profiles in this district yet.'}
                  </div>
                ) : (
                  <div className="divide-y divide-[#F6F4F3]">
                    {suggestedTutors.map(tutor => {
                      const isSelf = tutor.id === currentUser.id || tutor.uid === currentUser.id;
                      return (
                        <button
                          key={tutor.id}
                          type="button"
                          onClick={() => void openTutorAccount(tutor)}
                          className="w-full px-4 sm:px-5 py-3 hover:bg-[#FFF6F3] flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                              alt={tutor.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-full object-cover border border-[#EFEAE7] shrink-0 bg-[#F6F4F3]"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-sm font-bold text-[#18181B]">
                                <span className="truncate">{tutor.name}</span>
                                {isTutorVerified(tutor) && (
                                  <BadgeCheck className="w-4 h-4 text-[#EB624B] shrink-0" />
                                )}
                                {isSelf && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFEAFF] text-[#18181B] shrink-0">
                                    {isBn ? 'আপনি' : 'You'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#6B6B6B] truncate">
                                {[
                                  tutor.university,
                                  tutor.department,
                                  tutor.district
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            </div>
                          </div>

                          <span className="h-8 px-3 rounded-full bg-[#F6F4F3] text-[#18181B] text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
                            <span>{isBn ? 'প্রোফাইল' : 'Profile'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : matchingTutors.length === 0 ? (
            <div className="bg-white p-8 sm:p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FFF6F3] border border-[#F5E4DF] text-[#EB624B] flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="font-display text-base font-extrabold text-[#18181B]">
                {isBn
                  ? `"${trimmedQuery}" নামে কোনো টিউটর অ্যাকাউন্ট পাওয়া যায়নি`
                  : `No tutor account matched "${trimmedQuery}"`}
              </div>
              <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed">
                {isBn
                  ? 'নামের অন্য অংশ, বিশ্ববিদ্যালয়ের নাম (যেমন DU, BUET, NSU), বা জেলা পরিবর্তন করে চেষ্টা করুন।'
                  : 'Try searching part of the tutor’s name, university acronym (e.g. DU, BUET, NSU), subject, or switch district filter.'}
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                {localDistrict !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setLocalDistrict('All')}
                    className="h-9 px-4 rounded-full bg-[#EFEAFF] text-[#18181B] text-xs font-bold cursor-pointer"
                  >
                    {isBn ? 'সকল জেলা দেখুন' : 'Search All Districts'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setLocalQuery('');
                    inputRef.current?.focus();
                  }}
                  className="h-9 px-4 rounded-full bg-[#18181B] text-white text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'নতুন করে খুঁজুন' : 'Reset Query'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white divide-y divide-[#F6F4F3]">
              {matchingTutors.slice(0, 40).map(tutor => {
                const isSelf = tutor.id === currentUser.id || tutor.uid === currentUser.id;
                const verified = isTutorVerified(tutor);
                return (
                  <button
                    key={tutor.id}
                    type="button"
                    onClick={() => void openTutorAccount(tutor)}
                    className="w-full px-4 sm:px-5 py-3.5 hover:bg-[#FFF6F3] flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                        alt={tutor.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-[#EFEAE7] shrink-0 bg-[#F6F4F3]"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-[#18181B]">
                          <span className="truncate">{tutor.name}</span>
                          {verified && (
                            <BadgeCheck className="w-4 h-4 text-[#EB624B] shrink-0" />
                          )}
                          {isSelf && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFEAFF] text-[#18181B]">
                              {isBn ? 'আপনি' : 'You'}
                            </span>
                          )}
                          {tutor.isPublished === false && (
                            <span className="text-[10px] font-bold text-[#C94A35]">Draft</span>
                          )}
                        </div>

                        <div className="text-xs font-medium text-[#52525B] truncate">
                          {[tutor.university, tutor.department, tutor.academicYear]
                            .filter(Boolean)
                            .join(' · ') || 'University Tutor'}
                        </div>

                        <div className="text-[11px] text-[#6B6B6B] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {tutor.subjects.length > 0 && (
                            <span className="truncate max-w-[220px]">
                              {tutor.subjects.slice(0, 3).join(', ')}
                            </span>
                          )}
                          <span>· {tutor.district}</span>
                          {tutor.rating > 0 && (
                            <span className="inline-flex items-center gap-0.5 font-semibold text-[#18181B]">
                              · <Star className="w-3 h-3 text-[#F5A04E] fill-[#F5A04E]" />
                              {tutor.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="h-9 px-3.5 rounded-full bg-[#18181B] text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <span>{isBn ? 'প্রোফাইল দেখুন' : 'View Profile'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}

              {matchingTutors.length > 0 && (
                <div className="p-3.5 bg-[#F8F6F5] flex items-center justify-between gap-2">
                  <span className="text-xs text-[#6B6B6B]">
                    {matchingTutors.length > 40
                      ? isBn
                        ? `শীর্ষ ৪০টি প্রোফাইল দেখানো হচ্ছে (মোট ${matchingTutors.length})`
                        : `Showing top 40 of ${matchingTutors.length} profiles`
                      : isBn
                        ? `মোট ${matchingTutors.length}টি ম্যাচিং প্রোফাইল`
                        : `${matchingTutors.length} matching profiles`}
                  </span>
                  <button
                    type="button"
                    onClick={handleBrowseAllInDirectory}
                    className="h-9 px-4 rounded-full bg-white border border-[#EAE4E1] hover:border-[#18181B] text-xs font-bold text-[#18181B] cursor-pointer transition-colors"
                  >
                    {isBn ? 'ডিরেক্টরিতে দেখুন →' : 'View in Directory →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
