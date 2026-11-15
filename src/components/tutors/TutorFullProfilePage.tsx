import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Bookmark,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Star,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  TutorPrivateContact,
  isTutorVerified,
  DEFAULT_PLACEHOLDER_AVATAR
} from '../../types';
import {
  buildWhatsAppUrl,
  launchWhatsAppUrl,
  sanitizeFacebookUrl,
  DEFAULT_TUTOR_WHATSAPP_MESSAGE
} from '../../utils/contactLinks';
import { TutorReviewsSection } from './TutorReviewsSection';

export const TutorFullProfilePage: React.FC = () => {
  const {
    tutors,
    selectedTutor,
    setSelectedTutor,
    setActiveView,
    setDirectoryTab,
    savedTutorIds,
    toggleSaveTutor,
    canViewTutorWhatsApp,
    getTutorContactInfo,
    sendInvitation,
    tuitionPosts,
    currentUser,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    submitReport,
    showToast
  } = useApp();

  const tutor =
    tutors.find(t => t.id === selectedTutor?.id) || selectedTutor || tutors[0] || null;

  const [openingWa, setOpeningWa] = useState(false);
  const [privateContact, setPrivateContact] = useState<TutorPrivateContact | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [inviteClass, setInviteClass] = useState('');
  const [inviteSubject, setInviteSubject] = useState('');
  const [inviteOfferBDT, setInviteOfferBDT] = useState(8000);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    let active = true;
    setPrivateContact(null);
    if (!tutor) return;
    const canView = canViewTutorWhatsApp(tutor);
    if (
      isAuthenticated &&
      canView &&
      !tutor.isSample &&
      (!tutor.whatsappNumber || !tutor.facebookUrl)
    ) {
      getTutorContactInfo(tutor.uid || tutor.id).then(info => {
        if (active && info) setPrivateContact(info);
      });
    }
    return () => {
      active = false;
    };
  }, [
    tutor?.id,
    tutor?.uid,
    tutor?.isSample,
    tutor?.whatsappNumber,
    tutor?.facebookUrl,
    isAuthenticated,
    canViewTutorWhatsApp,
    getTutorContactInfo
  ]);

  if (!tutor) {
    return (
      <div className="min-h-[70vh] bg-[#FFFFFF] flex items-center justify-center px-4">
        <div className="ivory-card p-8 max-w-md w-full text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-[#252525]">Tutor not found</h1>
          <p className="text-sm text-[#858585]">
            This tutor profile may have been unpublished or removed.
          </p>
          <button
            type="button"
            onClick={() => {
              setDirectoryTab('tutors');
              setActiveView('landing');
            }}
            className="h-10 px-6 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-sm font-bold cursor-pointer transition-all"
          >
            Back to Tutors
          </button>
        </div>
      </div>
    );
  }

  const verified = isTutorVerified(tutor);
  const isSaved = savedTutorIds.includes(tutor.id);
  const canWa = canViewTutorWhatsApp(tutor);
  const fbUrl = sanitizeFacebookUrl(privateContact?.facebookUrl || tutor.facebookUrl);
  const openMyPosts = tuitionPosts.filter(
    p => p.learnerId === currentUser.id && p.status === 'open'
  );

  const openInviteModal = () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    const defaultPost = openMyPosts[0];
    setSelectedPostId(defaultPost?.id || '');
    setInviteClass(defaultPost?.classGrade || tutor.classes[0] || 'Class 11 - 12 (HSC)');
    setInviteSubject(
      defaultPost?.subjects.join(', ') || tutor.subjects.slice(0, 2).join(', ') || 'Mathematics'
    );
    setInviteOfferBDT(defaultPost?.salaryOfferBDT || tutor.expectedSalaryMin || 8000);
    setInviteMessage('');
    setIsInviteOpen(true);
  };

  const handleWhatsAppClick = async () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Sign in with Google to message tutors on WhatsApp.', 'info');
      return;
    }

    if (!canWa) {
      openInviteModal();
      showToast('Send a quick invite to unlock WhatsApp contact with this tutor.', 'info');
      return;
    }

    let phone =
      privateContact?.normalizedWhatsappNumber ||
      privateContact?.whatsappNumber ||
      tutor.normalizedWhatsappNumber ||
      tutor.whatsappNumber ||
      tutor.phone;

    if (!phone && !tutor.isSample) {
      setOpeningWa(true);
      try {
        const priv = await getTutorContactInfo(tutor.uid || tutor.id);
        phone = priv?.normalizedWhatsappNumber || priv?.whatsappNumber || '';
      } finally {
        setOpeningWa(false);
      }
    }

    const url = buildWhatsAppUrl(
      phone,
      `${DEFAULT_TUTOR_WHATSAPP_MESSAGE} (Tutor: ${tutor.name})`
    );
    if (url) {
      const opened = launchWhatsAppUrl(url);
      if (!opened) {
        showToast('Could not open WhatsApp automatically. Please allow popups and try again.', 'info');
      }
    } else {
      showToast('WhatsApp number is not available on this profile yet.', 'info');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendInvitation(
      tutor,
      inviteMessage.trim() ||
        `Hello ${tutor.name}, we would like to discuss tuition for ${inviteClass} (${inviteSubject}).`,
      Number(inviteOfferBDT),
      inviteClass,
      inviteSubject
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      selectedPostId || undefined,
      openMyPosts.find(p => p.id === selectedPostId)?.preferredTime || '3 days/week'
    );
    setIsInviteOpen(false);
    setInviteMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FFFFFF] pb-14 text-left animate-fade-up">
      {/* Full-Width Warm EdTech Profile Cover */}
      <div className="bg-gradient-to-r from-[#FFF3EF] via-[#FFE2D9] to-[#DCEBFA] border-b border-[#F1E1DC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-20 sm:pb-24 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedTutor(tutor);
              setDirectoryTab('tutors');
              setActiveView('landing');
            }}
            className="h-10 px-4 rounded-full bg-white/90 hover:bg-white text-[#252525] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Tutors</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSaveTutor(tutor.id)}
            className={`h-10 px-4 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${
              isSaved
                ? 'bg-[#F47C68] text-[#252525] font-bold'
                : 'bg-white/90 hover:bg-white text-[#252525]'
            }`}
          >
            <Bookmark className={`w-4 h-4 shrink-0 ${isSaved ? 'fill-[#252525]' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save Tutor'}</span>
          </button>
        </div>
      </div>

      {/* Full-Page Profile Container */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 -mt-14 sm:-mt-16 space-y-6">
        {/* Identity & Primary CTA Card */}
        <section className="ivory-card p-5 sm:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 min-w-0">
              <img
                src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                alt={tutor.name}
                referrerPolicy="no-referrer"
                className="w-28 h-32 sm:w-36 sm:h-44 rounded-3xl object-cover object-top border-4 border-white shadow-md bg-[#FFF3EF] shrink-0 -mt-10 sm:-mt-14"
              />

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#252525] leading-tight break-words">
                    {tutor.name}
                  </h1>
                  {verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C94A35]">
                      <BadgeCheck className="w-5 h-5 text-[#F47C68] shrink-0" />
                      <span>Verified Tutor</span>
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base font-semibold text-[#C94A35] leading-snug break-words">
                  {tutor.university}
                </p>

                <div className="text-xs sm:text-sm text-[#252525] leading-relaxed">
                  {[
                    tutor.department,
                    tutor.degree,
                    tutor.academicYear,
                    tutor.gpa ? `CGPA ${tutor.gpa}` : ''
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-[#858585] tabular-nums pt-0.5">
                  <a
                    href="#tutor-reviews-heading"
                    className="inline-flex items-center gap-1 font-bold text-[#252525] hover:text-[#C94A35] transition-colors"
                  >
                    <Star className="w-4 h-4 text-[#F5A04E] fill-[#F5A04E] shrink-0" />
                    <span>{tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}</span>
                    <span className="font-normal text-[#858585]">
                      ({Math.max(tutor.reviewCount || 0, tutor.reviews?.length || 0)} reviews)
                    </span>
                  </a>
                  <span>·</span>
                  <span>
                    {tutor.experienceYears > 0 ? `${tutor.experienceYears} years exp` : 'New Tutor'}
                  </span>
                  <span>·</span>
                  <span>{tutor.completedTuitionsCount} tuitions completed</span>
                  <span>·</span>
                  <span className="font-semibold text-[#15803D]">{tutor.availability}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={openingWa}
                onClick={handleWhatsAppClick}
                className="h-11 px-6 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{openingWa ? 'Opening...' : 'Message on WhatsApp'}</span>
              </button>

              {!canWa && (
                <button
                  type="button"
                  onClick={openInviteModal}
                  className="h-11 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Send Invite</span>
                </button>
              )}
            </div>
          </div>

          {tutor.headline && (
            <p className="text-sm sm:text-base font-medium text-[#252525] leading-relaxed border-t border-[#F1E1DC] pt-4">
              {tutor.headline}
            </p>
          )}
        </section>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Full Academic & Teaching Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* About & Teaching Approach */}
            {(tutor.bio || tutor.teachingStyleSummary || tutor.experienceSummary) && (
              <section className="ivory-card p-5 sm:p-6 space-y-3">
                <h2 className="font-display text-lg font-bold text-[#252525]">
                  About & Teaching Approach
                </h2>
                {tutor.bio && (
                  <p className="text-sm text-[#252525] leading-relaxed">{tutor.bio}</p>
                )}
                {tutor.teachingStyleSummary && (
                  <p className="text-sm text-[#858585] leading-relaxed">
                    {tutor.teachingStyleSummary}
                  </p>
                )}
                {tutor.experienceSummary && (
                  <div className="p-3.5 rounded-2xl bg-[#FFF3EF] text-xs sm:text-sm text-[#252525]">
                    <strong className="font-semibold">Experience Highlight: </strong>
                    {tutor.experienceSummary}
                  </div>
                )}
              </section>
            )}

            {/* Subjects & Classes Taught */}
            <section className="ivory-card p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#252525] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#F47C68]" />
                <span>Subjects, Classes & Curriculum</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-[#FFF3EF] space-y-1.5">
                  <div className="text-xs font-semibold text-[#858585]">Subjects Taught</div>
                  <div className="font-semibold text-[#252525] leading-relaxed">
                    {tutor.subjects.join(', ')}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF3EF] space-y-1.5">
                  <div className="text-xs font-semibold text-[#858585]">Classes & Levels</div>
                  <div className="font-semibold text-[#252525] leading-relaxed">
                    {tutor.classes.join(', ')}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF3EF] space-y-1.5">
                  <div className="text-xs font-semibold text-[#858585]">Education Mediums</div>
                  <div className="font-semibold text-[#252525] leading-relaxed">
                    {tutor.mediums.join(', ')}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF3EF] space-y-1.5">
                  <div className="text-xs font-semibold text-[#858585]">Tuition Modes</div>
                  <div className="font-semibold text-[#252525] leading-relaxed">
                    {tutor.tuitionTypes.join(', ')}
                  </div>
                </div>
              </div>
            </section>

            {/* Full Educational Background */}
            <section className="ivory-card p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#252525] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#F47C68]" />
                <span>Educational Background</span>
              </h2>

              <div className="space-y-3 text-sm">
                <div className="p-4 rounded-2xl bg-[#FFF3EF] space-y-1">
                  <div className="text-xs font-semibold text-[#C94A35]">University</div>
                  <div className="font-bold text-[#252525]">{tutor.university}</div>
                  <div className="text-xs sm:text-sm text-[#858585]">
                    {[tutor.degree, tutor.department, tutor.academicYear, tutor.semester]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {tutor.gpa && (
                    <div className="text-xs font-mono font-semibold text-[#252525] pt-0.5">
                      CGPA: {tutor.gpa}
                    </div>
                  )}
                </div>

                {(tutor.collegeName || tutor.hscGpa) && (
                  <div className="p-4 rounded-2xl bg-[#FFF3EF] space-y-1">
                    <div className="text-xs font-semibold text-[#858585]">College / HSC</div>
                    <div className="font-bold text-[#252525]">
                      {tutor.collegeName || 'Higher Secondary'}
                    </div>
                    {tutor.hscGpa && (
                      <div className="text-xs font-mono font-semibold text-[#858585]">
                        HSC GPA: {tutor.hscGpa}
                      </div>
                    )}
                  </div>
                )}

                {(tutor.schoolName || tutor.sscGpa) && (
                  <div className="p-4 rounded-2xl bg-[#FFF3EF] space-y-1">
                    <div className="text-xs font-semibold text-[#858585]">School / SSC</div>
                    <div className="font-bold text-[#252525]">
                      {tutor.schoolName || 'Secondary School'}
                    </div>
                    {tutor.sscGpa && (
                      <div className="text-xs font-mono font-semibold text-[#858585]">
                        SSC GPA: {tutor.sscGpa}
                      </div>
                    )}
                  </div>
                )}

                {tutor.achievements && tutor.achievements.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#DCEBFA]/70 space-y-1.5">
                    <div className="text-xs font-semibold text-[#252525] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#F5A04E]" />
                      <span>Academic Honors & Achievements</span>
                    </div>
                    <ul className="text-xs sm:text-sm text-[#252525] space-y-1">
                      {tutor.achievements.map(item => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Interactive Student & Guardian Reviews & Star Ratings */}
            <TutorReviewsSection tutor={tutor} />
          </div>

          {/* Right Column: Fee, Areas & Contact Details */}
          <aside className="space-y-4 lg:sticky lg:top-[72px]">
            <div className="ivory-card p-5 sm:p-6 space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-[#DCEBFA]/70">
                <div className="text-xs font-semibold text-[#252525]">Expected Monthly Fee</div>
                <div className="font-mono text-2xl font-extrabold text-[#252525] mt-1 tabular-nums">
                  ৳{tutor.expectedSalaryMin.toLocaleString()}–
                  {tutor.expectedSalaryMax.toLocaleString()}
                  <span className="text-xs font-sans font-normal text-[#858585]"> /month</span>
                </div>
              </div>

              <div className="border-t border-[#F1E1DC] pt-4 space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#F47C68] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#252525]">
                      {tutor.district}, {tutor.division}
                    </div>
                    <div className="text-[#858585] leading-relaxed mt-0.5">
                      {tutor.preferredAreas.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#F5A04E] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#252525]">Weekly Availability</div>
                    <div className="text-[#858585]">
                      {tutor.daysPerWeek.join('–')} days per week
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#252525]">Schedule Status</div>
                    <div className="text-[#15803D] font-medium">{tutor.availability}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <UserCheck className="w-4 h-4 text-[#F47C68] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#252525]">Tutor Gender</div>
                    <div className="text-[#858585]">{tutor.gender}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#F47C68] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#252525]">Verification</div>
                    <div className="text-[#858585]">
                      {verified
                        ? 'Identity & University Verified'
                        : 'Active Community Tutor'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#F1E1DC] pt-4 space-y-2.5">
                <button
                  type="button"
                  disabled={openingWa}
                  onClick={handleWhatsAppClick}
                  className="w-full h-11 px-5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>{openingWa ? 'Opening...' : 'Contact via WhatsApp'}</span>
                </button>

                {fbUrl && (
                  <a
                    href={fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 px-5 rounded-full bg-[#DCEBFA]/70 hover:bg-[#DCEBFA] text-[#252525] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>View Facebook Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() =>
                    submitReport({
                      reportedItemType: 'tutor',
                      targetTitle: `${tutor.name} (${tutor.university})`,
                      targetId: tutor.id,
                      reportedBy: currentUser.name,
                      reportedById: currentUser.id,
                      reason: 'Reported from Full Tutor Profile'
                    })
                  }
                  className="w-full py-2 text-xs text-[#858585] hover:text-[#252525] hover:underline cursor-pointer text-center"
                >
                  Report this profile
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsInviteOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#F1E1DC] max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-[#252525]">
              Invite {tutor.name}
            </h3>
            <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
              {openMyPosts.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">
                    Tuition Post (Optional)
                  </label>
                  <select
                    value={selectedPostId}
                    onChange={(e) => {
                      setSelectedPostId(e.target.value);
                      const chosen = openMyPosts.find(p => p.id === e.target.value);
                      if (chosen) {
                        setInviteClass(chosen.classGrade);
                        setInviteSubject(chosen.subjects.join(', '));
                        setInviteOfferBDT(chosen.salaryOfferBDT);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525]"
                  >
                    <option value="">Direct Invitation</option>
                    {openMyPosts.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Class *</label>
                  <input
                    type="text"
                    required
                    value={inviteClass}
                    onChange={(e) => setInviteClass(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Offer (৳/mo) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={inviteOfferBDT}
                    onChange={(e) => setInviteOfferBDT(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Subjects *</label>
                <input
                  type="text"
                  required
                  value={inviteSubject}
                  onChange={(e) => setInviteSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#252525] mb-1">Message</label>
                <textarea
                  rows={2}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Share area, timing, or demo request..."
                  className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] placeholder:text-[#858585]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="h-10 px-5 rounded-full bg-[#FFF3EF] text-[#252525] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
