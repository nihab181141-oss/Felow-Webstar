import React from 'react';
import { ChevronRight, ShieldCheck, GraduationCap, MessageCircle, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RouteView } from '../../utils/routing';
import { BrandWordmark } from '../shared/BrandWordmark';

export const AboutPage: React.FC = () => {
  const { setActiveView, setDirectoryTab, language } = useApp();
  const isBn = language === 'bn';

  const navigate = (e: React.MouseEvent<HTMLAnchorElement>, view: RouteView, tab?: 'tutors' | 'tuitions') => {
    e.preventDefault();
    if (tab) setDirectoryTab(tab);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FFFFFF] py-6 sm:py-10 px-4 sm:px-6 text-left">
      <div className="max-w-4xl mx-auto space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6B6B6B] flex-wrap">
          <a href="/" onClick={(e) => navigate(e, 'landing', 'tutors')} className="hover:text-[#C94A35] transition-colors">
            {isBn ? 'হোম' : 'Home'}
          </a>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#252525]">{isBn ? 'আমাদের সম্পর্কে' : <>About <BrandWordmark /></>}</span>
        </nav>

        <article className="ivory-card p-6 sm:p-8 space-y-6">
          <header className="space-y-2 border-b border-[#F1E1DC] pb-5">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#252525] leading-tight">
              {isBn ? (
                <>
                  <BrandWordmark /> সম্পর্কে — বাংলাদেশের নির্ভরযোগ্য টিউটর ও টিউশন মার্কেটপ্লেস
                </>
              ) : (
                <>
                  About <BrandWordmark /> — Bangladesh Tutor Discovery &amp; Tuition Marketplace
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-[#555555] leading-relaxed">
              {isBn ? (
                <>
                  <BrandWordmark /> বাংলাদেশের শিক্ষার্থী, অভিভাবক এবং বিশ্ববিদ্যালয় পর্যায়ের যোগ্য টিউটরদের সরাসরি ও নিরাপদভাবে যুক্ত করার একটি আধুনিক শিক্ষামূলক প্ল্যাটফর্ম।
                </>
              ) : (
                <>
                  <BrandWordmark /> connects students and guardians across Bangladesh with university tutors through transparent academic credentials, clear tuition expectations, and privacy-protected WhatsApp communication.
                </>
              )}
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FFF3EF]/70 rounded-2xl p-5 border border-[#F1E1DC] space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                <GraduationCap className="w-5 h-5 text-[#F47C68] shrink-0" />
                <h2>{isBn ? 'স্বচ্ছ একাডেমিক প্রোফাইল' : 'Transparent Academic Credentials'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {isBn
                  ? 'প্রতিটি টিউটরের বিশ্ববিদ্যালয়, বিভাগ, সেমিস্টার, পছন্দসই বিষয়, শিক্ষাদানের এলাকা এবং সম্মানী পরিসর সহজেই তুলনা করা যায়।'
                  : 'Guardians can inspect each tutor’s university, department, academic year, SSC/HSC background, preferred teaching subjects, and expected salary range upfront.'}
              </p>
            </div>

            <div className="bg-[#FFF3EF]/70 rounded-2xl p-5 border border-[#F1E1DC] space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                <ShieldCheck className="w-5 h-5 text-[#15803D] shrink-0" />
                <h2>{isBn ? 'নিরাপদ যোগাযোগ ও প্রাইভেসি' : 'Contact Privacy by Default'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {isBn
                  ? 'ব্যক্তিগত WhatsApp নম্বর এবং ঠিকানা পাবলিক পেজে প্রদর্শিত হয় না; অনুমোদিত ব্যবহারকারী বা গৃহীত আবেদনের মাধ্যমেই যোগাযোগ সুরক্ষিত থাকে।'
                  : 'Personal WhatsApp numbers, Facebook links, and detailed home addresses are isolated from public listings and shared only under explicit user visibility settings or accepted applications.'}
              </p>
            </div>

            <div className="bg-[#FFF3EF]/70 rounded-2xl p-5 border border-[#F1E1DC] space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                <MapPin className="w-5 h-5 text-[#F47C68] shrink-0" />
                <h2>{isBn ? 'সারা বাংলাদেশের জেলা ও এলাকা' : 'Nationwide Coverage Across 64 Districts'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {isBn
                  ? 'ঢাকা, চট্টগ্রাম, সিলেট, রাজশাহী, খুলনা, বরিশাল, রংপুর ও ময়মনসিংহসহ সকল জেলায় হোম ও অনলাইন টিউশন খোঁজা যায়।'
                  : 'Search home tutors and online 1-on-1 educators across Dhaka, Chattogram, Sylhet, Rajshahi, Khulna, Barishal, Rangpur, and Mymensingh.'}
              </p>
            </div>

            <div className="bg-[#FFF3EF]/70 rounded-2xl p-5 border border-[#F1E1DC] space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-[#252525]">
                <MessageCircle className="w-5 h-5 text-[#15803D] shrink-0" />
                <h2>{isBn ? 'সরাসরি WhatsApp ও আবেদন ব্যবস্থা' : 'Direct Proposals & WhatsApp Follow-Up'}</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {isBn
                  ? 'অভিভাবক ও শিক্ষার্থীরা টিউশন পোস্ট করতে পারেন অথবা পছন্দমতো টিউটরকে আমন্ত্রণ জানাতে পারেন।'
                  : 'Families can post tuition requirements for free and invite matching tutors, while tutors apply with custom schedules and salary proposals—connecting directly over WhatsApp.'}
              </p>
            </div>
          </section>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/tutors"
              onClick={(e) => navigate(e, 'tutors', 'tutors')}
              className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold inline-flex items-center justify-center transition-colors"
            >
              {isBn ? 'টিউটর দেখুন' : 'Browse Tutors'}
            </a>
            <a
              href="/tuitions"
              onClick={(e) => navigate(e, 'tuitions', 'tuitions')}
              className="h-10 px-6 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#252525] text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-colors"
            >
              {isBn ? 'খোলা টিউশন দেখুন' : 'View Open Tuitions'}
            </a>
          </div>

          <section className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-[#F1E1DC] text-xs font-semibold text-[#C94A35]">
            <a href="/for-guardians" onClick={(e) => navigate(e, 'for-guardians')} className="hover:underline">
              {isBn ? 'অভিভাবক ও শিক্ষার্থী নির্দেশিকা →' : 'Student & Guardian Guide →'}
            </a>
            <a href="/become-a-tutor" onClick={(e) => navigate(e, 'become-a-tutor')} className="hover:underline">
              {isBn ? 'টিউটর হিসেবে যোগ দিন →' : 'Become a Tutor →'}
            </a>
            <a href="/how-it-works" onClick={(e) => navigate(e, 'how-it-works')} className="hover:underline">
              {isBn ? 'কিভাবে কাজ করে →' : 'How It Works →'}
            </a>
          </section>
        </article>
      </div>
    </div>
  );
};
