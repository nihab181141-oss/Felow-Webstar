import React, { useState } from 'react';
import { MotionConfig, motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Briefcase,
  PlusCircle,
  User,
  GraduationCap,
  Bookmark,
  Repeat,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  Settings,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandWordmark } from './shared/BrandWordmark';

type DockTabId = 'tutors' | 'tuitions' | 'post' | 'account';

export const MobileBottomNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
    directoryTab,
    setDirectoryTab,
    setMobileDetailOpen,
    currentUser,
    currentRole,
    isAuthenticated,
    switchUserRole,
    activateDualRole,
    openCreateTuitionModal,
    isPostTuitionOpen,
    logoutUser,
    setIsAuthModalOpen,
    setAuthModalMode,
    savedTutorIds,
    savedTuitionIds,
    notifications,
    language,
    setLanguage
  } = useApp();

  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const isBn = language === 'bn';
  const savedCount = savedTutorIds.length + savedTuitionIds.length;
  const unreadCount = notifications.filter(n => !n.read).length;

  const isDirectoryView =
    activeView === 'landing' ||
    activeView === 'tutors' ||
    activeView === 'tuitions';

  const activeDockTab: DockTabId = (() => {
    if (isPostTuitionOpen) return 'post';
    if (
      isAccountOpen ||
      activeView === 'dashboard' ||
      activeView === 'admin' ||
      activeView === 'tutor-onboarding'
    ) {
      return 'account';
    }
    if (activeView === 'tuition-detail' || (isDirectoryView && directoryTab === 'tuitions')) {
      return 'tuitions';
    }
    return 'tutors';
  })();

  const requireAuthOrRun = (action: () => void) => {
    setIsAccountOpen(false);
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    action();
  };

  const handleDockSelect = (tab: DockTabId) => {
    if (tab === 'tutors') {
      setIsAccountOpen(false);
      setMobileDetailOpen(false);
      setDirectoryTab('tutors');
      setActiveView('tutors');
      return;
    }
    if (tab === 'tuitions') {
      setIsAccountOpen(false);
      setMobileDetailOpen(false);
      setDirectoryTab('tuitions');
      setActiveView('tuitions');
      return;
    }
    if (tab === 'post') {
      requireAuthOrRun(openCreateTuitionModal);
      return;
    }
    setIsAccountOpen(prev => !prev);
  };

  const dockItems: Array<{
    id: DockTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'tutors',
      label: isBn ? 'টিউটর' : 'Tutors',
      icon: Users
    },
    {
      id: 'tuitions',
      label: isBn ? 'টিউশন' : 'Tuitions',
      icon: Briefcase
    },
    {
      id: 'post',
      label: isBn ? 'পোস্ট' : 'Post',
      icon: PlusCircle
    },
    {
      id: 'account',
      label: isBn ? 'অ্যাকাউন্ট' : 'Account',
      icon: User,
      badge: isAuthenticated ? unreadCount : 0
    }
  ];

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isAccountOpen && (
          <motion.div
            key="mobile-account-drawer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden fixed inset-x-0 top-16 bottom-16 z-30 bg-[#FFFFFF] overflow-y-auto p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#252525]">
                {isBn ? 'অ্যাকাউন্ট' : 'Account'}
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
                          : 'Student / Guardian'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#858585] shrink-0" />
              </button>
            ) : (
              <div className="ivory-card p-4 space-y-3 bg-[#FFF3EF]/50">
                <div className="text-sm font-bold text-[#252525]">
                  {isBn ? <><BrandWordmark />-এ যোগ দিন</> : 'Sign in with Google'}
                </div>
                <p className="text-xs text-[#858585] leading-relaxed">
                  {isBn
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
                  {isBn ? 'Google দিয়ে সাইন ইন' : 'Continue with Google'}
                </button>
              </div>
            )}

            <div className="ivory-card divide-y divide-[#F1E1DC] overflow-hidden">
              <button
                type="button"
                onClick={() => requireAuthOrRun(() => setActiveView('dashboard'))}
                className="w-full px-4 py-3.5 flex items-center justify-between text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Bookmark className="w-4 h-4 text-[#F47C68] shrink-0" />
                  <span>{isBn ? 'আমার প্রোফাইল ও সেভ' : 'My Profile & Saved'}</span>
                </span>
                {isAuthenticated && savedCount > 0 && (
                  <span className="text-xs font-mono font-bold text-[#C94A35] tabular-nums">
                    {savedCount}
                  </span>
                )}
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('dashboard');
                    setIsAccountOpen(false);
                  }}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-sm font-medium text-[#252525] hover:bg-[#FFF3EF]/60 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#858585] shrink-0" />
                  <span>{isBn ? 'অ্যাকাউন্ট সেটিংস ও ডিলিট' : 'Account Settings & Delete'}</span>
                </button>
              )}

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
                    ? (isBn ? 'টিউটর পেজ এডিট' : 'Edit My Tutor Page')
                    : (isBn ? 'টিউটর পেজ তৈরি' : 'Create Tutor Page')}
                </span>
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
                      ? (isBn ? 'স্টুডেন্ট / গার্জিয়ান মোড' : 'Switch to Student / Guardian')
                      : (isBn ? 'টিউটর মোড' : 'Switch to Tutor Mode')}
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
                  <span>{isBn ? 'লগ আউট' : 'Log Out'}</span>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standard Docked 4-Option Bottom Navigation Bar with Sliding Icon-to-Icon Transition */}
      <nav
        aria-label="Mobile docked navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F1E1DC] shadow-[0_-4px_24px_rgba(37,37,37,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1.5">
          {dockItems.map(item => {
            const Icon = item.icon;
            const isActive = activeDockTab === item.id;
            const isPostTab = item.id === 'post';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleDockSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={item.id === 'account' ? isAccountOpen : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C68] rounded-xl"
              >
                {/* Smooth Sliding Top Bar */}
                {isActive && (
                  <motion.span
                    layoutId="docked-nav-top-bar"
                    transition={{ type: 'spring', stiffness: 580, damping: 38, mass: 0.5 }}
                    className="absolute top-0 w-9 h-[3px] rounded-b-full bg-[#F47C68]"
                  />
                )}

                {/* Smooth Sliding Pill Highlight Behind Icon */}
                <div className="relative flex items-center justify-center w-12 h-7">
                  {isActive && (
                    <motion.span
                      layoutId="docked-nav-pill"
                      transition={{ type: 'spring', stiffness: 580, damping: 38, mass: 0.5 }}
                      className={`absolute inset-0 rounded-full ${
                        isPostTab ? 'bg-[#F47C68]/25' : 'bg-[#FFF3EF]'
                      }`}
                    />
                  )}
                  <motion.span
                    animate={{
                      y: isActive ? -1 : 0,
                      scale: isActive ? 1.08 : 1
                    }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative z-10 flex items-center justify-center ${
                      isActive
                        ? 'text-[#C94A35]'
                        : isPostTab
                        ? 'text-[#F47C68]'
                        : 'text-[#858585]'
                    }`}
                  >
                    <Icon className="w-[19px] h-[19px] shrink-0" />
                  </motion.span>

                  {item.badge ? (
                    <span className="absolute -top-0.5 right-1.5 z-20 min-w-[15px] h-[15px] px-1 rounded-full bg-[#F47C68] text-[#252525] text-[9px] font-bold flex items-center justify-center tabular-nums">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>

                <span
                  className={`text-[11px] leading-none transition-colors duration-150 ${
                    isActive
                      ? 'font-bold text-[#252525]'
                      : isPostTab
                      ? 'font-semibold text-[#252525]'
                      : 'font-medium text-[#858585]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </MotionConfig>
  );
};
