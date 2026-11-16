import React from 'react';
import {
  MapPin,
  Bookmark,
  Send,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { TuitionPost } from '../../types';
import { useApp } from '../../context/AppContext';

interface TuitionPostCardProps {
  post: TuitionPost;
}

export const TuitionPostCard: React.FC<TuitionPostCardProps> = ({ post }) => {
  const {
    viewTuitionDetail,
    setSelectedTuition,
    setIsApplyModalOpen,
    savedTuitionIds,
    toggleSaveTuition,
    hasAppliedToPost,
    currentUser,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode
  } = useApp();

  const isSaved = savedTuitionIds.includes(post.id);
  const alreadyApplied = hasAppliedToPost(post.id);
  const isOwnPost = post.learnerId === currentUser.id;

  const initials = (post.learnerName || 'G')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedTuition(post);
    setIsApplyModalOpen(true);
  };

  return (
    <article className="ivory-card ivory-card-hover overflow-hidden text-left">
      <div className="p-4 pb-2.5 flex items-start justify-between gap-3">
        <div
          onClick={() => viewTuitionDetail(post)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#EFEAFF] border border-[#E1D8FF] text-[#18181B] font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-[#18181B] leading-snug break-words">
              <strong className="font-bold hover:underline">{post.learnerName}</strong>
            </div>
            <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-[#EB624B] shrink-0" />
                <span>{post.area}, {post.district}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{post.postedDate}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleSaveTuition(post.id)}
          aria-label={isSaved ? 'Unsave tuition post' : 'Save tuition post'}
          className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFF6F3] transition-colors cursor-pointer shrink-0 ${
            isSaved ? 'text-[#EB624B] bg-[#FFF6F3]' : 'text-[#6B6B6B]'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#EB624B]' : ''}`} />
        </button>
      </div>

      <div
        onClick={() => viewTuitionDetail(post)}
        className="px-4 pb-3 space-y-2.5 cursor-pointer"
      >
        <h3 className="font-display text-[15px] font-bold text-[#18181B] leading-snug break-words">{post.title}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-[#FFF6F3] border border-[#F5E4DF] rounded-2xl p-3 flex items-start gap-2 text-[#18181B]">
            <BookOpen className="w-4 h-4 text-[#EB624B] shrink-0 mt-0.5" />
            <span className="leading-snug break-words">
              <strong>{post.classGrade}</strong> · {post.subjects.join(', ')}
            </span>
          </div>
          <div className="bg-[#DCEBFA]/70 border border-[#C6DDF5] rounded-2xl p-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[#52525B]">
            <strong className="font-mono text-[#18181B] tabular-nums">৳{post.salaryOfferBDT.toLocaleString()}/mo</strong>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{post.daysPerWeek} days/wk</span>
            <span aria-hidden="true">·</span>
            <span>{post.tuitionType}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[#EFEAE7] grid grid-cols-2 gap-2">
        {isOwnPost ? (
          <button
            type="button"
            onClick={() => viewTuitionDetail(post)}
            className="h-10 px-4 rounded-full text-xs font-bold bg-[#EFEAFF] hover:bg-[#E1D8FF] text-[#18181B] transition-colors cursor-pointer whitespace-nowrap tabular-nums"
          >
            Applicants ({post.totalApplicants})
          </button>
        ) : alreadyApplied ? (
          <button
            type="button"
            onClick={() => viewTuitionDetail(post)}
            className="h-10 px-4 rounded-full text-xs font-semibold bg-[#DCEBFA] text-[#18181B] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            <span>Applied</span>
          </button>
        ) : post.status === 'open' ? (
          <button
            type="button"
            onClick={handleApplyClick}
            className="h-10 px-4 rounded-full text-xs font-bold bg-[#EB624B] hover:bg-[#DC533D] text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        ) : (
          <div className="h-10 px-4 rounded-full text-xs font-semibold bg-[#F6F4F3] text-[#6B6B6B] flex items-center justify-center">
            Closed
          </div>
        )}

        <button
          type="button"
          onClick={() => viewTuitionDetail(post)}
          className="h-10 px-4 rounded-full text-xs font-bold text-white bg-[#18181B] hover:bg-[#27272A] transition-colors cursor-pointer whitespace-nowrap"
        >
          Details
        </button>
      </div>
    </article>
  );
};
