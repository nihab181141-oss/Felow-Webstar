import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  TutorProfile,
  TutorPrivateContact,
  LearnerProfile,
  TuitionPost,
  TuitionPostStatus,
  Application,
  Invitation,
  VerificationQueueItem,
  NotificationItem,
  ReportItem,
  UserAccount,
  UserRole,
  ApplicationStatus,
  calculateTutorCompleteness,
  isTutorProfileMandatoryComplete,
  DEFAULT_PLACEHOLDER_AVATAR
} from '../types';
import {
  INITIAL_TUTORS,
  INITIAL_TUITION_POSTS,
  INITIAL_APPLICATIONS,
  INITIAL_INVITATIONS,
  INITIAL_VERIFICATION_QUEUE,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  PRESET_USERS
} from '../data/mockData';
import { TRANSLATIONS, getDivisionByDistrict } from '../data/bangladeshData';
import {
  auth,
  db,
  testConnection,
  loginWithGooglePopup,
  logout,
  isAdminUserInFirestore,
  extractFriendlyErrorMessage,
  fetchUserAccountFromFirestore,
  updateUserRoleSettingsInFirestore,
  saveLearnerProfileInFirestore,
  fetchLearnerProfileFromFirestore,
  saveTutorProfileInFirestore,
  fetchTutorProfileById,
  fetchTutorContactDetails,
  fetchTutorProfilesPage,
  mapTutorProfileDoc,
  createTuitionPostInFirestore,
  updateTuitionPostInFirestore,
  updateTuitionPostStatusInFirestore,
  fetchTuitionPrivateContact,
  deleteTuitionPostInFirestore,
  fetchPublicTuitionPostsPage,
  mapTuitionPostDoc,
  submitApplicationInFirestore,
  updateApplicationStatusInFirestore,
  sendInvitationInFirestore,
  respondToInvitationInFirestore,
  toggleTutorFavouriteInFirestore,
  toggleSavedTuitionInFirestore,
  submitVerificationInFirestore,
  updateVerificationInFirestore,
  submitReportInFirestore,
  resolveReportInFirestore,
  markNotificationAsReadInFirestore,
  markAllNotificationsAsReadInFirestore,
  uploadDocumentToStorage,
  uploadAvatarToStorage,
  toIsoDateString
} from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';

export type AppView =
  | 'landing'
  | 'tutors'
  | 'tutor-detail'
  | 'tuitions'
  | 'tuition-detail'
  | 'how-it-works'
  | 'about'
  | 'login'
  | 'tutor-onboarding'
  | 'dashboard'
  | 'admin';

interface ToastState {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  t: typeof TRANSLATIONS.en;

  currentUser: UserAccount;
  currentRole: UserRole;
  learnerProfile: LearnerProfile | null;
  switchUserRole: (role: UserRole) => Promise<void>;
  activateDualRole: (role: 'learner' | 'tutor') => Promise<void>;
  switchUserPersona: (userId: string) => void;
  presetUsers: UserAccount[];
  allUsers: UserAccount[];

  activeView: AppView;
  setActiveView: (view: AppView) => void;
  directoryTab: 'tutors' | 'tuitions';
  setDirectoryTab: (tab: 'tutors' | 'tuitions') => void;
  districtFilter: string;
  setDistrictFilter: (district: string) => void;
  mobileDetailOpen: boolean;
  setMobileDetailOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  tutors: TutorProfile[];
  tuitionPosts: TuitionPost[];
  applications: Application[];
  invitations: Invitation[];
  verificationQueue: VerificationQueueItem[];
  notifications: NotificationItem[];
  reports: ReportItem[];
  isMarketplaceLoading: boolean;

  savedTutorIds: string[];
  toggleSaveTutor: (tutorId: string) => Promise<void>;

  savedTuitionIds: string[];
  toggleSaveTuition: (tuitionId: string) => Promise<void>;

  comparisonTutorIds: string[];
  toggleComparisonTutor: (tutorId: string) => void;
  clearComparison: () => void;

  selectedTutor: TutorProfile | null;
  setSelectedTutor: (tutor: TutorProfile | null) => void;
  viewTutorDetail: (tutor: TutorProfile) => void;

  selectedTuition: TuitionPost | null;
  setSelectedTuition: (tuition: TuitionPost | null) => void;
  viewTuitionDetail: (tuition: TuitionPost) => void;

  editingTuition: TuitionPost | null;
  setEditingTuition: (tuition: TuitionPost | null) => void;
  openCreateTuitionModal: () => void;
  openEditTuitionModal: (tuition: TuitionPost) => void;

  isPostTuitionOpen: boolean;
  setIsPostTuitionOpen: (open: boolean) => void;

  isApplyModalOpen: boolean;
  setIsApplyModalOpen: (open: boolean) => void;

  isComparisonModalOpen: boolean;
  setIsComparisonModalOpen: (open: boolean) => void;

  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;

  postNewTuition: (post: Omit<TuitionPost, 'id' | 'learnerId' | 'learnerName' | 'postedDate' | 'status' | 'totalApplicants'>) => Promise<void>;
  updateTuitionPost: (postId: string, updates: Partial<TuitionPost>) => Promise<void>;
  updateTuitionPostStatus: (postId: string, status: TuitionPostStatus) => Promise<void>;
  deleteTuitionPost: (postId: string) => Promise<void>;

  submitApplication: (application: Omit<Application, 'id' | 'appliedAt' | 'status'>) => Promise<void>;
  withdrawApplication: (appId: string) => Promise<void>;
  updateApplicationStatus: (appId: string, status: ApplicationStatus, note?: string, closePostOnAccept?: boolean) => Promise<void>;

  sendInvitation: (
    tutor: TutorProfile,
    message: string,
    offerBDT: number,
    classGrade: string,
    subjects: string[],
    tuitionPostId?: string,
    preferredSchedule?: string
  ) => Promise<void>;
  respondToInvitation: (invitationId: string, status: 'accepted' | 'declined') => Promise<void>;

  updateTutorProfile: (tutorId: string, updated: Partial<TutorProfile>) => Promise<void>;
  saveLearnerProfile: (profile: Partial<LearnerProfile>) => Promise<void>;

  hasAppliedToPost: (postId: string) => boolean;
  getUserApplicationForPost: (postId: string) => Application | undefined;
  canViewTutorWhatsApp: (tutor: TutorProfile) => boolean;
  canViewLearnerWhatsApp: (learnerId: string) => boolean;
  getTutorContactInfo: (tutorId: string) => Promise<TutorPrivateContact | null>;
  getTuitionPrivateContact: (postId: string) => Promise<{ whatsappNumber: string; detailedAddress: string } | null>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  handleNotificationClick: (notif: NotificationItem) => void;

  submitReport: (report: Omit<ReportItem, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  resolveReport: (id: string) => Promise<void>;

  approveVerification: (id: string) => Promise<void>;
  rejectVerification: (id: string, reason: string) => Promise<void>;
  submitNewVerificationDoc: (tutorId: string, type: 'identity' | 'institution' | 'qualification', docName: string, docUrl?: string) => Promise<void>;

  isFirebaseConnected: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  isDemoSession: boolean;
  firebaseUser: FirebaseUser | null;
  needsTutorProfileSetup: boolean;
  myTutorProfile: TutorProfile | null;
  loginWithGoogleUser: (intendedRole?: 'learner' | 'tutor', learnerSubtype?: 'student' | 'guardian') => Promise<void>;
  logoutUser: () => Promise<void>;
  uploadTutorDoc: (file: File) => Promise<string>;
  uploadTutorAvatar: (file: File) => Promise<string>;

  toast: ToastState | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [currentUser, setCurrentUser] = useState<UserAccount>(PRESET_USERS[0]);
  const [currentRole, setCurrentRole] = useState<UserRole>('learner');
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [activeView, setActiveViewState] = useState<AppView>('landing');
  const preAuthViewRef = useRef<AppView>('landing');
  const setActiveView = useCallback((viewOrUpdater: React.SetStateAction<AppView>) => {
    setActiveViewState(prev => {
      const next = typeof viewOrUpdater === 'function' ? viewOrUpdater(prev) : viewOrUpdater;
      if (next === 'login' && prev !== 'login' && prev !== 'dashboard' && prev !== 'admin' && prev !== 'tutor-onboarding') {
        preAuthViewRef.current = prev;
      }
      return next;
    });
  }, []);

  const [tutors, setTutors] = useState<TutorProfile[]>(INITIAL_TUTORS);
  const [tuitionPosts, setTuitionPosts] = useState<TuitionPost[]>(INITIAL_TUITION_POSTS);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [invitations, setInvitations] = useState<Invitation[]>(INITIAL_INVITATIONS);
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItem[]>(INITIAL_VERIFICATION_QUEUE);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [allUsers] = useState<UserAccount[]>(PRESET_USERS);
  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(false);

  const [savedTutorIds, setSavedTutorIds] = useState<string[]>(['tutor-1']);
  const [savedTuitionIds, setSavedTuitionIds] = useState<string[]>(['post-1']);
  const [comparisonTutorIds, setComparisonTutorIds] = useState<string[]>([]);

  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);
  const [selectedTuition, setSelectedTuition] = useState<TuitionPost | null>(null);
  const [editingTuition, setEditingTuition] = useState<TuitionPost | null>(null);

  const [isPostTuitionOpen, setIsPostTuitionOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isAuthModalOpen] = useState(false);
  const setIsAuthModalOpen = useCallback((open: boolean) => {
    if (open) {
      setActiveView('login');
    } else {
      setActiveViewState(prev => (prev === 'login' ? preAuthViewRef.current : prev));
    }
  }, [setActiveView]);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [directoryTab, setDirectoryTab] = useState<'tutors' | 'tuitions'>('tutors');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [toast, setToast] = useState<ToastState | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const myPrivateContactRef = useRef<TutorPrivateContact | null>(null);

  const t = TRANSLATIONS[language];
  const isAuthenticated = Boolean(firebaseUser || isDemoSession);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToast({ id, text, type });
    setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, 4000);
  }, []);

  // Boot connection & persistent Google Auth state sync
  useEffect(() => {
    testConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemoSession(false);
        const [isUserAdmin, remoteAccount, remoteLearner, remoteTutor, remotePrivateContact] = await Promise.all([
          isAdminUserInFirestore(user.uid, user.email, user.emailVerified),
          fetchUserAccountFromFirestore(user.uid),
          fetchLearnerProfileFromFirestore(user.uid),
          fetchTutorProfileById(user.uid),
          fetchTutorContactDetails(user.uid)
        ]);
        myPrivateContactRef.current = remotePrivateContact;
        if (remoteLearner) setLearnerProfile(remoteLearner);

        if (remoteTutor) {
          const enrichedTutor: TutorProfile = {
            ...remoteTutor,
            whatsappNumber: remotePrivateContact?.whatsappNumber || remoteTutor.whatsappNumber || '',
            normalizedWhatsappNumber:
              remotePrivateContact?.normalizedWhatsappNumber || remoteTutor.normalizedWhatsappNumber || '',
            facebookUrl: remotePrivateContact?.facebookUrl || remoteTutor.facebookUrl || '',
            whatsappConsent: remotePrivateContact?.whatsappConsent ?? remoteTutor.whatsappConsent ?? false,
            contactVisibility: remotePrivateContact?.contactVisibility || remoteTutor.contactVisibility || 'authenticated'
          };
          setTutors(prev => {
            const exists = prev.some(t => t.id === enrichedTutor.id || t.uid === user.uid);
            if (exists) {
              return prev.map(t => (t.id === enrichedTutor.id || t.uid === user.uid ? enrichedTutor : t));
            }
            return [enrichedTutor, ...prev];
          });
        }

        const resolvedRole: UserRole = isUserAdmin
          ? 'admin'
          : (remoteAccount?.role as UserRole) || 'learner';

        setCurrentUser(prev => ({
          ...prev,
          id: user.uid,
          name: remoteAccount?.name || user.displayName || 'FeLoW WebStaR User',
          email: user.email || remoteAccount?.email || '',
          phone: remotePrivateContact?.whatsappNumber || remoteAccount?.phone || user.phoneNumber || '',
          whatsappNumber:
            remotePrivateContact?.whatsappNumber || remoteAccount?.whatsappNumber || remoteAccount?.phone || user.phoneNumber || '',
          facebookUrl: remotePrivateContact?.facebookUrl || remoteAccount?.facebookUrl || '',
          avatar: remoteAccount?.avatar || user.photoURL || DEFAULT_PLACEHOLDER_AVATAR,
          division: remoteAccount?.division || 'Dhaka',
          district: remoteAccount?.district || 'Dhaka',
          upazila: remoteAccount?.upazila || '',
          area: remoteAccount?.area || 'Dhanmondi',
          learnerSubtype: remoteAccount?.learnerSubtype || 'guardian',
          phoneVisibility: remoteAccount?.phoneVisibility ?? false,
          availableRoles: isUserAdmin
            ? ['admin', 'learner', 'tutor']
            : remoteAccount?.availableRoles || [resolvedRole],
          tutorProfileId: user.uid,
          role: resolvedRole
        }));
        setCurrentRole(resolvedRole);

        // Enforce mandatory Tutor Profile Setup Wizard before allowing Tutor Dashboard
        if (resolvedRole === 'tutor' && (!remoteTutor || !remoteTutor.isPublished)) {
          setActiveView(prevView => (prevView === 'dashboard' || prevView === 'login' ? 'tutor-onboarding' : prevView));
        }
      } else {
        myPrivateContactRef.current = null;
        setLearnerProfile(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // Route guard for protected & admin-only views
  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated && (activeView === 'dashboard' || activeView === 'admin' || activeView === 'tutor-onboarding')) {
      setActiveView('login');
      showToast('Please sign in with Google to access your account dashboard.', 'info');
      return;
    }
    if (isAuthenticated && activeView === 'admin' && currentRole !== 'admin') {
      setActiveView('dashboard');
      showToast('Admin authorization required.', 'error');
    }
  }, [isAuthReady, isAuthenticated, activeView, currentRole, showToast]);

  // Initial public catalog fetch (one-shot reads without opening unauthenticated WebChannel streams)
  useEffect(() => {
    let isMounted = true;
    setIsMarketplaceLoading(true);
    Promise.all([
      fetchTutorProfilesPage(100),
      fetchPublicTuitionPostsPage(100)
    ])
      .then(([tutorPage, remotePosts]) => {
        if (!isMounted) return;
        if (tutorPage.items.length > 0) {
          setTutors(prev => {
            const existingMine = prev.find(t => t.id === firebaseUser?.uid || t.uid === firebaseUser?.uid);
            const mergedRemote = tutorPage.items.map(rt => {
              if (existingMine && (rt.id === existingMine.id || rt.uid === existingMine.uid)) {
                return {
                  ...rt,
                  whatsappNumber: existingMine.whatsappNumber || myPrivateContactRef.current?.whatsappNumber || '',
                  normalizedWhatsappNumber:
                    existingMine.normalizedWhatsappNumber || myPrivateContactRef.current?.normalizedWhatsappNumber || '',
                  facebookUrl: existingMine.facebookUrl || myPrivateContactRef.current?.facebookUrl || ''
                };
              }
              return rt;
            });
            const remoteIds = new Set(mergedRemote.map(t => t.id));
            const sampleKeep = INITIAL_TUTORS.filter(t => !remoteIds.has(t.id));
            return [...mergedRemote, ...sampleKeep];
          });
        }
        if (remotePosts.length > 0) {
          setTuitionPosts(() => {
            const remoteIds = new Set(remotePosts.map(p => p.id));
            const sampleKeep = INITIAL_TUITION_POSTS.filter(p => !remoteIds.has(p.id));
            return [...remotePosts, ...sampleKeep];
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsMarketplaceLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [firebaseUser?.uid]);

  // Real-time Listeners for Authenticated Firebase User
  useEffect(() => {
    if (!firebaseUser) {
      // Demo persona state uses INITIAL_* fixtures
      return;
    }

    const uid = firebaseUser.uid;
    let cancelled = false;
    const unsubs: Array<() => void> = [];

    // Clear sample saved IDs so only authentic Firestore records render for authenticated users
    setSavedTutorIds([]);
    setSavedTuitionIds([]);

    unsubs.push(
      onSnapshot(query(collection(db, 'tutorProfiles'), limit(100)), (snapshot) => {
        const remoteTutors: TutorProfile[] = snapshot.docs.map(docSnap => {
          const mapped = mapTutorProfileDoc(docSnap);
          if (mapped.id === uid || mapped.uid === uid) {
            const priv = myPrivateContactRef.current;
            if (priv) {
              return {
                ...mapped,
                whatsappNumber: priv.whatsappNumber || '',
                normalizedWhatsappNumber: priv.normalizedWhatsappNumber || '',
                facebookUrl: priv.facebookUrl || '',
                whatsappConsent: priv.whatsappConsent,
                contactVisibility: priv.contactVisibility
              };
            }
          }
          return mapped;
        });
        setTutors(() => {
          const remoteIds = new Set(remoteTutors.map(t => t.id));
          const sampleKeep = INITIAL_TUTORS.filter(t => !remoteIds.has(t.id));
          return [...remoteTutors, ...sampleKeep];
        });
      }, (err) => {
        console.warn('tutorProfiles listener fallback:', err);
      })
    );

    unsubs.push(
      onSnapshot(query(collection(db, 'tuitionPosts'), limit(100)), (snapshot) => {
        const remotePosts: TuitionPost[] = snapshot.docs.map(mapTuitionPostDoc);
        setTuitionPosts(() => {
          const remoteIds = new Set(remotePosts.map(p => p.id));
          const sampleKeep = INITIAL_TUITION_POSTS.filter(p => !remoteIds.has(p.id));
          return [...remotePosts, ...sampleKeep];
        });
      }, (err) => {
        console.warn('tuitionPosts listener fallback:', err);
      })
    );

    const mapAppDoc = (docSnap: any): Application => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        tuitionPostId: d.tuitionPostId || '',
        tuitionTitle: d.tuitionTitle || '',
        learnerId: d.learnerId || '',
        learnerName: d.learnerName || '',
        tutorId: d.tutorId || '',
        tutorName: d.tutorName || '',
        tutorAvatar: d.tutorAvatar || '',
        tutorUniversity: d.tutorUniversity || '',
        tutorDepartment: d.tutorDepartment || '',
        tutorAcademicYear: d.tutorAcademicYear || '',
        tutorRating: Number(d.tutorRating) || 0,
        tutorExperienceYears: Number(d.tutorExperienceYears) || 0,
        tutorWhatsApp: d.tutorWhatsApp || '',
        tutorFacebookUrl: d.tutorFacebookUrl || '',
        guardianWhatsApp: d.guardianWhatsApp || '',
        proposedSalaryBDT: Number(d.proposedSalaryBDT) || 0,
        introduction: d.introduction || '',
        coverLetter: d.coverLetter || '',
        experienceSummary: d.experienceSummary || '',
        suitabilityReason: d.suitabilityReason || '',
        availableSchedule: d.availableSchedule || '',
        additionalQualifications: d.additionalQualifications || '',
        appliedAt: d.appliedAt || toIsoDateString(d.createdAt, '').split('T')[0],
        updatedAt: toIsoDateString(d.updatedAt),
        status: d.status || 'pending',
        demoDate: d.demoDate,
        feedbackNote: d.feedbackNote,
        isSample: false
      };
    };

    const tutorAppsMap = new Map<string, Application>();
    const learnerAppsMap = new Map<string, Application>();
    const syncMergedApps = () => {
      const merged = new Map<string, Application>();
      tutorAppsMap.forEach((v, k) => merged.set(k, v));
      learnerAppsMap.forEach((v, k) => merged.set(k, v));
      setApplications(Array.from(merged.values()));
    };

    isAdminUserInFirestore(uid, firebaseUser.email, firebaseUser.emailVerified).then((isUserAdmin) => {
      if (cancelled) return;

      if (isUserAdmin) {
        unsubs.push(
          onSnapshot(query(collection(db, 'applications'), limit(100)), snap => {
            setApplications(snap.docs.map(mapAppDoc));
          }, err => console.warn('admin applications listener:', err))
        );
        unsubs.push(
          onSnapshot(query(collection(db, 'verificationRequests'), limit(50)), snap => {
            const items: VerificationQueueItem[] = snap.docs.map(d => ({
              id: d.id,
              ...(d.data() as any)
            }));
            setVerificationQueue(items);
          }, err => console.warn('verificationRequests listener:', err))
        );
        unsubs.push(
          onSnapshot(query(collection(db, 'reports'), limit(50)), snap => {
            const items: ReportItem[] = snap.docs.map(d => ({
              id: d.id,
              ...(d.data() as any)
            }));
            setReports(items);
          }, err => console.warn('reports listener:', err))
        );
      } else {
        unsubs.push(
          onSnapshot(query(collection(db, 'applications'), where('tutorId', '==', uid), limit(100)), snap => {
            tutorAppsMap.clear();
            snap.docs.forEach(d => tutorAppsMap.set(d.id, mapAppDoc(d)));
            syncMergedApps();
          }, err => console.warn('tutor applications listener:', err))
        );
        unsubs.push(
          onSnapshot(query(collection(db, 'applications'), where('learnerId', '==', uid), limit(100)), snap => {
            learnerAppsMap.clear();
            snap.docs.forEach(d => learnerAppsMap.set(d.id, mapAppDoc(d)));
            syncMergedApps();
          }, err => console.warn('learner applications listener:', err))
        );
        unsubs.push(
          onSnapshot(query(collection(db, 'verificationRequests'), where('tutorId', '==', uid), limit(20)), snap => {
            const items: VerificationQueueItem[] = snap.docs.map(d => ({
              id: d.id,
              ...(d.data() as any)
            }));
            setVerificationQueue(items);
          }, err => console.warn('my verificationRequests listener:', err))
        );
      }
    });

    // Invitations (scoped to tutorId or learnerId)
    const mapInvDoc = (docSnap: any): Invitation => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        learnerId: d.learnerId || '',
        learnerName: d.learnerName || '',
        learnerWhatsApp: d.learnerWhatsApp || '',
        tutorId: d.tutorId || '',
        tutorName: d.tutorName || '',
        tutorWhatsApp: d.tutorWhatsApp || '',
        tutorFacebookUrl: d.tutorFacebookUrl || '',
        tuitionPostId: d.tuitionPostId || '',
        tuitionTitle: d.tuitionTitle || '',
        classGrade: d.classGrade || '',
        subjects: Array.isArray(d.subjects) ? d.subjects : [],
        offerSalaryBDT: Number(d.offerSalaryBDT || d.offerBDT) || 0,
        preferredSchedule: d.preferredSchedule || '',
        message: d.message || '',
        status: d.status || 'pending',
        sentAt: d.sentAt || toIsoDateString(d.createdAt, '').split('T')[0],
        isSample: false
      };
    };

    const tutorInvs = new Map<string, Invitation>();
    const learnerInvs = new Map<string, Invitation>();
    const syncMergedInvs = () => {
      const merged = new Map<string, Invitation>();
      tutorInvs.forEach((v, k) => merged.set(k, v));
      learnerInvs.forEach((v, k) => merged.set(k, v));
      setInvitations(Array.from(merged.values()));
    };

    unsubs.push(
      onSnapshot(query(collection(db, 'invitations'), where('tutorId', '==', uid), limit(50)), snap => {
        tutorInvs.clear();
        snap.docs.forEach(d => tutorInvs.set(d.id, mapInvDoc(d)));
        syncMergedInvs();
      }, err => console.warn('tutor invitations listener:', err))
    );
    unsubs.push(
      onSnapshot(query(collection(db, 'invitations'), where('learnerId', '==', uid), limit(50)), snap => {
        learnerInvs.clear();
        snap.docs.forEach(d => learnerInvs.set(d.id, mapInvDoc(d)));
        syncMergedInvs();
      }, err => console.warn('learner invitations listener:', err))
    );

    // Tutor Favourites
    unsubs.push(
      onSnapshot(query(collection(db, 'tutorFavourites'), where('userId', '==', uid), limit(100)), snap => {
        setSavedTutorIds(snap.docs.map(d => d.data().tutorId).filter(Boolean));
      }, err => console.warn('tutorFavourites listener:', err))
    );

    // Saved Tuitions
    unsubs.push(
      onSnapshot(query(collection(db, 'savedTuitions'), where('userId', '==', uid), limit(100)), snap => {
        setSavedTuitionIds(snap.docs.map(d => d.data().tuitionPostId).filter(Boolean));
      }, err => console.warn('savedTuitions listener:', err))
    );

    // Notifications
    unsubs.push(
      onSnapshot(query(collection(db, 'notifications'), where('userId', '==', uid), limit(50)), snap => {
        const items: NotificationItem[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            title: data.title || 'Notification',
            message: data.message || '',
            time: data.time || toIsoDateString(data.createdAt, 'Recently').split('T')[0],
            read: Boolean(data.read),
            type: data.type || 'system',
            actionView: data.actionView,
            targetId: data.targetId,
            createdAt: toIsoDateString(data.createdAt)
          };
        });
        setNotifications(items);
      }, err => console.warn('notifications listener:', err))
    );

    return () => {
      cancelled = true;
      unsubs.forEach(fn => fn());
    };
  }, [firebaseUser]);

  const myTutorProfile = tutors.find(t => t.id === currentUser.id || t.uid === currentUser.id) || null;
  const needsTutorProfileSetup = Boolean(
    firebaseUser &&
      currentRole === 'tutor' &&
      (!myTutorProfile || !myTutorProfile.isPublished)
  );

  // Multi-Role & Demo Persona Switching
  const switchUserRole = async (role: UserRole) => {
    setCurrentRole(role);
    const updatedRoles = Array.from(new Set([...(currentUser.availableRoles || [currentUser.role]), role]));
    setCurrentUser(prev => ({
      ...prev,
      role,
      availableRoles: updatedRoles
    }));

    if (firebaseUser && (role === 'learner' || role === 'tutor')) {
      try {
        await updateUserRoleSettingsInFirestore(firebaseUser.uid, role, updatedRoles);
      } catch (e) {
        console.warn('Could not persist role switch:', e);
      }
      if (role === 'tutor' && (!myTutorProfile || !myTutorProfile.isPublished)) {
        setActiveView('tutor-onboarding');
        showToast('Please complete your mandatory Tutor Profile setup to publish.', 'info');
        return;
      }
    }
    showToast(`Switched active mode to ${role.toUpperCase()}`, 'info');
  };

  const activateDualRole = async (role: 'learner' | 'tutor') => {
    const updatedRoles = Array.from(new Set([...(currentUser.availableRoles || [currentUser.role]), role]));
    setCurrentUser(prev => ({
      ...prev,
      role,
      availableRoles: updatedRoles
    }));
    setCurrentRole(role);

    if (firebaseUser) {
      try {
        await updateUserRoleSettingsInFirestore(firebaseUser.uid, role, updatedRoles);
        if (role === 'tutor') {
          const existingTutor = tutors.find(t => t.id === firebaseUser.uid || t.uid === firebaseUser.uid);
          if (!existingTutor || !existingTutor.isPublished) {
            setActiveView('tutor-onboarding');
            showToast('Complete your mandatory Tutor Profile setup to go live!', 'info');
            return;
          }
        } else if (role === 'learner' && !learnerProfile) {
          await saveLearnerProfileInFirestore(firebaseUser.uid, {
            uid: firebaseUser.uid,
            name: currentUser.name,
            learnerType: currentUser.learnerSubtype || 'guardian',
            phone: currentUser.phone,
            whatsappNumber: currentUser.whatsappNumber || currentUser.phone,
            division: currentUser.division || 'Dhaka',
            district: currentUser.district || 'Dhaka',
            area: currentUser.area || 'Dhanmondi',
            phoneVisibility: false
          });
        }
      } catch (err) {
        console.warn('Role activation persistence warning:', err);
      }
    }
    showToast(`${role === 'tutor' ? 'Tutor' : 'Learner / Guardian'} mode activated on your account!`, 'success');
  };

  const switchUserPersona = (userId: string) => {
    const target = PRESET_USERS.find(u => u.id === userId);
    if (target) {
      setIsDemoSession(true);
      setCurrentUser(target);
      setCurrentRole(target.role);
      showToast(`Preview mode active as ${target.name} (${target.role})`, 'info');
    }
  };

  const toggleSaveTutor = async (tutorId: string) => {
    const exists = savedTutorIds.includes(tutorId);
    setSavedTutorIds(prev => (exists ? prev.filter(id => id !== tutorId) : [...prev, tutorId]));
    showToast(exists ? 'Removed from saved tutors' : 'Tutor saved to your shortlist');

    if (firebaseUser) {
      try {
        await toggleTutorFavouriteInFirestore(firebaseUser.uid, tutorId, !exists);
      } catch (err) {
        console.warn('toggleTutorFavouriteInFirestore failed:', err);
      }
    }
  };

  const toggleSaveTuition = async (tuitionId: string) => {
    const exists = savedTuitionIds.includes(tuitionId);
    setSavedTuitionIds(prev => (exists ? prev.filter(id => id !== tuitionId) : [...prev, tuitionId]));
    showToast(exists ? 'Removed from saved tuitions' : 'Tuition opportunity saved');

    if (firebaseUser) {
      try {
        await toggleSavedTuitionInFirestore(firebaseUser.uid, tuitionId, !exists);
      } catch (err) {
        console.warn('toggleSavedTuitionInFirestore failed:', err);
      }
    }
  };

  const viewTutorDetail = (tutor: TutorProfile) => {
    setSelectedTutor(tutor);
    setDirectoryTab('tutors');
    setMobileDetailOpen(false);
    setActiveView('tutor-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewTuitionDetail = (tuition: TuitionPost) => {
    setSelectedTuition(tuition);
    setDirectoryTab('tuitions');
    setMobileDetailOpen(false);
    setActiveView('tuition-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCreateTuitionModal = () => {
    setEditingTuition(null);
    setIsPostTuitionOpen(true);
  };

  const openEditTuitionModal = (tuition: TuitionPost) => {
    setEditingTuition(tuition);
    setIsPostTuitionOpen(true);
    if (firebaseUser && !tuition.isSample && !tuition.id.startsWith('post-')) {
      fetchTuitionPrivateContact(tuition.id).then(priv => {
        if (priv) {
          setEditingTuition(prev =>
            prev && prev.id === tuition.id
              ? {
                  ...prev,
                  whatsappNumber: priv.whatsappNumber || prev.whatsappNumber,
                  detailedAddress: priv.detailedAddress || prev.detailedAddress
                }
              : prev
          );
        }
      });
    }
  };

  const toggleComparisonTutor = (tutorId: string) => {
    setComparisonTutorIds(prev => {
      if (prev.includes(tutorId)) {
        return prev.filter(id => id !== tutorId);
      }
      if (prev.length >= 3) {
        showToast('You can compare up to 3 tutors at a time.', 'info');
        return prev;
      }
      showToast('Tutor added to comparison matrix');
      return [...prev, tutorId];
    });
  };

  const clearComparison = () => {
    setComparisonTutorIds([]);
  };

  // -------------------------------------------------------------
  // Tuition Post Mutations
  // -------------------------------------------------------------

  const postNewTuition = async (
    postData: Omit<TuitionPost, 'id' | 'learnerId' | 'learnerName' | 'postedDate' | 'status' | 'totalApplicants'>
  ) => {
    const tempId = `post-${Date.now()}`;
    const division = postData.division || getDivisionByDistrict(postData.district);
    const newPost: TuitionPost = {
      ...postData,
      division,
      id: tempId,
      learnerId: currentUser.id,
      learnerName: currentUser.name,
      whatsappNumber: postData.whatsappNumber || currentUser.whatsappNumber || currentUser.phone,
      postedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'open',
      totalApplicants: 0,
      isFeatured: false,
      isSample: !firebaseUser
    };

    setTuitionPosts(prev => [newPost, ...prev]);
    setIsPostTuitionOpen(false);
    setEditingTuition(null);

    if (firebaseUser) {
      try {
        const firestoreId = await createTuitionPostInFirestore({
          ...postData,
          division,
          learnerId: firebaseUser.uid,
          learnerName: currentUser.name,
          whatsappNumber: postData.whatsappNumber || currentUser.whatsappNumber || currentUser.phone,
          isFeatured: false
        });
        if (firestoreId) {
          setTuitionPosts(prev => prev.map(p => (p.id === tempId ? { ...p, id: firestoreId } : p)));
          showToast('Tuition requirement published and saved!', 'success');
        }
      } catch (err: any) {
        setTuitionPosts(prev => prev.filter(p => p.id !== tempId));
        showToast(extractFriendlyErrorMessage(err, 'Failed to publish tuition post.'), 'error');
        throw err;
      }
    } else {
      showToast('Tuition post created in preview mode. Sign in to persist to database.', 'success');
    }
  };

  const updateTuitionPost = async (postId: string, updates: Partial<TuitionPost>) => {
    setTuitionPosts(prev => prev.map(p => (p.id === postId ? { ...p, ...updates } : p)));
    if (selectedTuition?.id === postId) {
      setSelectedTuition(prev => (prev ? { ...prev, ...updates } : null));
    }
    setIsPostTuitionOpen(false);
    setEditingTuition(null);

    if (firebaseUser && !postId.startsWith('post-')) {
      try {
        await updateTuitionPostInFirestore(postId, updates);
        showToast('Tuition post updated!', 'success');
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to update tuition post.'), 'error');
      }
    } else {
      showToast('Tuition post updated!', 'success');
    }
  };

  const updateTuitionPostStatus = async (postId: string, status: TuitionPostStatus) => {
    setTuitionPosts(prev => prev.map(p => (p.id === postId ? { ...p, status } : p)));
    if (selectedTuition?.id === postId) {
      setSelectedTuition(prev => (prev ? { ...prev, status } : null));
    }

    if (firebaseUser && !postId.startsWith('post-')) {
      try {
        await updateTuitionPostStatusInFirestore(postId, status);
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to update post status.'), 'error');
        return;
      }
    }
    showToast(`Tuition post marked as ${status.toUpperCase()}`, 'info');
  };

  const deleteTuitionPost = async (postId: string) => {
    setTuitionPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedTuition?.id === postId) {
      setSelectedTuition(null);
      if (activeView === 'tuition-detail') setActiveView('tuitions');
    }

    if (firebaseUser && !postId.startsWith('post-')) {
      try {
        await deleteTuitionPostInFirestore(postId);
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to delete tuition post.'), 'error');
        return;
      }
    }
    showToast('Tuition post deleted.', 'info');
  };

  // -------------------------------------------------------------
  // Application & Proposal Mutations
  // -------------------------------------------------------------

  const getUserApplicationForPost = useCallback(
    (postId: string) => {
      return applications.find(
        a => a.tuitionPostId === postId && a.tutorId === currentUser.id
      );
    },
    [applications, currentUser.id]
  );

  const hasAppliedToPost = useCallback(
    (postId: string) => {
      return Boolean(getUserApplicationForPost(postId));
    },
    [getUserApplicationForPost]
  );

  const submitApplication = async (appData: Omit<Application, 'id' | 'appliedAt' | 'status'>) => {
    const targetPost = tuitionPosts.find(p => p.id === appData.tuitionPostId);
    if (targetPost && targetPost.status !== 'open') {
      showToast('This tuition post is no longer open for applications.', 'error');
      return;
    }
    if (targetPost && targetPost.learnerId === currentUser.id) {
      showToast('You cannot apply to your own tuition post.', 'error');
      return;
    }
    if (firebaseUser && (targetPost?.isSample || appData.tuitionPostId.startsWith('post-'))) {
      showToast('This is a sample tuition listing. Please apply to a live tuition post.', 'info');
      return;
    }
    if (hasAppliedToPost(appData.tuitionPostId)) {
      showToast('You have already submitted an application for this tuition post.', 'error');
      return;
    }

    const deterministicId = `${appData.tuitionPostId}_${appData.tutorId}`;
    const newApp: Application = {
      ...appData,
      id: deterministicId,
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      isSample: !firebaseUser
    };

    setApplications(prev => [newApp, ...prev]);
    setTuitionPosts(prev =>
      prev.map(p => (p.id === appData.tuitionPostId ? { ...p, totalApplicants: p.totalApplicants + 1 } : p))
    );
    setIsApplyModalOpen(false);

    if (firebaseUser) {
      try {
        const firestoreId = await submitApplicationInFirestore(appData);
        if (firestoreId) {
          showToast('Proposal submitted and saved!', 'success');
        }
      } catch (err: any) {
        setApplications(prev => prev.filter(a => a.id !== deterministicId));
        setTuitionPosts(prev =>
          prev.map(p =>
            p.id === appData.tuitionPostId
              ? { ...p, totalApplicants: Math.max(0, p.totalApplicants - 1) }
              : p
          )
        );
        showToast(extractFriendlyErrorMessage(err, 'Failed to submit application.'), 'error');
        throw err;
      }
    } else {
      showToast('Proposal submitted in preview mode!', 'success');
    }
  };

  const withdrawApplication = async (appId: string) => {
    const target = applications.find(a => a.id === appId);
    setApplications(prev => prev.map(a => (a.id === appId ? { ...a, status: 'withdrawn' } : a)));

    if (firebaseUser && !target?.isSample) {
      try {
        await updateApplicationStatusInFirestore(appId, 'withdrawn', 'Withdrawn by tutor', {
          learnerId: target?.learnerId,
          tutorName: target?.tutorName,
          tuitionTitle: target?.tuitionTitle
        });
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to withdraw application.'), 'error');
        return;
      }
    }
    showToast('Application withdrawn.', 'info');
  };

  const updateApplicationStatus = async (
    appId: string,
    status: ApplicationStatus,
    note?: string,
    closePostOnAccept = true
  ) => {
    const target = applications.find(a => a.id === appId);
    setApplications(prev =>
      prev.map(app => {
        if (app.id === appId) {
          return {
            ...app,
            status,
            feedbackNote: note || app.feedbackNote,
            demoDate: status === 'invited' ? new Date(Date.now() + 86400000 * 2).toISOString() : app.demoDate
          };
        }
        return app;
      })
    );

    if (status === 'accepted' && closePostOnAccept && target?.tuitionPostId) {
      await updateTuitionPostStatus(target.tuitionPostId, 'assigned');
    }

    if (firebaseUser && !target?.isSample) {
      try {
        await updateApplicationStatusInFirestore(appId, status, note, {
          tutorId: target?.tutorId,
          learnerId: target?.learnerId,
          tutorName: target?.tutorName,
          tuitionTitle: target?.tuitionTitle,
          tuitionPostId: target?.tuitionPostId,
          guardianWhatsApp: currentUser.whatsappNumber || currentUser.phone
        });
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to update application status.'), 'error');
        return;
      }
    }
    showToast(`Application marked as ${status.toUpperCase()}`, 'success');
  };

  // -------------------------------------------------------------
  // Direct Invitations
  // -------------------------------------------------------------

  const sendInvitation = async (
    tutor: TutorProfile,
    message: string,
    offerBDT: number,
    classGrade: string,
    subjects: string[],
    tuitionPostId?: string,
    preferredSchedule?: string
  ) => {
    const linkedPost = tuitionPostId ? tuitionPosts.find(p => p.id === tuitionPostId) : undefined;
    let resolvedTutorWa = tutor.whatsappNumber || tutor.phone || '';
    let resolvedTutorFb = tutor.facebookUrl || '';

    if (firebaseUser && !tutor.isSample && (!resolvedTutorWa || !resolvedTutorFb)) {
      try {
        const priv = await fetchTutorContactDetails(tutor.uid || tutor.id);
        if (priv) {
          resolvedTutorWa = resolvedTutorWa || priv.whatsappNumber || priv.normalizedWhatsappNumber || '';
          resolvedTutorFb = resolvedTutorFb || priv.facebookUrl || '';
        }
      } catch {
        // Tutor contact remains hidden until acceptance if shortlisted_only
      }
    }

    const tempId = `inv-${Date.now()}`;
    const newInv: Invitation = {
      id: tempId,
      learnerId: currentUser.id,
      learnerName: currentUser.name,
      learnerWhatsApp: currentUser.whatsappNumber || currentUser.phone,
      tutorId: tutor.uid || tutor.id,
      tutorName: tutor.name,
      tutorWhatsApp: resolvedTutorWa,
      tutorFacebookUrl: resolvedTutorFb,
      tuitionPostId: linkedPost?.id,
      tuitionTitle: linkedPost?.title,
      classGrade,
      subjects,
      offerSalaryBDT: offerBDT,
      preferredSchedule,
      message,
      status: 'pending',
      sentAt: new Date().toISOString().split('T')[0],
      isSample: !firebaseUser
    };

    setInvitations(prev => [newInv, ...prev]);

    if (firebaseUser) {
      try {
        const firestoreId = await sendInvitationInFirestore({
          learnerId: firebaseUser.uid,
          learnerName: currentUser.name,
          learnerWhatsApp: currentUser.whatsappNumber || currentUser.phone,
          tutorId: tutor.uid || tutor.id,
          tutorName: tutor.name,
          tutorWhatsApp: resolvedTutorWa,
          tutorFacebookUrl: resolvedTutorFb,
          tuitionPostId: linkedPost?.id,
          tuitionTitle: linkedPost?.title,
          classGrade,
          subjects,
          offerSalaryBDT: offerBDT,
          preferredSchedule,
          message
        });
        if (firestoreId) {
          setInvitations(prev => prev.map(i => (i.id === tempId ? { ...i, id: firestoreId } : i)));
        }
      } catch (err: any) {
        setInvitations(prev => prev.filter(i => i.id !== tempId));
        showToast(extractFriendlyErrorMessage(err, 'Failed to send invitation.'), 'error');
        return;
      }
    }
    showToast(`Tuition invitation sent to ${tutor.name}!`, 'success');
  };

  const respondToInvitation = async (invitationId: string, status: 'accepted' | 'declined') => {
    const target = invitations.find(i => i.id === invitationId);
    const tutorCanShareWa =
      myTutorProfile?.whatsappConsent !== false && myTutorProfile?.contactVisibility !== 'hidden';
    const tutorWa =
      status === 'accepted' && tutorCanShareWa
        ? currentUser.whatsappNumber || myTutorProfile?.whatsappNumber || currentUser.phone || ''
        : target?.tutorWhatsApp;
    const tutorFb =
      status === 'accepted' && tutorCanShareWa
        ? currentUser.facebookUrl || myTutorProfile?.facebookUrl || ''
        : target?.tutorFacebookUrl;

    setInvitations(prev =>
      prev.map(i =>
        i.id === invitationId
          ? { ...i, status, tutorWhatsApp: tutorWa || i.tutorWhatsApp, tutorFacebookUrl: tutorFb || i.tutorFacebookUrl }
          : i
      )
    );

    if (firebaseUser && !target?.isSample) {
      try {
        await respondToInvitationInFirestore(invitationId, status, {
          learnerId: target?.learnerId,
          tutorName: target?.tutorName,
          classGrade: target?.classGrade,
          tutorWhatsApp: tutorWa,
          tutorFacebookUrl: tutorFb
        });
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to update invitation response.'), 'error');
        return;
      }
    }
    showToast(
      status === 'accepted'
        ? 'Invitation accepted! WhatsApp coordination unlocked.'
        : 'Invitation declined.',
      status === 'accepted' ? 'success' : 'info'
    );
  };

  // -------------------------------------------------------------
  // Contact Visibility & Privacy Enforcement
  // -------------------------------------------------------------

  const canViewTutorWhatsApp = useCallback(
    (tutor: TutorProfile) => {
      if (currentRole === 'admin' || currentUser.id === tutor.id || currentUser.id === tutor.uid) {
        return true;
      }
      if (!isAuthenticated) {
        return false;
      }
      if (tutor.whatsappConsent === false || tutor.contactVisibility === 'hidden') {
        return false;
      }
      const vis = tutor.contactVisibility || (tutor.whatsappPublic === false ? 'shortlisted_only' : 'authenticated');
      if (vis === 'authenticated') {
        return true;
      }
      const hasUnlockedApp = applications.some(
        a =>
          (a.tutorId === tutor.id || a.tutorId === tutor.uid) &&
          a.learnerId === currentUser.id &&
          (a.status === 'shortlisted' || a.status === 'invited' || a.status === 'accepted')
      );
      const hasAcceptedInvite = invitations.some(
        i =>
          (i.tutorId === tutor.id || i.tutorId === tutor.uid) &&
          i.learnerId === currentUser.id &&
          i.status === 'accepted'
      );
      return hasUnlockedApp || hasAcceptedInvite;
    },
    [applications, invitations, currentRole, currentUser.id, isAuthenticated]
  );

  const canViewLearnerWhatsApp = useCallback(
    (learnerId: string) => {
      if (currentRole === 'admin' || currentUser.id === learnerId) {
        return true;
      }
      if (!isAuthenticated) {
        return false;
      }
      const hasUnlockedApp = applications.some(
        a =>
          a.learnerId === learnerId &&
          a.tutorId === currentUser.id &&
          (a.status === 'shortlisted' || a.status === 'invited' || a.status === 'accepted')
      );
      const hasAcceptedInvite = invitations.some(
        i => i.learnerId === learnerId && i.tutorId === currentUser.id && i.status === 'accepted'
      );
      return hasUnlockedApp || hasAcceptedInvite;
    },
    [applications, invitations, currentRole, currentUser.id, isAuthenticated]
  );

  const getTutorContactInfo = useCallback(async (tutorId: string): Promise<TutorPrivateContact | null> => {
    if (!firebaseUser) return null;
    return fetchTutorContactDetails(tutorId);
  }, [firebaseUser]);

  const getTuitionPrivateContact = useCallback(async (postId: string) => {
    if (!firebaseUser) return null;
    return fetchTuitionPrivateContact(postId);
  }, [firebaseUser]);

  // -------------------------------------------------------------
  // Profiles Update
  // -------------------------------------------------------------

  const updateTutorProfile = async (tutorId: string, updated: Partial<TutorProfile>) => {
    const existing = tutors.find(t => t.id === tutorId || t.uid === tutorId);
    const merged: TutorProfile = {
      ...(existing || INITIAL_TUTORS[0]),
      ...updated,
      id: tutorId,
      uid: updated.uid || existing?.uid || tutorId
    };
    merged.profileCompletion = calculateTutorCompleteness(merged);
    if (updated.isPublished && !isTutorProfileMandatoryComplete(merged, true)) {
      showToast('Please complete all mandatory personal and academic fields before publishing.', 'error');
      return;
    }

    if (tutorId === currentUser.id || tutorId === currentUser.tutorProfileId) {
      myPrivateContactRef.current = {
        uid: tutorId,
        whatsappNumber: merged.whatsappNumber || myPrivateContactRef.current?.whatsappNumber || '',
        normalizedWhatsappNumber:
          merged.normalizedWhatsappNumber || myPrivateContactRef.current?.normalizedWhatsappNumber || '',
        facebookUrl: merged.facebookUrl ?? myPrivateContactRef.current?.facebookUrl ?? '',
        whatsappConsent: merged.whatsappConsent ?? myPrivateContactRef.current?.whatsappConsent ?? true,
        contactVisibility: merged.contactVisibility || myPrivateContactRef.current?.contactVisibility || 'authenticated'
      };
    }

    setTutors(prev => {
      const existsInList = prev.some(t => t.id === tutorId || t.uid === tutorId);
      if (existsInList) {
        return prev.map(t => (t.id === tutorId || t.uid === tutorId ? merged : t));
      }
      return [merged, ...prev];
    });
    if (selectedTutor?.id === tutorId) {
      setSelectedTutor(merged);
    }
    if (tutorId === currentUser.id || tutorId === currentUser.tutorProfileId) {
      setCurrentUser(prev => ({
        ...prev,
        name: merged.name || prev.name,
        avatar: merged.profilePhotoURL || merged.avatar || prev.avatar,
        whatsappNumber: merged.whatsappNumber || merged.phone || prev.whatsappNumber,
        phone: merged.whatsappNumber || merged.phone || prev.phone,
        facebookUrl: merged.facebookUrl ?? prev.facebookUrl,
        university: merged.university || prev.university,
        department: merged.department || prev.department,
        academicYear: merged.academicYear || prev.academicYear
      }));
    }

    if (firebaseUser) {
      try {
        await saveTutorProfileInFirestore(firebaseUser.uid, merged);
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to save tutor profile to Firestore.'), 'error');
        throw err;
      }
    }
    showToast(merged.isPublished ? 'Tutor profile published & saved!' : 'Teaching profile saved!', 'success');
  };

  const saveLearnerProfile = async (profile: Partial<LearnerProfile>) => {
    const uid = firebaseUser?.uid || currentUser.id;
    const division = profile.division || getDivisionByDistrict(profile.district || currentUser.district);
    const nextProfile: LearnerProfile = {
      uid,
      name: profile.name ?? currentUser.name,
      learnerType: profile.learnerType ?? currentUser.learnerSubtype ?? 'guardian',
      phone: profile.phone ?? currentUser.phone,
      whatsappNumber: profile.whatsappNumber ?? currentUser.whatsappNumber ?? currentUser.phone,
      facebookUrl: profile.facebookUrl ?? currentUser.facebookUrl,
      division,
      district: profile.district ?? currentUser.district,
      upazila: profile.upazila ?? currentUser.upazila,
      area: profile.area ?? currentUser.area,
      phoneVisibility: profile.phoneVisibility ?? currentUser.phoneVisibility,
      profileCompletion: 100
    };
    setLearnerProfile(nextProfile);
    setCurrentUser(prev => ({
      ...prev,
      name: nextProfile.name,
      learnerSubtype: nextProfile.learnerType,
      phone: nextProfile.phone,
      whatsappNumber: nextProfile.whatsappNumber,
      facebookUrl: nextProfile.facebookUrl,
      division: nextProfile.division,
      district: nextProfile.district,
      upazila: nextProfile.upazila,
      area: nextProfile.area,
      phoneVisibility: nextProfile.phoneVisibility
    }));

    if (firebaseUser) {
      try {
        await saveLearnerProfileInFirestore(firebaseUser.uid, nextProfile);
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to save learner profile.'), 'error');
        return;
      }
    }
    showToast('Learner profile and privacy preferences saved!', 'success');
  };

  // -------------------------------------------------------------
  // Notifications, Reports, Verifications
  // -------------------------------------------------------------

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    if (firebaseUser && !id.startsWith('notif-')) {
      try {
        await markNotificationAsReadInFirestore(id);
      } catch (e) {
        console.warn('Notification read sync skipped:', e);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (firebaseUser) {
      try {
        await markAllNotificationsAsReadInFirestore(firebaseUser.uid);
      } catch (e) {
        console.warn('All notifications read sync skipped:', e);
      }
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markNotificationRead(notif.id);
    if (notif.actionView === 'tuition-detail' && notif.targetId) {
      const post = tuitionPosts.find(p => p.id === notif.targetId);
      if (post) {
        viewTuitionDetail(post);
        return;
      }
    }
    if (notif.actionView === 'tutor-detail' && notif.targetId) {
      const tutor = tutors.find(t => t.id === notif.targetId);
      if (tutor) {
        viewTutorDetail(tutor);
        return;
      }
    }
    setActiveView('dashboard');
  };

  const submitReport = async (report: Omit<ReportItem, 'id' | 'submittedAt' | 'status'>) => {
    const newReport: ReportItem = {
      ...report,
      id: `rep-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0]
    };
    setReports(prev => [newReport, ...prev]);
    if (firebaseUser) {
      try {
        await submitReportInFirestore({ ...report, reportedById: firebaseUser.uid });
      } catch (e) {
        console.warn('submitReportInFirestore warning:', e);
      }
    }
    showToast('Report submitted to FeLoW WebStaR safety team.', 'success');
  };

  const resolveReport = async (id: string) => {
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status: 'resolved' } : r)));
    showToast('Report marked as resolved by administrator.', 'success');
    if (firebaseUser && !id.startsWith('rep-')) {
      try {
        await resolveReportInFirestore(id);
      } catch (e) {
        console.warn('Resolve report sync skipped:', e);
      }
    }
  };

  const approveVerification = async (queueId: string) => {
    const targetItem = verificationQueue.find(item => item.id === queueId);
    setVerificationQueue(prev => prev.map(item => (item.id === queueId ? { ...item, status: 'approved' } : item)));
    if (targetItem) {
      const badgeLabel =
        targetItem.verificationType === 'identity'
          ? 'Identity Verified'
          : targetItem.verificationType === 'institution'
          ? 'University Verified'
          : 'Qualification Verified';
      setTutors(prev =>
        prev.map(t =>
          t.id === targetItem.tutorId || t.uid === targetItem.tutorId
            ? {
                ...t,
                badges: Array.from(new Set([...(t.badges || []), badgeLabel])),
                verification: {
                  ...t.verification,
                  [targetItem.verificationType]: {
                    ...t.verification[targetItem.verificationType],
                    status: 'verified',
                    verifiedAt: new Date().toISOString()
                  }
                }
              }
            : t
        )
      );
    }
    if (firebaseUser && !queueId.startsWith('ver-')) {
      try {
        await updateVerificationInFirestore(queueId, 'approved');
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to approve verification.'), 'error');
        return;
      }
    }
    showToast('Tutor document approved! Verification badge issued to profile.', 'success');
  };

  const rejectVerification = async (queueId: string, reason: string) => {
    const targetItem = verificationQueue.find(item => item.id === queueId);
    setVerificationQueue(prev =>
      prev.map(item => (item.id === queueId ? { ...item, status: 'rejected', rejectionReason: reason } : item))
    );
    if (targetItem) {
      setTutors(prev =>
        prev.map(t =>
          t.id === targetItem.tutorId || t.uid === targetItem.tutorId
            ? {
                ...t,
                verification: {
                  ...t.verification,
                  [targetItem.verificationType]: {
                    ...t.verification[targetItem.verificationType],
                    status: 'unverified'
                  }
                }
              }
            : t
        )
      );
    }
    if (firebaseUser && !queueId.startsWith('ver-')) {
      try {
        await updateVerificationInFirestore(queueId, 'rejected', reason);
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Failed to reject verification.'), 'error');
        return;
      }
    }
    showToast('Document rejected and feedback notification sent to tutor.', 'info');
  };

  const submitNewVerificationDoc = async (
    tutorId: string,
    type: 'identity' | 'institution' | 'qualification',
    docName: string,
    docUrl?: string
  ) => {
    const newItem: VerificationQueueItem = {
      id: `ver-${Date.now()}`,
      tutorId,
      tutorName: currentUser.name,
      university: myTutorProfile?.university || currentUser.university || 'Submitted Institution',
      verificationType: type,
      documentName: docName,
      documentUrl: docUrl,
      submittedAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setVerificationQueue(prev => [newItem, ...prev]);
    setTutors(prev =>
      prev.map(t =>
        t.id === tutorId || t.uid === tutorId
          ? {
              ...t,
              verification: {
                ...t.verification,
                [type]: { ...t.verification[type], status: 'pending' }
              }
            }
          : t
      )
    );

    if (firebaseUser) {
      try {
        await submitVerificationInFirestore({
          tutorId: firebaseUser.uid,
          tutorName: currentUser.name,
          university: myTutorProfile?.university || currentUser.university || 'Submitted Institution',
          verificationType: type,
          documentName: docName,
          documentUrl: docUrl
        });
      } catch (err: any) {
        showToast(extractFriendlyErrorMessage(err, 'Could not submit verification document.'), 'error');
        return;
      }
    }
    showToast('Document submitted for admin verification audit.', 'success');
  };

  // -------------------------------------------------------------
  // Firebase Google-Only Auth Actions
  // -------------------------------------------------------------

  const loginWithGoogleUser = async (
    intendedRole: 'learner' | 'tutor' = 'learner',
    learnerSubtype: 'student' | 'guardian' = 'guardian'
  ) => {
    try {
      const { fbUser, needsTutorOnboarding } = await loginWithGooglePopup(intendedRole, learnerSubtype);
      setIsDemoSession(false);
      const [isUserAdmin, remoteAccount, remoteLearner, remoteTutor, remotePrivateContact] = await Promise.all([
        isAdminUserInFirestore(fbUser.uid, fbUser.email, fbUser.emailVerified),
        fetchUserAccountFromFirestore(fbUser.uid),
        fetchLearnerProfileFromFirestore(fbUser.uid),
        fetchTutorProfileById(fbUser.uid),
        fetchTutorContactDetails(fbUser.uid)
      ]);
      myPrivateContactRef.current = remotePrivateContact;
      if (remoteLearner) setLearnerProfile(remoteLearner);

      const role: UserRole = isUserAdmin
        ? 'admin'
        : intendedRole === 'tutor'
        ? 'tutor'
        : (remoteAccount?.role as UserRole) || intendedRole;

      setCurrentUser(prev => ({
        ...prev,
        id: fbUser.uid,
        name: remoteAccount?.name || fbUser.displayName || 'FeLoW WebStaR User',
        email: fbUser.email || '',
        phone: remotePrivateContact?.whatsappNumber || remoteAccount?.phone || fbUser.phoneNumber || '',
        whatsappNumber:
          remotePrivateContact?.whatsappNumber || remoteAccount?.whatsappNumber || fbUser.phoneNumber || '',
        facebookUrl: remotePrivateContact?.facebookUrl || remoteAccount?.facebookUrl || '',
        role,
        availableRoles: isUserAdmin
          ? ['admin', 'learner', 'tutor']
          : Array.from(new Set([...(remoteAccount?.availableRoles || [role]), role])),
        learnerSubtype: remoteAccount?.learnerSubtype || learnerSubtype,
        avatar: remoteAccount?.avatar || fbUser.photoURL || DEFAULT_PLACEHOLDER_AVATAR,
        division: remoteAccount?.division || 'Dhaka',
        district: remoteAccount?.district || 'Dhaka',
        upazila: remoteAccount?.upazila || '',
        area: remoteAccount?.area || 'Dhanmondi',
        tutorProfileId: fbUser.uid
      }));
      setCurrentRole(role);

      if (role === 'tutor' && (needsTutorOnboarding || !remoteTutor || !remoteTutor.isPublished)) {
        showToast('Signed in with Google! Complete your tutor profile setup to publish.', 'info');
        setActiveView('tutor-onboarding');
      } else {
        showToast('Signed in with Google successfully!', 'success');
        setActiveView(role === 'admin' ? 'admin' : 'dashboard');
      }
    } catch (err: any) {
      showToast(extractFriendlyErrorMessage(err, 'Google Sign-In failed.'), 'error');
      throw err;
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      myPrivateContactRef.current = null;
      setIsDemoSession(false);
      setCurrentUser(PRESET_USERS[0]);
      setCurrentRole('learner');
      setApplications(INITIAL_APPLICATIONS);
      setInvitations(INITIAL_INVITATIONS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setVerificationQueue(INITIAL_VERIFICATION_QUEUE);
      setReports(INITIAL_REPORTS);
      setSavedTutorIds(['tutor-1']);
      setSavedTuitionIds(['post-1']);
      showToast('Signed out of FeLoW WebStaR.', 'info');
      setActiveView('landing');
    } catch (err: any) {
      showToast(err.message || 'Logout failed.', 'error');
    }
  };

  const uploadTutorDoc = async (file: File): Promise<string> => {
    if (!firebaseUser) {
      throw new Error('Please sign in with Google to upload verification documents.');
    }
    try {
      showToast(`Uploading ${file.name} to Cloud Storage...`, 'info');
      const url = await uploadDocumentToStorage(firebaseUser.uid, file);
      if (!url) {
        throw new Error('Document upload did not return a download URL.');
      }
      showToast('Document uploaded!', 'success');
      return url;
    } catch (err: any) {
      showToast(extractFriendlyErrorMessage(err, 'Document upload failed.'), 'error');
      throw err;
    }
  };

  const uploadTutorAvatar = async (file: File): Promise<string> => {
    if (!firebaseUser) {
      // Preview fallback if unauthenticated demo session
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
    }
    try {
      showToast('Uploading profile photo...', 'info');
      const url = await uploadAvatarToStorage(firebaseUser.uid, file);
      showToast('Profile photo uploaded!', 'success');
      return url;
    } catch (err: any) {
      showToast(err?.message || 'Profile photo upload failed.', 'error');
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        currentRole,
        learnerProfile,
        switchUserRole,
        activateDualRole,
        switchUserPersona,
        presetUsers: PRESET_USERS,
        allUsers,
        activeView,
        setActiveView,
        directoryTab,
        setDirectoryTab,
        districtFilter,
        setDistrictFilter,
        mobileDetailOpen,
        setMobileDetailOpen,
        searchQuery,
        setSearchQuery,
        tutors,
        tuitionPosts,
        applications,
        invitations,
        verificationQueue,
        notifications,
        reports,
        isMarketplaceLoading,
        savedTutorIds,
        toggleSaveTutor,
        savedTuitionIds,
        toggleSaveTuition,
        comparisonTutorIds,
        toggleComparisonTutor,
        clearComparison,
        selectedTutor,
        setSelectedTutor,
        viewTutorDetail,
        selectedTuition,
        setSelectedTuition,
        viewTuitionDetail,
        editingTuition,
        setEditingTuition,
        openCreateTuitionModal,
        openEditTuitionModal,
        isPostTuitionOpen,
        setIsPostTuitionOpen,
        isApplyModalOpen,
        setIsApplyModalOpen,
        isComparisonModalOpen,
        setIsComparisonModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        postNewTuition,
        updateTuitionPost,
        updateTuitionPostStatus,
        deleteTuitionPost,
        submitApplication,
        withdrawApplication,
        updateApplicationStatus,
        sendInvitation,
        respondToInvitation,
        updateTutorProfile,
        saveLearnerProfile,
        hasAppliedToPost,
        getUserApplicationForPost,
        canViewTutorWhatsApp,
        canViewLearnerWhatsApp,
        getTutorContactInfo,
        getTuitionPrivateContact,
        markNotificationRead,
        markAllNotificationsRead,
        handleNotificationClick,
        submitReport,
        resolveReport,
        approveVerification,
        rejectVerification,
        submitNewVerificationDoc,
        isFirebaseConnected,
        isAuthReady,
        isAuthenticated,
        isDemoSession,
        firebaseUser,
        needsTutorProfileSetup,
        myTutorProfile,
        loginWithGoogleUser,
        logoutUser,
        uploadTutorDoc,
        uploadTutorAvatar,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
