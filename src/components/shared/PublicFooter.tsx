import React from 'react';
import { useApp } from '../../context/AppContext';
import { RouteView } from '../../utils/routing';

export const PublicFooter: React.FC = () => {
  const { setActiveView, setDirectoryTab, language } = useApp();
  const isBn = language === 'bn';

  const navigate = (e: React.MouseEvent<HTMLAnchorElement>, view: RouteView, tab?: 'tutors' | 'tuitions') => {
    e.preventDefault();
    if (tab) setDirectoryTab(tab);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#F1E1DC] bg-[#FFFBF9] mt-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#6B6B6B]">
        <div className="space-y-1">
          <div className="font-display font-bold text-sm text-[#252525]">FeLoW WebStaR</div>
          <p className="max-w-md leading-relaxed">
            {isBn
              ? 'বাংলাদেশের শিক্ষার্থী, অভিভাবক ও যাচাইকৃত বিশ্ববিদ্যালয় টিউটরদের নির্ভরযোগ্য প্ল্যাটফর্ম।'
              : 'Bangladesh tutor discovery and tuition marketplace connecting students, guardians, and verified university tutors.'}
          </p>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 font-medium text-[#252525]">
          <a
            href="/"
            onClick={(e) => navigate(e, 'landing', 'tutors')}
            className="hover:text-[#C94A35] transition-colors"
          >
            {isBn ? 'হোম' : 'Home'}
          </a>
          <a
            href="/tutors"
            onClick={(e) => navigate(e, 'tutors', 'tutors')}
            className="hover:text-[#C94A35] transition-colors"
          >
            {isBn ? 'টিউটর ডিরেক্টরি' : 'Browse Tutors'}
          </a>
          <a
            href="/tuitions"
            onClick={(e) => navigate(e, 'tuitions', 'tuitions')}
            className="hover:text-[#C94A35] transition-colors"
          >
            {isBn ? 'টিউশন বোর্ড' : 'Open Tuitions'}
          </a>
          <a
            href="/how-it-works"
            onClick={(e) => navigate(e, 'how-it-works')}
            className="hover:text-[#C94A35] transition-colors"
          >
            {isBn ? 'কিভাবে কাজ করে' : 'How It Works'}
          </a>
          <a
            href="/about"
            onClick={(e) => navigate(e, 'about')}
            className="hover:text-[#C94A35] transition-colors"
          >
            {isBn ? 'আমাদের সম্পর্কে' : 'About'}
          </a>
        </nav>
      </div>
    </footer>
  );
};
