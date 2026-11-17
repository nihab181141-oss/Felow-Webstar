import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  GraduationCap,
  Bell,
  LogOut,
  User,
  Shield,
  Repeat,
  Globe,
  X,
  BellRing,
  CheckCircle2,
  ArrowUpRight,
  BadgeCheck,
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BD_DISTRICTS_BY_DIVISION } from '../data/bangladeshData';
import { DEFAULT_PLACEHOLDER_AVATAR, TutorProfile, isTutorVerified } from '../types';
import { matchesTutorSearchQuery, scoreTutorSearchMatch } from '../utils/tutorSearch';

const ALL_DISTRICTS = Array.from(new Set(Object.values(BD_DISTRICTS_BY_DIVISION).flat())).sort();

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setDirectoryTab,
    searchQuery,
    setSearchQuery,
    districtFilter,
    setDistrictFilter,
    setMobileDetailOpen,
    currentUser,
    currentRole,
    isAuthenticated,
    switchUserRole,
    activateDualRole,
    openCreateTuitionModal,
    logoutUser,
    setIsAuthModalOpen,
    setAuthModalMode,
    notifications,
    markAllNotificationsRead,
    handleNotificationClick,
    browserNotifPermission,
    requestBrowserNotifications,
    tutors,
    adminTutorProfiles,
    tuitionPosts,
    viewTutorDetail,
    viewTuitionDetail,
    openAdminUserProfile,
    language,
    setLanguage
  } = useApp();

  const [openDropdown, setOpenDropdown] = useState<'notif' | 'account' | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const rightControlsRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const trimmedQuery = searchQuery.trim();

  const matchingTutorResults = React.useMemo(() => {
    if (!trimmedQuery) return [];
    const poolMap = new Map<string, TutorProfile>();
    tutors.forEach(t => {
      if (t.isPublished !== false && t.profileVisibility !== 'hidden') {
        poolMap.set(t.id, t);
      }
    });
    if (currentRole === 'admin') {
      adminTutorProfiles.forEach(t => {
        poolMap.set(t.id, t);
      });
    }
    return Array.from(poolMap.values())
      .filter(t => matchesTutorSearchQuery(t, trimmedQuery, currentRole === 'admin' ? t.email : undefined))
      .sort((a, b) => scoreTutorSearchMatch(b, trimmedQuery) - scoreTutorSearchMatch(a, trimmedQuery))
      .slice(0, 6);
  }, [trimmedQuery, tutors, adminTutorProfiles, currentRole]);

  const matchingTuitionResults = React.useMemo(() => {
    if (!trimmedQuery) return [];
    const q = trimmedQuery.toLowerCase();
    return tuitionPosts
      .filter(post => {
        if (post.status !== 'open') return false;
        const hay = [
          post.title,
          post.learnerName,
          post.classGrade,
          post.district,
          post.area,
          ...post.subjects
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return q.split(/\s+/).every(tok => hay.includes(tok));
      })
      .slice(0, 3);
  }, [trimmedQuery, tuitionPosts]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rightControlsRef.current && !rightControlsRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      const inDesktopSearch = searchBoxRef.current?.contains(e.target as Node);
      const inMobileSearch = mobileSearchRef.current?.contains(e.target as Node);
      if (!inDesktopSearch && !inMobileSearch) {
        setIsSearchFocused(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setIsSearchFocused(false);
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const ensureDirectoryView = () => {
    if (activeView !== 'landing' && activeView !== 'tutors' && activeView !== 'tuitions') {
      setActiveView('landing');
      setMobileDetailOpen(false);
    }
  };

  const handleTutorPageAction = async () => {
    setOpenDropdown(null);
    if (currentRole === 'tutor') {
      setActiveView('tutor-onboarding');
    } else {
      await activateDualRole('tutor');
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 sm:h-[72px] bg-white/92 backdrop-blur-md border-b border-[#EFEAE7]">
      <div className="max-w-[1440px] h-full mx-auto px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 md:gap-6">
        {/* Zone 1: Brand Wordmark & Top-Level Nav */}
        <div className="flex items-center gap-5 shrink-0">
          <a
            href="/"
            aria-label="FeLoW WebStaR Home"
            onClick={(e) => {
              e.preventDefault();
              setOpenDropdown(null);
              setMobileDetailOpen(false);
              setDistrictFilter('All');
              setDirectoryTab('tutors');
              setActiveView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C68] rounded-xl -ml-2 min-[380px]:-ml-2.5 sm:-ml-3.5 pr-1 py-0.5 transition-all duration-150 hover:opacity-85 active:scale-[0.98]"
          >
            <img
              src="/assets/aistudio/felow-webstar-icon-color_69459cad.svg"
              alt=""
              aria-hidden="true"
              width={72}
              height={72}
              className="h-12 w-12 min-[380px]:h-14 min-[380px]:w-14 sm:h-[72px] sm:w-[72px] object-contain block shrink-0 select-none"
            />
            <img
              src="/assets/aistudio/felow-webstar-wordmark-color_a106cae2.svg"
              alt="FeLoW WebStaR"
              width={180}
              height={78}
              className="h-[56px] min-[380px]:h-[62px] sm:h-[78px] w-auto -ml-2 min-[380px]:-ml-2.5 sm:-ml-3 object-contain block select-none"
            />
          </a>

          <nav aria-label="Primary navigation" className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[#52525B]">
            <a
              href="/tutors"
              onClick={(e) => {
                e.preventDefault();
                setOpenDropdown(null);
                setMobileDetailOpen(false);
                setDistrictFilter('All');
                setDirectoryTab('tutors');
                setActiveView('tutors');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#18181B] transition-colors py-1 whitespace-nowrap ${
                activeView === 'tutors' || activeView === 'landing' ? 'text-[#18181B] font-extrabold underline decoration-[#EB624B] decoration-2 underline-offset-4' : ''
              }`}
            >
              {language === 'bn' ? 'টিউটর' : 'Find Tutors'}
            </a>
            <a
              href="/tuitions"
              onClick={(e) => {
                e.preventDefault();
                setOpenDropdown(null);
                setMobileDetailOpen(false);
                setDistrictFilter('All');
                setDirectoryTab('tuitions');
                setActiveView('tuitions');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#18181B] transition-colors py-1 whitespace-nowrap ${
                activeView === 'tuitions' ? 'text-[#18181B] font-extrabold underline decoration-[#EB624B] decoration-2 underline-offset-4' : ''
              }`}
            >
              {language === 'bn' ? 'টিউশন' : 'Tuitions'}
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => {
                e.preventDefault();
                setOpenDropdown(null);
                setMobileDetailOpen(false);
                setActiveView('how-it-works');
              }}
              className={`hover:text-[#18181B] transition-colors py-1 whitespace-nowrap ${
                activeView === 'how-it-works' ? 'text-[#18181B] font-extrabold underline decoration-[#EB624B] decoration-2 underline-offset-4' : ''
              }`}
            >
              {language === 'bn' ? 'কিভাবে কাজ করে' : 'How It Works'}
            </a>
          </nav>
        </div>

        {/* Zone 2: Desktop / Tablet Search + Instant Tutor Account Results + District Filter */}
        <div ref={searchBoxRef} className="hidden md:block flex-1 max-w-xl relative">
          <div className="flex items-center bg-[#F6F4F3] rounded-full border border-[#EAE4E1] focus-within:border-[#18181B] focus-within:bg-white transition-all overflow-hidden">
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="w-4 h-4 text-[#6B6B6B] ml-4 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && trimmedQuery) {
                    setIsSearchFocused(false);
                    if (matchingTutorResults.length > 0 && matchingTuitionResults.length === 0) {
                      setDirectoryTab('tutors');
                      setActiveView('tutors');
                    } else {
                      ensureDirectoryView();
                    }
                  }
                }}
                placeholder={
                  language === 'bn'
                    ? 'টিউটরের নাম, প্রোফাইল, বিষয় বা এলাকা খুঁজুন...'
                    : 'Search tutor name, profile, subject, area...'
                }
                className="w-full h-10 pl-2.5 pr-8 bg-transparent text-sm text-[#18181B] placeholder:text-[#858585] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="mr-2 w-6 h-6 rounded-full hover:bg-[#EAE4E1] flex items-center justify-center text-[#6B6B6B] hover:text-[#18181B] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center border-l border-[#EAE4E1] pl-2.5 pr-3.5 shrink-0">
              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  ensureDirectoryView();
                }}
                aria-label="Filter by district"
                className="h-10 bg-transparent text-xs font-bold text-[#18181B] focus:outline-none cursor-pointer"
              >
                <option value="All">{language === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
                {ALL_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Instant Tutor Accounts & Posts Dropdown */}
          {isSearchFocused && trimmedQuery.length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-white rounded-[24px] shadow-[0_14px_40px_rgba(24,24,27,0.12)] border border-[#EFEAE7] overflow-hidden z-50 max-h-[75vh] overflow-y-auto">
              <div className="px-4 py-2.5 bg-[#F8F6F5] border-b border-[#EFEAE7] flex items-center justify-between text-[11px] font-bold text-[#52525B]">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#EB624B]" />
                  <span>
                    {language === 'bn' ? 'টিউটর অ্যাকাউন্ট ও প্রোফাইল' : 'Tutor Accounts & Profiles'} ({matchingTutorResults.length})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    setDirectoryTab('tutors');
                    setActiveView('tutors');
                  }}
                  className="text-[#C94A35] hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'ডিরেক্টরিতে দেখুন →' : 'View in Tutors →'}
                </button>
              </div>

              {matchingTutorResults.length === 0 ? (
                <div className="px-4 py-3 text-xs text-[#6B6B6B]">
                  {language === 'bn'
                    ? `"${trimmedQuery}" নামে কোনো টিউটর প্রোফাইল পাওয়া যায়নি।`
                    : `No tutor accounts or profiles matched "${trimmedQuery}".`}
                </div>
              ) : (
                <div className="divide-y divide-[#F6F4F3]">
                  {matchingTutorResults.map(tutor => (
                    <button
                      key={tutor.id}
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        if (tutor.isPublished === false && currentRole === 'admin') {
                          openAdminUserProfile(tutor.uid || tutor.id);
                        } else {
                          viewTutorDetail(tutor);
                        }
                      }}
                      className="w-full px-4 py-2.5 hover:bg-[#FFF6F3] flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                          alt={tutor.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-[#EFEAE7] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-xs font-bold text-[#18181B]">
                            <span className="truncate">{tutor.name}</span>
                            {isTutorVerified(tutor) && (
                              <BadgeCheck className="w-3.5 h-3.5 text-[#F47C68] shrink-0" />
                            )}
                            {tutor.isPublished === false && (
                              <span className="text-[10px] font-semibold text-[#C94A35] ml-1">Draft</span>
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
                      <ArrowUpRight className="w-4 h-4 text-[#858585] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {matchingTuitionResults.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-[#F8F6F5] border-y border-[#EFEAE7] flex items-center justify-between text-[11px] font-bold text-[#52525B]">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>{language === 'bn' ? 'টিউশন পোস্ট' : 'Tuition Posts'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        setDirectoryTab('tuitions');
                        setActiveView('tuitions');
                      }}
                      className="text-[#15803D] hover:underline cursor-pointer"
                    >
                      {language === 'bn' ? 'টিউশনে দেখুন →' : 'View in Tuitions →'}
                    </button>
                  </div>
                  <div className="divide-y divide-[#F6F4F3]">
                    {matchingTuitionResults.map(post => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          viewTuitionDetail(post);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-[#DCEBFA]/35 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#18181B] truncate">{post.title}</div>
                          <div className="text-[11px] text-[#6B6B6B] truncate">
                            {post.classGrade} · {[post.area, post.district].filter(Boolean).join(', ')} · ৳
                            {post.salaryOfferBDT.toLocaleString()}/mo
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#858585] shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: Mobile Search Trigger + Primary Post CTA + Account Controls */}
        <div className="flex items-center gap-2 shrink-0 relative" ref={rightControlsRef}>
          <button
            type="button"
            onClick={() => {
              setOpenDropdown(null);
              setIsMobileSearchOpen(prev => !prev);
            }}
            aria-label="Search tutors"
            className="md:hidden w-10 h-10 rounded-full bg-[#F6F4F3] hover:bg-[#EFEAFF] text-[#18181B] flex items-center justify-center cursor-pointer transition-colors"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenDropdown(null);
              if (!isAuthenticated) {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
                return;
              }
              openCreateTuitionModal();
            }}
            className="hidden sm:inline-flex h-10 px-4 bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs sm:text-sm font-bold rounded-full items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{language === 'bn' ? 'টিউশন পোস্ট' : 'Post Tuition'}</span>
          </button>

          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(prev => (prev === 'notif' ? null : 'notif'))}
                  aria-label="Notifications"
                  aria-expanded={openDropdown === 'notif'}
                  className={`w-10 h-10 rounded-full flex items-center justify-center relative cursor-pointer transition-colors ${
                    openDropdown === 'notif'
                      ? 'bg-[#EFEAFF] text-[#18181B]'
                      : 'bg-[#F6F4F3] hover:bg-[#EFEAFF] text-[#18181B]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EB624B] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {openDropdown === 'notif' && (
                  <div className="absolute right-0 top-12 w-[min(92vw,340px)] bg-white rounded-[24px] shadow-[0_12px_36px_rgba(24,24,27,0.08)] border border-[#EFEAE7] overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#EFEAE7] flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[#18181B]">
                        {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                      </span>
                      <div className="flex items-center gap-2.5">
                        {currentRole === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveView('admin');
                              setOpenDropdown(null);
                            }}
                            className="text-xs font-bold text-[#18181B] hover:text-[#EB624B] cursor-pointer"
                          >
                            {language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Portal'}
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="text-xs font-semibold text-[#C94A35] hover:underline cursor-pointer"
                          >
                            {language === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}
                          </button>
                        )}
                      </div>
                    </div>

                    {browserNotifPermission === 'default' && (
                      <div className="px-4 py-2.5 bg-[#EFEAFF]/65 border-b border-[#E1D8FF] flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-[#18181B]">
                          {language === 'bn'
                            ? 'ট্যাবের বাইরেও লাইভ অ্যালার্ট পান'
                            : 'Get live alerts outside this tab'}
                        </span>
                        <button
                          type="button"
                          onClick={requestBrowserNotifications}
                          className="h-7 px-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <BellRing className="w-3 h-3" />
                          <span>{language === 'bn' ? 'চালু করুন' : 'Enable'}</span>
                        </button>
                      </div>
                    )}

                    {browserNotifPermission === 'granted' && (
                      <div className="px-4 py-1.5 bg-[#E8F8EE]/80 border-b border-[#C6EBD5] flex items-center gap-1.5 text-[11px] font-semibold text-[#15803D]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {language === 'bn'
                            ? 'ব্রাউজার ও ইন-অ্যাপ নোটিফিকেশন চালু আছে'
                            : 'In-app & browser alerts active'}
                        </span>
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#FFF3EF]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[#858585]">
                          {language === 'bn' ? 'কোনো নোটিফিকেশন নেই।' : 'No notifications yet.'}
                        </div>
                      ) : (
                        notifications.slice(0, 15).map(n => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              handleNotificationClick(n);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-[#FFF3EF] transition-colors cursor-pointer ${
                              !n.read ? 'bg-[#DCEBFA]/45' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs font-semibold text-[#252525]">{n.title}</div>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-[#EB624B] mt-1 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-[#858585] line-clamp-2 mt-0.5">{n.message}</div>
                            <div className="text-[11px] text-[#C94A35] font-medium mt-1">{n.time}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(prev => (prev === 'account' ? null : 'account'))}
                  aria-label="Account menu"
                  aria-expanded={openDropdown === 'account'}
                  className="p-0.5 rounded-full hover:ring-2 hover:ring-[#F47C68]/50 cursor-pointer transition-all"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-[#F1E1DC]"
                  />
                </button>

                {openDropdown === 'account' && (
                  <div className="absolute right-0 top-12 w-[min(90vw,288px)] bg-white rounded-[24px] shadow-[0_12px_36px_rgba(24,24,27,0.08)] border border-[#EFEAE7] p-2 z-50 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('dashboard');
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#F6F4F3] text-left cursor-pointer"
                    >
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-[#EFEAE7] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#18181B] truncate">{currentUser.name}</div>
                        <div className="text-xs text-[#6B6B6B]">
                          {currentRole === 'tutor'
                            ? 'Tutor Page'
                            : currentRole === 'admin'
                              ? 'Admin'
                              : 'Student / Parent'}
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-[#EFEAE7] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('dashboard');
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF6F3] text-sm font-medium text-[#18181B] cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#6B6B6B] shrink-0" />
                      <span>{language === 'bn' ? 'আমার প্রোফাইল ও সেভ' : 'My Profile & Saved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTutorPageAction}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#EFEAFF]/70 text-sm font-medium text-[#18181B] cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4 text-[#EB624B] shrink-0" />
                      <span>
                        {currentRole === 'tutor'
                          ? (language === 'bn' ? 'টিউটর পেজ এডিট করুন' : 'Edit My Tutor Page')
                          : (language === 'bn' ? 'টিউটর পেজ তৈরি করুন' : 'Create Tutor Page')}
                      </span>
                    </button>

                    {currentRole !== 'admin' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextRole = currentRole === 'tutor' ? 'learner' : 'tutor';
                          setOpenDropdown(null);
                          await switchUserRole(nextRole);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF4D6]/60 text-sm font-medium text-[#18181B] cursor-pointer"
                      >
                        <Repeat className="w-4 h-4 text-[#C94A35] shrink-0" />
                        <span>
                          {currentRole === 'tutor'
                            ? (language === 'bn' ? 'স্টুডেন্ট মোডে যান' : 'Switch to Student / Parent')
                            : (language === 'bn' ? 'টিউটর মোডে যান' : 'Switch to Tutor Mode')}
                        </span>
                      </button>
                    )}

                    {currentRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView('admin');
                          setOpenDropdown(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#DCEBFA]/60 text-sm font-medium text-[#18181B] cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-[#EB624B] shrink-0" />
                        <span>Admin Moderation</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F6F4F3] text-sm font-medium text-[#18181B] cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-[#6B6B6B] shrink-0" />
                        <span>Language / ভাষা</span>
                      </span>
                      <span className="text-xs font-bold text-[#EB624B]">
                        {language === 'en' ? 'EN' : 'বাংলা'}
                      </span>
                    </button>

                    <div className="border-t border-[#EFEAE7] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        logoutUser();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF6F3] text-sm font-medium text-[#18181B] cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-[#6B6B6B] shrink-0" />
                      <span>{language === 'bn' ? 'লগ আউট' : 'Log Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="h-9 px-3.5 rounded-full text-xs font-semibold text-[#18181B] bg-[#F6F4F3] hover:bg-[#EFEAFF] cursor-pointer whitespace-nowrap transition-colors"
              >
                {language === 'en' ? 'বাংলা' : 'EN'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(null);
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="h-9 sm:h-10 px-4 bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {language === 'bn' ? 'সাইন ইন' : 'Sign In'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expandable Mobile Global Tutor Search Drawer */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden bg-white border-b border-[#EFEAE7] px-3 py-3 space-y-2.5 shadow-lg"
        >
          <div className="flex items-center bg-[#F6F4F3] rounded-full border border-[#EAE4E1] focus-within:border-[#18181B] focus-within:bg-white px-3.5 h-11">
            <Search className="w-4 h-4 text-[#6B6B6B] shrink-0 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'টিউটরের নাম, প্রোফাইল, বিষয় খুঁজুন...'
                  : 'Search tutor name, profile, subject...'
              }
              className="flex-1 min-w-0 bg-transparent px-2.5 text-sm text-[#18181B] placeholder:text-[#858585] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear mobile search"
                className="w-7 h-7 rounded-full hover:bg-[#EAE4E1] flex items-center justify-center text-[#52525B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {trimmedQuery.length > 0 && (
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-[#EFEAE7] divide-y divide-[#F6F4F3] bg-white">
              {matchingTutorResults.length === 0 && matchingTuitionResults.length === 0 ? (
                <div className="p-3 text-xs text-[#6B6B6B]">
                  {language === 'bn'
                    ? `"${trimmedQuery}" নামে কোনো টিউটর বা পোস্ট পাওয়া যায়নি।`
                    : `No matching tutors or posts for "${trimmedQuery}".`}
                </div>
              ) : (
                <>
                  {matchingTutorResults.map(tutor => (
                    <button
                      key={tutor.id}
                      type="button"
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        if (tutor.isPublished === false && currentRole === 'admin') {
                          openAdminUserProfile(tutor.uid || tutor.id);
                        } else {
                          viewTutorDetail(tutor);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left hover:bg-[#FFF6F3]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                          alt={tutor.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#18181B] truncate">{tutor.name}</div>
                          <div className="text-[11px] text-[#6B6B6B] truncate">
                            {[tutor.university, tutor.district].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#858585] shrink-0" />
                    </button>
                  ))}
                  {matchingTuitionResults.map(post => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        viewTuitionDetail(post);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left hover:bg-[#DCEBFA]/35"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#18181B] truncate">{post.title}</div>
                        <div className="text-[11px] text-[#6B6B6B] truncate">
                          Tuition · {post.district} · ৳{post.salaryOfferBDT.toLocaleString()}/mo
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#858585] shrink-0" />
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
