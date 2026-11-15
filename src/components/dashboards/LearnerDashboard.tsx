import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  MessageCircle,
  Edit3,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TutorPageCard } from '../shared/TutorPageCard';
import { buildWhatsAppUrl } from '../../utils/contactLinks';
import { BD_DISTRICTS_BY_DIVISION, getDivisionByDistrict, getAreasOrUpazilas } from '../../data/bangladeshData';
import { DEFAULT_PLACEHOLDER_AVATAR } from '../../types';

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
    viewTutorDetail
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'profile'>('posts');

  const [name, setName] = useState(learnerProfile?.name || currentUser.name || '');
  const [district, setDistrict] = useState(learnerProfile?.district || currentUser.district || 'Dhaka');
  const [area, setArea] = useState(learnerProfile?.area || currentUser.area || 'Dhanmondi');
  const [whatsapp, setWhatsapp] = useState(
    learnerProfile?.whatsappNumber || currentUser.whatsappNumber || currentUser.phone || ''
  );

  useEffect(() => {
    setName(learnerProfile?.name || currentUser.name || '');
    setDistrict(learnerProfile?.district || currentUser.district || 'Dhaka');
    setArea(learnerProfile?.area || currentUser.area || 'Dhanmondi');
    setWhatsapp(
      learnerProfile?.whatsappNumber || currentUser.whatsappNumber || currentUser.phone || ''
    );
  }, [
    learnerProfile?.name,
    learnerProfile?.district,
    learnerProfile?.area,
    learnerProfile?.whatsappNumber,
    currentUser.name,
    currentUser.district,
    currentUser.area,
    currentUser.whatsappNumber,
    currentUser.phone
  ]);

  const myPosts = tuitionPosts.filter(p => p.learnerId === currentUser.id);
  const savedTutors = tutors.filter(t => savedTutorIds.includes(t.id));
  const myInvitations = invitations.filter(i => i.learnerId === currentUser.id);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveLearnerProfile({
      name: name.trim(),
      district,
      division: getDivisionByDistrict(district),
      area,
      whatsappNumber: whatsapp.trim(),
      phone: whatsapp.trim()
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-12 text-left animate-fade-up">
      {/* Account Header */}
      <div className="bg-white border-b border-[#F1E1DC]">
        <div className="max-w-4xl mx-auto">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-[#FFF3EF] via-[#FFE2D9] to-[#DCEBFA] border-b border-[#F1E1DC] sm:rounded-b-3xl" />

          <div className="px-4 sm:px-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
              <div className="flex items-end gap-4 min-w-0">
                <img
                  src={currentUser.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-sm bg-white shrink-0"
                />
                <div className="pb-1 min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-[#252525] leading-snug break-words">
                    {currentUser.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#858585] break-words">
                    Student / Parent Account · {currentUser.area}, {currentUser.district}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openCreateTuitionModal}
                  className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Tuition</span>
                </button>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="border-t border-[#F1E1DC] mt-4 pt-2 flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'posts', label: `My Tuition Posts (${myPosts.length})` },
                { id: 'saved', label: `Saved Tutors (${savedTutors.length})` },
                { id: 'profile', label: 'Edit Profile & Invites' }
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
        {activeTab === 'posts' && (
          <>
            {myPosts.length === 0 ? (
              <div className="ivory-card p-8 text-center space-y-3">
                <div className="text-base font-bold text-[#252525]">No tuition posts yet</div>
                <p className="text-sm text-[#858585]">
                  Post what class and subjects you need a tutor for — tutors will apply directly.
                </p>
                <button
                  type="button"
                  onClick={openCreateTuitionModal}
                  className="h-10 px-6 bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs sm:text-sm font-bold rounded-full cursor-pointer transition-colors"
                >
                  Post Tuition Need
                </button>
              </div>
            ) : (
              myPosts.map(post => {
                const postApps = applications.filter(
                  a => a.tuitionPostId === post.id && a.status !== 'withdrawn'
                );

                return (
                  <div key={post.id} className="ivory-card p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#C94A35] uppercase tabular-nums">
                          {post.status} · ৳{post.salaryOfferBDT.toLocaleString()}/mo
                        </div>
                        <h3 className="text-base font-bold text-[#252525] leading-snug break-words">{post.title}</h3>
                        <div className="text-xs text-[#858585] break-words">
                          {post.classGrade} · {post.subjects.join(', ')} · {post.area}, {post.district}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditTuitionModal(post)}
                          className="w-9 h-9 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] flex items-center justify-center cursor-pointer transition-colors"
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
                    <div className="pt-2 border-t border-[#F1E1DC] space-y-2">
                      <div className="text-xs font-bold text-[#858585]">
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
                              className="p-3.5 rounded-2xl bg-[#FFF3EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <img
                                  src={app.tutorAvatar || DEFAULT_PLACEHOLDER_AVATAR}
                                  alt={app.tutorName}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-full object-cover shrink-0"
                                />
                                <div className="min-w-0 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => matchedTutor && viewTutorDetail(matchedTutor)}
                                    className="font-bold text-[#252525] hover:text-[#C94A35] hover:underline cursor-pointer text-left"
                                  >
                                    {app.tutorName}
                                  </button>
                                  <div className="text-[#858585] tabular-nums">
                                    {app.tutorUniversity} · ৳{app.proposedSalaryBDT.toLocaleString()}/mo ·{' '}
                                    <span className="font-semibold text-[#C94A35] uppercase">
                                      {app.status}
                                    </span>
                                  </div>
                                  <p className="text-[#252525] mt-1 leading-relaxed">{app.coverLetter}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {tutorWa && (
                                  <a
                                    href={tutorWa}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 px-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
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
                                        className="h-9 px-3.5 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#252525] text-xs font-semibold cursor-pointer transition-colors"
                                      >
                                        Shortlist
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                      className="h-9 px-3.5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-xs font-bold cursor-pointer transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                      className="h-9 px-3.5 rounded-full bg-white border border-[#F1E1DC] text-rose-700 text-xs font-semibold cursor-pointer hover:bg-rose-50 transition-colors"
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
              <div className="ivory-card p-8 text-center md:col-span-2 text-sm text-[#858585]">
                No saved Tutors yet. Click the bookmark icon on any Tutor profile to save it here.
              </div>
            ) : (
              savedTutors.map(t => <TutorPageCard key={t.id} tutor={t} />)
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={handleSaveProfile} className="ivory-card p-5 space-y-3 text-xs">
              <h2 className="font-display text-base font-bold text-[#252525]">
                Your Contact & Location
              </h2>
              <div>
                <label className="block font-semibold text-[#252525] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] outline-none focus:border-[#F47C68]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setArea(getAreasOrUpazilas(e.target.value)[0]);
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] outline-none focus:border-[#F47C68]"
                  >
                    {ALL_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#252525] mb-1">Area</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] outline-none focus:border-[#F47C68]"
                  >
                    {getAreasOrUpazilas(district).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#252525] mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full p-2.5 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] placeholder:text-[#858585] outline-none focus:border-[#F47C68]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold cursor-pointer transition-colors"
              >
                Save Info
              </button>
            </form>

            <div className="ivory-card p-5 space-y-3 text-xs">
              <h2 className="font-display text-base font-bold text-[#252525]">
                Sent Invitations ({myInvitations.length})
              </h2>
              {myInvitations.length === 0 ? (
                <p className="text-[#858585]">No direct invitations sent yet.</p>
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
                      <div key={inv.id} className="p-3.5 rounded-2xl bg-[#FFF3EF] space-y-2">
                        <div className="flex justify-between font-bold text-[#252525]">
                          <span>{inv.tutorName}</span>
                          <span className="text-[#C94A35] uppercase">{inv.status}</span>
                        </div>
                        <div className="text-[#858585] tabular-nums">
                          {inv.classGrade} · {inv.subjects.join(', ')} · ৳{inv.offerSalaryBDT.toLocaleString()}/mo
                        </div>
                        {invWa && (
                          <div className="pt-1">
                            <a
                              href={invWa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp Tutor</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
