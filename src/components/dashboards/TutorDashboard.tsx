import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  MessageCircle,
  Upload,
  CheckCircle2,
  Globe,
  Repeat,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TuitionPostCard } from '../shared/TuitionPostCard';
import { DeleteAccountSection } from '../shared/DeleteAccountSection';
import { ShareModal } from '../shared/ShareModal';
import { PushNotificationCard } from '../shared/PushNotificationCard';
import { buildWhatsAppUrl } from '../../utils/contactLinks';
import { buildTutorSharePayload } from '../../utils/shareLinks';
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
    isAuthenticated,
    switchUserRole,
    language,
    setLanguage
  } = useApp();

  const isBn = language === 'bn';
  const [activeTab, setActiveTab] = useState<'applications' | 'invitations' | 'saved' | 'settings'>('applications');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [guardianContacts, setGuardianContacts] = useState<Record<string, string>>({});
  const [isShareOpen, setIsShareOpen] = useState(false);

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
    <div className="min-h-screen bg-[#FCFBFA] pb-12 text-left animate-fade-up">
      {/* Tutor Profile Manager Header */}
      <div className="bg-white border-b border-[#EFEAE7]">
        <div className="max-w-4xl mx-auto">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-[#FFF5F2] via-[#F2EEFF] to-[#E2F0FF] border-b border-[#EFEAE7] sm:rounded-b-[28px]" />

          <div className="px-4 sm:px-6 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
              <div className="flex items-end gap-4 min-w-0">
                <img
                  src={myTutorProfile?.profilePhotoURL || myTutorProfile?.avatar || currentUser.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-sm bg-white shrink-0"
                />
                <div className="pb-1 min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#18181B] leading-snug break-words text-balance">
                    {myTutorProfile?.name || currentUser.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6B6B6B] break-words">
                    {myTutorProfile?.university || 'Tutor Profile'}
                    {myTutorProfile?.department ? ` · ${myTutorProfile.department}` : ''}
                    {' · '}
                    {myTutorProfile?.isPublished ? 'Public Profile Live' : 'Draft Profile'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {myTutorProfile && (
                  <>
                    <button
                      type="button"
                      onClick={() => viewTutorDetail(myTutorProfile)}
                      className="h-10 px-4 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap shrink-0 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>View My Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsShareOpen(true)}
                      className="h-10 px-4 rounded-full bg-[#EFEAFF] hover:bg-[#E1D8FF] border border-[#E1D8FF] text-[#18181B] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{isBn ? 'শেয়ার করুন' : 'Share Profile'}</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveView('tutor-onboarding')}
                  className="h-10 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Interactive 3-Card Bento Overview Strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-5">
              <button
                type="button"
                onClick={() => setActiveTab('applications')}
                className={`p-3 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 ${
                  activeTab === 'applications'
                    ? 'bg-[#FFF6F3] border-[#EB624B]/60 shadow-xs'
                    : 'bg-[#FFF6F3]/65 border-[#F5E4DF] hover:bg-[#FFF6F3]'
                }`}
              >
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  {isBn ? 'আবেদনসমূহ' : 'Applications'}
                </div>
                <div className="font-display text-lg sm:text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                  {myApps.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invitations')}
                className={`p-3 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 ${
                  activeTab === 'invitations'
                    ? 'bg-[#EFEAFF] border-[#7C5DFA]/50 shadow-xs'
                    : 'bg-[#EFEAFF]/65 border-[#E1D8FF] hover:bg-[#EFEAFF]'
                }`}
              >
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  {isBn ? 'টিউশন আমন্ত্রণ' : 'Invitations'}
                </div>
                <div className="font-display text-lg sm:text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                  {myInvites.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`p-3 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 ${
                  activeTab === 'saved'
                    ? 'bg-[#FFF4D6] border-[#F5A04E]/70 shadow-xs'
                    : 'bg-[#FFF4D6]/65 border-[#F8E4AE] hover:bg-[#FFF4D6]'
                }`}
              >
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  {isBn ? 'সেভড ও যাচাই' : 'Saved & Verify'}
                </div>
                <div className="font-display text-lg sm:text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                  {savedTuitions.length}
                </div>
              </button>
            </div>

            <div className="mt-4 inline-flex max-w-full items-center gap-1 p-1 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] overflow-x-auto no-scrollbar">
              {[
                { id: 'applications', label: isBn ? `আমার আবেদন (${myApps.length})` : `My Applications (${myApps.length})` },
                { id: 'invitations', label: isBn ? `আমন্ত্রণ (${myInvites.length})` : `Invitations (${myInvites.length})` },
                { id: 'saved', label: isBn ? `সেভড ও ভেরিফিকেশন (${savedTuitions.length})` : `Saved & Verification (${savedTuitions.length})` },
                { id: 'settings', label: isBn ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-9 px-4 text-xs sm:text-sm rounded-full whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#18181B] text-white font-bold shadow-xs'
                      : 'text-[#52525B] font-semibold hover:text-[#18181B] hover:bg-white/70'
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
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-6 space-y-4">
        {activeTab === 'applications' && (
          <>
            {myApps.length === 0 ? (
              <div className="ivory-card p-8 sm:p-10 text-center space-y-3">
                <div className="font-display text-lg font-extrabold text-[#18181B]">No applications sent yet</div>
                <p className="text-sm text-[#6B6B6B] max-w-md mx-auto">
                  Browse open Tuition Requests to find matching students in your area.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveView('tuitions')}
                    className="h-10 px-6 bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs sm:text-sm font-bold rounded-full cursor-pointer transition-colors"
                  >
                    Browse Tuitions
                  </button>
                </div>
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
                      `Assalamu Alaikum, following up regarding "${app.tuitionTitle}" on FeLoW WebStaR.`
                    )
                  : null;

                return (
                  <div key={app.id} className="ivory-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="font-display font-bold text-sm sm:text-base text-[#18181B] leading-snug break-words">
                        {app.tuitionTitle}
                      </div>
                      <div className="text-[#6B6B6B] tabular-nums">
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
                          className="h-9 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>WhatsApp Guardian</span>
                        </a>
                      )}
                      {(app.status === 'pending' || app.status === 'shortlisted') && (
                        <button
                          type="button"
                          onClick={() => withdrawApplication(app.id)}
                          className="h-9 px-4 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
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
              <div className="ivory-card p-8 text-center text-sm text-[#6B6B6B]">
                No direct invitations from parents or students yet.
              </div>
            ) : (
              myInvites.map(inv => {
                const guardianWa =
                  inv.status === 'accepted'
                    ? buildWhatsAppUrl(
                        inv.learnerWhatsApp,
                        `Assalamu Alaikum ${inv.learnerName}, I accepted your tuition invitation on FeLoW WebStaR.`
                      )
                    : null;

                return (
                  <div key={inv.id} className="ivory-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="font-display font-bold text-sm sm:text-base text-[#18181B] break-words">
                        {inv.learnerName} invited you for {inv.classGrade}
                      </div>
                      <div className="text-[#6B6B6B] tabular-nums">
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
                            className="h-9 px-4 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white font-bold cursor-pointer transition-colors whitespace-nowrap"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToInvitation(inv.id, 'declined')}
                            className="h-9 px-4 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] text-[#18181B] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                          >
                            Decline
                          </button>
                        </>
                      ) : guardianWa ? (
                        <a
                          href={guardianWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
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
            <div className="ivory-card p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold text-[#18181B]">
                  Verify Your Tutor Profile (Optional Badge)
                </h2>
                <p className="text-[#6B6B6B] mt-1">
                  Upload your University Student ID or NID to receive the verified checkmark on your Tutor Profile.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="h-10 px-4 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#18181B] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>{uploadingDoc ? 'Uploading...' : 'Upload University ID'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={uploadingDoc}
                    onChange={(e) => handleDocUpload(e, 'institution')}
                    className="hidden"
                  />
                </label>

                <label className="h-10 px-4 rounded-full bg-[#FFF6F3] hover:bg-[#FFEBE6] border border-[#F5E4DF] text-[#18181B] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-[#EB624B] shrink-0" />
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
                <div className="pt-3 border-t border-[#EFEAE7] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-[16px] bg-[#EFEAFF]/70 border border-[#E1D8FF]">
                      <div className="text-[11px] font-medium text-[#52525B]">University ID Status</div>
                      <div className="font-display text-sm font-bold text-[#18181B] capitalize mt-0.5">
                        {myTutorProfile?.verification?.institution?.status || 'unverified'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-[16px] bg-[#DCEBFA]/65 border border-[#C6DDF5]">
                      <div className="text-[11px] font-medium text-[#52525B]">NID / Identity Status</div>
                      <div className="font-display text-sm font-bold text-[#18181B] capitalize mt-0.5">
                        {myTutorProfile?.verification?.identity?.status || 'unverified'}
                      </div>
                    </div>
                  </div>

                  {myVerificationItems.slice(0, 3).map(v => (
                    <div
                      key={v.id}
                      className="p-3 rounded-[14px] bg-[#F8F6F5] border border-[#EFEAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                    >
                      <div className="text-[#18181B] font-medium break-words">
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
                <h3 className="font-display text-sm sm:text-base font-extrabold text-[#18181B] px-1">
                  Saved Tuition Posts
                </h3>
                {savedTuitions.map(post => (
                  <TuitionPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="ivory-card p-5 sm:p-6 space-y-4 text-xs">
              <h2 className="font-display text-base font-extrabold text-[#18181B] flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#EFEAFF] border border-[#E1D8FF] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#18181B]" />
                </span>
                <span>{isBn ? 'টিউটর অ্যাকাউন্ট ও পছন্দসমূহ' : 'Tutor Account & Preferences'}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-[18px] bg-[#FFF6F3] border border-[#F5E4DF] space-y-1">
                  <div className="text-[#52525B]">{isBn ? 'সাইন-ইন ইমেইল' : 'Signed-in Email'}</div>
                  <div className="font-semibold text-[#18181B] break-all">
                    {currentUser.email || 'Google Account'}
                  </div>
                </div>
                <div className="p-4 rounded-[18px] bg-[#EFEAFF]/70 border border-[#E1D8FF] space-y-1">
                  <div className="text-[#52525B]">{isBn ? 'প্রোফাইল দৃশ্যমানতা' : 'Profile Status'}</div>
                  <div className="font-semibold text-[#18181B]">
                    {myTutorProfile?.isPublished ? 'Published in Directory' : 'Draft / Incomplete'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveView('tutor-onboarding')}
                  className="h-10 px-4 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isBn ? 'টিউটর প্রোফাইল এডিট' : 'Edit Tutor Profile & Contact'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchUserRole('learner')}
                  className="h-10 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Repeat className="w-3.5 h-3.5 shrink-0" />
                  <span>{isBn ? 'স্টুডেন্ট / গার্জিয়ান মোডে যান' : 'Switch to Student / Guardian'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                  className="h-10 px-4 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] text-[#18181B] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Globe className="w-3.5 h-3.5 text-[#EB624B] shrink-0" />
                  <span>{language === 'en' ? 'বাংলা ভাষা' : 'English Language'}</span>
                </button>
              </div>
            </div>

            <PushNotificationCard />

            <DeleteAccountSection />
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

      {myTutorProfile && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          {...buildTutorSharePayload(myTutorProfile)}
        />
      )}
    </div>
  );
};
