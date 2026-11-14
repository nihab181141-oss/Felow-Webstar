import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  MessageCircle,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TuitionPostCard } from '../shared/TuitionPostCard';
import { buildWhatsAppUrl } from '../../utils/contactLinks';
import { DEFAULT_PLACEHOLDER_AVATAR } from '../../types';

export const TutorDashboard: React.FC = () => {
  const {
    currentUser,
    myTutorProfile,
    applications,
    invitations,
    tuitionPosts,
    savedTuitionIds,
    verificationQueue,
    withdrawApplication,
    respondToInvitation,
    setActiveView,
    viewTutorDetail,
    uploadTutorDoc,
    submitNewVerificationDoc,
    getTuitionPrivateContact,
    isAuthenticated
  } = useApp();

  const [activeTab, setActiveTab] = useState<'applications' | 'invitations' | 'saved'>('applications');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [guardianContacts, setGuardianContacts] = useState<Record<string, string>>({});

  const myApps = applications.filter(
    a => a.tutorId === currentUser.id || a.tutorId === currentUser.tutorProfileId
  );
  const myInvites = invitations.filter(
    i => i.tutorId === currentUser.id || i.tutorId === currentUser.tutorProfileId
  );
  const savedTuitions = tuitionPosts.filter(p => savedTuitionIds.includes(p.id));
  const myVerificationItems = verificationQueue.filter(
    v => v.tutorId === currentUser.id || v.tutorId === myTutorProfile?.id
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const unlockedMissing = myApps.filter(
      a =>
        (a.status === 'shortlisted' || a.status === 'invited' || a.status === 'accepted') &&
        !a.guardianWhatsApp &&
        !a.isSample &&
        !a.tuitionPostId.startsWith('post-') &&
        !guardianContacts[a.tuitionPostId]
    );
    if (unlockedMissing.length === 0) return;

    Promise.all(
      unlockedMissing.map(async a => {
        const priv = await getTuitionPrivateContact(a.tuitionPostId);
        return priv?.whatsappNumber ? [a.tuitionPostId, priv.whatsappNumber] as const : null;
      })
    ).then(results => {
      if (!active) return;
      const next: Record<string, string> = {};
      results.forEach(entry => {
        if (entry) next[entry[0]] = entry[1];
      });
      if (Object.keys(next).length > 0) {
        setGuardianContacts(prev => ({ ...prev, ...next }));
      }
    });

    return () => {
      active = false;
    };
  }, [myApps, isAuthenticated, getTuitionPrivateContact, guardianContacts]);

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'identity' | 'institution'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const url = await uploadTutorDoc(file);
      if (!url) return;
      await submitNewVerificationDoc(
        myTutorProfile?.id || currentUser.id,
        type,
        file.name,
        url
      );
    } catch {
      // Error toast already shown by uploadTutorDoc
    } finally {
      e.target.value = '';
      setUploadingDoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-12 text-left animate-fade-up">
      {/* Tutor Profile Manager Header */}
      <div className="bg-white border-b border-[#F1E1DC]">
        <div className="max-w-4xl mx-auto">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-[#FFF3EF] via-[#FFE2D9] to-[#DCEBFA] border-b border-[#F1E1DC] sm:rounded-b-3xl" />

          <div className="px-4 sm:px-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
              <div className="flex items-end gap-4 min-w-0">
                <img
                  src={myTutorProfile?.profilePhotoURL || myTutorProfile?.avatar || currentUser.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-sm bg-white shrink-0"
                />
                <div className="pb-1 min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-[#252525] leading-snug break-words">
                    {myTutorProfile?.name || currentUser.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#858585] break-words">
                    {myTutorProfile?.university || 'Tutor Profile'}
                    {myTutorProfile?.department ? ` · ${myTutorProfile.department}` : ''}
                    {' · '}
                    {myTutorProfile?.isPublished ? 'Public Profile Live' : 'Draft Profile'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {myTutorProfile && (
                  <button
                    type="button"
                    onClick={() => viewTutorDetail(myTutorProfile)}
                    className="h-10 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View My Profile</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveView('tutor-onboarding')}
                  className="h-10 px-4 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            <div className="border-t border-[#F1E1DC] mt-4 pt-2 flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'applications', label: `My Applications (${myApps.length})` },
                { id: 'invitations', label: `Invitations (${myInvites.length})` },
                { id: 'saved', label: `Saved & Verification (${savedTuitions.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-9 px-4 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#DCEBFA] text-[#252525]'
                      : 'text-[#858585] hover:bg-[#FFF3EF] hover:text-[#252525]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-5 space-y-4">
        {activeTab === 'applications' && (
          <>
            {myApps.length === 0 ? (
              <div className="ivory-card p-8 text-center space-y-3">
                <div className="text-base font-bold text-[#252525]">No applications sent yet</div>
                <p className="text-sm text-[#858585]">
                  Browse Tuition Requests to find matching students in your area.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('tuitions')}
                  className="h-10 px-6 bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold rounded-full cursor-pointer transition-colors"
                >
                  Browse Tuitions
                </button>
              </div>
            ) : (
              myApps.map(app => {
                const unlockedGuardianPhone =
                  app.guardianWhatsApp || guardianContacts[app.tuitionPostId];
                const canContact =
                  (app.status === 'shortlisted' || app.status === 'invited' || app.status === 'accepted') &&
                  Boolean(unlockedGuardianPhone);
                const guardianWa = canContact
                  ? buildWhatsAppUrl(
                      unlockedGuardianPhone,
                      `Assalamu Alaikum, following up regarding "${app.tuitionTitle}" on Tutorly.`
                    )
                  : null;

                return (
                  <div key={app.id} className="ivory-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="font-bold text-sm text-[#252525] leading-snug break-words">{app.tuitionTitle}</div>
                      <div className="text-[#858585] tabular-nums">
                        Proposed: ৳{app.proposedSalaryBDT.toLocaleString()}/mo · Applied {app.appliedAt} ·{' '}
                        <span className="font-bold text-[#C94A35] uppercase">{app.status}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {guardianWa && (
                        <a
                          href={guardianWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Guardian</span>
                        </a>
                      )}
                      {(app.status === 'pending' || app.status === 'shortlisted') && (
                        <button
                          type="button"
                          onClick={() => withdrawApplication(app.id)}
                          className="h-9 px-4 rounded-full bg-[#FFF3EF] hover:bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'invitations' && (
          <>
            {myInvites.length === 0 ? (
              <div className="ivory-card p-8 text-center text-sm text-[#858585]">
                No direct invitations from parents or students yet.
              </div>
            ) : (
              myInvites.map(inv => {
                const guardianWa =
                  inv.status === 'accepted'
                    ? buildWhatsAppUrl(
                        inv.learnerWhatsApp,
                        `Assalamu Alaikum ${inv.learnerName}, I accepted your tuition invitation on Tutorly.`
                      )
                    : null;

                return (
                  <div key={inv.id} className="ivory-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-sm text-[#252525] break-words">
                        {inv.learnerName} invited you for {inv.classGrade}
                      </div>
                      <div className="text-[#858585] tabular-nums">
                        {inv.subjects.join(', ')} · ৳{inv.offerSalaryBDT.toLocaleString()}/mo ·{' '}
                        <span className="font-bold text-[#C94A35] uppercase">{inv.status}</span>
                      </div>
                      <p className="text-[#252525] leading-relaxed">{inv.message}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {inv.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => respondToInvitation(inv.id, 'accepted')}
                            className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold cursor-pointer transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToInvitation(inv.id, 'declined')}
                            className="h-9 px-4 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] font-semibold cursor-pointer transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      ) : guardianWa ? (
                        <a
                          href={guardianWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="ivory-card p-5 space-y-3 text-xs">
              <h2 className="font-display text-base font-bold text-[#252525]">
                Verify Your Tutor Profile (Optional Badge)
              </h2>
              <p className="text-[#858585]">
                Upload your University Student ID or NID to receive the verified checkmark on your Tutor Profile.
              </p>
              <div className="flex flex-wrap gap-3">
                <label className="h-10 px-4 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#252525] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingDoc ? 'Uploading...' : 'Upload University ID'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={uploadingDoc}
                    onChange={(e) => handleDocUpload(e, 'institution')}
                    className="hidden"
                  />
                </label>

                <label className="h-10 px-4 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-[#F47C68]" />
                  <span>{uploadingDoc ? 'Uploading...' : 'Upload NID'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={uploadingDoc}
                    onChange={(e) => handleDocUpload(e, 'identity')}
                    className="hidden"
                  />
                </label>
              </div>

              {(myTutorProfile || myVerificationItems.length > 0) && (
                <div className="pt-2 border-t border-[#F1E1DC] space-y-2">
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF3EF] text-[#252525] font-semibold">
                      University ID: {myTutorProfile?.verification?.institution?.status || 'unverified'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF3EF] text-[#252525] font-semibold">
                      NID / Identity: {myTutorProfile?.verification?.identity?.status || 'unverified'}
                    </span>
                  </div>
                  {myVerificationItems.slice(0, 3).map(v => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded-xl bg-[#FFF3EF] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                    >
                      <div className="text-[#252525] font-medium break-words">
                        {v.verificationType} · {v.documentName}
                      </div>
                      <div className="font-bold uppercase text-[#C94A35]">
                        {v.status}
                        {v.status === 'rejected' && v.rejectionReason ? ` — ${v.rejectionReason}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {savedTuitions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#252525] px-1">Saved Tuition Posts</h3>
                {savedTuitions.map(post => (
                  <TuitionPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-12 pb-6 flex justify-center">
        <img
          src="/assets/aistudio/felow-webstar-color_11ef6d13.svg"
          alt="FeLoW WebStaR"
          className="w-[300px] sm:w-[420px] md:w-[500px] max-w-full h-auto block select-none"
        />
      </div>
    </div>
  );
};
