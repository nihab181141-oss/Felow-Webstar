import React, { useState } from 'react';
import {
  BadgeCheck,
  MapPin,
  MessageCircle,
  Bookmark,
  GraduationCap
} from 'lucide-react';
import { TutorProfile, isTutorVerified, DEFAULT_PLACEHOLDER_AVATAR } from '../../types';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppUrl, launchWhatsAppUrl, DEFAULT_TUTOR_WHATSAPP_MESSAGE } from '../../utils/contactLinks';

interface TutorPageCardProps {
  tutor: TutorProfile;
}

export const TutorPageCard: React.FC<TutorPageCardProps> = ({ tutor }) => {
  const {
    viewTutorDetail,
    savedTutorIds,
    toggleSaveTutor,
    canViewTutorWhatsApp,
    getTutorContactInfo,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    showToast
  } = useApp();

  const [openingWa, setOpeningWa] = useState(false);
  const isSaved = savedTutorIds.includes(tutor.id);
  const verified = isTutorVerified(tutor);
  const canContact = canViewTutorWhatsApp(tutor);

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Sign in with Google to message tutors on WhatsApp.', 'info');
      return;
    }

    if (!canContact) {
      viewTutorDetail(tutor);
      showToast('Open this Tutor Page to request contact.', 'info');
      return;
    }

    let phone = tutor.normalizedWhatsappNumber || tutor.whatsappNumber || tutor.phone;
    if (!phone) {
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
        showToast('Please allow popups to open WhatsApp.', 'info');
      }
    } else {
      viewTutorDetail(tutor);
    }
  };

  const extraAreas = Math.max(0, tutor.preferredAreas.length - 3);

  return (
    <article className="ivory-card ivory-card-hover overflow-hidden text-left p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div
          onClick={() => viewTutorDetail(tutor)}
          className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1 cursor-pointer"
        >
          <img
            src={tutor.profilePhotoURL || tutor.avatar || DEFAULT_PLACEHOLDER_AVATAR}
            alt={tutor.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className="w-20 h-24 sm:w-28 sm:h-32 rounded-2xl object-cover object-top border border-[#EFEAE7] shrink-0 bg-[#F6F4F3]"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-display text-base sm:text-lg font-extrabold text-[#18181B] hover:underline leading-snug break-words">
                {tutor.name}
              </h3>
              {verified && (
                <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#EB624B] shrink-0" aria-label="Verified Tutor" />
              )}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-[#EB624B] leading-snug break-words">
              {tutor.university || 'University Tutor'}
            </div>
            <div className="text-xs text-[#18181B] leading-relaxed break-words">
              {[
                tutor.department,
                tutor.academicYear,
                tutor.gpa ? `CGPA ${tutor.gpa}` : ''
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {(tutor.collegeName || tutor.hscGpa || tutor.sscGpa) && (
              <div className="text-xs text-[#6B6B6B] leading-relaxed break-words">
                {[
                  tutor.collegeName,
                  tutor.hscGpa ? `HSC ${tutor.hscGpa}` : '',
                  tutor.sscGpa ? `SSC ${tutor.sscGpa}` : ''
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
            <div className="text-xs text-[#6B6B6B] flex items-start gap-1 pt-0.5 leading-snug">
              <MapPin className="w-3.5 h-3.5 text-[#EB624B] shrink-0 mt-0.5" />
              <span className="break-words">
                {tutor.preferredAreas.slice(0, 3).join(', ') || tutor.district}
                {extraAreas > 0 ? ` (+${extraAreas})` : ''}, {tutor.district}
              </span>
            </div>
            <div className="text-xs text-[#6B6B6B] tabular-nums">
              {tutor.experienceYears > 0 ? `${tutor.experienceYears} yrs exp` : 'New Tutor'}
              <span aria-hidden="true"> · </span>
              <span className="font-semibold text-[#15803D]">{tutor.availability}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleSaveTutor(tutor.id)}
          aria-label={isSaved ? 'Remove from saved tutors' : 'Save tutor'}
          className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFF6F3] transition-colors cursor-pointer shrink-0 ${
            isSaved ? 'text-[#EB624B] bg-[#FFF6F3]' : 'text-[#6B6B6B]'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#EB624B]' : ''}`} />
        </button>
      </div>

      {(tutor.headline || tutor.bio) && (
        <div
          onClick={() => viewTutorDetail(tutor)}
          className="border-t border-[#EFEAE7] pt-3 space-y-1 cursor-pointer"
        >
          {tutor.headline && (
            <p className="text-xs sm:text-[13px] font-semibold text-[#18181B] leading-snug break-words">
              {tutor.headline}
            </p>
          )}
          {tutor.bio && (
            <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2 break-words">{tutor.bio}</p>
          )}
        </div>
      )}

      <div
        onClick={() => viewTutorDetail(tutor)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#18181B] cursor-pointer"
      >
        <div className="min-w-0 rounded-2xl bg-[#FFF6F3] border border-[#F5E4DF] p-3">
          <div className="text-[11px] font-semibold text-[#6B6B6B]">Subjects</div>
          <div className="font-semibold text-[#18181B] mt-0.5 flex items-start gap-1.5 leading-snug">
            <GraduationCap className="w-3.5 h-3.5 text-[#EB624B] shrink-0 mt-0.5" />
            <span className="break-words">{tutor.subjects.slice(0, 4).join(', ')}</span>
          </div>
        </div>
        <div className="min-w-0 rounded-2xl bg-[#EFEAFF] border border-[#E1D8FF] p-3">
          <div className="text-[11px] font-semibold text-[#52525B]">Classes</div>
          <div className="font-semibold text-[#18181B] mt-0.5 leading-snug break-words">
            {tutor.classes.slice(0, 3).join(', ')}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl bg-[#EFF6FF] border border-[#DCEBFA] p-3">
          <div className="text-[11px] font-semibold text-[#52525B]">Medium & Mode</div>
          <div className="text-[#18181B] font-medium mt-0.5 leading-snug break-words">
            {tutor.mediums.join(', ')} · {tutor.tuitionTypes.join(', ')}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl bg-[#FFF4D6] border border-[#F8E4AE] p-3">
          <div className="text-[11px] font-semibold text-[#52525B]">Monthly Fee</div>
          <div className="font-mono font-bold text-[#18181B] mt-0.5 tabular-nums">
            ৳{tutor.expectedSalaryMin.toLocaleString()}–{tutor.expectedSalaryMax.toLocaleString()}/mo
          </div>
        </div>
      </div>

      <div className="pt-1 grid grid-cols-2 sm:flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => viewTutorDetail(tutor)}
          className="h-10 px-4 rounded-full text-xs font-bold text-white bg-[#18181B] hover:bg-[#27272A] transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
        >
          View Full Profile
        </button>

        <button
          type="button"
          disabled={openingWa}
          onClick={handleWhatsAppClick}
          className="h-10 px-4 rounded-full text-xs font-semibold bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>{openingWa ? 'Opening...' : 'WhatsApp'}</span>
        </button>
      </div>
    </article>
  );
};
