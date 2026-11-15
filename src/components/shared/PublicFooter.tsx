import React from 'react';
import { useApp } from '../../context/AppContext';
import { RouteView } from '../../utils/routing';

export const PublicFooter: React.FC = () => {
  const { setActiveView, setDirectoryTab, setDistrictFilter, language } = useApp();
  const isBn = language === 'bn';

  const navigate = (
    e: React.MouseEvent<HTMLAnchorElement>,
    view: RouteView,
    tab?: 'tutors' | 'tuitions'
  ) => {
    e.preventDefault();
    setDistrictFilter('All');
    if (tab) setDirectoryTab(tab);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#F1E1DC] bg-[#FFFBF9] mt-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 text-xs text-[#6B6B6B]">
        <div className="md:col-span-5 space-y-2">
          <div className="font-display font-bold text-sm text-[#252525]">FeLoW WebStaR</div>
          <p className="max-w-md leading-relaxed">
            {isBn
              ? 'বাংলাদেশের শিক্ষার্থী, অভিভাবক ও বিশ্ববিদ্যালয়ের টিউটরদের সরাসরি WhatsApp যোগাযোগভিত্তিক টিউশন প্ল্যাটফর্ম।'
              : 'Bangladesh tutor discovery and tuition marketplace connecting students, parents, and university tutors directly via WhatsApp.'}
          </p>
        </div>

        <nav aria-label="Marketplace links" className="md:col-span-3 space-y-2">
          <div className="font-display font-bold text-xs uppercase tracking-wide text-[#252525]">
            {isBn ? 'মার্কেটপ্লেস' : 'Marketplace'}
          </div>
          <ul className="space-y-1.5 font-medium text-[#252525]">
            <li>
              <a
                href="/"
                onClick={(e) => navigate(e, 'landing', 'tutors')}
                className="hover:text-[#C94A35] transition-colors"
              >
                {isBn ? 'হোম' : 'Home Directory'}
              </a>
            </li>
            <li>
              <a
                href="/tutors"
                onClick={(e) => navigate(e, 'tutors', 'tutors')}
                className="hover:text-[#C94A35] transition-colors"
              >
                {isBn ? 'টিউটর খুঁজুন' : 'Browse Tutors in Bangladesh'}
              </a>
            </li>
            <li>
              <a
                href="/tuitions"
                onClick={(e) => navigate(e, 'tuitions', 'tuitions')}
                className="hover:text-[#C94A35] transition-colors"
              >
                {isBn ? 'খোলা টিউশন দেখুন' : 'Open Tuition Opportunities'}
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Guides and information" className="md:col-span-4 space-y-2">
          <div className="font-display font-bold text-xs uppercase tracking-wide text-[#252525]">
            {isBn ? 'নির্দেশিকা ও তথ্য' : 'Guides & Information'}
          </div>
          <ul className="space-y-1.5 font-medium text-[#252525]">
            <li>
              <a
                href="/for-guardians"
                onClick={(e) => navigate(e, 'for-guardians')}
                className="hover:text-[#C94A35] transition-colors"
              >
                {isBn ? 'শিক্ষার্থী ও অভিভাবক নির্দেশিকা' : 'For Students & Guardians'}
              </a>
            </li>
            <li>
              <a
                href="/become-a-tutor"
                onClick={(e) => navigate(e, 'become-a-tutor')}
                className="hover:text-[#C94A35] transition-colors"
              >
                {isBn ? 'টিউটর হিসেবে নিবন্ধন' : 'Become a Tutor in Bangladesh'}
              </a>
            </li>
            <li>
              <a
                href="/how-it-works"
                onClick={(e) => navigate(e, 'how-it-works')}
                className="hover:text-[#C94A35] transition-colors"
              >
                {isBn ? 'কিভাবে কাজ করে' : 'How It Works'}
              </a>
            </li>
            <li>
              <a
                href="/about"
                onClick={(e) => navigate(e, 'about')}
                className="hover:text-[#C94A35] transition-colors"
              >
                {isBn ? 'আমাদের সম্পর্কে' : 'About FeLoW WebStaR'}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};
