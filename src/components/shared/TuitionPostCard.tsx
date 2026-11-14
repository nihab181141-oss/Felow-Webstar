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
      <div className="p-4 pb-2 flex items-start justify-between gap-3">
        <div
          onClick={() => viewTuitionDetail(post)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#DCEBFA] text-[#252525] font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-[#252525] leading-snug break-words">
              <strong className="font-bold hover:underline">{post.learnerName}</strong>
            </div>
            <div className="text-xs text-[#858585] flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-[#F47C68] shrink-0" />
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
          className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFF3EF] transition-colors cursor-pointer shrink-0 ${
            isSaved ? 'text-[#C94A35] bg-[#FFF3EF]' : 'text-[#858585]'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#F47C68]' : ''}`} />
        </button>
      </div>

      <div
        onClick={() => viewTuitionDetail(post)}
        className="px-4 pb-3 space-y-2.5 cursor-pointer"
      >
        <h3 className="text-[15px] font-bold text-[#252525] leading-snug break-words">{post.title}</h3>

        <div className="bg-[#FFF3EF] rounded-2xl p-3.5 space-y-1.5 text-xs">
          <div className="flex items-start gap-2 text-[#252525]">
            <BookOpen className="w-4 h-4 text-[#F47C68] shrink-0 mt-0.5" />
            <span className="leading-snug break-words">
              <strong>{post.classGrade}</strong> · {post.subjects.join(', ')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#858585]">
            <strong className="font-mono text-[#252525] tabular-nums">৳{post.salaryOfferBDT.toLocaleString()}/mo</strong>
            <span aria-hidden="true">·</span>
            <span>{post.daysPerWeek} days/wk</span>
            <span aria-hidden="true">·</span>
            <span>{post.tuitionType}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[#F1E1DC] grid grid-cols-2 gap-2">
        {isOwnPost ? (
          <button
            type="button"
            onClick={() => viewTuitionDetail(post)}
            className="h-10 px-4 rounded-full text-xs font-semibold bg-[#DCEBFA]/70 hover:bg-[#DCEBFA] text-[#252525] transition-colors cursor-pointer whitespace-nowrap"
          >
            Applicants ({post.totalApplicants})
          </button>
        ) : alreadyApplied ? (
          <button
            type="button"
            onClick={() => viewTuitionDetail(post)}
            className="h-10 px-4 rounded-full text-xs font-semibold bg-[#DCEBFA] text-[#252525] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            <span>Applied</span>
          </button>
        ) : post.status === 'open' ? (
          <button
            type="button"
            onClick={handleApplyClick}
            className="h-10 px-4 rounded-full text-xs font-bold bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        ) : (
          <div className="h-10 px-4 rounded-full text-xs font-semibold bg-[#FFF3EF] text-[#858585] flex items-center justify-center">
            Closed
          </div>
        )}

        <button
          type="button"
          onClick={() => viewTuitionDetail(post)}
          className="h-10 px-4 rounded-full text-xs font-semibold text-[#252525] bg-[#DCEBFA]/70 hover:bg-[#DCEBFA] transition-colors cursor-pointer whitespace-nowrap"
        >
          Details
        </button>
      </div>
    </article>
  );
};
