import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Edit3,
  MapPin,
  MessageCircle,
  Send,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_PLACEHOLDER_AVATAR } from '../../types';
import { buildWhatsAppUrl } from '../../utils/contactLinks';
import { trackAnalyticsEvent } from '../../utils/analytics';

export const TuitionFullDetailPage: React.FC = () => {
  const {
    tuitionPosts,
    tutors,
    applications,
    selectedTuition,
    setSelectedTuition,
    setSelectedTutor,
    setDirectoryTab,
    setActiveView,
    savedTuitionIds,
    toggleSaveTuition,
    hasAppliedToPost,
    getUserApplicationForPost,
    withdrawApplication,
    updateApplicationStatus,
    canViewLearnerWhatsApp,
    canViewTutorWhatsApp,
    getTuitionPrivateContact,
    openEditTuitionModal,
    deleteTuitionPost,
    setIsApplyModalOpen,
    currentUser,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    submitReport
  } = useApp();

  const post =
    tuitionPosts.find(p => p.id === selectedTuition?.id) || selectedTuition || null;

  const [guardianPrivateWa, setGuardianPrivateWa] = useState('');
  const canViewGuardianWa = post ? canViewLearnerWhatsApp(post.learnerId) : false;

  useEffect(() => {
    let active = true;
    setGuardianPrivateWa('');
    if (!post || !isAuthenticated || !canViewGuardianWa || post.whatsappNumber) {
      return;
    }
    getTuitionPrivateContact(post.id).then(priv => {
      if (active && priv?.whatsappNumber) {
        setGuardianPrivateWa(priv.whatsappNumber);
      }
    });
    return () => {
      active = false;
    };
  }, [post?.id, post?.whatsappNumber, isAuthenticated, canViewGuardianWa, getTuitionPrivateContact]);

  if (!post) {
    return (
      <div className="min-h-[70vh] bg-[#FFFFFF] flex items-center justify-center px-4">
        <div className="ivory-card p-8 max-w-md w-full text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-[#252525]">Tuition post not found</h1>
          <button
            type="button"
            onClick={() => {
              setDirectoryTab('tuitions');
              setActiveView('landing');
            }}
            className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-sm font-bold cursor-pointer"
          >
            Back to Tuition Posts
          </button>
        </div>
      </div>
    );
  }

  const isSaved = savedTuitionIds.includes(post.id);
  const isOwn = post.learnerId === currentUser.id;
  const userApp = getUserApplicationForPost(post.id);
  const alreadyApplied = hasAppliedToPost(post.id);
  const postApps = applications.filter(
    a => a.tuitionPostId === post.id && a.status !== 'withdrawn'
  );
  const resolvedGuardianPhone =
    post.whatsappNumber || userApp?.guardianWhatsApp || guardianPrivateWa;
  const guardianWa =
    canViewGuardianWa && resolvedGuardianPhone
      ? buildWhatsAppUrl(
          resolvedGuardianPhone,
          `Assalamu Alaikum ${post.learnerName}, following up on "${post.title}" on FeLoW WebStaR.`
        )
      : null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FFFFFF] py-5 px-3 sm:px-6 pb-14 text-left animate-fade-up">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedTuition(post);
              setDirectoryTab('tuitions');
              setActiveView('landing');
            }}
            className="h-10 px-4 rounded-full bg-[#FFF3EF] border border-[#F3D5CC] hover:bg-[#FFE6DD] text-xs sm:text-sm font-semibold text-[#252525] inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Tuition Posts</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSaveTuition(post.id)}
            className={`h-10 px-4 rounded-full border text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#FFF3EF] border-[#F47C68]/50 text-[#C94A35]'
                : 'bg-white border-[#F1E1DC] hover:bg-[#FFF3EF] text-[#252525]'
            }`}
          >
            <Bookmark className={`w-4 h-4 shrink-0 ${isSaved ? 'fill-[#F47C68]' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save Post'}</span>
          </button>
        </div>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6B6B6B] flex-wrap">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setDirectoryTab('tuitions');
              setActiveView('landing');
            }}
            className="hover:text-[#C94A35] transition-colors"
          >
            Home
          </a>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <a
            href="/tuitions"
            onClick={(e) => {
              e.preventDefault();
              setDirectoryTab('tuitions');
              setActiveView('tuitions');
            }}
            className="hover:text-[#C94A35] transition-colors"
          >
            Tuitions
          </a>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[#252525] truncate max-w-[260px]">{post.title}</span>
        </nav>

        <article className="ivory-card p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="text-xs font-bold text-[#C94A35] uppercase">
                {post.status} · {post.tuitionType}
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#252525] leading-snug break-words">
                {post.title}
              </h1>
              <div className="text-xs sm:text-sm text-[#858585] flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span>
                  Posted by <strong className="text-[#252525]">{post.learnerName}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F47C68] shrink-0" />
                  <span>
                    {post.area}, {post.district}
                  </span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{post.postedDate}</span>
              </div>
            </div>

            {isOwn && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditTuitionModal(post)}
                  className="h-9 px-4 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-xs font-semibold text-[#252525] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteTuitionPost(post.id);
                    setActiveView('landing');
                  }}
                  className="h-9 px-4 rounded-full bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-600 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-[#FFF3EF]">
              <div className="text-xs text-[#858585]">Class</div>
              <div className="font-bold text-[#252525] mt-0.5 leading-snug">{post.classGrade}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF3EF]">
              <div className="text-xs text-[#858585]">Medium</div>
              <div className="font-bold text-[#252525] mt-0.5 leading-snug">{post.medium}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF3EF]">
              <div className="text-xs text-[#858585]">Schedule</div>
              <div className="font-bold text-[#252525] mt-0.5 tabular-nums">
                {post.daysPerWeek} days/wk
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#DCEBFA]/75">
              <div className="text-xs text-[#252525] font-semibold">Monthly Salary</div>
              <div className="font-mono font-extrabold text-[#252525] mt-0.5 tabular-nums">
                ৳{post.salaryOfferBDT.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm border-t border-[#F1E1DC] pt-5">
            <h2 className="font-display text-base font-bold text-[#252525]">
              Requirements & Student Details
            </h2>
            <p className="text-[#252525] leading-relaxed">{post.requirementsDescription}</p>
            <div className="text-xs sm:text-sm text-[#858585] space-y-1.5 pt-1">
              <div>
                <strong className="text-[#252525]">Subjects: </strong>
                {post.subjects.join(', ')}
              </div>
              <div>
                <strong className="text-[#252525]">Preferred Tutor Gender: </strong>
                {post.preferredTutorGender}
              </div>
              {post.preferredUniversity && (
                <div>
                  <strong className="text-[#252525]">Preferred University: </strong>
                  {post.preferredUniversity}
                </div>
              )}
              {post.preferredTime && (
                <div>
                  <strong className="text-[#252525]">Preferred Time: </strong>
                  {post.preferredTime}
                </div>
              )}
            </div>
          </div>

          {!isOwn ? (
            <div className="pt-5 border-t border-[#F1E1DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {alreadyApplied && userApp ? (
                  <>
                    <div className="h-10 px-5 rounded-full bg-[#DCEBFA] text-[#252525] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                      <span>Applied ({userApp.status})</span>
                    </div>
                    {(userApp.status === 'pending' || userApp.status === 'shortlisted') && (
                      <button
                        type="button"
                        onClick={() => withdrawApplication(userApp.id)}
                        className="h-10 px-5 rounded-full bg-[#FFF3EF] hover:bg-rose-50 text-rose-600 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Withdraw
                      </button>
                    )}
                  </>
                ) : post.status === 'open' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setAuthModalMode('login');
                        setIsAuthModalOpen(true);
                        return;
                      }
                      setSelectedTuition(post);
                      setIsApplyModalOpen(true);
                    }}
                    className="h-11 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-sm font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Apply for Tuition</span>
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-[#858585]">Applications Closed</span>
                )}

                {guardianWa && (
                  <a
                    href={guardianWa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackAnalyticsEvent('whatsapp_contact_click', {
                        target_type: 'guardian',
                        district: post.district
                      })
                    }
                    className="h-11 px-5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Guardian</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  submitReport({
                    reportedItemType: 'tuition',
                    targetTitle: post.title,
                    targetId: post.id,
                    reportedBy: currentUser.name,
                    reportedById: currentUser.id,
                    reason: 'Flagged tuition post'
                  })
                }
                className="text-xs text-[#858585] hover:text-[#252525] hover:underline cursor-pointer self-start sm:self-center"
              >
                Report post
              </button>
            </div>
          ) : (
            <div className="pt-5 border-t border-[#F1E1DC] space-y-3">
              <h2 className="font-display text-base font-bold text-[#252525]">
                Tutor Applicants ({postApps.length})
              </h2>
              {postApps.length === 0 ? (
                <p className="text-sm text-[#858585]">
                  No applicants yet. Tutors will appear here when they apply.
                </p>
              ) : (
                <div className="space-y-3">
                  {postApps.map(app => {
                    const matchedTutor = tutors.find(
                      t => t.id === app.tutorId || t.uid === app.tutorId
                    );
                    const isUnlockedByStatus =
                      app.status === 'shortlisted' ||
                      app.status === 'invited' ||
                      app.status === 'accepted';
                    const canShowTutorWa = matchedTutor
                      ? canViewTutorWhatsApp(matchedTutor) ||
                        (isUnlockedByStatus &&
                          matchedTutor.whatsappConsent !== false &&
                          matchedTutor.contactVisibility !== 'hidden')
                      : Boolean(app.tutorWhatsApp);
                    const tutorWa = canShowTutorWa
                      ? buildWhatsAppUrl(
                          app.tutorWhatsApp || matchedTutor?.whatsappNumber || matchedTutor?.phone,
                          `Hello ${app.tutorName}, regarding "${post.title}" on FeLoW WebStaR.`
                        )
                      : null;

                    return (
                      <div key={app.id} className="p-4 rounded-2xl bg-[#FFF3EF] space-y-2.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={app.tutorAvatar || DEFAULT_PLACEHOLDER_AVATAR}
                              alt={app.tutorName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-[#F1E1DC] shrink-0"
                            />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedTutor) {
                                    setSelectedTutor(matchedTutor);
                                    setActiveView('tutor-detail');
                                  }
                                }}
                                className="text-sm font-bold text-[#252525] hover:text-[#C94A35] hover:underline cursor-pointer text-left"
                              >
                                {app.tutorName}
                              </button>
                              <div className="text-xs text-[#858585] tabular-nums">
                                {app.tutorUniversity} · ৳{app.proposedSalaryBDT.toLocaleString()}/mo
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold uppercase text-[#C94A35]">
                            {app.status}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#252525] leading-relaxed">
                          {app.coverLetter}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          {tutorWa && (
                            <a
                              href={tutorWa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          {app.status !== 'accepted' && app.status !== 'rejected' && (
                            <>
                              {app.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                                  className="h-9 px-4 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#252525] text-xs font-semibold cursor-pointer"
                                >
                                  Shortlist
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                className="h-9 px-4 rounded-full bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
};
