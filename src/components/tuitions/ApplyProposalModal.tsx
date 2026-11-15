import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TuitionPost } from '../../types';

interface ApplyProposalModalProps {
  post: TuitionPost | null;
  onClose: () => void;
}

export const ApplyProposalModal: React.FC<ApplyProposalModalProps> = ({ post, onClose }) => {
  const {
    submitApplication,
    currentUser,
    tutors,
    myTutorProfile,
    isAuthenticated,
    isDemoSession,
    setActiveView,
    isApplyModalOpen,
    getUserApplicationForPost,
    showToast
  } = useApp();

  const currentTutor =
    myTutorProfile ||
    tutors.find(t => t.id === currentUser.tutorProfileId || t.uid === currentUser.id);

  const [proposedSalary, setProposedSalary] = useState<number>(post?.salaryOfferBDT || 8000);
  const [availableSchedule, setAvailableSchedule] = useState(
    post?.preferredTime || '3 days/week · Evening'
  );
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setProposedSalary(post.salaryOfferBDT || currentTutor?.expectedSalaryMin || 8000);
      setAvailableSchedule(post.preferredTime || `${post.daysPerWeek} days/week`);
      setNote(
        currentTutor
          ? `Assalamu Alaikum. I am ${currentTutor.name} (${currentTutor.department}, ${currentTutor.university})${
              currentTutor.experienceYears > 0
                ? ` with ${currentTutor.experienceYears} years of teaching experience`
                : ''
            }.`
          : `Assalamu Alaikum. I am ${currentUser.name} and I am available to teach this tuition.`
      );
    }
  }, [post, currentTutor, currentUser]);

  if (!isApplyModalOpen || !post) return null;

  const existingApp = getUserApplicationForPost(post.id);
  const isOwnPost = post.learnerId === currentUser.id;
  const isPostClosed = post.status !== 'open';
  const isLiveSampleBlocked = Boolean(
    isAuthenticated && !isDemoSession && (post.isSample || post.id.startsWith('post-'))
  );
  const needsPublishedTutorProfile = Boolean(
    isAuthenticated && !isDemoSession && (!currentTutor || !currentTutor.isPublished)
  );
  const canShareContact =
    currentTutor?.whatsappConsent !== false && currentTutor?.contactVisibility !== 'hidden';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingApp || isOwnPost || isPostClosed || isLiveSampleBlocked || needsPublishedTutorProfile) {
      return;
    }
    const cleanSalary = Math.round(Number(proposedSalary));
    if (!Number.isFinite(cleanSalary) || cleanSalary < 1000 || cleanSalary > 500000) {
      showToast('Enter a valid monthly salary between ৳1,000 and ৳500,000.', 'error');
      return;
    }
    if (!note.trim()) {
      showToast('Please write a short message for the student or parent.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const expYears = currentTutor?.experienceYears ?? 0;
      await submitApplication({
        tuitionPostId: post.id,
        tuitionTitle: post.title,
        learnerId: post.learnerId,
        learnerName: post.learnerName,
        tutorId: currentUser.id,
        tutorName: currentTutor?.name || currentUser.name,
        tutorAvatar: currentTutor?.profilePhotoURL || currentTutor?.avatar || currentUser.avatar,
        tutorUniversity: currentTutor?.university || currentUser.university || 'University Tutor',
        tutorDepartment: currentTutor?.department || currentUser.department,
        tutorAcademicYear: currentTutor?.academicYear || currentUser.academicYear,
        tutorRating: currentTutor?.rating ?? 0,
        tutorExperienceYears: expYears,
        tutorWhatsApp: canShareContact
          ? currentTutor?.whatsappNumber ||
            currentTutor?.phone ||
            currentUser.whatsappNumber ||
            currentUser.phone
          : undefined,
        tutorFacebookUrl: canShareContact
          ? currentTutor?.facebookUrl || currentUser.facebookUrl
          : undefined,
        proposedSalaryBDT: cleanSalary,
        introduction: note.trim(),
        coverLetter: note.trim(),
        experienceSummary:
          currentTutor?.experienceSummary ||
          (expYears > 0 ? `${expYears} years teaching experience` : 'University tutor on FeLoW WebStaR'),
        suitabilityReason: note.trim(),
        availableSchedule: availableSchedule.trim()
      });
      onClose();
    } catch {
      // Toast already surfaced by AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#F1E1DC] max-w-md w-full shadow-xl overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#F1E1DC] flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-[#252525]">Apply for Tuition</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FFF3EF]">
            <div className="font-bold text-sm text-[#252525] leading-snug">{post.title}</div>
            <div className="text-[#858585] mt-0.5">
              {post.area}, {post.district} · Offer: ৳{post.salaryOfferBDT.toLocaleString()}/mo
            </div>
          </div>

          {isOwnPost ? (
            <div className="p-3 rounded-2xl bg-[#FFF3EF] text-[#252525] border border-[#F5A04E] font-semibold">
              You cannot apply to your own tuition post.
            </div>
          ) : existingApp ? (
            <div className="p-3 rounded-2xl bg-[#DCEBFA] text-[#252525] font-semibold">
              You already applied ({existingApp.status}).
            </div>
          ) : isPostClosed ? (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 font-semibold">
              This tuition post is closed.
            </div>
          ) : isLiveSampleBlocked ? (
            <div className="p-3.5 rounded-2xl bg-[#FFF3EF] text-[#252525] border border-[#F5A04E] space-y-2">
              <div className="font-semibold">This is a sample tuition preview.</div>
              <p className="text-[#858585]">
                Please select a live tuition post published by a student or guardian to submit your application.
              </p>
            </div>
          ) : needsPublishedTutorProfile ? (
            <div className="p-3.5 rounded-2xl bg-[#FFF3EF] text-[#252525] border border-[#F5A04E] space-y-3">
              <div className="font-semibold">Complete & publish your Tutor Profile first.</div>
              <p className="text-[#858585]">
                Students and guardians review your university, photo, and subjects before accepting applications.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveView('tutor-onboarding');
                }}
                className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold cursor-pointer"
              >
                Complete Tutor Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">
                    Expected Salary (৳/mo)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={proposedSalary}
                    onChange={(e) => setProposedSalary(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] font-mono font-bold outline-none focus:border-[#F47C68]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">
                    Available Schedule
                  </label>
                  <input
                    type="text"
                    required
                    value={availableSchedule}
                    onChange={(e) => setAvailableSchedule(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] outline-none focus:border-[#F47C68]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">
                  Short Message to {post.learnerName} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] leading-relaxed outline-none focus:border-[#F47C68]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-5 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Application'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
