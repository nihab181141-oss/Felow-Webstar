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
  ArrowUpRight,
  Search,
  Users,
  X,
  GraduationCap,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sanitizeSafeHttpUrl } from '../../utils/contactLinks';
import { formatRelativeTime, isWithinLast24Hours } from '../../utils/notifications';
import { matchesTutorSearchQuery } from '../../utils/tutorSearch';
import { DEFAULT_PLACEHOLDER_AVATAR, LearnerProfile, TutorProfile, UserAccount } from '../../types';
import { AdminGrowthChartCard } from './AdminGrowthChartCard';
import { AdminProfileInspectorModal } from './AdminProfileInspectorModal';
import { PushNotificationCard } from '../shared/PushNotificationCard';

type AdminTab = 'activity' | 'directory' | 'notifications' | 'verifications' | 'reports';
type DirectoryRoleFilter = 'all' | 'tutors' | 'guardians' | 'students' | 'drafts';

interface UnifiedAdminPerson {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  roleLabel: string;
  isTutor: boolean;
  isDraftTutor: boolean;
  district: string;
  subtitle: string;
  createdAt: string;
  user?: UserAccount;
  tutor?: TutorProfile;
  learner?: LearnerProfile;
}

export const AdminDashboard: React.FC = () => {
  const {
    verificationQueue,
    approveVerification,
    rejectVerification,
    reports,
    resolveReport,
    adminUsers,
    adminLearnerProfiles,
    adminTutorProfiles,
    adminTuitionPosts,
    inspectedAdminUserId,
    setInspectedAdminUserId,
    openAdminUserProfile,
    notifications,
    markAllNotificationsRead,
    handleNotificationClick,
    viewTutorDetail,
    viewTuitionDetail,
    browserNotifPermission,
    requestBrowserNotifications
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('activity');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<DirectoryRoleFilter>('all');
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
        actorId: post.learnerId,
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
        actorId: tutor.uid || tutor.id,
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

  const unifiedDirectory = useMemo<UnifiedAdminPerson[]>(() => {
    const uidSet = new Set<string>();
    const userMap = new Map<string, UserAccount>();
    const tutorMap = new Map<string, TutorProfile>();
    const learnerMap = new Map<string, LearnerProfile>();

    adminUsers.forEach(u => {
      uidSet.add(u.id);
      userMap.set(u.id, u);
    });
    adminTutorProfiles.forEach(t => {
      const uid = t.uid || t.id;
      uidSet.add(uid);
      tutorMap.set(uid, t);
    });
    adminLearnerProfiles.forEach(l => {
      uidSet.add(l.uid);
      learnerMap.set(l.uid, l);
    });

    return Array.from(uidSet)
      .map(uid => {
        const user = userMap.get(uid);
        const tutor = tutorMap.get(uid);
        const learner = learnerMap.get(uid);
        const isTutor = Boolean(tutor || user?.role === 'tutor');
        const isDraftTutor = Boolean(tutor && !tutor.isPublished);
        const roleLabel = tutor
          ? tutor.isPublished
            ? 'Tutor'
            : 'Draft Tutor'
          : user?.role === 'tutor'
            ? 'Tutor Account'
            : (learner?.learnerType || user?.learnerSubtype) === 'student'
              ? 'Student'
              : 'Guardian';

        const subtitleParts = tutor
          ? [tutor.university, tutor.department, tutor.subjects.slice(0, 3).join(', ')]
          : [user?.email, learner?.area || user?.area];

        return {
          uid,
          name: tutor?.name || learner?.name || user?.name || 'Registered User',
          email: user?.email || tutor?.email || '',
          avatar:
            tutor?.profilePhotoURL ||
            tutor?.avatar ||
            user?.avatar ||
            DEFAULT_PLACEHOLDER_AVATAR,
          roleLabel,
          isTutor,
          isDraftTutor,
          district: tutor?.district || learner?.district || user?.district || '',
          subtitle: subtitleParts.filter(Boolean).join(' · '),
          createdAt: tutor?.createdAt || user?.createdAt || '',
          user,
          tutor,
          learner
        };
      })
      .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }, [adminUsers, adminTutorProfiles, adminLearnerProfiles]);

  const platformMetrics = useMemo(() => {
    const totalTuitionPosts = adminTuitionPosts.length;
    const openTuitionPosts = adminTuitionPosts.filter(p => p.status === 'open').length;
    const publishedTutorPosts = adminTutorProfiles.filter(t => t.isPublished !== false).length;
    const draftTutorPosts = adminTutorProfiles.length - publishedTutorPosts;
    const totalTutors = unifiedDirectory.filter(p => p.isTutor).length;
    const totalGuardians = unifiedDirectory.filter(
      p => !p.isTutor && p.roleLabel === 'Guardian'
    ).length;
    const totalStudents = unifiedDirectory.filter(
      p => !p.isTutor && p.roleLabel === 'Student'
    ).length;

    return {
      totalTuitionPosts,
      openTuitionPosts,
      publishedTutorPosts,
      draftTutorPosts,
      totalTutors,
      totalGuardians,
      totalStudents
    };
  }, [adminTuitionPosts, adminTutorProfiles, unifiedDirectory]);

  const filteredDirectory = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return unifiedDirectory.filter(person => {
      if (directoryRoleFilter === 'tutors' && !person.isTutor) return false;
      if (directoryRoleFilter === 'guardians' && (person.isTutor || person.roleLabel !== 'Guardian')) return false;
      if (directoryRoleFilter === 'students' && (person.isTutor || person.roleLabel !== 'Student')) return false;
      if (directoryRoleFilter === 'drafts' && !person.isDraftTutor) return false;

      if (!q) return true;
      if (person.tutor) {
        if (matchesTutorSearchQuery(person.tutor, q, person.email)) return true;
      }
      const hay = [
        person.name,
        person.email,
        person.roleLabel,
        person.district,
        person.subtitle,
        person.user?.phone,
        person.user?.whatsappNumber,
        person.learner?.area,
        person.learner?.district
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every(tok => hay.includes(tok));
    });
  }, [unifiedDirectory, directorySearch, directoryRoleFilter]);

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
                Live growth analytics, 24h signups & posts, user/tutor lookup, notifications, and safety moderation
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

          {/* Platform Totals Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className="p-3.5 rounded-[20px] bg-[#DCEBFA]/55 hover:bg-[#DCEBFA]/85 border border-[#C6DDF5] text-left cursor-pointer transition-all"
            >
              <div className="text-[11px] font-medium text-[#52525B] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                <span className="truncate">Total Tuition Posts</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {platformMetrics.totalTuitionPosts}
              </div>
              <div className="text-[10px] font-medium text-[#52525B] mt-0.5 tabular-nums">
                {platformMetrics.openTuitionPosts} open now
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirectoryRoleFilter('tutors');
                setActiveTab('directory');
              }}
              className="p-3.5 rounded-[20px] bg-[#FFF6F3]/85 hover:bg-[#FFEBE6] border border-[#F5E4DF] text-left cursor-pointer transition-all"
            >
              <div className="text-[11px] font-medium text-[#52525B] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#C94A35] shrink-0" />
                <span className="truncate">Total Tutor Posts</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {platformMetrics.publishedTutorPosts}
              </div>
              <div className="text-[10px] font-medium text-[#52525B] mt-0.5 tabular-nums">
                {platformMetrics.draftTutorPosts} drafts
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirectoryRoleFilter('tutors');
                setActiveTab('directory');
              }}
              className="p-3.5 rounded-[20px] bg-[#EFEAFF]/70 hover:bg-[#EFEAFF] border border-[#E1D8FF] text-left cursor-pointer transition-all"
            >
              <div className="text-[11px] font-medium text-[#52525B] flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                <span className="truncate">Total Tutors</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {platformMetrics.totalTutors}
              </div>
              <div className="text-[10px] font-medium text-[#52525B] mt-0.5 tabular-nums">
                {unifiedDirectory.length} total accounts
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirectoryRoleFilter('guardians');
                setActiveTab('directory');
              }}
              className="p-3.5 rounded-[20px] bg-[#FFF4D6]/65 hover:bg-[#FFF4D6] border border-[#F8E4AE] text-left cursor-pointer transition-all"
            >
              <div className="text-[11px] font-medium text-[#52525B] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#18181B] shrink-0" />
                <span className="truncate">Total Guardians</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {platformMetrics.totalGuardians}
              </div>
              <div className="text-[10px] font-medium text-[#52525B] mt-0.5">
                Guardian accounts
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirectoryRoleFilter('students');
                setActiveTab('directory');
              }}
              className="col-span-2 sm:col-span-1 p-3.5 rounded-[20px] bg-[#E8F8EE]/70 hover:bg-[#E8F8EE] border border-[#C6EBD5] text-left cursor-pointer transition-all"
            >
              <div className="text-[11px] font-medium text-[#52525B] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                <span className="truncate">Total Students</span>
              </div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-1">
                {platformMetrics.totalStudents}
              </div>
              <div className="text-[10px] font-medium text-[#52525B] mt-0.5">
                Student accounts
              </div>
            </button>
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
              <span>Overview & 24h</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`h-9 px-4 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'directory'
                  ? 'bg-[#18181B] text-white font-bold shadow-xs'
                  : 'text-[#52525B] font-semibold hover:text-[#18181B]'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">All Users & Tutors ({unifiedDirectory.length})</span>
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

        {/* TAB 1: OVERVIEW, 7-DAY GROWTH CHART & LAST 24 HOURS */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <AdminGrowthChartCard users={adminUsers} tuitionPosts={adminTuitionPosts} />

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
                      Click any name to inspect and enter their created profile
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#18181B] tabular-nums">
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
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => openAdminUserProfile(user.id)}
                          className="w-full text-left p-3 rounded-2xl bg-[#F8F6F5] hover:bg-[#EFEAFF]/45 border border-[#EFEAE7] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={user.avatar || DEFAULT_PLACEHOLDER_AVATAR}
                              alt={user.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-white bg-white shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#18181B] hover:text-[#EB624B] truncate">
                                {user.name || 'New User'}
                              </div>
                              <div className="text-[11px] text-[#6B6B6B] truncate">
                                {user.email || 'Google Account'}
                                {user.district ? ` · ${user.district}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right space-y-0.5">
                              <div className="text-[11px] font-bold text-[#18181B]">
                                {roleText}
                              </div>
                              <div className="text-[10px] text-[#858585] font-medium">
                                {formatRelativeTime(user.createdAt)}
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-[#858585]" />
                          </div>
                        </button>
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
                      Click a post to open it, or click the creator&apos;s name to view their profile
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#18181B] tabular-nums">
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
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (item.kind === 'tuition') {
                            viewTuitionDetail(item.post);
                          } else {
                            viewTutorDetail(item.tutor);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (item.kind === 'tuition') {
                              viewTuitionDetail(item.post);
                            } else {
                              viewTutorDetail(item.tutor);
                            }
                          }
                        }}
                        className="w-full text-left p-3 rounded-2xl bg-[#F8F6F5] hover:bg-[#FFF6F3] border border-[#EFEAE7] flex items-start justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                            <span className="font-bold text-[#C94A35]">
                              {item.kind === 'tuition' ? 'Tuition Post' : 'Tutor Profile'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{formatRelativeTime(item.createdAt)}</span>
                          </div>
                          <div className="text-xs font-bold text-[#18181B] leading-snug break-words">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#52525B] truncate">
                            By{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAdminUserProfile(item.actorId);
                              }}
                              className="font-bold text-[#18181B] hover:text-[#EB624B] hover:underline cursor-pointer"
                            >
                              {item.actorName}
                            </button>
                            {item.location ? ` · ${item.location}` : ''}
                          </div>
                          <div className="text-[11px] text-[#6B6B6B] truncate">{item.meta}</div>
                        </div>

                        <ArrowUpRight className="w-4 h-4 text-[#858585] shrink-0 mt-1" />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: SEARCHABLE ALL USERS, TUTORS & PROFILES DIRECTORY */}
        {activeTab === 'directory' && (
          <section className="ivory-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-extrabold text-[#18181B]">
                  Search Any Account or Profile
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Search by tutor name, student/guardian name, email, university, subjects, or district to enter their profile
                </p>
              </div>

              <div className="inline-flex max-w-full overflow-x-auto no-scrollbar items-center gap-1 p-1 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] self-start">
                {(
                  [
                    ['all', 'All'],
                    ['tutors', 'Tutors'],
                    ['guardians', 'Guardians'],
                    ['students', 'Students'],
                    ['drafts', 'Draft Tutors']
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDirectoryRoleFilter(key)}
                    className={`h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                      directoryRoleFilter === key
                        ? 'bg-[#18181B] text-white'
                        : 'text-[#6B6B6B] hover:text-[#18181B]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center bg-[#F6F4F3] rounded-full border border-[#EAE4E1] focus-within:border-[#18181B] focus-within:bg-white px-4 h-11 transition-colors">
              <Search className="w-4 h-4 text-[#6B6B6B] shrink-0" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search tutor name, profile bio, university, email, subject, or district..."
                className="flex-1 min-w-0 bg-transparent px-3 text-sm text-[#18181B] placeholder:text-[#858585] focus:outline-none"
              />
              {directorySearch && (
                <button
                  type="button"
                  onClick={() => setDirectorySearch('')}
                  aria-label="Clear search"
                  className="w-7 h-7 rounded-full hover:bg-[#EAE4E1] flex items-center justify-center text-[#52525B] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredDirectory.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] text-center text-xs text-[#6B6B6B]">
                No matching user or tutor profiles found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredDirectory.map(person => (
                  <div
                    key={person.uid}
                    className="p-3.5 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => openAdminUserProfile(person.uid)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                    >
                      <img
                        src={person.avatar}
                        alt={person.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-white bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#18181B] group-hover:text-[#EB624B] truncate">
                          {person.name}
                        </div>
                        <div className="text-[11px] text-[#52525B] truncate">
                          {person.roleLabel}
                          {person.district ? ` · ${person.district}` : ''}
                        </div>
                        {person.subtitle && (
                          <div className="text-[11px] text-[#6B6B6B] truncate">{person.subtitle}</div>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {person.tutor && (
                        <button
                          type="button"
                          onClick={() => viewTutorDetail(person.tutor!)}
                          className="h-8 px-3 rounded-full bg-white hover:bg-[#FFF6F3] border border-[#EAE4E1] text-[11px] font-bold text-[#18181B] cursor-pointer whitespace-nowrap"
                        >
                          Tutor Page
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openAdminUserProfile(person.uid)}
                        className="h-8 px-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: ADMIN NOTIFICATIONS CENTER */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <PushNotificationCard />
            <div className="ivory-card p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-extrabold text-[#18181B]">
                  Live Admin Alerts & Signups Feed
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Click any alert or name to jump directly into the created user, tutor, or tuition profile
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold text-[#C94A35]">{n.time}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#858585]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        {/* TAB 4: VERIFICATIONS */}
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
                      <button
                        type="button"
                        onClick={() => openAdminUserProfile(item.tutorId)}
                        className="font-display font-bold text-base text-[#18181B] hover:text-[#EB624B] hover:underline cursor-pointer text-left"
                      >
                        {item.tutorName}
                      </button>
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

        {/* TAB 5: REPORTS */}
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
                    {rep.targetId ? (
                      <button
                        type="button"
                        onClick={() => openAdminUserProfile(rep.targetId!)}
                        className="font-display font-bold text-sm sm:text-base text-[#18181B] hover:text-[#EB624B] hover:underline cursor-pointer text-left"
                      >
                        {rep.targetTitle}
                      </button>
                    ) : (
                      <div className="font-display font-bold text-sm sm:text-base text-[#18181B]">
                        {rep.targetTitle}
                      </div>
                    )}
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

      <AdminProfileInspectorModal
        userId={inspectedAdminUserId}
        onClose={() => setInspectedAdminUserId(null)}
      />

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
