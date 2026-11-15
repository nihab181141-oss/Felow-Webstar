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

type RoleChoice = 'learner' | 'tutor';

export const AuthPage: React.FC = () => {
  const {
    loginWithGoogleUser,
    switchUserPersona,
    setActiveView,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    language,
    setLanguage
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<RoleChoice>('learner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const isSignInMode = authModalMode === 'login';

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginWithGoogleUser(selectedRole, 'guardian');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: Array<{
    id: RoleChoice;
    labelEn: string;
    labelBn: string;
    hintEn: string;
    hintBn: string;
    Icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'learner',
      labelEn: 'Student / Guardian',
      labelBn: 'শিক্ষার্থী / অভিভাবক',
      hintEn: 'Browse tutors, post tuition & contact on WhatsApp',
      hintBn: 'টিউটর খুঁজুন, টিউশন পোস্ট করুন ও WhatsApp-এ যোগাযোগ করুন',
      Icon: Users
    },
    {
      id: 'tutor',
      labelEn: "I'm a Tutor",
      labelBn: 'আমি একজন টিউটর',
      hintEn: 'Create your Tutor Page & apply for tuitions',
      hintBn: 'টিউটর পেজ খুলুন ও টিউশনে আবেদন করুন',
      Icon: GraduationCap
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] flex flex-col lg:grid lg:grid-cols-12 overflow-x-clip">
      {/* Top / Left Editorial Brand Section */}
      <section className="lg:col-span-6 bg-[#FFFFFF] flex flex-col justify-between relative">
        {/* Top Navigation Utility Bar */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="h-10 px-4 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] border border-[#F1E1DC] text-xs font-semibold text-[#252525] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{language === 'bn' ? 'ডিরেক্টরিতে ফিরুন' : 'Back to Directory'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="h-10 px-4 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] border border-[#F1E1DC] text-xs font-semibold text-[#252525] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-[#858585] shrink-0" />
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
              ? 'বাংলাদেশের সেরা বিশ্ববিদ্যালয়ের যাচাইকৃত টিউটর খুঁজুন এবং সরাসরি WhatsApp-এ যোগাযোগ করুন।'
              : 'Find trusted university tutors across Bangladesh and connect directly on WhatsApp.'}
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
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-balance">
              {language === 'bn' ? 'FeLoW WebStaR-এ স্বাগতম' : 'Welcome to FeLoW WebStaR'}
            </h1>
            <p className="text-sm sm:text-base text-white/95 font-medium leading-relaxed text-balance">
              {language === 'bn'
                ? 'একসাথে শিখুন। উদ্দেশ্য নিয়ে পড়ান। সঠিক সহায়তা খুঁজে নিন।'
                : 'Learn together. Teach with purpose. Find the right support.'}
            </p>
          </div>

          {/* 2 Unified Role Selection Buttons (Student / Guardian & Tutor) */}
          <div className="space-y-3" role="radiogroup" aria-label="Choose your role">
            {roleOptions.map((option) => {
              const isSelected = selectedRole === option.id;
              const Icon = option.Icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedRole(option.id)}
                  className={`w-full min-h-[68px] px-4 py-3 rounded-full bg-white text-left flex items-center gap-3.5 cursor-pointer transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#E45A43] ${
                    isSelected
                      ? 'ring-4 ring-white/45 shadow-lg'
                      : 'opacity-95 hover:opacity-100 shadow-sm'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#FFF3EF] text-[#C94A35]'
                        : 'bg-[#FFF7F4] text-[#858585]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="w-px h-8 bg-[#F1E1DC] shrink-0" aria-hidden="true" />

                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base font-bold text-[#252525] leading-tight truncate">
                      {language === 'bn' ? option.labelBn : option.labelEn}
                    </div>
                    <div className="text-xs text-[#6B6B6B] leading-snug truncate mt-0.5">
                      {language === 'bn' ? option.hintBn : option.hintEn}
                    </div>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#174E3E] text-white'
                        : 'bg-[#FFF3EF] text-transparent border border-[#F1E1DC]'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

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
              className="w-full h-13 px-6 rounded-full bg-white hover:bg-[#FFFBF9] text-[#174E3E] font-display text-base font-extrabold shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>
                {isSubmitting
                  ? (language === 'bn' ? 'অপেক্ষা করুন...' : 'Signing in...')
                  : isSignInMode
                    ? (language === 'bn' ? 'Google দিয়ে সাইন ইন করুন' : 'Sign in with Google')
                    : (language === 'bn' ? 'Google দিয়ে অ্যাকাউন্ট খুলুন' : 'Create an account')}
              </span>
            </button>

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
                    <>New to FeLoW WebStaR? <span className="font-bold underline">Create an account</span></>
                  )
                ) : (
                  language === 'bn' ? (
                    <>ইতিমধ্যে অ্যাকাউন্ট আছে? <span className="font-bold underline">সাইন ইন</span></>
                  ) : (
                    <>Already have an account? <span className="font-bold underline">Sign in</span></>
                  )
                )}
              </button>

              <span className="text-white/60" aria-hidden="true">·</span>

              <button
                type="button"
                onClick={() => {
                  switchUserPersona(selectedRole === 'tutor' ? 'user-tutor-1' : 'user-guardian-1');
                  setActiveView('dashboard');
                }}
                className="font-bold hover:underline cursor-pointer"
              >
                {language === 'bn' ? 'ডেমো অ্যাকাউন্ট দেখুন' : 'Preview Demo Account'}
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
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowPolicyModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#F1E1DC] max-w-md w-full p-6 space-y-4 shadow-xl text-left text-[#252525]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#F1E1DC]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#174E3E] shrink-0" />
                <h2 className="font-display text-base font-bold">
                  {language === 'bn' ? 'শর্তাবলী ও প্রাইভেসি নীতি' : 'FeLoW WebStaR Terms & Privacy'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                aria-label="Close policy dialog"
                className="w-9 h-9 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#555555] leading-relaxed">
              <p>
                <strong className="text-[#252525]">Google-Only Authentication:</strong> Your account uses verified Google Sign-In so passwords are never stored on our servers.
              </p>
              <p>
                <strong className="text-[#252525]">Contact Privacy:</strong> Tutors and guardians control when their WhatsApp number is visible. Private contact numbers are protected by Firestore security rules and shared only when permitted.
              </p>
              <p>
                <strong className="text-[#252525]">Community Safety:</strong> All tuition postings and tutor profiles must follow accurate academic representation and respectful communication standards.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPolicyModal(false)}
              className="w-full h-11 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-sm font-bold cursor-pointer transition-colors"
            >
              {language === 'bn' ? 'বুঝেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
