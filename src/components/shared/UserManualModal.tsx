import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Search,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

type ManualRole = 'learner' | 'tutor';
type ManualLang = 'en' | 'bn';

interface GuideAction {
  labelEn: string;
  labelBn: string;
  onClick: () => void;
}

interface GuideStep {
  number: string;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  action?: GuideAction;
}

export const UserManualModal: React.FC = () => {
  const {
    isUserManualOpen,
    setIsUserManualOpen,
    currentRole,
    isAuthenticated,
    setActiveView,
    setDirectoryTab,
    openCreateTuitionModal,
    openLoginForPortal,
    setIsTutorSearchOpen
  } = useApp();

  // Default to English on open; users can switch to Bangla at the top anytime.
  const [manualLang, setManualLang] = useState<ManualLang>('en');
  const [manualRole, setManualRole] = useState<ManualRole>(
    currentRole === 'tutor' ? 'tutor' : 'learner'
  );

  useEffect(() => {
    if (isUserManualOpen) {
      setManualLang('en');
      setManualRole(currentRole === 'tutor' ? 'tutor' : 'learner');
    }
  }, [isUserManualOpen, currentRole]);

  useEffect(() => {
    if (!isUserManualOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserManualOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isUserManualOpen, setIsUserManualOpen]);

  if (!isUserManualOpen) return null;

  const isBn = manualLang === 'bn';

  const closeAndRun = (fn: () => void) => {
    setIsUserManualOpen(false);
    fn();
  };

  const guardianSteps: GuideStep[] = [
    {
      number: '01',
      titleEn: 'Sign In Strictly as a Student / Guardian',
      titleBn: 'স্টুডেন্ট / গার্জিয়ান পোর্টালে আলাদা লগইন',
      bodyEn:
        'Always use the Student / Guardian Login portal with Google. Even if you use the same Gmail as a tutor profile elsewhere, your Guardian workspace remains completely separate with zero accidental role switching.',
      bodyBn:
        'সবসময় Google দিয়ে "শিক্ষার্থী / অভিভাবক লগইন" পোর্টাল ব্যবহার করুন। একই জিমেইল থাকলেও আপনার গার্জিয়ান ও টিউটর অ্যাকাউন্ট সম্পূর্ণ আলাদা থাকবে।',
      action:
        isAuthenticated && currentRole === 'learner'
          ? {
              labelEn: 'Open My Student Dashboard',
              labelBn: 'আমার স্টুডেন্ট ড্যাশবোর্ডে যান',
              onClick: () => closeAndRun(() => setActiveView('dashboard'))
            }
          : {
              labelEn: 'Open Student / Guardian Login',
              labelBn: 'স্টুডেন্ট / গার্জিয়ান লগইন খুলুন',
              onClick: () => closeAndRun(() => void openLoginForPortal('learner', 'login'))
            }
    },
    {
      number: '02',
      titleEn: 'Filter Tutors by Subject, Rate & Location',
      titleBn: 'বিষয়, বেতন ও এলাকা দিয়ে টিউটর খুঁজুন',
      bodyEn:
        'Open the Tutors Directory and use the filtering sidebar to narrow tutors by district (Dhaka, Chattogram, Rajshahi, Sylhet, Khulna, etc.), teaching subject, and monthly/hourly rate range—or search any tutor directly by name.',
      bodyBn:
        'টিউটর ডিরেক্টরির ফিল্টার সাইডবার থেকে জেলা, পড়ানোর বিষয় এবং বাজেট অনুযায়ী টিউটর বাছাই করুন অথবা নাম লিখে যেকোনো টিউটরের প্রোফাইল সরাসরি খুঁজে দেখুন।',
      action: {
        labelEn: 'Browse Tutors Directory',
        labelBn: 'টিউটর ডিরেক্টরি দেখুন',
        onClick: () =>
          closeAndRun(() => {
            setDirectoryTab('tutors');
            setActiveView('tutors');
          })
      }
    },
    {
      number: '03',
      titleEn: 'Post a Tuition Requirement for Free',
      titleBn: 'বিনামূল্যে টিউশন সার্কুলার পোস্ট করুন',
      bodyEn:
        'Need qualified university tutors to apply to you? Post a tuition circular with class/grade, subjects, area, days per week, and your offered monthly budget in BDT.',
      bodyBn:
        'যোগ্য বিশ্ববিদ্যালয় টিউটরদের আবেদন পেতে শ্রেণি, বিষয়, এলাকা, সপ্তাহে কয়দিন এবং সম্মানী উল্লেখ করে একটি টিউশন বিজ্ঞপ্তি পোস্ট করুন।',
      action: {
        labelEn: 'Post a Tuition Now',
        labelBn: 'এখনই টিউশন পোস্ট করুন',
        onClick: () =>
          closeAndRun(() => {
            if (!isAuthenticated) {
              void openLoginForPortal('learner', 'register');
            } else {
              openCreateTuitionModal();
            }
          })
      }
    },
    {
      number: '04',
      titleEn: 'Connect via WhatsApp & Leave a Review',
      titleBn: 'সরাসরি WhatsApp-এ যোগাযোগ ও রিভিউ দিন',
      bodyEn:
        'Review applicants inside your dashboard, shortlist or invite verified tutors, click the WhatsApp button on any tutor card or profile to message them with a pre-filled template, and leave an honest review after demo classes.',
      bodyBn:
        'ড্যাশবোর্ড থেকে আবেদন দেখুন, শর্টলিস্ট বা ইনভাইট পাঠান এবং যেকোনো টিউটর কার্ডের WhatsApp বাটনে ক্লিক করে সরাসরি মেসেজ করুন।',
      action: {
        labelEn: 'Search Tutor by Name',
        labelBn: 'নাম দিয়ে টিউটর খুঁজুন',
        onClick: () => closeAndRun(() => setIsTutorSearchOpen(true))
      }
    }
  ];

  const tutorSteps: GuideStep[] = [
    {
      number: '01',
      titleEn: 'Sign In via the Separate Tutor Login Portal',
      titleBn: 'আলাদা টিউটর লগইন পোর্টাল ব্যবহার করুন',
      bodyEn:
        'Use the Tutor Login portal to access your teaching dashboard and profile setup. Your Tutor account stays strictly isolated from Student / Guardian sessions—even when using the same Gmail.',
      bodyBn:
        'পড়ানোর ড্যাশবোর্ড এবং প্রোফাইল সেটআপের জন্য "টিউটর লগইন" পোর্টাল ব্যবহার করুন। আপনার টিউটর অ্যাকাউন্ট সবসময় আলাদা ও সুরক্ষিত থাকবে।',
      action:
        isAuthenticated && currentRole === 'tutor'
          ? {
              labelEn: 'Open My Tutor Dashboard',
              labelBn: 'আমার টিউটর ড্যাশবোর্ডে যান',
              onClick: () => closeAndRun(() => setActiveView('dashboard'))
            }
          : {
              labelEn: 'Open Tutor Login Portal',
              labelBn: 'টিউটর লগইন পোর্টালে যান',
              onClick: () => closeAndRun(() => void openLoginForPortal('tutor', 'login'))
            }
    },
    {
      number: '02',
      titleEn: 'Complete & Publish Your Tutor Profile',
      titleBn: 'টিউটর প্রোফাইল সম্পূর্ণ করে পাবলিশ করুন',
      bodyEn:
        'Add your profile photo, university, department, HSC/SSC results, subjects, preferred districts/areas, expected monthly honorarium, and valid WhatsApp contact so guardians can discover and message you.',
      bodyBn:
        'আপনার ছবি, বিশ্ববিদ্যালয়, বিভাগ, পড়ানোর বিষয়, পছন্দের এলাকা, প্রত্যাশিত সম্মানী এবং সঠিক WhatsApp নম্বর দিয়ে প্রোফাইল পাবলিশ করুন।',
      action: {
        labelEn: 'Edit / Set Up Tutor Profile',
        labelBn: 'টিউটর প্রোফাইল সেটআপ / এডিট করুন',
        onClick: () =>
          closeAndRun(() => {
            if (isAuthenticated && currentRole === 'tutor') {
              setActiveView('tutor-onboarding');
            } else {
              void openLoginForPortal('tutor', 'register');
            }
          })
      }
    },
    {
      number: '03',
      titleEn: 'Request Verification & Earn Gold Badge & Milestones',
      titleBn: 'ভেরিফিকেশন রিকোয়েস্ট পাঠিয়ে গোল্ড ব্যাজ অর্জন করুন',
      bodyEn:
        'In Tutor Dashboard → Account Settings (or Saved & Verify), submit your University Student ID card and NID. Once approved by admin, your profile displays the Gold Verified Checkmark and trust achievements (Verified, Top Rated, Super Tutor).',
      bodyBn:
        'টিউটর ড্যাশবোর্ডের Account Settings-এ গিয়ে বিশ্ববিদ্যালয় আইডি ও এনআইডি জমা দিন। অ্যাডমিন যাচাইয়ের পর আপনার প্রোফাইলে গোল্ড ভেরিফাইড টিক চিহ্ন ও অ্যাচিভমেন্ট ব্যাজ যুক্ত হবে।',
      action: {
        labelEn: 'Go to Dashboard & Verification',
        labelBn: 'ড্যাশবোর্ড ও ভেরিফিকেশনে যান',
        onClick: () =>
          closeAndRun(() => {
            if (isAuthenticated && currentRole === 'tutor') {
              setActiveView('dashboard');
            } else {
              void openLoginForPortal('tutor', 'login');
            }
          })
      }
    },
    {
      number: '04',
      titleEn: 'Apply to Open Tuitions & Track Monthly Views',
      titleBn: 'খোলা টিউশনে আবেদন ও মাসিক অ্যানালিটিক্স দেখুন',
      bodyEn:
        'Explore the live Tuition Board, filter by district and subject, send tailored applications with your expected fee, respond to guardian invitations, and track profile views & inquiries in your monthly analytics chart.',
      bodyBn:
        'টিউশন বোর্ডে আপনার এলাকার খোলা টিউশন দেখুন, সরাসরি আবেদন পাঠান, অভিভাবকদের আমন্ত্রণ গ্রহণ করুন এবং মাসিক অ্যানালিটিক্সে প্রোফাইল ভিউ দেখুন।',
      action: {
        labelEn: 'Browse Open Tuitions',
        labelBn: 'খোলা টিউশন বোর্ড দেখুন',
        onClick: () =>
          closeAndRun(() => {
            setDirectoryTab('tuitions');
            setActiveView('tuitions');
          })
      }
    }
  ];

  const steps = manualRole === 'tutor' ? tutorSteps : guardianSteps;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-manual-title"
      onClick={() => setIsUserManualOpen(false)}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FCFBFA] rounded-[28px] border border-[#EFEAE7] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left animate-fade-up"
      >
        {/* Top Modal Header + Language Switch */}
        <div className="bg-white border-b border-[#EFEAE7] px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-[#FFF6F3] border border-[#F5E4DF] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-[#EB624B]" />
            </span>
            <div className="min-w-0">
              <h2
                id="user-manual-title"
                className="font-display text-base sm:text-lg font-extrabold text-[#18181B] leading-tight truncate"
              >
                {isBn ? 'FeLoW WebStaR ব্যবহার নির্দেশিকা' : 'FeLoW WebStaR User Manual'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#6B6B6B] truncate">
                {isBn
                  ? 'ধাপে ধাপে ব্যবহারের নিয়ম ও সরাসরি ফিচার লিংক'
                  : 'Step-by-step guides with direct feature shortcuts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Top Language Switcher: Default English, Switchable to Bangla */}
            <div
              className="inline-flex items-center p-0.5 rounded-full bg-[#F6F4F3] border border-[#EAE4E1]"
              role="group"
              aria-label="Manual language"
            >
              <button
                type="button"
                onClick={() => setManualLang('en')}
                className={`h-8 px-3 rounded-full text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                  manualLang === 'en'
                    ? 'bg-[#18181B] text-white shadow-2xs'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setManualLang('bn')}
                className={`h-8 px-3 rounded-full text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                  manualLang === 'bn'
                    ? 'bg-[#EB624B] text-white shadow-2xs'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                বাংলা
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsUserManualOpen(false)}
              aria-label="Close user manual"
              className="w-9 h-9 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] flex items-center justify-center text-[#18181B] cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audience Role Selector */}
        <div className="px-5 sm:px-6 pt-4 pb-2 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white border border-[#EFEAE7]">
            <button
              type="button"
              onClick={() => setManualRole('learner')}
              className={`h-10 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                manualRole === 'learner'
                  ? 'bg-[#18181B] text-white shadow-xs'
                  : 'text-[#52525B] hover:bg-[#F6F4F3] hover:text-[#18181B]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {isBn ? 'শিক্ষার্থী / অভিভাবক' : 'Students & Guardians'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setManualRole('tutor')}
              className={`h-10 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                manualRole === 'tutor'
                  ? 'bg-[#EB624B] text-white shadow-xs'
                  : 'text-[#52525B] hover:bg-[#FFF6F3] hover:text-[#18181B]'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {isBn ? 'টিউটর গাইড' : 'Tutors'}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Manual Steps Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 space-y-3">
          {steps.map(step => (
            <div
              key={step.number}
              className="bg-white rounded-[22px] border border-[#EFEAE7] p-4 sm:p-5 space-y-2.5"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#FFF6F3] border border-[#F5E4DF] text-[#C94A35] tabular-nums shrink-0 mt-0.5">
                  {step.number}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3 className="font-display text-sm sm:text-base font-extrabold text-[#18181B] leading-snug">
                    {isBn ? step.titleBn : step.titleEn}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#52525B] leading-relaxed">
                    {isBn ? step.bodyBn : step.bodyEn}
                  </p>
                  {step.action && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={step.action.onClick}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C94A35] hover:text-[#EB624B] hover:underline cursor-pointer"
                      >
                        <span>{isBn ? step.action.labelBn : step.action.labelEn}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Quick Trust & Account Separation Note */}
          <div className="rounded-[20px] bg-[#EFEAFF]/70 border border-[#E1D8FF] p-4 flex items-start gap-3 text-xs text-[#18181B]">
            <ShieldCheck className="w-4 h-4 text-[#7C5DFA] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>
                  {isBn
                    ? 'আলাদা অ্যাকাউন্ট নিরাপত্তা ও যাচাইকৃত টিউটর'
                    : 'Strict Account Separation & Verification Trust'}
                </span>
              </div>
              <p className="text-[#52525B] leading-relaxed">
                {isBn
                  ? 'স্টুডেন্ট/গার্জিয়ান অ্যাকাউন্ট এবং টিউটর অ্যাকাউন্টের জন্য আলাদা লগইন পোর্টাল থাকায় কখনো ভুলবশত রোল পরিবর্তন হয়ে যাওয়ার ঝুঁকি নেই।'
                  : 'Student/Guardian and Tutor accounts use dedicated login portals so a student session never switches unexpectedly into tutor mode.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Footer Shortcuts */}
        <div className="bg-white border-t border-[#EFEAE7] px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                closeAndRun(() => {
                  setDirectoryTab('tutors');
                  setActiveView('tutors');
                })
              }
              className="h-9 px-3.5 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] text-xs font-semibold text-[#18181B] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isBn ? 'টিউটর খুঁজুন' : 'Find Tutors'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                closeAndRun(() => {
                  setDirectoryTab('tuitions');
                  setActiveView('tuitions');
                })
              }
              className="h-9 px-3.5 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] text-xs font-semibold text-[#18181B] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isBn ? 'টিউশন বোর্ড' : 'Tuition Board'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsUserManualOpen(false)}
            className="h-9 px-5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isBn ? 'বুঝেছি' : 'Got It'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
