import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Check,
  ExternalLink,
  UserPlus,
  FileText,
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sanitizeSafeHttpUrl } from '../../utils/contactLinks';
import { formatRelativeTime, isWithinLast24Hours } from '../../utils/notifications';
import { DEFAULT_PLACEHOLDER_AVATAR } from '../../types';

type AdminTab = 'activity' | 'notifications' | 'verifications' | 'reports';

export const AdminDashboard: React.FC = () => {
  const {
    verificationQueue,
    approveVerification,
    rejectVerification,
    reports,
    resolveReport,
    adminUsers,
    adminTutorProfiles,
    adminTuitionPosts,
    notifications,
    markAllNotificationsRead,
    handleNotificationClick,
    viewTutorDetail,
    viewTuitionDetail,
    browserNotifPermission,
    requestBrowserNotifications
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('activity');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const pendingVerifications = verificationQueue.filter(v => v.status === 'pending');
  const pendingReports = reports.filter(r => r.status !== 'resolved');
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const recentSignups24h = useMemo(() => {
    return adminUsers
      .filter(u => isWithinLast24Hours(u.createdAt))
      .sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
  }, [adminUsers]);

  const recentPostsAndProfiles24h = useMemo(() => {
    const postItems = adminTuitionPosts
      .filter(p => isWithinLast24Hours(p.createdAt))
      .map(post => ({
        kind: 'tuition' as const,
        id: `tuition_${post.id}`,
        title: post.title,
        actorName: post.learnerName || 'Guardian / Student',
        location: [post.area, post.district].filter(Boolean).join(', '),
        meta: `৳${post.salaryOfferBDT.toLocaleString()}/mo · ${post.classGrade} · ${post.status}`,
        createdAt: post.createdAt || '',
        post
      }));

    const tutorItems = adminTutorProfiles
      .filter(t => isWithinLast24Hours(t.createdAt))
      .map(tutor => ({
        kind: 'tutor' as const,
        id: `tutor_${tutor.id}`,
        title: tutor.name,
        actorName: tutor.university || 'University Tutor',
        location: tutor.district || 'Bangladesh',
        meta: `${tutor.isPublished ? 'Published Tutor' : 'Draft Tutor'} · ${
          tutor.subjects.slice(0, 3).join(', ') || 'Tutor Profile'
        }`,
        createdAt: tutor.createdAt || '',
        tutor
      }));

    return [...postItems, ...tutorItems].sort(
      (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
    );
  }, [adminTuitionPosts, adminTutorProfiles]);

  return (
    <div className="min-h-screen bg-[#FCFBFA] py-6 px-3 sm:px-6 text-left animate-fade-up">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="ivory-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#18181B]">
                Admin Portal
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
                Live last 24h signups & posts, notifications, verifications, and safety moderation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {browserNotifPermission === 'granted' ? (
                <div className="h-9 px-3.5 rounded-full bg-[#E8F8EE] border border-[#C6EBD5] text-[#15803D] text-xs font-bold inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Outside Alerts Active</span>
                </div>
              ) : browserNotifPermission !== 'unsupported' ? (
                <button
                  type="button"
                  onClick={requestBrowserNotifications}
                  className="h-9 px-4 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <BellRing className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {browserNotifPermission === 'denied'
                      ? 'Browser Alerts Blocked'
                      : 'Enable Outside Alerts'}
                  </span>
                </button>
              ) : null}
            </div>
          </div>

          {/* 4-Card Bento KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all ${
                activeTab === 'activity'
                  ? 'bg-[#EFEAFF] border-[#7C5DFA]/50 shadow-xs'
                  : 'bg-[#EFEAFF]/65 border-[#E1D8FF] hover:bg-[#EFEAFF]'
              }`}
            >
              <div className="text-xs font-medium text-[#52525B] flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                <span>New Signups (24h)</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {recentSignups24h.length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all ${
                activeTab === 'activity'
                  ? 'bg-[#DCEBFA] border-[#4D8AF0]/50 shadow-xs'
                  : 'bg-[#DCEBFA]/65 border-[#C6DDF5] hover:bg-[#DCEBFA]'
              }`}
            >
              <div className="text-xs font-medium text-[#52525B] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                <span>New Posts (24h)</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {recentPostsAndProfiles24h.length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('verifications')}
              className={`p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all ${
                activeTab === 'verifications'
                  ? 'bg-[#FFF4D6] border-[#F5A04E]/70 shadow-xs'
                  : 'bg-[#FFF4D6]/65 border-[#F8E4AE] hover:bg-[#FFF4D6]'
              }`}
            >
              <div className="text-xs font-medium text-[#52525B] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                <span>Verifications</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {pendingVerifications.length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#FFEBE6] border-[#EB624B]/60 shadow-xs'
                  : 'bg-[#FFEBE6]/65 border-[#FAD5CB] hover:bg-[#FFEBE6]'
              }`}
            >
              <div className="text-xs font-medium text-[#52525B] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                <span>Pending Reports</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {pendingReports.length}
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="inline-flex max-w-full items-center gap-1 p-1 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`h-9 px-4 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'activity'
                  ? 'bg-[#18181B] text-white font-bold shadow-xs'
                  : 'text-[#52525B] font-semibold hover:text-[#18181B]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Last 24 Hours</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`h-9 px-4 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-[#18181B] text-white font-bold shadow-xs'
                  : 'text-[#52525B] font-semibold hover:text-[#18181B]'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">
                Alerts{unreadNotifsCount > 0 ? ` (${unreadNotifsCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('verifications')}
              className={`h-9 px-4 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'verifications'
                  ? 'bg-[#18181B] text-white font-bold shadow-xs'
                  : 'text-[#52525B] font-semibold hover:text-[#18181B]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">Verifications ({pendingVerifications.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`h-9 px-4 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-[#18181B] text-white font-bold shadow-xs'
                  : 'text-[#52525B] font-semibold hover:text-[#18181B]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">Reports ({pendingReports.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LAST 24 HOURS COMPACT BENTO VIEW */}
        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* New Signups (Last 24 Hours) */}
            <section className="ivory-card p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-extrabold text-[#18181B] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#EFEAFF] border border-[#E1D8FF] flex items-center justify-center shrink-0">
                      <UserPlus className="w-3.5 h-3.5 text-[#18181B]" />
                    </span>
                    <span>New Signups (Last 24h)</span>
                  </h2>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    New accounts created today (tutors, students & guardians)
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EFEAFF] text-[#18181B] font-mono text-xs font-bold tabular-nums">
                  {recentSignups24h.length}
                </span>
              </div>

              {recentSignups24h.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] text-center text-xs text-[#6B6B6B]">
                  No new user accounts created in the last 24 hours.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
                  {recentSignups24h.map(user => {
                    const roleText =
                      user.role === 'tutor'
                        ? 'Tutor'
                        : user.learnerSubtype === 'student'
                          ? 'Student'
                          : 'Guardian';
                    return (
                      <div
                        key={user.id}
                        className="p-3 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={user.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-white bg-white shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#18181B] truncate">
                              {user.name || 'New User'}
                            </div>
                            <div className="text-[11px] text-[#6B6B6B] truncate">
                              {user.email || 'Google Account'}
                              {user.district ? ` · ${user.district}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              user.role === 'tutor'
                                ? 'bg-[#DCEBFA] text-[#1E3A8A]'
                                : 'bg-[#FFF4D6] text-[#92400E]'
                            }`}
                          >
                            {roleText}
                          </span>
                          <div className="text-[10px] text-[#858585] font-medium">
                            {formatRelativeTime(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Latest Tuition Posts & Tutor Profiles (Last 24 Hours) */}
            <section className="ivory-card p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-extrabold text-[#18181B] flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#DCEBFA] border border-[#C6DDF5] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[#18181B]" />
                    </span>
                    <span>Latest Posts (Last 24h)</span>
                  </h2>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Who posted a tuition requirement or published a tutor profile
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#DCEBFA] text-[#18181B] font-mono text-xs font-bold tabular-nums">
                  {recentPostsAndProfiles24h.length}
                </span>
              </div>

              {recentPostsAndProfiles24h.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] text-center text-xs text-[#6B6B6B]">
                  No new tuition posts or tutor profiles in the last 24 hours.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
                  {recentPostsAndProfiles24h.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.kind === 'tuition') {
                          viewTuitionDetail(item.post);
                        } else {
                          viewTutorDetail(item.tutor);
                        }
                      }}
                      className="w-full text-left p-3 rounded-2xl bg-[#F8F6F5] hover:bg-[#FFF6F3] border border-[#EFEAE7] flex items-start justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.kind === 'tuition'
                                ? 'bg-[#FFEBE6] text-[#C94A35]'
                                : 'bg-[#EFEAFF] text-[#5B21B6]'
                            }`}
                          >
                            {item.kind === 'tuition' ? 'Tuition Post' : 'Tutor Profile'}
                          </span>
                          <span className="text-[11px] text-[#858585] font-medium">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#18181B] leading-snug break-words">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#52525B] truncate">
                          By <strong className="text-[#18181B]">{item.actorName}</strong>
                          {item.location ? ` · ${item.location}` : ''}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B] truncate">{item.meta}</div>
                      </div>

                      <ArrowUpRight className="w-4 h-4 text-[#858585] shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: ADMIN NOTIFICATIONS CENTER */}
        {activeTab === 'notifications' && (
          <div className="ivory-card p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-extrabold text-[#18181B]">
                  Live Admin Alerts & Signups Feed
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Real-time alerts when someone signs up, posts a tuition, or publishes a tutor profile
                </p>
              </div>
              {unreadNotifsCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="h-9 px-4 rounded-full bg-[#FFF6F3] hover:bg-[#FFEBE6] border border-[#F5E4DF] text-xs font-bold text-[#C94A35] cursor-pointer shrink-0"
                >
                  Mark all read ({unreadNotifsCount})
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#6B6B6B]">
                No notifications received yet.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      !n.read
                        ? 'bg-[#DCEBFA]/45 border-[#C6DDF5] hover:bg-[#DCEBFA]/70'
                        : 'bg-[#F8F6F5] border-[#EFEAE7] hover:bg-[#FFF6F3]'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#EB624B] shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm font-bold text-[#18181B]">
                          {n.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] leading-relaxed">{n.message}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#C94A35] shrink-0">
                      {n.time}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VERIFICATIONS */}
        {activeTab === 'verifications' && (
          <div className="space-y-3">
            {pendingVerifications.length === 0 ? (
              <div className="ivory-card p-8 text-center text-sm text-[#6B6B6B]">
                No pending verification requests.
              </div>
            ) : (
              pendingVerifications.map(item => (
                <div
                  key={item.id}
                  className="ivory-card p-5 space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-display font-bold text-base text-[#18181B]">
                        {item.tutorName}
                      </div>
                      <div className="text-[#6B6B6B] break-words">
                        {item.university} · {item.verificationType} · {item.documentName}
                      </div>
                      {(() => {
                        const safeDocUrl = sanitizeSafeHttpUrl(item.documentUrl);
                        if (!safeDocUrl) return null;
                        return (
                          <a
                            href={safeDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C94A35] hover:underline pt-1"
                          >
                            <span>View Uploaded Document</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          rejectVerification(
                            item.id,
                            rejectionReasons[item.id]?.trim() || 'Document unclear or invalid.'
                          )
                        }
                        className="h-9 px-4 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer transition-colors whitespace-nowrap"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => approveVerification(item.id)}
                        className="h-9 px-4 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white font-bold cursor-pointer transition-colors whitespace-nowrap"
                      >
                        Approve Badge
                      </button>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={rejectionReasons[item.id] || ''}
                      onChange={(e) =>
                        setRejectionReasons(prev => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Optional rejection feedback note (e.g. Upload a clearer photo of ID)..."
                      className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="ivory-card p-8 text-center text-sm text-[#6B6B6B]">
                No reports submitted.
              </div>
            ) : (
              reports.map(rep => (
                <div
                  key={rep.id}
                  className="ivory-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-display font-bold text-sm sm:text-base text-[#18181B]">
                      {rep.targetTitle}
                    </div>
                    <div className="text-[#6B6B6B] mt-0.5">
                      {rep.reason} · Reported by {rep.reportedBy} ({rep.submittedAt})
                    </div>
                  </div>
                  {rep.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => resolveReport(rep.id)}
                      className="h-9 px-4 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Resolve</span>
                    </button>
                  ) : (
                    <span className="text-[#15803D] font-bold">Resolved</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-12 pb-6 flex justify-center">
        <img
          src="/assets/aistudio/felow-webstar-color_11ef6d13.svg"
          alt="FeLoW WebStaR"
          className="w-[300px] sm:w-[420px] md:w-[500px] max-w-full h-auto block select-none"
        />
      </div>
    </div>
  );
};
