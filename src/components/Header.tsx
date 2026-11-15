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
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BD_DISTRICTS_BY_DIVISION } from '../data/bangladeshData';

const ALL_DISTRICTS = Array.from(new Set(Object.values(BD_DISTRICTS_BY_DIVISION).flat())).sort();

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
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
    language,
    setLanguage
  } = useApp();

  const [openDropdown, setOpenDropdown] = useState<'notif' | 'account' | null>(null);
  const rightControlsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rightControlsRef.current && !rightControlsRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
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
    <header className="sticky top-0 z-40 h-16 sm:h-[72px] bg-white/95 backdrop-blur-sm border-b border-[#F1E1DC]">
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
              setActiveView('landing');
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

          <nav aria-label="Primary navigation" className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[#252525]">
            <a
              href="/tutors"
              onClick={(e) => {
                e.preventDefault();
                setOpenDropdown(null);
                setMobileDetailOpen(false);
                setDistrictFilter('All');
                setActiveView('tutors');
              }}
              className={`hover:text-[#C94A35] transition-colors py-1 whitespace-nowrap ${
                activeView === 'tutors' ? 'text-[#C94A35] underline underline-offset-4' : ''
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
                setActiveView('tuitions');
              }}
              className={`hover:text-[#C94A35] transition-colors py-1 whitespace-nowrap ${
                activeView === 'tuitions' ? 'text-[#C94A35] underline underline-offset-4' : ''
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
              className={`hover:text-[#C94A35] transition-colors py-1 whitespace-nowrap ${
                activeView === 'how-it-works' ? 'text-[#C94A35] underline underline-offset-4' : ''
              }`}
            >
              {language === 'bn' ? 'কিভাবে কাজ করে' : 'How It Works'}
            </a>
          </nav>
        </div>

        {/* Zone 2: Desktop / Tablet Search + District Filter */}
        <div className="hidden md:flex flex-1 max-w-xl items-center bg-[#FFF3EF] rounded-full border border-[#F3D5CC]/70 focus-within:border-[#F47C68] focus-within:bg-white transition-colors overflow-hidden">
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-4 h-4 text-[#858585] ml-4 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                ensureDirectoryView();
              }}
              placeholder={
                language === 'bn' ? 'টিউটর, বিষয় বা এলাকা খুঁজুন...' : 'Search tutor, subject, area...'
              }
              className="w-full h-10 pl-2.5 pr-8 bg-transparent text-sm text-[#252525] placeholder:text-[#858585] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="mr-2 w-6 h-6 rounded-full hover:bg-[#FFE6DD] flex items-center justify-center text-[#858585] hover:text-[#252525] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center border-l border-[#F3D5CC] pl-2.5 pr-3.5 shrink-0">
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                ensureDirectoryView();
              }}
              aria-label="Filter by district"
              className="h-10 bg-transparent text-xs font-semibold text-[#252525] focus:outline-none cursor-pointer"
            >
              <option value="All">{language === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
              {ALL_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 3: Primary Post CTA + Account Controls */}
        <div className="flex items-center gap-2 shrink-0 relative" ref={rightControlsRef}>
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
            className="hidden sm:inline-flex h-10 px-4 bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold rounded-full items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap shrink-0 shadow-xs"
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
                      ? 'bg-[#DCEBFA] text-[#252525]'
                      : 'bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F47C68] text-[#252525] text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {openDropdown === 'notif' && (
                  <div className="absolute right-0 top-12 w-[min(92vw,320px)] bg-white rounded-2xl shadow-xl border border-[#F1E1DC] overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#F1E1DC] flex items-center justify-between">
                      <span className="font-bold text-sm text-[#252525]">
                        {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                      </span>
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
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#FFF3EF]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[#858585]">
                          {language === 'bn' ? 'কোনো নোটিফিকেশন নেই।' : 'No notifications yet.'}
                        </div>
                      ) : (
                        notifications.slice(0, 8).map(n => (
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
                            <div className="text-xs font-semibold text-[#252525]">{n.title}</div>
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
                  <div className="absolute right-0 top-12 w-[min(90vw,288px)] bg-white rounded-2xl shadow-xl border border-[#F1E1DC] p-2 z-50 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('dashboard');
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FFF3EF] text-left cursor-pointer"
                    >
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-[#F1E1DC] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#252525] truncate">{currentUser.name}</div>
                        <div className="text-xs text-[#858585]">
                          {currentRole === 'tutor'
                            ? 'Tutor Page'
                            : currentRole === 'admin'
                              ? 'Admin'
                              : 'Student / Parent'}
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-[#F1E1DC] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('dashboard');
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF3EF] text-sm font-medium text-[#252525] cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#858585] shrink-0" />
                      <span>{language === 'bn' ? 'আমার প্রোফাইল ও সেভ' : 'My Profile & Saved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTutorPageAction}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF3EF] text-sm font-medium text-[#252525] cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4 text-[#F47C68] shrink-0" />
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF3EF] text-sm font-medium text-[#252525] cursor-pointer"
                      >
                        <Repeat className="w-4 h-4 text-[#F5A04E] shrink-0" />
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF3EF] text-sm font-medium text-[#252525] cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-[#F47C68] shrink-0" />
                        <span>Admin Moderation</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FFF3EF] text-sm font-medium text-[#252525] cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-[#858585] shrink-0" />
                        <span>Language / ভাষা</span>
                      </span>
                      <span className="text-xs font-bold text-[#C94A35]">
                        {language === 'en' ? 'EN' : 'বাংলা'}
                      </span>
                    </button>

                    <div className="border-t border-[#F1E1DC] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        logoutUser();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF3EF] text-sm font-medium text-[#252525] cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-[#858585] shrink-0" />
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
                className="h-9 px-3.5 rounded-full text-xs font-semibold text-[#252525] bg-[#FFF3EF] hover:bg-[#FFE6DD] cursor-pointer whitespace-nowrap transition-colors"
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
                className="h-9 sm:h-10 px-4 bg-[#FFF3EF] border border-[#F3D5CC] hover:bg-[#FFE6DD] text-[#252525] text-xs sm:text-sm font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {language === 'bn' ? 'সাইন ইন' : 'Sign In'}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
