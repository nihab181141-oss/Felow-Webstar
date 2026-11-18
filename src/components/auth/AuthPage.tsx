import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Globe,
  X,
  ShieldCheck,
  Users,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandWordmark } from '../shared/BrandWordmark';

type RoleChoice = 'learner' | 'tutor';

export const AuthPage: React.FC = () => {
  const {
    loginWithGoogleUser,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    authPortalChoice,
    setAuthPortalChoice,
    language,
    setLanguage
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<RoleChoice>(authPortalChoice);
  const [learnerSubtype, setLearnerSubtype] = useState<'guardian' | 'student'>('guardian');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  React.useEffect(() => {
    setSelectedRole(authPortalChoice);
  }, [authPortalChoice]);

  const handleSelectPortal = (portal: RoleChoice) => {
    setSelectedRole(portal);
    setAuthPortalChoice(portal);
    setErrorMessage('');
  };

  const isSignInMode = authModalMode === 'login';

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginWithGoogleUser(selectedRole, learnerSubtype);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: Array<{
    id: RoleChoice;
    portalTagEn: string;
    portalTagBn: string;
    labelEn: string;
    labelBn: string;
    hintEn: string;
    hintBn: string;
    Icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'learner',
      portalTagEn: 'Portal 01 · Learning',
      portalTagBn: 'পোর্টাল ০১ · শিক্ষার্থী/অভিভাবক',
      labelEn: 'Student / Guardian Login',
      labelBn: 'শিক্ষার্থী / অভিভাবক লগইন',
      hintEn: 'Find verified tutors, post tuitions & contact on WhatsApp',
      hintBn: 'টিউটর খুঁজুন, টিউশন পোস্ট করুন ও WhatsApp-এ যোগাযোগ করুন',
      Icon: Users
    },
    {
      id: 'tutor',
      portalTagEn: 'Portal 02 · Teaching',
      portalTagBn: 'পোর্টাল ০২ · টিউটর',
      labelEn: 'Tutor Login',
      labelBn: 'টিউটর লগইন',
      hintEn: 'Manage your Tutor Page, get verified & apply for tuitions',
      hintBn: 'টিউটর পেজ পরিচালনা করুন, ভেরিফিকেশন নিন ও টিউশনে আবেদন করুন',
      Icon: GraduationCap
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#FCFBFA] flex flex-col lg:grid lg:grid-cols-12 overflow-x-clip">
      {/* Top / Left Editorial Brand Section */}
      <section className="lg:col-span-6 bg-[#FCFBFA] flex flex-col justify-between relative">
        {/* Top Navigation Utility Bar */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="h-10 px-4 rounded-full bg-white hover:bg-[#F6F4F3] border border-[#EFEAE7] text-xs font-semibold text-[#18181B] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{language === 'bn' ? 'ডিরেক্টরিতে ফিরুন' : 'Back to Directory'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="h-10 px-4 rounded-full bg-white hover:bg-[#F6F4F3] border border-[#EFEAE7] text-xs font-semibold text-[#18181B] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>

        {/* Center Logo & Brand Copy */}
        <div className="px-5 sm:px-10 py-8 sm:py-10 flex-1 flex flex-col items-center justify-center text-center gap-5 max-w-lg mx-auto w-full">
          <img
            src="/assets/aistudio/felow-webstar-color_11ef6d13.svg"
            alt="FeLoW WebStaR"
            className="w-44 sm:w-52 lg:w-60 h-auto block select-none"
          />

          <p className="text-base sm:text-lg text-[#252525] font-medium leading-relaxed text-balance">
            {language === 'bn'
              ? 'শিক্ষার্থী/অভিভাবক এবং টিউটর অ্যাকাউন্ট সম্পূর্ণ আলাদা। একই জিমেইল ব্যবহার করলেও প্রতিটি অ্যাকাউন্ট নিজের পোর্টালে সুরক্ষিত থাকে।'
              : 'Student/Guardian and Tutor portals remain completely separate—even when signing in with the same Gmail account.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#858585]">
            <span>{language === 'bn' ? 'যাচাইকৃত টিউটর' : 'Verified university tutors'}</span>
            <span aria-hidden="true">·</span>
            <span>{language === 'bn' ? 'সারা বাংলাদেশে' : 'Across Bangladesh'}</span>
            <span aria-hidden="true">·</span>
            <span>{language === 'bn' ? 'সরাসরি WhatsApp' : 'Direct WhatsApp contact'}</span>
          </div>
        </div>

        {/* Smooth Mobile Wave Transition into Coral Action Canvas */}
        <div className="lg:hidden w-full overflow-hidden leading-none -mb-px pointer-events-none" aria-hidden="true">
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="w-full h-12 sm:h-16 block"
          >
            <path
              d="M0,36 C360,115 1080,-10 1440,56 L1440,120 L0,120 Z"
              fill="#EB624B"
            />
          </svg>
        </div>
      </section>

      {/* Bottom / Right Action & Role Selection Canvas */}
      <section className="lg:col-span-6 bg-gradient-to-b from-[#EB624B] via-[#E45A43] to-[#D64B35] text-white px-5 sm:px-10 lg:px-12 pt-5 pb-10 lg:py-12 flex flex-col justify-center lg:rounded-l-[40px] flex-1">
        <div className="max-w-md w-full mx-auto space-y-5">
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-white flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
              {language === 'bn' ? (
                <>
                  <img
                    src="/assets/aistudio/felow-webstar-side-by-side_1__1df0def6.svg"
                    alt="FeLoW WebStaR"
                    className="h-[0.95em] w-auto shrink-0 brightness-0 invert select-none"
                  />
                  <span>-এ আলাদা লগইন পোর্টাল</span>
                </>
              ) : (
                <>
                  <span>Choose Your</span>
                  <img
                    src="/assets/aistudio/felow-webstar-side-by-side_1__1df0def6.svg"
                    alt="FeLoW WebStaR"
                    className="h-[0.95em] w-auto shrink-0 brightness-0 invert select-none"
                  />
                  <span>Portal</span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-white/95 font-medium leading-relaxed text-balance">
              {language === 'bn'
                ? 'টিউটর ও গার্জিয়ান অ্যাকাউন্ট আলাদাভাবে লগইন করুন। কোনো স্বয়ংক্রিয় রোল সুইচ নেই।'
                : 'Select Student/Guardian or Tutor login. Accounts stay strictly isolated.'}
            </p>
          </div>

          {/* Segmented Portal Switcher Tabs */}
          <div
            className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-black/15 border border-white/25"
            role="tablist"
            aria-label={language === 'bn' ? 'লগইন পোর্টাল নির্বাচন' : 'Select login portal'}
          >
            {roleOptions.map((option) => {
              const isSelected = selectedRole === option.id;
              const Icon = option.Icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectPortal(option.id)}
                  className={`h-10 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-[#18181B] shadow-sm'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#EB624B]' : 'text-white'}`} />
                  <span className="truncate">
                    {language === 'bn' ? option.labelBn : option.labelEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Portal Selection Cards */}
          <div className="space-y-2.5" role="radiogroup" aria-label="Choose your login portal">
            {roleOptions.map((option) => {
              const isSelected = selectedRole === option.id;
              const Icon = option.Icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectPortal(option.id)}
                  className={`w-full min-h-[72px] px-4 py-3 rounded-[24px] bg-white text-left flex items-center gap-3.5 cursor-pointer transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#E45A43] ${
                    isSelected
                      ? 'ring-4 ring-white/45 shadow-lg'
                      : 'opacity-85 hover:opacity-100 shadow-sm'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#FFF6F3] text-[#EB624B]'
                        : 'bg-[#F6F4F3] text-[#52525B]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="w-px h-8 bg-[#EFEAE7] shrink-0" aria-hidden="true" />

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#EB624B]">
                      {language === 'bn' ? option.portalTagBn : option.portalTagEn}
                    </div>
                    <div className="font-display text-base font-extrabold text-[#18181B] leading-tight truncate">
                      {language === 'bn' ? option.labelBn : option.labelEn}
                    </div>
                    <div className="text-xs text-[#6B6B6B] leading-snug line-clamp-1 mt-0.5">
                      {language === 'bn' ? option.hintBn : option.hintEn}
                    </div>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#18181B] text-white'
                        : 'bg-[#F6F4F3] text-transparent border border-[#EAE4E1]'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

          {selectedRole === 'learner' && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs">
              <span className="text-white/95 font-medium pl-1">
                {language === 'bn' ? 'আমি একজন:' : 'Account type:'}
              </span>
              <div className="inline-flex items-center gap-1">
                {(
                  [
                    { id: 'guardian' as const, en: 'Guardian', bn: 'অভিভাবক' },
                    { id: 'student' as const, en: 'Student', bn: 'শিক্ষার্থী' }
                  ] as const
                ).map(item => {
                  const active = learnerSubtype === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLearnerSubtype(item.id)}
                      className={`h-7 px-3 rounded-full font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-white text-[#18181B] shadow-2xs'
                          : 'text-white/95 hover:bg-white/15'
                      }`}
                    >
                      {language === 'bn' ? item.bn : item.en}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-white text-rose-700 text-xs font-medium flex items-start gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Google Auth Action Button */}
          <div className="pt-1 space-y-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleLogin}
              className="w-full h-13 px-6 rounded-full bg-white hover:bg-[#FCFBFA] text-[#18181B] font-display text-sm sm:text-base font-extrabold shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="truncate">
                {isSubmitting
                  ? (language === 'bn' ? 'অপেক্ষা করুন...' : 'Signing in...')
                  : selectedRole === 'tutor'
                    ? (language === 'bn'
                        ? 'Google দিয়ে টিউটর হিসেবে সাইন ইন'
                        : 'Continue to Tutor Login with Google')
                    : (language === 'bn'
                        ? 'Google দিয়ে স্টুডেন্ট / গার্জিয়ান লগইন'
                        : 'Continue as Student / Guardian')}
              </span>
            </button>

            <div className="px-3.5 py-2.5 rounded-2xl bg-black/15 border border-white/20 text-[11px] text-white/95 text-center leading-relaxed">
              {language === 'bn'
                ? 'টিপস: একই জিমেইল দিয়ে টিউটর এবং গার্জিয়ান উভয় পোর্টালে আলাদাভাবে লগইন করতে পারবেন — একটিতে ঢুকলে অন্যটিতে স্বয়ংক্রিয়ভাবে সুইচ হবে না।'
                : 'Same Gmail supported separately: signing into Student/Guardian keeps you strictly in your Guardian account, and Tutor Login opens your Tutor account.'}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white">
              <button
                type="button"
                onClick={() => setAuthModalMode(isSignInMode ? 'register' : 'login')}
                className="font-medium hover:underline cursor-pointer"
              >
                {isSignInMode ? (
                  language === 'bn' ? (
                    <>নতুন ব্যবহারকারী? <span className="font-bold underline">অ্যাকাউন্ট খুলুন</span></>
                  ) : (
                    <>New to <BrandWordmark invert />? <span className="font-bold underline">Create an account</span></>
                  )
                ) : (
                  language === 'bn' ? (
                    <>ইতিমধ্যে অ্যাকাউন্ট আছে? <span className="font-bold underline">সাইন ইন</span></>
                  ) : (
                    <>Already have an account? <span className="font-bold underline">Sign in</span></>
                  )
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-white/90 pt-1">
              {language === 'bn' ? 'চালিয়ে যাওয়ার মাধ্যমে আপনি আমাদের ' : 'By continuing, you agree to our '}
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                className="font-semibold underline hover:text-white cursor-pointer"
              >
                {language === 'bn' ? 'শর্তাবলী ও প্রাইভেসি নীতি' : 'Terms & Privacy Policy'}
              </button>
              {language === 'bn' ? ' মেনে নিচ্ছেন।' : '.'}
            </p>
          </div>
        </div>
      </section>

      {/* Terms & Privacy Policy Modal */}
      {showPolicyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPolicyModal(false)}
        >
          <div
            className="bg-white rounded-[28px] border border-[#EFEAE7] max-w-md w-full p-6 space-y-4 shadow-2xl text-left text-[#18181B]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EFEAE7]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
                <h2 className="font-display text-base font-extrabold">
                  {language === 'bn' ? 'শর্তাবলী ও প্রাইভেসি নীতি' : <><BrandWordmark /> Terms &amp; Privacy</>}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                aria-label="Close policy dialog"
                className="w-9 h-9 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#52525B] leading-relaxed">
              <p>
                <strong className="text-[#18181B]">Google-Only Authentication:</strong> Your account uses verified Google Sign-In so passwords are never stored on our servers.
              </p>
              <p>
                <strong className="text-[#18181B]">Contact Privacy:</strong> Tutors and guardians control when their WhatsApp number is visible. Private contact numbers are protected by Firestore security rules and shared only when permitted.
              </p>
              <p>
                <strong className="text-[#18181B]">Community Safety:</strong> All tuition postings and tutor profiles must follow accurate academic representation and respectful communication standards.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPolicyModal(false)}
              className="w-full h-11 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-sm font-bold cursor-pointer transition-colors"
            >
              {language === 'bn' ? 'বুঝেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
