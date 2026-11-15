import React from 'react';
import { ChevronRight, GraduationCap, ShieldCheck, Briefcase, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RouteView } from '../../utils/routing';

export const BecomeTutorPage: React.FC = () => {
  const { setActiveView, setDirectoryTab, setIsAuthModalOpen, setAuthModalMode, isAuthenticated, activateDualRole, currentRole, language } = useApp();
  const isBn = language === 'bn';

  const navigate = (e: React.MouseEvent<HTMLAnchorElement>, view: RouteView, tab?: 'tutors' | 'tuitions') => {
    e.preventDefault();
    if (tab) setDirectoryTab(tab);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartTutorSetup = async () => {
    if (!isAuthenticated) {
      setAuthModalMode('register');
      setIsAuthModalOpen(true);
      return;
    }
    if (currentRole === 'tutor') {
      setActiveView('tutor-onboarding');
      return;
    }
    await activateDualRole('tutor');
  };

  const faqs = isBn
    ? [
        {
          q: 'বাংলাদেশে বিশ্ববিদ্যালয়ের শিক্ষার্থীরা কীভাবে টিউশনির কাজ খুঁজতে পারেন?',
          a: 'FeLoW WebStaR-এ Google দিয়ে সাইন ইন করে আপনার বিশ্ববিদ্যালয়, বিভাগ, পড়ানোর বিষয় ও পছন্দের এলাকা যুক্ত করে একটি সম্পূর্ণ টিউটর পেজ তৈরি করুন এবং খোলা টিউশন বোর্ডে সরাসরি আবেদন করুন।'
        },
        {
          q: 'টিউটর প্রোফাইলে কী কী তথ্য থাকা জরুরি?',
          a: 'প্রদর্শিত নাম, জেলা ও পছন্দের এলাকা, বিশ্ববিদ্যালয় ও বিভাগ, পড়ানোর মাধ্যম ও শ্রেণি, বিষয়সমূহ, প্রত্যাশিত মাসিক সম্মানী এবং আপনার শিক্ষাদানের সংক্ষিপ্ত বিবরণ দিলে অভিভাবকেরা সহজেই আপনাকে খুঁজে পান।'
        },
        {
          q: 'আমি কীভাবে প্রোফাইলে ভেরিফায়েড ব্যাজ পাব?',
          a: 'টিউটর ড্যাশবোর্ড থেকে জাতীয় পরিচয়পত্র, বিশ্ববিদ্যালয় আইডি কার্ড অথবা একাডেমিক সনদ নিরাপদে জমা দিলে অ্যাডমিন যাচাইয়ের পর ভেরিফিকেশন ব্যাজ যুক্ত করা হয়।'
        },
        {
          q: 'আমি কি একই অ্যাকাউন্ট থেকে শিক্ষার্থী ও টিউটর দুইভাবেই ব্যবহার করতে পারব?',
          a: 'হ্যাঁ। FeLoW WebStaR-এ আপনি প্রয়োজনে টিউটর মোড ও স্টুডেন্ট/গার্জিয়ান মোডের মধ্যে সহজেই সুইচ করতে পারেন।'
        }
      ]
    : [
        {
          q: 'How can university students find tuition jobs in Bangladesh?',
          a: 'Create a complete tutor profile on FeLoW WebStaR using your Google account, list your university, department, preferred teaching areas, and subjects, and submit tailored proposals to open tuition posts in your district or online.'
        },
        {
          q: 'What details should a strong tutor profile include?',
          a: 'Include your university, department, current academic year, SSC/HSC background, mediums and classes you teach, subjects, weekly availability, expected monthly honorarium range in BDT, and a clear bio describing your teaching approach.'
        },
        {
          q: 'How does tutor verification work on FeLoW WebStaR?',
          a: 'After publishing your profile, upload your student ID, national ID, or academic certificate in your Tutor Dashboard. Verification documents stay strictly private to you and moderation admins while verified badges appear on your public profile.'
        },
        {
          q: 'How do tutors and guardians communicate once an application is accepted?',
          a: 'Communication happens directly over WhatsApp—no internal chat friction. You also control your contact visibility settings and WhatsApp consent in your profile preferences.'
        }
      ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FFFFFF] py-6 sm:py-10 px-4 sm:px-6 text-left">
      <div className="max-w-4xl mx-auto space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6B6B6B] flex-wrap">
          <a href="/" onClick={(e) => navigate(e, 'landing', 'tutors')} className="hover:text-[#C94A35] transition-colors">
            {isBn ? 'হোম' : 'Home'}
          </a>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#252525]">
            {isBn ? 'টিউটর হিসেবে নিবন্ধন ও টিউশন' : 'Become a Tutor in Bangladesh'}
          </span>
        </nav>

        <article className="ivory-card p-6 sm:p-8 space-y-8">
          <header className="space-y-3 border-b border-[#F1E1DC] pb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#252525] leading-tight">
              {isBn
                ? 'বাংলাদেশে প্রাইভেট টিউটর হিসেবে প্রোফাইল খুলুন ও টিউশনির কাজ খুঁজুন'
                : 'Become a Private Tutor in Bangladesh — Registration & Tuition Jobs'}
            </h1>
            <p className="text-sm sm:text-base text-[#555555] leading-relaxed">
              {isBn
                ? 'বিশ্ববিদ্যালয়ের শিক্ষার্থী এবং অভিজ্ঞ শিক্ষকদের জন্য FeLoW WebStaR-এ পেশাদার টিউটর প্রোফাইল তৈরি, খোলা টিউশনে আবেদন এবং অভিভাবকদের সাথে সরাসরি WhatsApp-এ যুক্ত হওয়ার সম্পূর্ণ সুযোগ।'
                : 'Built for university students and experienced educators across Dhaka, Rajshahi, Chattogram, Sylhet, Khulna, and all 64 districts of Bangladesh. Publish your academic credentials, discover open tuition circulars, and connect directly with guardians.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleStartTutorSetup}
                className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                {isBn ? 'টিউটর প্রোফাইল তৈরি করুন' : 'Create Your Tutor Profile'}
              </button>
              <a
                href="/tuitions"
                onClick={(e) => navigate(e, 'tuitions', 'tuitions')}
                className="h-10 px-6 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#252525] text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-colors"
              >
                {isBn ? 'খোলা টিউশন দেখুন' : 'Explore Open Tuition Posts'}
              </a>
            </div>
          </header>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#252525]">
              {isBn ? 'টিউটর নিবন্ধনের ৪টি ধাপ' : '4 Steps to Launch Your Public Tutor Page'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FFF3EF]/70 rounded-2xl p-5 border border-[#F1E1DC] space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                  <GraduationCap className="w-5 h-5 text-[#F47C68] shrink-0" />
                  <h3>{isBn ? '১. Google সাইন ইন ও টিউটর অপশন নির্বাচন' : '1. Sign In & Complete Tutor Onboarding'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  {isBn
                    ? 'Google অ্যাকাউন্ট দিয়ে সাইন ইন করে "I’m a Tutor" বেছে নিন এবং আপনার বিশ্ববিদ্যালয়, বিভাগ, পাসের বছর ও একাডেমিক ফলাফল যোগ করুন।'
                    : 'Sign in with Google, select Tutor, and complete the guided onboarding wizard with your university, department, academic year, and bio.'}
                </p>
              </div>

              <div className="bg-[#FFF3EF]/70 rounded-2xl p-5 border border-[#F1E1DC] space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                  <CheckCircle2 className="w-5 h-5 text-[#F47C68] shrink-0" />
                  <h3>{isBn ? '২. বিষয়, এলাকা ও সম্মানী নির্ধারণ' : '2. Set Subjects, Mediums & Preferred Areas'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  {isBn
                    ? 'হোম টিউশন বা অনলাইন ১-টু-১ পড়ানোর পছন্দ, সাপ্তাহিক দিন এবং প্রত্যাশিত মাসিক সম্মানী পরিসর উল্লেখ করুন।'
                    : 'Specify whether you offer home tuition or online 1-on-1 sessions, target classes (SSC, HSC, O/A Level, Admission), and BDT salary expectations.'}
                </p>
              </div>

              <div className="bg-[#DCEBFA]/45 rounded-2xl p-5 border border-[#CBE0F7] space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                  <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
                  <h3>{isBn ? '৩. পরিচয় ও প্রাতিষ্ঠানিক ভেরিফিকেশন' : '3. Verify Your University & Identity'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  {isBn
                    ? 'ড্যাশবোর্ডে স্টুডেন্ট আইডি কার্ড বা সনদ আপলোড করে প্রোফাইলে অভিভাবকদের আস্থা বাড়ান। আপনার নথিপত্র সর্বদা গোপন থাকে।'
                    : 'Submit your student ID card or certificates privately in your Tutor Dashboard to earn verification badges and stand out to families.'}
                </p>
              </div>

              <div className="bg-[#DCEBFA]/45 rounded-2xl p-5 border border-[#CBE0F7] space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                  <Briefcase className="w-5 h-5 text-[#252525] shrink-0" />
                  <h3>{isBn ? '৪. টিউশনে আবেদন ও WhatsApp যোগাযোগ' : '4. Apply to Tuitions & Connect on WhatsApp'}</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  {isBn
                    ? 'পছন্দের টিউশন পোস্টে প্রস্তাব পাঠান অথবা অভিভাবকের আমন্ত্রণ গ্রহণ করে সরাসরি WhatsApp-এ যোগাযোগ করুন।'
                    : 'Browse active tuition listings, send tailored proposals, respond to parent invitations, and coordinate directly on WhatsApp.'}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-[#F1E1DC] pt-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#C94A35] shrink-0" />
              <h2 className="font-display text-lg font-bold text-[#252525]">
                {isBn ? 'টিউটরদের সাধারণ প্রশ্নোত্তর' : 'Frequently Asked Questions for Tutors'}
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map(item => (
                <div key={item.q} className="border-b border-[#F1E1DC]/70 pb-4 last:border-none last:pb-0 space-y-1.5">
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#252525]">{item.q}</h3>
                  <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-[#F1E1DC] text-xs font-semibold text-[#C94A35]">
            <a href="/tuitions" onClick={(e) => navigate(e, 'tuitions', 'tuitions')} className="hover:underline">
              {isBn ? 'চলমান টিউশন বোর্ড দেখুন →' : 'Browse Open Tuitions →'}
            </a>
            <a href="/tutors" onClick={(e) => navigate(e, 'tutors', 'tutors')} className="hover:underline">
              {isBn ? 'টিউটর ডিরেক্টরি দেখুন →' : 'See Published Tutor Profiles →'}
            </a>
            <a href="/for-guardians" onClick={(e) => navigate(e, 'for-guardians')} className="hover:underline">
              {isBn ? 'অভিভাবক নির্দেশিকা →' : 'For Students & Guardians →'}
            </a>
          </section>
        </article>
      </div>
    </div>
  );
};
