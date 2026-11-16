import React from 'react';
import { ChevronRight, Search, ShieldCheck, MessageCircle, FileText, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RouteView } from '../../utils/routing';
import { BrandWordmark } from '../shared/BrandWordmark';

export const ForGuardiansPage: React.FC = () => {
  const { setActiveView, setDirectoryTab, setIsAuthModalOpen, setAuthModalMode, isAuthenticated, openCreateTuitionModal, language } = useApp();
  const isBn = language === 'bn';

  const navigate = (e: React.MouseEvent<HTMLAnchorElement>, view: RouteView, tab?: 'tutors' | 'tuitions') => {
    e.preventDefault();
    if (tab) setDirectoryTab(tab);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqs: Array<{ id: string; q: React.ReactNode; a: React.ReactNode }> = isBn
    ? [
        {
          id: 'bn-find',
          q: 'বাংলাদেশে কীভাবে বাসায় বা অনলাইনে যোগ্য শিক্ষক খুঁজব?',
          a: <><BrandWordmark />-এর টিউটর ডিরেক্টরিতে জেলা, বিষয়, শ্রেণি এবং শিক্ষার মাধ্যম অনুযায়ী ফিল্টার করে বিশ্ববিদ্যালয়ের শিক্ষার্থীদের প্রোফাইল তুলনা করুন, অথবা বিনা খরচে আপনার টিউশন চাহিদা পোস্ট করুন।</>
        },
        {
          id: 'bn-signup',
          q: 'অভিভাবক ও শিক্ষার্থীরা কীভাবে সাইন আপ করবেন?',
          a: 'Google দিয়ে সাইন ইন করে Student / Guardian হিসেবে একটি অ্যাকাউন্ট খুললেই টিউশন পোস্ট করা, পছন্দের টিউটর সেভ করা এবং অনুমোদিত WhatsApp যোগাযোগ চালু করা যায়।'
        },
        {
          id: 'bn-check',
          q: 'একজন প্রাইভেট টিউটর নির্বাচনের আগে কী কী যাচাই করা উচিত?',
          a: 'টিউটরের বিশ্ববিদ্যালয় ও বিভাগ, SSC/HSC ও স্নাতক ফলাফল, পূর্বের অভিজ্ঞতা, প্রোফাইলে থাকা ভেরিফিকেশন স্ট্যাটাস এবং পূর্বের শিক্ষার্থী-অভিভাবকদের রিভিউ দেখে ডেমো ক্লাস নির্ধারণ করুন।'
        },
        {
          id: 'bn-privacy',
          q: 'আমার ফোন নম্বর কি সবার কাছে প্রকাশ পাবে?',
          a: 'না। অভিভাবক ও শিক্ষার্থীদের ব্যক্তিগত WhatsApp নম্বর এবং বিস্তারিত ঠিকানা পাবলিক পেজে দেখানো হয় না; কেবল গৃহীত আবেদন বা অনুমোদিত যোগাযোগের মাধ্যমেই তা শেয়ার হয়।'
        }
      ]
    : [
        {
          id: 'en-find',
          q: 'How can parents and students find a qualified home tutor in Bangladesh?',
          a: <>Browse the <BrandWordmark /> tutor directory by district, subject, curriculum medium, and class level to compare university tutors, or publish a free tuition post so matching tutors can apply directly.</>
        },
        {
          id: 'en-signup',
          q: <>How do students and guardians register on <BrandWordmark />?</>,
          a: 'Click Sign In, select Student / Guardian, and continue with your verified Google account. A single Student / Guardian account lets you save tutors, post open tuition requirements, review tutor applications, and coordinate via WhatsApp.'
        },
        {
          id: 'en-check',
          q: 'What should I check before choosing a private tutor?',
          a: 'Review the tutor’s university, department, academic background, teaching medium (Bangla Medium, English Version, or English Medium), preferred areas, profile verification status, and published student reviews before confirming a trial session.'
        },
        {
          id: 'en-privacy',
          q: 'Is my phone number or home address shown publicly when I post a tuition?',
          a: 'No. Guardian WhatsApp numbers and detailed home addresses are isolated in private records and never exposed on public directory pages.'
        }
      ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FCFBFA] py-6 sm:py-10 px-4 sm:px-6 text-left animate-fade-up">
      <div className="max-w-4xl mx-auto space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6B6B6B] flex-wrap">
          <a href="/" onClick={(e) => navigate(e, 'landing', 'tutors')} className="hover:text-[#EB624B] transition-colors">
            {isBn ? 'হোম' : 'Home'}
          </a>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#18181B]">
            {isBn ? 'শিক্ষার্থী ও অভিভাবক নির্দেশিকা' : 'For Students & Guardians'}
          </span>
        </nav>

        <article className="ivory-card p-6 sm:p-8 space-y-8">
          <header className="space-y-3 border-b border-[#EFEAE7] pb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B] leading-tight text-balance">
              {isBn
                ? 'বাংলাদেশে বাসায় বা অনলাইন টিউটর খুঁজুন — শিক্ষার্থী ও অভিভাবক নির্দেশিকা'
                : 'Find a Home or Online Tutor in Bangladesh — Student & Guardian Guide'}
            </h1>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
              {isBn
                ? 'ঢাকা, রাজশাহী, চট্টগ্রাম, সিলেট, খুলনা ও সারাদেশে স্কুল-কলেজ, O/A Level এবং ভর্তি পরীক্ষার জন্য যাচাইকৃত বিশ্ববিদ্যালয় টিউটর খুঁজুন এবং সরাসরি WhatsApp-এ কথা বলুন।'
                : <><BrandWordmark /> helps students, parents, and guardians across Bangladesh discover university tutors for Bangla Medium, English Version, English Medium (O/A Level), and admission preparation—without third-party middlemen.</>}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/tutors"
                onClick={(e) => navigate(e, 'tutors', 'tutors')}
                className="h-10 px-6 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center transition-colors whitespace-nowrap"
              >
                {isBn ? 'টিউটর ডিরেক্টরি দেখুন' : 'Browse Verified Tutors'}
              </a>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthModalMode('register');
                    setIsAuthModalOpen(true);
                    return;
                  }
                  openCreateTuitionModal();
                }}
                className="h-10 px-6 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center cursor-pointer transition-colors whitespace-nowrap"
              >
                {isBn ? 'বিনা খরচে টিউশন পোস্ট করুন' : 'Post a Free Tuition Request'}
              </button>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FFF6F3] rounded-[24px] p-5 sm:p-6 border border-[#F5E4DF] space-y-3">
              <div className="flex items-center gap-3 font-display font-extrabold text-[#18181B]">
                <span className="w-10 h-10 rounded-full bg-white text-[#EB624B] flex items-center justify-center shadow-2xs shrink-0">
                  <Search className="w-5 h-5" />
                </span>
                <h2>{isBn ? '১. বিষয় ও এলাকা ভিত্তিক অনুসন্ধান' : '1. Filter by District, Medium & Subject'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                {isBn
                  ? 'আপনার জেলা ও পছন্দের এলাকা, শ্রেণি এবং বিষয় নির্বাচন করে BUET, DU, RU, CU, SUST, BRACU বা NSU-এর মতো বিশ্ববিদ্যালয়ের টিউটরদের প্রোফাইল দেখুন।'
                  : 'Filter by any of Bangladesh’s 64 districts and compare tutors’ university, department, academic credentials, expected monthly honorarium in BDT, and weekly schedule.'}
              </p>
            </div>

            <div className="bg-[#FFF4D6] rounded-[24px] p-5 sm:p-6 border border-[#F8E4AE] space-y-3">
              <div className="flex items-center gap-3 font-display font-extrabold text-[#18181B]">
                <span className="w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center shadow-2xs shrink-0">
                  <FileText className="w-5 h-5" />
                </span>
                <h2>{isBn ? '২. সহজ টিউশন পোস্ট ও আমন্ত্রণ' : '2. Post Tuition Requirements or Send Invites'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                {isBn
                  ? 'ক্লাস, বিষয়, সপ্তাহে কত দিন পড়াবেন এবং মাসিক বাজেট উল্লেখ করে টিউশন পোস্ট করুন অথবা সরাসরি পছন্দের টিউটরকে আমন্ত্রণ পাঠান।'
                  : 'Publish your learning goals, class grade, preferred days per week, and salary offer in minutes—or invite specific tutors directly from their public profile.'}
              </p>
            </div>

            <div className="bg-[#EFEAFF] rounded-[24px] p-5 sm:p-6 border border-[#E1D8FF] space-y-3">
              <div className="flex items-center gap-3 font-display font-extrabold text-[#18181B]">
                <span className="w-10 h-10 rounded-full bg-white text-[#15803D] flex items-center justify-center shadow-2xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h2>{isBn ? '৩. প্রাইভেসি ও ভেরিফিকেশন সুরক্ষা' : '3. Verification & Contact Privacy'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                {isBn
                  ? 'অভিভাবকদের ব্যক্তিগত নম্বর গোপন থাকে এবং টিউটরদের প্রাতিষ্ঠানিক পরিচয়পত্র ও যোগ্যতার ডকুমেন্ট যাচাই করার ব্যবস্থা রয়েছে।'
                  : 'Identity, university ID, and qualification verification badges help families evaluate trust, while private guardian phone numbers stay hidden from public pages.'}
              </p>
            </div>

            <div className="bg-[#DCEBFA]/75 rounded-[24px] p-5 sm:p-6 border border-[#C6DDF5] space-y-3">
              <div className="flex items-center gap-3 font-display font-extrabold text-[#18181B]">
                <span className="w-10 h-10 rounded-full bg-white text-[#15803D] flex items-center justify-center shadow-2xs shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <h2>{isBn ? '৪. সরাসরি WhatsApp-এ যোগাযোগ' : '4. Direct WhatsApp Coordination'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                {isBn
                  ? 'কোনো জটিল ইন-অ্যাপ চ্যাট ছাড়াই অনুমোদিত টিউটরের সাথে সরাসরি WhatsApp-এ কথা বলে ডেমো ক্লাসের সময় ঠিক করুন।'
                  : 'No internal messaging bottleneck—once connected or shortlisted, coordinate trial classes, curriculum goals, and timings directly on WhatsApp.'}
              </p>
            </div>
          </section>

          <section className="space-y-4 border-t border-[#EFEAE7] pt-6">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#FFF6F3] border border-[#F5E4DF] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#EB624B]" />
              </span>
              <h2 className="font-display text-lg font-extrabold text-[#18181B]">
                {isBn ? 'সাধারণ প্রশ্নোত্তর (অভিভাবক ও শিক্ষার্থী)' : 'Frequently Asked Questions for Students & Guardians'}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {faqs.map(item => (
                <div key={item.id} className="p-4 sm:p-5 rounded-[20px] bg-[#F8F6F5] border border-[#EFEAE7] space-y-1.5">
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#18181B]">{item.q}</h3>
                  <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 border-t border-[#EFEAE7] text-xs font-bold text-[#18181B]">
            <a href="/how-it-works" onClick={(e) => navigate(e, 'how-it-works')} className="hover:text-[#EB624B] transition-colors">
              {isBn ? 'প্ল্যাটফর্ম কীভাবে কাজ করে →' : <>See How <BrandWordmark /> Works →</>}
            </a>
            <a href="/become-a-tutor" onClick={(e) => navigate(e, 'become-a-tutor')} className="hover:text-[#EB624B] transition-colors">
              {isBn ? 'টিউটর হিসেবে যোগ দিতে চান? →' : 'Looking to teach as a tutor? →'}
            </a>
            <a href="/tuitions" onClick={(e) => navigate(e, 'tuitions', 'tuitions')} className="hover:text-[#EB624B] transition-colors">
              {isBn ? 'খোলা টিউশন বিজ্ঞপ্তি দেখুন →' : 'View Open Tuition Board →'}
            </a>
          </section>
        </article>
      </div>
    </div>
  );
};
