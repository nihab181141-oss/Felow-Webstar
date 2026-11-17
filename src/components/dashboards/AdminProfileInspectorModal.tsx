import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DEFAULT_PLACEHOLDER_AVATAR,
  LearnerProfile,
  TutorPrivateContact,
  TutorProfile,
  UserAccount,
  isTutorVerified
} from '../../types';
import {
  fetchLearnerProfileFromFirestore,
  fetchTutorProfileById,
  fetchUserAccountFromFirestore
} from '../../services/firebase';
import { buildWhatsAppUrl, launchWhatsAppUrl, sanitizeFacebookUrl, sanitizeSafeHttpUrl } from '../../utils/contactLinks';
import { formatRelativeTime } from '../../utils/notifications';

interface AdminProfileInspectorModalProps {
  userId: string | null;
  onClose: () => void;
}

export const AdminProfileInspectorModal: React.FC<AdminProfileInspectorModalProps> = ({
  userId,
  onClose
}) => {
  const {
    adminUsers,
    adminLearnerProfiles,
    adminTutorProfiles,
    adminTuitionPosts,
    verificationQueue,
    getTutorContactInfo,
    viewTutorDetail,
    viewTuitionDetail
  } = useApp();

  const [fetchedUser, setFetchedUser] = useState<Partial<UserAccount> | null>(null);
  const [fetchedLearner, setFetchedLearner] = useState<LearnerProfile | null>(null);
  const [fetchedTutor, setFetchedTutor] = useState<TutorProfile | null>(null);
  const [privateContact, setPrivateContact] = useState<TutorPrivateContact | null>(null);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);

  const cachedUser = userId ? adminUsers.find(u => u.id === userId) || null : null;
  const cachedLearner = userId
    ? adminLearnerProfiles.find(l => l.uid === userId) || null
    : null;
  const cachedTutor = userId
    ? adminTutorProfiles.find(t => t.id === userId || t.uid === userId) || null
    : null;

  useEffect(() => {
    if (!userId) {
      setFetchedUser(null);
      setFetchedLearner(null);
      setFetchedTutor(null);
      setPrivateContact(null);
      return;
    }

    let active = true;
    setIsLoadingExtra(true);
    Promise.all([
      cachedUser ? Promise.resolve(null) : fetchUserAccountFromFirestore(userId),
      cachedLearner ? Promise.resolve(null) : fetchLearnerProfileFromFirestore(userId),
      cachedTutor ? Promise.resolve(null) : fetchTutorProfileById(userId),
      getTutorContactInfo(userId).catch(() => null)
    ])
      .then(([u, l, t, priv]) => {
        if (!active) return;
        setFetchedUser(u);
        setFetchedLearner(l);
        setFetchedTutor(t);
        setPrivateContact(priv);
      })
      .finally(() => {
        if (active) setIsLoadingExtra(false);
      });

    return () => {
      active = false;
    };
  }, [userId, cachedUser, cachedLearner, cachedTutor, getTutorContactInfo]);

  useEffect(() => {
    if (!userId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [userId, onClose]);

  if (!userId) return null;

  const userRecord = cachedUser || fetchedUser;
  const learnerRecord = cachedLearner || fetchedLearner;
  const tutorRecord = cachedTutor || fetchedTutor;

  const userPosts = adminTuitionPosts.filter(p => p.learnerId === userId);
  const userVerifications = verificationQueue.filter(v => v.tutorId === userId);

  const displayName =
    tutorRecord?.name ||
    learnerRecord?.name ||
    userRecord?.name ||
    'Registered User';
  const displayAvatar =
    tutorRecord?.profilePhotoURL ||
    tutorRecord?.avatar ||
    userRecord?.avatar ||
    DEFAULT_PLACEHOLDER_AVATAR;
  const email = userRecord?.email || tutorRecord?.email || '';
  const whatsappRaw =
    privateContact?.normalizedWhatsappNumber ||
    privateContact?.whatsappNumber ||
    tutorRecord?.whatsappNumber ||
    learnerRecord?.whatsappNumber ||
    userRecord?.whatsappNumber ||
    userRecord?.phone ||
    learnerRecord?.phone ||
    '';
  const facebookUrl = sanitizeFacebookUrl(
    privateContact?.facebookUrl ||
      tutorRecord?.facebookUrl ||
      learnerRecord?.facebookUrl ||
      userRecord?.facebookUrl
  );
  const district =
    tutorRecord?.district || learnerRecord?.district || userRecord?.district || '';
  const area =
    learnerRecord?.area ||
    userRecord?.area ||
    tutorRecord?.preferredAreas?.slice(0, 3).join(', ') ||
    '';
  const division =
    tutorRecord?.division || learnerRecord?.division || userRecord?.division || '';

  const activeRoleLabel = tutorRecord
    ? tutorRecord.isPublished
      ? 'Tutor (Published)'
      : 'Tutor (Draft)'
    : userRecord?.role === 'tutor'
      ? 'Tutor Account'
      : (learnerRecord?.learnerType || userRecord?.learnerSubtype) === 'student'
        ? 'Student'
        : 'Guardian / Parent';

  const whatsappUrl = whatsappRaw
    ? buildWhatsAppUrl(
        whatsappRaw,
        `Assalamu Alaikum ${displayName}, reaching out from FeLoW WebStaR Admin Support.`
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-up"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-inspector-title"
        className="bg-[#FCFBFA] rounded-[28px] border border-[#EFEAE7] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Cover Header */}
        <div className="bg-gradient-to-r from-[#FFF5F2] via-[#EFEAFF] to-[#DCEBFA] border-b border-[#EFEAE7] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              <img
                src={displayAvatar}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white bg-white shadow-xs shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2
                    id="admin-profile-inspector-title"
                    className="font-display text-lg sm:text-xl font-extrabold text-[#18181B] leading-tight break-words"
                  >
                    {displayName}
                  </h2>
                  {tutorRecord && isTutorVerified(tutorRecord) && (
                    <BadgeCheck className="w-5 h-5 text-[#F47C68] shrink-0" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#52525B] font-medium">
                  <span className="font-bold text-[#18181B]">{activeRoleLabel}</span>
                  {(district || area) && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#EB624B] shrink-0" />
                        {[area, district, division].filter(Boolean).join(', ')}
                      </span>
                    </>
                  )}
                  {userRecord?.createdAt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Joined {formatRelativeTime(userRecord.createdAt)}</span>
                    </>
                  )}
                </div>

                {email && (
                  <div className="text-xs text-[#6B6B6B] truncate">{email}</div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close user profile view"
              className="w-9 h-9 rounded-full bg-white hover:bg-[#F6F4F3] border border-[#EFEAE7] flex items-center justify-center text-[#18181B] cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Admin Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tutorRecord && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  viewTutorDetail(tutorRecord);
                }}
                className="h-10 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Open Full Tutor Page</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}

            {whatsappUrl && (
              <button
                type="button"
                onClick={() => launchWhatsAppUrl(whatsappUrl)}
                className="h-10 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}

            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-full bg-white hover:bg-[#EEF2FF] border border-[#DCEBFA] text-[#1E3A8A] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Facebook Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {isLoadingExtra && !userRecord && !tutorRecord && !learnerRecord && (
            <div className="p-5 rounded-2xl bg-white border border-[#EFEAE7] text-xs text-[#6B6B6B]">
              Loading user profile details...
            </div>
          )}

          {/* Account & Private Contact Details */}
          <section className="bg-white rounded-2xl border border-[#EFEAE7] p-4 space-y-3">
            <div className="text-xs font-bold text-[#18181B] flex items-center gap-2">
              <User className="w-4 h-4 text-[#EB624B]" />
              <span>Account & Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7] space-y-0.5">
                <div className="text-[11px] font-semibold text-[#6B6B6B] flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>Email</span>
                </div>
                <div className="font-semibold text-[#18181B] break-all">
                  {email || 'Not provided'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7] space-y-0.5">
                <div className="text-[11px] font-semibold text-[#6B6B6B] flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>Phone / WhatsApp</span>
                </div>
                <div className="font-mono font-semibold text-[#18181B]">
                  {whatsappRaw || 'Not added yet'}
                </div>
              </div>
            </div>
          </section>

          {/* Created Tutor Profile Section */}
          {tutorRecord && (
            <section className="bg-white rounded-2xl border border-[#EFEAE7] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-[#18181B] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#7C5DFA]" />
                  <span>Created Tutor Profile</span>
                </div>
                <span className="text-[11px] font-semibold text-[#52525B] tabular-nums">
                  {tutorRecord.isPublished ? 'Published' : 'Draft / Not Published Yet'} ·{' '}
                  {tutorRecord.profileCompletion || 0}% complete
                </span>
              </div>

              {tutorRecord.headline && (
                <div className="text-sm font-bold text-[#18181B]">{tutorRecord.headline}</div>
              )}

              {tutorRecord.bio && (
                <p className="text-xs text-[#52525B] leading-relaxed whitespace-pre-line">
                  {tutorRecord.bio}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#EFEAFF]/45 border border-[#E1D8FF]">
                  <div className="text-[11px] font-semibold text-[#6B6B6B]">University & Dept</div>
                  <div className="font-bold text-[#18181B] mt-0.5">
                    {[tutorRecord.university, tutorRecord.department, tutorRecord.academicYear]
                      .filter(Boolean)
                      .join(' · ') || 'Not specified'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF6F3] border border-[#F5E4DF]">
                  <div className="text-[11px] font-semibold text-[#6B6B6B]">Expected Honorarium</div>
                  <div className="font-mono font-bold text-[#18181B] mt-0.5 tabular-nums">
                    ৳{tutorRecord.expectedSalaryMin.toLocaleString()}–
                    {tutorRecord.expectedSalaryMax.toLocaleString()}/mo
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#DCEBFA]/45 border border-[#C6DDF5]">
                  <div className="text-[11px] font-semibold text-[#6B6B6B]">Subjects</div>
                  <div className="font-semibold text-[#18181B] mt-0.5">
                    {tutorRecord.subjects.join(', ') || 'None selected'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF4D6]/60 border border-[#F8E4AE]">
                  <div className="text-[11px] font-semibold text-[#6B6B6B]">Classes & Areas</div>
                  <div className="font-semibold text-[#18181B] mt-0.5">
                    {[
                      tutorRecord.classes.join(', '),
                      tutorRecord.preferredAreas.join(', ')
                    ]
                      .filter(Boolean)
                      .join(' · ') || tutorRecord.district}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Created Student / Guardian Profile Section */}
          {learnerRecord && (
            <section className="bg-white rounded-2xl border border-[#EFEAE7] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-[#18181B] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#EB624B]" />
                  <span>
                    {learnerRecord.learnerType === 'student'
                      ? 'Student Profile'
                      : 'Guardian / Parent Profile'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#52525B] tabular-nums">
                  {learnerRecord.profileCompletion || 50}% complete
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7]">
                  <div className="text-[11px] text-[#6B6B6B]">Type</div>
                  <div className="font-bold text-[#18181B] capitalize">
                    {learnerRecord.learnerType}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7]">
                  <div className="text-[11px] text-[#6B6B6B]">Location</div>
                  <div className="font-bold text-[#18181B]">
                    {[learnerRecord.area, learnerRecord.district].filter(Boolean).join(', ') || 'Bangladesh'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7]">
                  <div className="text-[11px] text-[#6B6B6B]">Division</div>
                  <div className="font-bold text-[#18181B]">{learnerRecord.division || 'Dhaka'}</div>
                </div>
              </div>
            </section>
          )}

          {/* Tuition Posts Created by This User */}
          {userPosts.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EFEAE7] p-4 space-y-2.5">
              <div className="text-xs font-bold text-[#18181B] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#15803D]" />
                <span>Tuition Posts ({userPosts.length})</span>
              </div>
              <div className="space-y-2">
                {userPosts.map(post => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      viewTuitionDetail(post);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[#F8F6F5] hover:bg-[#FFF6F3] border border-[#EFEAE7] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#18181B] truncate">{post.title}</div>
                      <div className="text-[11px] text-[#6B6B6B] truncate">
                        {post.classGrade} · {[post.area, post.district].filter(Boolean).join(', ')} · ৳
                        {post.salaryOfferBDT.toLocaleString()}/mo · {post.status}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#858585] shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Verification Requests */}
          {userVerifications.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EFEAE7] p-4 space-y-2.5">
              <div className="text-xs font-bold text-[#18181B] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C94A35]" />
                <span>Verification Submissions ({userVerifications.length})</span>
              </div>
              <div className="space-y-2">
                {userVerifications.map(v => {
                  const safeDoc = sanitizeSafeHttpUrl(v.documentUrl);
                  return (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#18181B] capitalize">
                          {v.verificationType} · {v.status}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B] truncate">{v.documentName}</div>
                      </div>
                      {safeDoc && safeDoc.startsWith('https://') && (
                        <a
                          href={safeDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#C94A35] hover:underline shrink-0"
                        >
                          View Doc
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
