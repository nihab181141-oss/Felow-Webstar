import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandWordmark } from '../shared/BrandWordmark';

export const NotFoundPage: React.FC = () => {
  const { setActiveView, setDirectoryTab } = useApp();

  return (
    <div className="min-h-[65vh] bg-[#FCFBFA] flex items-center justify-center px-4 py-12 animate-fade-up">
      <div className="bg-white rounded-[28px] border border-[#EFEAE7] shadow-[0_6px_28px_rgba(24,24,27,0.05)] p-8 sm:p-10 max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#EFEAFF] border border-[#E1D8FF] text-base font-mono font-extrabold text-[#18181B] mx-auto">
          404
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B]">
          Page not found
        </h1>
        <p className="text-sm text-[#52525B] leading-relaxed">
          The page you requested does not exist on <BrandWordmark />. Browse verified tutors or open tuition posts instead.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setDirectoryTab('tutors');
              setActiveView('landing');
            }}
            className="h-10 px-5 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
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
            className="h-10 px-5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold inline-flex items-center transition-colors whitespace-nowrap"
          >
            Browse Tutors
          </a>
        </div>
      </div>
    </div>
  );
};
