import React, { useState } from 'react';
import {
  LayoutList,
  PlusCircle,
  User,
  GraduationCap,
  Bookmark,
  Repeat,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
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
    savedTutorIds,
    savedTuitionIds,
    language,
    setLanguage
  } = useApp();

  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const savedCount = savedTutorIds.length + savedTuitionIds.length;
  const isBrowseActive =
    !isAccountOpen &&
    (activeView === 'landing' ||
      activeView === 'tutors' ||
      activeView === 'tuitions' ||
      activeView === 'tutor-detail' ||
      activeView === 'tuition-detail');

  const requireAuthOrRun = (action: () => void) => {
    setIsAccountOpen(false);
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    action();
  };

  return (
    <>
      {isAccountOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-14 z-30 bg-[#FFFFFF] overflow-y-auto p-4 space-y-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#252525]">
              {language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
            </h2>
            <button
              type="button"
              onClick={() => setIsAccountOpen(false)}
              aria-label="Close account sheet"
              className="w-9 h-9 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                setActiveView('dashboard');
                setIsAccountOpen(false);
              }}
              className="w-full ivory-card p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-[#F1E1DC] shrink-0"
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
              </div>
              <ChevronRight className="w-4 h-4 text-[#858585] shrink-0" />
            </button>
          ) : (
            <div className="ivory-card p-4 space-y-3 bg-[#FFF3EF]/50">
              <div className="text-sm font-bold text-[#252525]">
                {language === 'bn' ? 'FeLoW WebStaR-এ যোগ দিন' : 'Sign in with Google'}
              </div>
              <p className="text-xs text-[#858585] leading-relaxed">
                {language === 'bn'
                  ? 'টিউশন পোস্ট করতে বা টিউটরদের WhatsApp করতে সাইন ইন করুন।'
                  : 'Sign in to message tutors on WhatsApp, save favorites, or post tuitions.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsAccountOpen(false);
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="w-full h-11 bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-sm font-bold rounded-full cursor-pointer transition-all"
              >
                {language === 'bn' ? 'Google দিয়ে সাইন ইন' : 'Continue with Google'}
              </button>
            </div>
          )}

          <div className="ivory-card divide-y divide-[#F1E1DC] overflow-hidden">
            <button
              type="button"
              onClick={() =>
                requireAuthOrRun(async () => {
                  if (currentRole === 'tutor') {
                    setActiveView('tutor-onboarding');
                  } else {
                    await activateDualRole('tutor');
                  }
                })
              }
              className="w-full px-4 py-3.5 flex items-center gap-3 text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#F47C68] shrink-0" />
              <span>
                {currentRole === 'tutor'
                  ? (language === 'bn' ? 'টিউটর পেজ এডিট' : 'Edit My Tutor Page')
                  : (language === 'bn' ? 'টিউটর পেজ তৈরি' : 'Create Tutor Page')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => requireAuthOrRun(() => setActiveView('dashboard'))}
              className="w-full px-4 py-3.5 flex items-center justify-between text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-[#F47C68] shrink-0" />
                <span>{language === 'bn' ? 'আমার প্রোফাইল ও সেভ' : 'My Profile & Saved'}</span>
              </span>
              {isAuthenticated && savedCount > 0 && (
                <span className="text-xs font-mono font-bold text-[#C94A35] tabular-nums">
                  {savedCount}
                </span>
              )}
            </button>

            {isAuthenticated && currentRole !== 'admin' && (
              <button
                type="button"
                onClick={async () => {
                  const nextRole = currentRole === 'tutor' ? 'learner' : 'tutor';
                  setIsAccountOpen(false);
                  await switchUserRole(nextRole);
                }}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
              >
                <Repeat className="w-4 h-4 text-[#F5A04E] shrink-0" />
                <span>
                  {currentRole === 'tutor'
                    ? (language === 'bn' ? 'স্টুডেন্ট মোড' : 'Switch to Student / Parent')
                    : (language === 'bn' ? 'টিউটর মোড' : 'Switch to Tutor Mode')}
                </span>
              </button>
            )}

            {isAuthenticated && currentRole === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setActiveView('admin');
                  setIsAccountOpen(false);
                }}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#F47C68] shrink-0" />
                <span>Admin Moderation</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#858585] shrink-0" />
                <span>Language / ভাষা</span>
              </span>
              <span className="text-xs font-bold text-[#C94A35]">
                {language === 'en' ? 'English' : 'বাংলা'}
              </span>
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  setIsAccountOpen(false);
                }}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#858585] shrink-0" />
                <span>{language === 'bn' ? 'লগ আউট' : 'Log Out'}</span>
              </button>
            )}
          </div>

          <div className="pt-6 pb-8 flex justify-center">
            <img
              src="/assets/aistudio/felow-webstar-color_11ef6d13.svg"
              alt="FeLoW WebStaR"
              className="w-[min(86vw,360px)] max-w-full h-auto block select-none"
            />
          </div>
        </div>
      )}

      {/* Compact 3-Action Mobile Bottom Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur-sm border-t border-[#F1E1DC] flex items-center justify-around px-2"
      >
        <button
          type="button"
          onClick={() => {
            setIsAccountOpen(false);
            setMobileDetailOpen(false);
            setActiveView('landing');
          }}
          className={`h-10 px-4 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            isBrowseActive ? 'bg-[#DCEBFA] text-[#252525]' : 'text-[#858585]'
          }`}
        >
          <LayoutList className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">
            {language === 'bn' ? 'ডিরেক্টরি' : 'Browse'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => requireAuthOrRun(openCreateTuitionModal)}
          className="h-10 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all shadow-xs"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">
            {language === 'bn' ? 'পোস্ট' : 'Post'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsAccountOpen(prev => !prev)}
          aria-expanded={isAccountOpen}
          className={`h-10 px-4 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            isAccountOpen ||
            activeView === 'dashboard' ||
            activeView === 'admin' ||
            activeView === 'tutor-onboarding'
              ? 'bg-[#DCEBFA] text-[#252525]'
              : 'text-[#858585]'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">
            {language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
          </span>
        </button>
      </nav>
    </>
  );
};
