import React, { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Copyright,
  FileText,
  Globe,
  GraduationCap,
  Lock,
  MapPin,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RouteView, SUPPORTED_LOCATIONS } from '../../utils/routing';
import { BrandWordmark } from './BrandWordmark';

type FooterLegalDoc = 'copyright' | 'privacy' | 'terms' | null;

const FEATURED_CITY_SLUGS = [
  'dhaka',
  'chattogram',
  'rajshahi',
  'sylhet',
  'khulna',
  'gazipur'
] as const;

export const PublicFooter: React.FC = () => {
  const {
    setActiveView,
    setDirectoryTab,
    setDistrictFilter,
    setMobileDetailOpen,
    openCreateTuitionModal,
    openLoginForPortal,
    isAuthenticated,
    currentRole,
    setIsAuthModalOpen,
    setAuthModalMode,
    language,
    setLanguage
  } = useApp();

  const [legalDoc, setLegalDoc] = useState<FooterLegalDoc>(null);
  const isBn = language === 'bn';
  const currentYear = Math.max(2026, new Date().getFullYear());

  const navigate = (
    e: React.MouseEvent<HTMLAnchorElement>,
    view: RouteView,
    options?: { tab?: 'tutors' | 'tuitions'; district?: string }
  ) => {
    e.preventDefault();
    setMobileDetailOpen(false);
    setDistrictFilter(options?.district ?? 'All');
    if (options?.tab) setDirectoryTab(options.tab);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostTuition = () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    openCreateTuitionModal();
  };

  const handleTutorEntry = async () => {
    if (isAuthenticated && currentRole === 'tutor') {
      setActiveView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await openLoginForPortal('tutor', 'register');
  };

  const featuredCities = FEATURED_CITY_SLUGS.map(slug => SUPPORTED_LOCATIONS[slug]).filter(Boolean);

  return (
    <footer className="border-t border-[#EFEAE7] bg-[#FCFBFA] mt-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 pb-3 sm:pt-10 sm:pb-4 space-y-6">
        {/* Top Bento Overview Banner: Quick Platform Summary + Action CTAs */}
        <div className="bg-white rounded-[28px] border border-[#EFEAE7] shadow-[0_6px_26px_rgba(24,24,27,0.04)] p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src="/assets/aistudio/felow-webstar-color_11ef6d13.svg"
                alt="FeLoW WebStaR"
                className="w-28 sm:w-32 h-auto block select-none"
              />
              <span className="h-4 w-px bg-[#EFEAE7]" aria-hidden="true" />
              <span className="text-xs font-semibold text-[#52525B]">
                {isBn
                  ? 'বাংলাদেশ টিউটর ও টিউশন মার্কেটপ্লেস'
                  : 'Bangladesh Tutor & Tuition Marketplace'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed max-w-2xl">
              {isBn ? (
                <>
                  <BrandWordmark /> বাংলাদেশের শিক্ষার্থী, অভিভাবক এবং বিশ্ববিদ্যালয়ের যাচাইকৃত টিউটরদের সরাসরি সংযোগের একটি নির্ভরযোগ্য মাধ্যম। কোনো মধ্যস্থতাকারী বা লুকানো কমিশন ছাড়াই ৬৪ জেলার হোম ও অনলাইন টিউশন খুঁজুন, আবেদন করুন এবং নিরাপদ WhatsApp গেটের মাধ্যমে যোগাযোগ করুন।
                </>
              ) : (
                <>
                  <BrandWordmark /> connects students, parents, and verified university tutors across all 64 districts of Bangladesh. Compare academic credentials, monthly honorariums, and schedules upfront—then connect directly through a privacy-protected WhatsApp workflow with zero agency commission.
                </>
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="px-3 py-2 rounded-2xl bg-[#FFF6F3] border border-[#F5E4DF] flex items-center gap-2 text-[#18181B] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#EB624B] shrink-0" />
                <span>{isBn ? 'বিশ্ববিদ্যালয় ও NID যাচাই' : 'ID & University Verification'}</span>
              </div>
              <div className="px-3 py-2 rounded-2xl bg-[#EFEAFF] border border-[#E1D8FF] flex items-center gap-2 text-[#18181B] font-semibold">
                <Lock className="w-4 h-4 text-[#18181B] shrink-0" />
                <span>{isBn ? 'সুরক্ষিত WhatsApp গেট' : 'Privacy-Gated WhatsApp'}</span>
              </div>
              <div className="px-3 py-2 rounded-2xl bg-[#DCEBFA]/75 border border-[#C6DDF5] flex items-center gap-2 text-[#18181B] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>{isBn ? '০% কমিশন · ফ্রি পোস্ট' : '0% Commission · Free Post'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FFF6F3] border border-[#F5E4DF] rounded-[24px] p-4 sm:p-5 space-y-3">
            <div className="font-display text-sm sm:text-base font-extrabold text-[#18181B]">
              {isBn ? 'আজই শুরু করুন — একদম বিনামূল্যে' : 'Get Started on FeLoW WebStaR'}
            </div>
            <p className="text-xs text-[#52525B] leading-relaxed">
              {isBn
                ? 'টিউটর খুঁজতে বিনামূল্যে টিউশন সার্কুলার দিন অথবা টিউটর হিসেবে আপনার প্রোফাইল প্রকাশ করুন।'
                : 'Publish a free tuition circular for tutors to apply, or activate your verified tutor profile.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePostTuition}
                className="h-10 px-4 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? 'টিউশন পোস্ট করুন' : 'Post Tuition Free'}</span>
              </button>

              <button
                type="button"
                onClick={handleTutorEntry}
                className="h-10 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>
                  {currentRole === 'tutor'
                    ? isBn
                      ? 'টিউটর ড্যাশবোর্ড'
                      : 'Tutor Dashboard'
                    : isBn
                      ? 'টিউটর হোন'
                      : 'Become a Tutor'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="h-10 px-3.5 rounded-full bg-white hover:bg-[#F6F4F3] border border-[#EFEAE7] text-[#18181B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-[#EB624B]" />
                <span>{language === 'en' ? 'বাংলায় দেখুন' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Multi-Column Directory Map ("Where Everything Is") */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 text-xs">
          {/* Column 1: Marketplace & Core Pages */}
          <nav
            aria-label="Marketplace directory"
            className="lg:col-span-3 bg-white rounded-[24px] border border-[#EFEAE7] p-5 space-y-3"
          >
            <div className="flex items-center gap-2 font-display font-extrabold text-sm text-[#18181B]">
              <span className="w-7 h-7 rounded-full bg-[#FFF6F3] border border-[#F5E4DF] flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-[#EB624B]" />
              </span>
              <span>{isBn ? 'মার্কেটপ্লেস' : 'Marketplace'}</span>
            </div>
            <ul className="space-y-2 font-medium text-[#52525B]">
              <li>
                <a
                  href="/"
                  onClick={(e) => navigate(e, 'landing', { tab: 'tutors' })}
                  className="hover:text-[#EB624B] text-[#18181B] inline-flex items-center gap-1 transition-colors"
                >
                  <span>{isBn ? 'হোম ডিরেক্টরি' : 'Home Directory'}</span>
                </a>
              </li>
              <li>
                <a
                  href="/tutors"
                  onClick={(e) => navigate(e, 'tutors', { tab: 'tutors' })}
                  className="hover:text-[#EB624B] text-[#18181B] inline-flex items-center gap-1 transition-colors"
                >
                  <span>{isBn ? 'যাচাইকৃত টিউটর খুঁজুন' : 'Browse Verified Tutors'}</span>
                </a>
              </li>
              <li>
                <a
                  href="/tuitions"
                  onClick={(e) => navigate(e, 'tuitions', { tab: 'tuitions' })}
                  className="hover:text-[#EB624B] text-[#18181B] inline-flex items-center gap-1 transition-colors"
                >
                  <span>{isBn ? 'খোলা টিউশন সার্কুলার' : 'Open Tuition Circulars'}</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handlePostTuition}
                  className="hover:text-[#EB624B] text-[#18181B] inline-flex items-center gap-1 cursor-pointer transition-colors text-left"
                >
                  <span>{isBn ? 'নতুন টিউশন পোস্ট করুন' : 'Post a Free Tuition Request'}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <a
                  href={isAuthenticated ? '/dashboard' : '/login'}
                  onClick={(e) => navigate(e, isAuthenticated ? 'dashboard' : 'login')}
                  className="hover:text-[#EB624B] text-[#18181B] inline-flex items-center gap-1 transition-colors"
                >
                  <span>
                    {isAuthenticated
                      ? isBn
                        ? 'আমার অ্যাকাউন্ট ও ড্যাশবোর্ড'
                        : 'My Account & Dashboard'
                      : isBn
                        ? 'Google দিয়ে সাইন ইন'
                        : 'Sign In / Create Account'}
                  </span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Column 2: Popular Tutor Locations in Bangladesh */}
          <nav
            aria-label="Tutors by city"
            className="lg:col-span-3 bg-white rounded-[24px] border border-[#EFEAE7] p-5 space-y-3"
          >
            <div className="flex items-center gap-2 font-display font-extrabold text-sm text-[#18181B]">
              <span className="w-7 h-7 rounded-full bg-[#EFEAFF] border border-[#E1D8FF] flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#18181B]" />
              </span>
              <span>{isBn ? 'শহর অনুযায়ী টিউটর' : 'Tutors by City'}</span>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-2 font-medium text-[#52525B]">
              {featuredCities.map(city => (
                <li key={city.slug}>
                  <a
                    href={`/tutors/${city.slug}`}
                    onClick={(e) =>
                      navigate(e, 'tutors', { tab: 'tutors', district: city.district })
                    }
                    className="hover:text-[#EB624B] text-[#18181B] transition-colors"
                  >
                    {isBn ? `${city.banglaName} টিউটর` : `Tutors in ${city.displayName}`}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3: Guides, Safety & Platform Information */}
          <nav
            aria-label="Guides and platform info"
            className="lg:col-span-3 bg-white rounded-[24px] border border-[#EFEAE7] p-5 space-y-3"
          >
            <div className="flex items-center gap-2 font-display font-extrabold text-sm text-[#18181B]">
              <span className="w-7 h-7 rounded-full bg-[#FFF4D6] border border-[#F8E4AE] flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-[#18181B]" />
              </span>
              <span>{isBn ? 'নির্দেশিকা ও তথ্য' : 'Guides & Resources'}</span>
            </div>
            <ul className="space-y-2 font-medium text-[#52525B]">
              <li>
                <a
                  href="/for-guardians"
                  onClick={(e) => navigate(e, 'for-guardians')}
                  className="hover:text-[#EB624B] text-[#18181B] transition-colors"
                >
                  {isBn ? 'শিক্ষার্থী ও অভিভাবক নির্দেশিকা' : 'For Students & Guardians'}
                </a>
              </li>
              <li>
                <a
                  href="/become-a-tutor"
                  onClick={(e) => navigate(e, 'become-a-tutor')}
                  className="hover:text-[#EB624B] text-[#18181B] transition-colors"
                >
                  {isBn ? 'টিউটর হিসেবে নিবন্ধন গাইড' : 'Become a Tutor in Bangladesh'}
                </a>
              </li>
              <li>
                <a
                  href="/how-it-works"
                  onClick={(e) => navigate(e, 'how-it-works')}
                  className="hover:text-[#EB624B] text-[#18181B] transition-colors"
                >
                  {isBn ? 'কিভাবে প্ল্যাটফর্ম কাজ করে' : 'How FeLoW WebStaR Works'}
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  onClick={(e) => navigate(e, 'about')}
                  className="hover:text-[#EB624B] text-[#18181B] transition-colors"
                >
                  {isBn ? (
                    'আমাদের সম্পর্কে ও নিরাপত্তা'
                  ) : (
                    <>
                      About <BrandWordmark /> & Safety
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  href="/tuitions/dhaka"
                  onClick={(e) =>
                    navigate(e, 'tuitions', { tab: 'tuitions', district: 'Dhaka' })
                  }
                  className="hover:text-[#EB624B] text-[#18181B] transition-colors inline-flex items-center gap-1"
                >
                  <Briefcase className="w-3 h-3 text-[#EB624B]" />
                  <span>{isBn ? 'ঢাকায় চলমান টিউশন' : 'Open Tuitions in Dhaka'}</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Column 4: Legal, Trust & Anti-Copy Policy Links */}
          <div className="lg:col-span-3 bg-white rounded-[24px] border border-[#EFEAE7] p-5 space-y-3">
            <div className="flex items-center gap-2 font-display font-extrabold text-sm text-[#18181B]">
              <span className="w-7 h-7 rounded-full bg-[#DCEBFA] border border-[#C6DDF5] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-[#18181B]" />
              </span>
              <span>{isBn ? 'নিরাপত্তা ও কপিরাইট' : 'Legal & Protection'}</span>
            </div>

            <ul className="space-y-2 font-medium text-[#18181B]">
              <li>
                <button
                  type="button"
                  onClick={() => setLegalDoc('copyright')}
                  className="hover:text-[#EB624B] transition-colors cursor-pointer text-left inline-flex items-center gap-1.5"
                >
                  <Copyright className="w-3.5 h-3.5 text-[#EB624B] shrink-0" />
                  <span>{isBn ? 'কপিরাইট ও মেধাস্বত্ব নীতিমালা' : 'Copyright & Anti-Cloning Notice'}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalDoc('privacy')}
                  className="hover:text-[#EB624B] transition-colors cursor-pointer text-left inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                  <span>{isBn ? 'গোপনীয়তা ও ডাটা সুরক্ষা নীতি' : 'Privacy & Data Protection Policy'}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setLegalDoc('terms')}
                  className="hover:text-[#EB624B] transition-colors cursor-pointer text-left inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                  <span>{isBn ? 'ব্যবহারের শর্তাবলি' : 'Terms of Service'}</span>
                </button>
              </li>
            </ul>

            <div className="pt-2 border-t border-[#EFEAE7] text-[11px] text-[#6B6B6B] leading-relaxed">
              {isBn ? (
                <span>
                  অফিশিয়াল ডোমেইন: <strong className="text-[#18181B]">felow-webstar.vercel.app</strong>
                </span>
              ) : (
                <span>
                  Official Domain: <strong className="text-[#18181B]">felow-webstar.vercel.app</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated Copyright, Trademark & Anti-Scraping Notice Box */}
        <div className="bg-[#F8F6F5] rounded-[22px] border border-[#EFEAE7] px-4 sm:px-5 py-4 space-y-2.5 text-xs text-[#52525B]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="font-display font-bold text-[#18181B] flex flex-wrap items-center gap-1.5">
              <Copyright className="w-4 h-4 text-[#EB624B] shrink-0" />
              <span>
                © {currentYear} <BrandWordmark />.{' '}
                {isBn ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All Rights Reserved.'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#18181B]">
              <button
                type="button"
                onClick={() => setLegalDoc('copyright')}
                className="hover:text-[#EB624B] underline underline-offset-2 cursor-pointer"
              >
                {isBn ? 'IP ও অ্যান্টি-কপি নীতি' : 'IP & Anti-Copy Policy'}
              </button>
              <button
                type="button"
                onClick={() => setLegalDoc('privacy')}
                className="hover:text-[#EB624B] underline underline-offset-2 cursor-pointer"
              >
                {isBn ? 'প্রাইভেসি পলিসি' : 'Privacy Policy'}
              </button>
              <button
                type="button"
                onClick={() => setLegalDoc('terms')}
                className="hover:text-[#EB624B] underline underline-offset-2 cursor-pointer"
              >
                {isBn ? 'শর্তাবলি' : 'Terms of Use'}
              </button>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-[#6B6B6B] leading-relaxed">
            {isBn ? (
              <>
                স্বত্বাধিকার ও কপি প্রতিরোধ বিজ্ঞপ্তি: <BrandWordmark />-এর নাম, লোগো, ডিজাইন সিস্টেম, কোডবেজ, টিউটর ও টিউশন ডিরেক্টরি কাঠামো এবং যাচাইকৃত প্রোফাইল তথ্য বাংলাদেশ কপিরাইট আইন ও আন্তর্জাতিক মেধাস্বত্ব আইনের আওতায় সংরক্ষিত। লিখিত অনুমতি ব্যতীত এই প্ল্যাটফর্মের কোনো অংশ স্ক্র্যাপিং, অটোমেটেড ডাটা সংগ্রহ, ক্লোনিং, পুনঃপ্রকাশ বা বাণিজ্যিক নকল সম্পূর্ণরূপে নিষিদ্ধ ও আইনত দণ্ডনীয়।
              </>
            ) : (
              <>
                Intellectual Property &amp; Anti-Copy Notice: The <BrandWordmark /> brand marks, custom SVG identity, UI architecture, source code, and curated directory structure are strictly protected under copyright and intellectual property laws of Bangladesh and international treaties. Any unauthorized copying, automated scraping, data harvesting, cloning, mirroring, or commercial redistribution without prior written consent is strictly prohibited.
              </>
            )}
          </p>

          <p className="text-xs font-bold text-[#18181B] font-['Comic_Sans_MS','Comic_Sans','Comic_Neue',cursive]">
            Developed by Nihab Al Mahjabin
          </p>
        </div>

        {/* Full-Width Signature Wordmark SVG at the Very Bottom */}
        <div className="pt-2 border-t border-[#EFEAE7]">
          <img
            src="/assets/aistudio/felow-webstar-side-by-side_1__1df0def6.svg"
            alt="FeLoW WebStaR"
            className="w-full h-auto block select-none opacity-95"
          />
        </div>
      </div>

      {/* Interactive Legal, Copyright & Privacy Detail Modal */}
      {legalDoc && (
        <div
          className="fixed inset-0 z-50 bg-[#18181B]/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLegalDoc(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-legal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-[28px] border border-[#EFEAE7] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-fade-up"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#EB624B]">
                  {isBn ? 'অফিশিয়াল নথি' : 'Official Legal Notice'}
                </div>
                <h2 id="footer-legal-title" className="font-display text-lg font-extrabold text-[#18181B]">
                  {legalDoc === 'copyright'
                    ? isBn
                      ? 'কপিরাইট, ট্রেডমার্ক ও অ্যান্টি-কপি সুরক্ষা'
                      : 'Copyright, Trademark & Anti-Copy Protection'
                    : legalDoc === 'privacy'
                      ? isBn
                        ? 'গোপনীয়তা ও WhatsApp ডাটা সুরক্ষা'
                        : 'Privacy & WhatsApp Data Protection'
                      : isBn
                        ? 'প্ল্যাটফর্ম ব্যবহারের শর্তাবলি'
                        : 'Terms of Service'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLegalDoc(null)}
                aria-label="Close legal notice"
                className="w-9 h-9 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] flex items-center justify-center text-[#18181B] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {legalDoc === 'copyright' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#52525B] leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-[#FFF6F3] border border-[#F5E4DF] text-[#18181B] font-semibold">
                  © {currentYear} <BrandWordmark /> — All Rights Reserved.
                </div>
                <p>
                  {isBn
                    ? 'FeLoW WebStaR ওয়েবসাইটের সমস্ত ব্র্যান্ড আইডেন্টিটি, SVG লোগো, বেন্টো ইন্টারফেস ডিজাইন, টেক্সট, এবং ডিরেক্টরি কাঠামো একচেটিয়াভাবে FeLoW WebStaR-এর মালিকানাধীন।'
                    : 'All brand marks, custom SVG wordmarks, UI layouts, frontend architecture, and curated marketplace structure on felow-webstar.vercel.app are the exclusive property of FeLoW WebStaR.'}
                </p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    {isBn
                      ? 'কোনো বট, ক্রলার বা স্ক্রিপ্ট ব্যবহার করে টিউটর বা টিউশন ডাটা কপি/স্ক্র্যাপ করা নিষিদ্ধ।'
                      : 'Automated scraping, bulk extraction, or harvesting of tutor or tuition profiles is strictly prohibited.'}
                  </li>
                  <li>
                    {isBn
                      ? 'FeLoW WebStaR-এর নাম বা লোগো নকল করে ভুয়া ওয়েবসাইট বা মিরর সাইট তৈরি করলে আইনি ব্যবস্থা নেওয়া হবে।'
                      : 'Cloning, mirroring, or impersonating FeLoW WebStaR branding, domain, or interface is prohibited under applicable IP law.'}
                  </li>
                  <li>
                    {isBn
                      ? 'ব্যবহারকারীদের আপলোড করা জাতীয় পরিচয়পত্র (NID) ও বিশ্ববিদ্যালয়ের আইডি কার্ড শুধুমাত্র অভ্যন্তরীণ ভেরিফিকেশনের জন্য সুরক্ষিত থাকে।'
                      : 'Verification documents (University ID and NID) remain restricted to private verification storage and are never exposed publicly.'}
                  </li>
                </ul>
              </div>
            )}

            {legalDoc === 'privacy' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#52525B] leading-relaxed">
                <p>
                  {isBn
                    ? 'আপনার ব্যক্তিগত ফোন নম্বর ও ঠিকানা সাধারণ ভিজিটরদের কাছে গোপন রাখা হয়।'
                    : 'Your personal phone number, WhatsApp number, and detailed street address are protected by Firestore security rules and are never publicly indexed.'}
                </p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    {isBn
                      ? 'টিউটররা শুধুমাত্র সাইন-ইন করা অথেনটিকেটেড ব্যবহারকারী বা সম্মত হওয়া অভিভাবকদের জন্য WhatsApp প্রদর্শনের ধরন নিয়ন্ত্রণ করতে পারেন।'
                      : 'Tutors control whether their WhatsApp unlocks after Google sign-in or strictly after accepting an invitation or application.'}
                  </li>
                  <li>
                    {isBn
                      ? 'টিউশন পোস্টকারীর WhatsApp কেবল শর্টলিস্টেড বা অনুমোদিত আবেদনকারীর সাথেই শেয়ার করা হয়।'
                      : 'Guardian WhatsApp numbers are shared only with shortlisted or accepted applicants.'}
                  </li>
                  <li>
                    {isBn
                      ? 'ব্যবহারকারীরা ড্যাশবোর্ড থেকে যেকোনো সময় নিজের অ্যাকাউন্ট ও প্রোফাইল স্থায়ীভাবে মুছে ফেলতে পারেন।'
                      : 'Users can permanently delete their account and associated marketplace profile anytime from their dashboard.'}
                  </li>
                </ul>
              </div>
            )}

            {legalDoc === 'terms' && (
              <div className="space-y-3 text-xs sm:text-sm text-[#52525B] leading-relaxed">
                <p>
                  {isBn
                    ? 'FeLoW WebStaR শিক্ষার্থী, অভিভাবক ও বিশ্ববিদ্যালয়ের টিউটরদের মধ্যে সরাসরি যোগাযোগের একটি প্ল্যাটফর্ম হিসেবে কাজ করে।'
                    : 'FeLoW WebStaR operates as a direct tutor discovery and tuition circular platform in Bangladesh.'}
                </p>
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    {isBn
                      ? 'সকল ব্যবহারকারীকে সঠিক শিক্ষাপ্রতিষ্ঠানের তথ্য ও প্রকৃত টিউশন চাহিদা প্রদান করতে হবে।'
                      : 'Users must provide truthful academic credentials and genuine tuition requirements.'}
                  </li>
                  <li>
                    {isBn
                      ? 'স্প্যাম, ভুয়া টিউশন সার্কুলার, বা অপব্যবহারের বিরুদ্ধে যেকোনো প্রোফাইল রিপোর্ট করা যায় এবং অ্যাডমিন তা অপসারণ করতে পারেন।'
                      : 'Fake listings, spam, or abusive behavior can be reported directly and are subject to immediate removal.'}
                  </li>
                  <li>
                    {isBn
                      ? 'সম্মানী, ক্লাস রুটিন ও পাঠদানের শর্তাবলি টিউটর ও অভিভাবক সরাসরি আলোচনা করে চূড়ান্ত করবেন।'
                      : 'Monthly honorariums, demo classes, and schedules are agreed upon directly between tutors and guardians.'}
                  </li>
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalDoc(null)}
                className="h-10 px-5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                {isBn ? 'বুঝেছি' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
