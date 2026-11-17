import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  MessageCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Globe,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TutorPageCard } from '../shared/TutorPageCard';
import { DeleteAccountSection } from '../shared/DeleteAccountSection';
import { BrandWordmark } from '../shared/BrandWordmark';
import { buildWhatsAppUrl, isValidBdWhatsAppNumber, sanitizeFacebookUrl } from '../../utils/contactLinks';
import { BD_DISTRICTS_BY_DIVISION, getDivisionByDistrict, getAreasOrUpazilas } from '../../data/bangladeshData';
import { DEFAULT_PLACEHOLDER_AVATAR, LearnerSubtype } from '../../types';
import { extractFriendlyErrorMessage } from '../../services/firebase';

const ALL_DISTRICTS = Array.from(new Set(Object.values(BD_DISTRICTS_BY_DIVISION).flat())).sort();

export const LearnerDashboard: React.FC = () => {
  const {
    currentUser,
    learnerProfile,
    tuitionPosts,
    applications,
    tutors,
    savedTutorIds,
    invitations,
    canViewTutorWhatsApp,
    openCreateTuitionModal,
    openEditTuitionModal,
    deleteTuitionPost,
    updateApplicationStatus,
    saveLearnerProfile,
    activateDualRole,
    viewTutorDetail,
    language,
    setLanguage
  } = useApp();

  const isBn = language === 'bn';
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'invitations' | 'settings'>('posts');

  const [name, setName] = useState(learnerProfile?.name || currentUser.name || '');
  const [learnerType, setLearnerType] = useState<LearnerSubtype>(
    learnerProfile?.learnerType || currentUser.learnerSubtype || 'guardian'
  );
  const [district, setDistrict] = useState(learnerProfile?.district || currentUser.district || 'Dhaka');
  const [area, setArea] = useState(learnerProfile?.area || currentUser.area || 'Dhanmondi');
  const [whatsapp, setWhatsapp] = useState(
    learnerProfile?.whatsappNumber || currentUser.whatsappNumber || currentUser.phone || ''
  );
  const [facebookUrl, setFacebookUrl] = useState(
    learnerProfile?.facebookUrl || currentUser.facebookUrl || ''
  );
  const [phoneVisibility, setPhoneVisibility] = useState<boolean>(
    learnerProfile?.phoneVisibility ?? currentUser.phoneVisibility ?? false
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    setName(learnerProfile?.name || currentUser.name || '');
    setLearnerType(learnerProfile?.learnerType || currentUser.learnerSubtype || 'guardian');
    setDistrict(learnerProfile?.district || currentUser.district || 'Dhaka');
    setArea(learnerProfile?.area || currentUser.area || 'Dhanmondi');
    setWhatsapp(
      learnerProfile?.whatsappNumber || currentUser.whatsappNumber || currentUser.phone || ''
    );
    setFacebookUrl(learnerProfile?.facebookUrl || currentUser.facebookUrl || '');
    setPhoneVisibility(learnerProfile?.phoneVisibility ?? currentUser.phoneVisibility ?? false);
  }, [
    learnerProfile?.name,
    learnerProfile?.learnerType,
    learnerProfile?.district,
    learnerProfile?.area,
    learnerProfile?.whatsappNumber,
    learnerProfile?.facebookUrl,
    learnerProfile?.phoneVisibility,
    currentUser.name,
    currentUser.learnerSubtype,
    currentUser.district,
    currentUser.area,
    currentUser.whatsappNumber,
    currentUser.phone,
    currentUser.facebookUrl,
    currentUser.phoneVisibility
  ]);

  const myPosts = tuitionPosts.filter(p => p.learnerId === currentUser.id);
  const savedTutors = tutors.filter(t => savedTutorIds.includes(t.id));
  const myInvitations = invitations.filter(i => i.learnerId === currentUser.id);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setSettingsError(isBn ? 'আপনার পুরো নাম লিখুন।' : 'Please enter your full name.');
      return;
    }

    const cleanWa = whatsapp.trim();
    if (cleanWa && !isValidBdWhatsAppNumber(cleanWa)) {
      setSettingsError(
        isBn
          ? 'সঠিক বাংলাদেশি WhatsApp নম্বর দিন (যেমন: 017XXXXXXXX)।'
          : 'Please enter a valid Bangladeshi WhatsApp number (e.g. 017XXXXXXXX).'
      );
      return;
    }

    const cleanFbInput = facebookUrl.trim();
    if (cleanFbInput && !sanitizeFacebookUrl(cleanFbInput)) {
      setSettingsError(
        isBn
          ? 'সঠিক Facebook প্রোফাইল লিংক দিন (যেমন: https://facebook.com/username)।'
          : 'Please enter a valid Facebook profile URL (e.g. https://facebook.com/username).'
      );
      return;
    }

    setSavingSettings(true);
    try {
      await saveLearnerProfile({
        name: cleanName,
        learnerType,
        district,
        division: getDivisionByDistrict(district),
        upazila: area,
        area,
        whatsappNumber: cleanWa,
        phone: cleanWa,
        facebookUrl: cleanFbInput ? sanitizeFacebookUrl(cleanFbInput) || '' : '',
        phoneVisibility
      });
    } catch (err: any) {
      setSettingsError(
        extractFriendlyErrorMessage(
          err,
          isBn ? 'সেটিংস সেভ করা যায়নি।' : 'Could not save settings.'
        )
      );
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBFA] pb-12 text-left animate-fade-up">
      {/* Account Header */}
      <div className="bg-white border-b border-[#EFEAE7]">
        <div className="max-w-4xl mx-auto">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-[#FFF5F2] via-[#F2EEFF] to-[#E2F0FF] border-b border-[#EFEAE7] sm:rounded-b-[28px]" />

          <div className="px-4 sm:px-6 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
              <div className="flex items-end gap-4 min-w-0">
                <img
                  src={currentUser.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-sm bg-white shrink-0"
                />
                <div className="pb-1 min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#18181B] leading-snug break-words text-balance">
                    {currentUser.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6B6B6B] break-words">
                    {learnerType === 'student' ? 'Student Account' : 'Guardian / Parent Account'} · {area}, {district}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openCreateTuitionModal}
                  className="h-10 px-5 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap shrink-0 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>{isBn ? 'টিউশন পোস্ট' : 'Post Tuition'}</span>
                </button>
              </div>
            </div>

            {/* Interactive 3-Card Bento Overview Strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-5">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`p-3 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 ${
                  activeTab === 'posts'
                    ? 'bg-[#FFF6F3] border-[#EB624B]/60 shadow-xs'
                    : 'bg-[#FFF6F3]/65 border-[#F5E4DF] hover:bg-[#FFF6F3]'
                }`}
              >
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  {isBn ? 'টিউশন পোস্ট' : 'Tuition Posts'}
                </div>
                <div className="font-display text-lg sm:text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                  {myPosts.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`p-3 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 ${
                  activeTab === 'saved'
                    ? 'bg-[#EFEAFF] border-[#7C5DFA]/50 shadow-xs'
                    : 'bg-[#EFEAFF]/65 border-[#E1D8FF] hover:bg-[#EFEAFF]'
                }`}
              >
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  {isBn ? 'সেভড টিউটর' : 'Saved Tutors'}
                </div>
                <div className="font-display text-lg sm:text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                  {savedTutors.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invitations')}
                className={`p-3 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 ${
                  activeTab === 'invitations'
                    ? 'bg-[#DCEBFA] border-[#60A5FA]/60 shadow-xs'
                    : 'bg-[#DCEBFA]/60 border-[#C6DDF5] hover:bg-[#DCEBFA]'
                }`}
              >
                <div className="text-[11px] font-medium text-[#52525B] truncate">
                  {isBn ? 'পাঠানো আমন্ত্রণ' : 'Sent Invites'}
                </div>
                <div className="font-display text-lg sm:text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                  {myInvitations.length}
                </div>
              </button>
            </div>

            {/* Clean 4-Tab Segmented Profile Navigation */}
            <div className="mt-4 inline-flex max-w-full items-center gap-1 p-1 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] overflow-x-auto no-scrollbar">
              {[
                { id: 'posts', label: isBn ? `আমার পোস্ট (${myPosts.length})` : `My Tuition Posts (${myPosts.length})` },
                { id: 'saved', label: isBn ? `সেভড টিউটর (${savedTutors.length})` : `Saved Tutors (${savedTutors.length})` },
                { id: 'invitations', label: isBn ? `পাঠানো ইনভাইট (${myInvitations.length})` : `Sent Invitations (${myInvitations.length})` },
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
        {activeTab === 'posts' && (
          <>
            {myPosts.length === 0 ? (
              <div className="ivory-card p-8 sm:p-10 text-center space-y-3">
                <div className="font-display text-lg font-extrabold text-[#18181B]">No tuition posts yet</div>
                <p className="text-sm text-[#6B6B6B] max-w-md mx-auto">
                  Post what class and subjects you need a tutor for — university tutors will apply directly.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={openCreateTuitionModal}
                    className="h-10 px-6 bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs sm:text-sm font-bold rounded-full cursor-pointer transition-colors"
                  >
                    Post Tuition Need
                  </button>
                </div>
              </div>
            ) : (
              myPosts.map(post => {
                const postApps = applications.filter(
                  a => a.tuitionPostId === post.id && a.status !== 'withdrawn'
                );

                return (
                  <div key={post.id} className="ivory-card p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-semibold text-[#C94A35] uppercase font-mono tabular-nums">
                          {post.status} · ৳{post.salaryOfferBDT.toLocaleString()}/mo
                        </div>
                        <h3 className="font-display text-base sm:text-lg font-extrabold text-[#18181B] leading-snug break-words">
                          {post.title}
                        </h3>
                        <div className="text-xs text-[#6B6B6B] break-words">
                          {post.classGrade} · {post.subjects.join(', ')} · {post.area}, {post.district}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditTuitionModal(post)}
                          className="w-9 h-9 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] text-[#18181B] flex items-center justify-center cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTuitionPost(post.id)}
                          className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center cursor-pointer transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Applicants List */}
                    <div className="pt-3 border-t border-[#EFEAE7] space-y-2.5">
                      <div className="text-xs font-bold text-[#52525B] tabular-nums">
                        Applicants ({postApps.length})
                      </div>

                      {postApps.length === 0 ? (
                        <div className="text-xs text-[#858585]">Waiting for tutors to apply.</div>
                      ) : (
                        postApps.map(app => {
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
                            <div
                              key={app.id}
                              className="p-3.5 sm:p-4 rounded-[18px] bg-[#F8F6F5] border border-[#EFEAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <img
                                  src={app.tutorAvatar || DEFAULT_PLACEHOLDER_AVATAR}
                                  alt={app.tutorName}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-full object-cover border border-white shadow-2xs shrink-0"
                                />
                                <div className="min-w-0 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => matchedTutor && viewTutorDetail(matchedTutor)}
                                    className="font-display text-sm font-bold text-[#18181B] hover:text-[#EB624B] hover:underline cursor-pointer text-left"
                                  >
                                    {app.tutorName}
                                  </button>
                                  <div className="text-[#6B6B6B] tabular-nums mt-0.5">
                                    {app.tutorUniversity} · ৳{app.proposedSalaryBDT.toLocaleString()}/mo ·{' '}
                                    <span className="font-semibold text-[#C94A35] uppercase">
                                      {app.status}
                                    </span>
                                  </div>
                                  <p className="text-[#252525] mt-1.5 leading-relaxed">{app.coverLetter}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {tutorWa && (
                                  <a
                                    href={tutorWa}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 px-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                                {app.status !== 'accepted' && app.status !== 'rejected' && (
                                  <>
                                    {app.status === 'pending' && (
                                      <button
                                        type="button"
                                        onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                                        className="h-9 px-3.5 rounded-full bg-[#EFEAFF] hover:bg-[#E1D8FF] text-[#18181B] text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                                      >
                                        Shortlist
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                      className="h-9 px-3.5 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                      className="h-9 px-3.5 rounded-full bg-white border border-[#EFEAE7] text-rose-700 text-xs font-semibold cursor-pointer hover:bg-rose-50 transition-colors whitespace-nowrap"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTutors.length === 0 ? (
              <div className="ivory-card p-8 text-center md:col-span-2 text-sm text-[#6B6B6B]">
                No saved Tutors yet. Click the bookmark icon on any Tutor profile to save it here.
              </div>
            ) : (
              savedTutors.map(t => <TutorPageCard key={t.id} tutor={t} />)
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="ivory-card p-5 sm:p-6 space-y-3.5 text-xs">
            <h2 className="font-display text-base sm:text-lg font-extrabold text-[#18181B] tabular-nums">
              {isBn ? `পাঠানো আমন্ত্রণ (${myInvitations.length})` : `Sent Invitations (${myInvitations.length})`}
            </h2>
            {myInvitations.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">
                {isBn
                  ? 'এখনো কোনো টিউটরকে সরাসরি আমন্ত্রণ পাঠানো হয়নি।'
                  : 'No direct invitations sent yet. Browse tutors to invite them to your tuition post.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {myInvitations.map(inv => {
                  const invWa =
                    inv.status === 'accepted'
                      ? buildWhatsAppUrl(
                          inv.tutorWhatsApp,
                          `Hello ${inv.tutorName}, following up on my tuition invitation on FeLoW WebStaR.`
                        )
                      : null;
                  return (
                    <div
                      key={inv.id}
                      className="p-4 rounded-[18px] bg-[#F8F6F5] border border-[#EFEAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 font-display font-bold text-sm text-[#18181B]">
                          <span>{inv.tutorName}</span>
                          <span className="text-xs font-mono text-[#C94A35] uppercase">
                            · {inv.status}
                          </span>
                        </div>
                        <div className="text-[#6B6B6B] tabular-nums">
                          {inv.classGrade} · {inv.subjects.join(', ')} · ৳{inv.offerSalaryBDT.toLocaleString()}/mo
                        </div>
                        {inv.message && (
                          <p className="text-[#252525] leading-relaxed">{inv.message}</p>
                        )}
                      </div>
                      {invWa && (
                        <a
                          href={invWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>WhatsApp Tutor</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Student / Guardian Profile & Contact Settings */}
              <form onSubmit={handleSaveProfile} className="ivory-card p-5 sm:p-6 space-y-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-base font-extrabold text-[#18181B] flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#FFF6F3] border border-[#F5E4DF] flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-[#EB624B]" />
                    </span>
                    <span>
                      {isBn ? 'ব্যক্তিগত ও যোগাযোগের তথ্য' : 'Profile & Contact Settings'}
                    </span>
                  </h2>
                </div>

                <div>
                  <label className="block font-semibold text-[#18181B] mb-1.5">
                    {isBn ? 'অ্যাকাউন্টের ধরন' : 'Account Role'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'student' as LearnerSubtype, label: isBn ? 'শিক্ষার্থী (Student)' : 'Student' },
                      { id: 'guardian' as LearnerSubtype, label: isBn ? 'অভিভাবক (Guardian)' : 'Guardian / Parent' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLearnerType(opt.id)}
                        className={`h-10 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          learnerType === opt.id
                            ? 'bg-[#18181B] border-[#18181B] text-white'
                            : 'bg-[#F6F4F3] border-[#EAE4E1] text-[#52525B] hover:text-[#18181B]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">
                    {isBn ? 'পুরো নাম *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    maxLength={128}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (settingsError) setSettingsError('');
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-[#18181B] mb-1">
                      {isBn ? 'জেলা' : 'District'}
                    </label>
                    <select
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setArea(getAreasOrUpazilas(e.target.value)[0] || '');
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
                    >
                      {ALL_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#18181B] mb-1">
                      {isBn ? 'এলাকা / উপজেলা' : 'Area / Upazila'}
                    </label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
                    >
                      {getAreasOrUpazilas(district).map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">
                    {isBn ? 'WhatsApp নম্বর' : 'WhatsApp Number'}
                  </label>
                  <input
                    type="tel"
                    maxLength={32}
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value);
                      if (settingsError) setSettingsError('');
                    }}
                    placeholder="017XXXXXXXX"
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">
                    {isBn ? 'Facebook প্রোফাইল লিংক (ঐচ্ছিক)' : 'Facebook Profile URL (Optional)'}
                  </label>
                  <input
                    type="url"
                    maxLength={512}
                    value={facebookUrl}
                    onChange={(e) => {
                      setFacebookUrl(e.target.value);
                      if (settingsError) setSettingsError('');
                    }}
                    placeholder="https://facebook.com/your.profile"
                    className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
                  />
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneVisibility}
                    onChange={(e) => setPhoneVisibility(e.target.checked)}
                    className="mt-0.5 accent-[#EB624B]"
                  />
                  <span className="text-xs text-[#252525] leading-relaxed">
                    {isBn
                      ? 'শর্টলিস্ট বা ইনভাইট করা টিউটররা যেন আমার যোগাযোগ নম্বর দেখতে পারেন।'
                      : 'Allow shortlisted or invited tutors to view my contact details directly.'}
                  </span>
                </label>

                {settingsError && (
                  <p className="text-xs font-semibold text-[#C94A35]">{settingsError}</p>
                )}

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="h-10 px-5 rounded-full bg-[#EB624B] hover:bg-[#DC533D] disabled:opacity-60 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isBn ? 'সেভ হচ্ছে...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সেটিংস সেভ করুন' : 'Save Account Settings'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Account Preferences & Role Switching */}
              <div className="space-y-4">
                <div className="ivory-card p-5 sm:p-6 space-y-3.5 text-xs">
                  <h2 className="font-display text-base font-extrabold text-[#18181B] flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#EFEAFF] border border-[#E1D8FF] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#18181B]" />
                    </span>
                    <span>{isBn ? 'অ্যাকাউন্ট ও ভাষা সেটিংস' : 'Account & Preferences'}</span>
                  </h2>

                  <div className="p-3.5 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] space-y-1">
                    <div className="text-[#6B6B6B]">{isBn ? 'সাইন-ইন ইমেইল' : 'Signed-in Email'}</div>
                    <div className="font-semibold text-[#18181B] break-all">
                      {currentUser.email || 'Google Account'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                    className="w-full h-10 px-4 rounded-xl bg-[#F6F4F3] hover:bg-[#EAE4E1] text-[#18181B] font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#EB624B]" />
                      <span>Language / ভাষা</span>
                    </span>
                    <span className="text-[#C94A35] font-bold">
                      {language === 'en' ? 'English' : 'বাংলা'}
                    </span>
                  </button>

                  <div className="p-4 rounded-[20px] bg-[#DCEBFA]/70 border border-[#C6DDF5] space-y-2.5">
                    <div className="font-display text-sm font-bold text-[#18181B]">
                      {isBn ? 'টিউটর হিসেবে পড়াতে চান?' : <>Want to teach on <BrandWordmark />?</>}
                    </div>
                    <p className="text-[#52525B] leading-relaxed">
                      {isBn
                        ? 'একই Google অ্যাকাউন্ট ব্যবহার করে স্টুডেন্ট এবং টিউটর মোডের মধ্যে সহজেই পরিবর্তন করুন।'
                        : 'Activate your Tutor Profile using the same account and switch between modes anytime.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => activateDualRole('tutor')}
                      className="h-10 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span>{isBn ? 'টিউটর মোড চালু করুন' : 'Switch / Create Tutor Page'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone: Delete Student / Guardian Account */}
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
    </div>
  );
};
