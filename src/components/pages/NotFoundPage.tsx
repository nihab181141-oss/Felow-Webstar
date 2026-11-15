import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotFoundPage: React.FC = () => {
  const { setActiveView, setDirectoryTab } = useApp();

  return (
    <div className="min-h-[65vh] bg-[#FFFFFF] flex items-center justify-center px-4 py-12">
      <div className="ivory-card p-8 max-w-md w-full text-center space-y-4">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#C94A35]">404</div>
        <h1 className="font-display text-2xl font-extrabold text-[#252525]">Page not found</h1>
        <p className="text-sm text-[#858585] leading-relaxed">
          The page you requested does not exist on FeLoW WebStaR. Browse verified tutors or open tuition posts instead.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setDirectoryTab('tutors');
              setActiveView('landing');
            }}
            className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Home</span>
          </a>
          <a
            href="/tutors"
            onClick={(e) => {
              e.preventDefault();
              setDirectoryTab('tutors');
              setActiveView('tutors');
            }}
            className="h-10 px-5 rounded-full bg-[#FFF3EF] border border-[#F3D5CC] hover:bg-[#FFE6DD] text-[#252525] text-xs sm:text-sm font-semibold inline-flex items-center"
          >
            Browse Tutors
          </a>
        </div>
      </div>
    </div>
  );
};
