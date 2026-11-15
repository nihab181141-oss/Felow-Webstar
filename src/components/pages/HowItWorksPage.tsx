import React from 'react';
import { ArrowLeft, Search, FileText, UserCheck, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HowItWorksPage: React.FC = () => {
  const { setActiveView, setDirectoryTab, language } = useApp();
  const isBn = language === 'bn';

  const learnerSteps = [
    {
      title: isBn ? '১. জেলা ও বিষয় অনুযায়ী খুঁজুন' : '1. Search by District & Subject',
      body: isBn
        ? 'আপনার এলাকা, মাধ্যম (বাংলা, ইংলিশ ভার্সন বা ইংলিশ মিডিয়াম) এবং প্রয়োজনীয় বিষয় অনুযায়ী টিউটর ফিল্টার করুন।'
        : 'Filter university tutors by district, area, curriculum medium, class level, and subjects.',
      Icon: Search
    },
    {
      title: isBn ? '২. টিউশন পোস্ট করুন বা আমন্ত্রণ পাঠান' : '2. Post a Tuition or Send an Invite',
      body: isBn
        ? 'বিনা খরচে আপনার টিউশনের প্রয়োজনীয়তা পোস্ট করুন অথবা সরাসরি পছন্দের টিউটরকে আমন্ত্রণ জানান।'
        : 'Publish your tuition requirement with preferred days and budget, or send a direct invitation to a matching tutor.',
      Icon: FileText
    },
    {
      title: isBn ? '৩. আবেদন যাচাই ও WhatsApp-এ যোগাযোগ' : '3. Shortlist & Connect on WhatsApp',
      body: isBn
        ? 'টিউটরদের প্রোফাইল ও রিভিউ দেখে শর্টলিস্ট করুন এবং নিরাপদে WhatsApp-এ ডেমো ক্লাসের সময় ঠিক করুন।'
        : 'Compare tutor profiles and verified credentials, shortlist candidates, and coordinate a trial class via WhatsApp.',
      Icon: MessageCircle
    }
  ];

  const tutorSteps = [
    {
      title: isBn ? '১. Google দিয়ে সাইন ইন ও প্রোফাইল তৈরি' : '1. Sign In with Google & Build Your Tutor Page',
      body: isBn
        ? 'আপনার বিশ্ববিদ্যালয়, বিভাগ, পড়াশোনার বছর, অভিজ্ঞতা ও শিক্ষাদানের এলাকা দিয়ে প্রোফাইল প্রকাশ করুন।'
        : 'Add your university, department, semester, SSC/HSC results, preferred areas, and expected salary range.',
      Icon: UserCheck
    },
    {
      title: isBn ? '২. প্রাতিষ্ঠানিক যাচাইকরণ' : '2. Submit Institutional Verification',
      body: isBn
        ? 'জাতীয় পরিচয়পত্র বা স্টুডেন্ট আইডি কার্ড আপলোড করে আপনার প্রোফাইলে ভেরিফায়েড ব্যাজ অর্জন করুন।'
        : 'Upload your student ID or academic document in your Tutor Dashboard to earn verified trust badges.',
      Icon: FileText
    },
    {
      title: isBn ? '৩. টিউশনে আবেদন করুন' : '3. Apply to Open Tuitions',
      body: isBn
        ? 'টিউশন বোর্ড থেকে উপযুক্ত টিউশনে আপনার প্রস্তাবিত সময়সূচি ও সম্মানী উল্লেখ করে আবেদন পাঠান।'
        : 'Browse open tuitions across Bangladesh and submit tailored teaching proposals directly to guardians.',
      Icon: MessageCircle
    }
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#FFFFFF] py-6 sm:py-10 px-4 sm:px-6 text-left">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => {
            setDirectoryTab('tutors');
            setActiveView('landing');
          }}
          className="h-10 px-4 rounded-full bg-[#FFF3EF] border border-[#F3D5CC] hover:bg-[#FFE6DD] text-xs sm:text-sm font-semibold text-[#252525] inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{isBn ? 'ডিরেক্টরিতে ফিরুন' : 'Back to Directory'}</span>
        </button>

        <article className="ivory-card p-6 sm:p-8 space-y-8">
          <header className="space-y-2 border-b border-[#F1E1DC] pb-5">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#252525] leading-tight">
              {isBn ? 'FeLoW WebStaR কিভাবে কাজ করে' : 'How FeLoW WebStaR Works'}
            </h1>
            <p className="text-sm sm:text-base text-[#555555] leading-relaxed">
              {isBn
                ? 'শিক্ষার্থী, অভিভাবক এবং টিউটরদের জন্য সহজ, স্বচ্ছ ও নিরাপদ টিউশন ম্যাচিং প্রক্রিয়া।'
                : 'A straightforward workflow for students, guardians, and university tutors across Bangladesh.'}
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#252525]">
              {isBn ? 'শিক্ষার্থী ও অভিভাবকদের জন্য' : 'For Students & Guardians'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {learnerSteps.map(step => {
                const Icon = step.Icon;
                return (
                  <div key={step.title} className="bg-[#FFF3EF]/70 rounded-2xl p-4 border border-[#F1E1DC] space-y-2">
                    <Icon className="w-5 h-5 text-[#F47C68]" />
                    <h3 className="font-display text-sm font-bold text-[#252525]">{step.title}</h3>
                    <p className="text-xs text-[#555555] leading-relaxed">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#252525]">
              {isBn ? 'টিউটরদের জন্য' : 'For University Tutors'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tutorSteps.map(step => {
                const Icon = step.Icon;
                return (
                  <div key={step.title} className="bg-[#DCEBFA]/45 rounded-2xl p-4 border border-[#CBE0F7] space-y-2">
                    <Icon className="w-5 h-5 text-[#252525]" />
                    <h3 className="font-display text-sm font-bold text-[#252525]">{step.title}</h3>
                    <p className="text-xs text-[#555555] leading-relaxed">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/tutors"
              onClick={(e) => {
                e.preventDefault();
                setDirectoryTab('tutors');
                setActiveView('tutors');
              }}
              className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold inline-flex items-center justify-center transition-colors"
            >
              {isBn ? 'টিউটর খুঁজুন' : 'Find Tutors'}
            </a>
            <a
              href="/tuitions"
              onClick={(e) => {
                e.preventDefault();
                setDirectoryTab('tuitions');
                setActiveView('tuitions');
              }}
              className="h-10 px-6 rounded-full bg-[#FFF3EF] border border-[#F3D5CC] hover:bg-[#FFE6DD] text-[#252525] text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-colors"
            >
              {isBn ? 'টিউশন দেখুন' : 'Browse Tuitions'}
            </a>
          </div>
        </article>
      </div>
    </div>
  );
};
