import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  writeBatch,
  getDocFromServer,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserAccount,
  TutorProfile,
  TutorPrivateContact,
  LearnerProfile,
  TuitionPost,
  TuitionPostStatus,
  Application,
  Invitation,
  NotificationItem,
  ReportItem,
  UserRole,
  ApplicationStatus,
  calculateTutorCompleteness,
  calculateLearnerCompleteness,
  isTutorProfileMandatoryComplete,
  DEFAULT_PLACEHOLDER_AVATAR
} from '../types';
import { getDivisionByDistrict } from '../data/bangladeshData';
import { normalizeBdPhoneForWhatsApp, sanitizeFacebookUrl } from '../utils/contactLinks';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without firestoreDatabaseId passed here */
function initFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      typeof window !== 'undefined'
        ? { experimentalForceLongPolling: true, ignoreUndefinedProperties: true }
        : { ignoreUndefinedProperties: true },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initFirestoreInstance();
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function extractFriendlyErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (!raw) return fallback;
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error) {
        const msg = String(parsed.error);
        if (msg.includes('Missing or insufficient permissions') || msg.includes('PERMISSION_DENIED')) {
          return 'Permission denied by database security rules. Please verify your signed-in account and required fields.';
        }
        return msg;
      }
    } catch {
      // fall through
    }
  }
  if (raw.includes('Missing or insufficient permissions') || raw.includes('PERMISSION_DENIED')) {
    return 'Permission denied by security rules. Please ensure you are signed in with a verified Google account.';
  }
  return raw;
}

export async function isAdminUserInFirestore(
  uid: string,
  email?: string | null,
  emailVerified?: boolean
): Promise<boolean> {
  if (email === 'nihabalmahjabin@gmail.com' && emailVerified === true) {
    return true;
  }
  if (!uid) return false;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export function toIsoDateString(val: unknown, fallback = ''): string {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return fallback;
}

function stripUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('unavailable') || message.includes('offline')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        await getDocFromServer(doc(db, 'test', 'connection'));
        return true;
      } catch {
        console.warn('Firestore operating with offline/local fallback until backend is reachable.');
      }
    }
    return false;
  }
}

// -------------------------------------------------------------
// Authentication & User Record Services (Google-Only Auth)
// -------------------------------------------------------------

export function mapGoogleAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing login. Please try again.';
    case 'auth/popup-blocked':
      return 'Browser blocked the Google sign-in popup. Please allow popups for this site and retry.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in request was superseded by another popup attempt.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email under an earlier sign-in method. Please contact support if migration assistance is needed.';
    case 'auth/network-request-failed':
      return 'Network error during Google authentication. Please check your internet connection.';
    case 'auth/unauthorized-domain':
      return 'This domain is not yet authorized in Firebase Authentication settings.';
    default:
      return error instanceof Error ? error.message : 'Google Sign-In failed. Please try again.';
  }
}

export interface GoogleLoginResult {
  fbUser: FirebaseUser;
  isNewUser: boolean;
  needsTutorOnboarding: boolean;
}

export async function loginWithGooglePopup(
  intendedRole: 'learner' | 'tutor' = 'learner',
  learnerSubtype: 'student' | 'guardian' = 'guardian'
): Promise<GoogleLoginResult> {
  let fbUser: FirebaseUser;
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    fbUser = cred.user;
  } catch (err) {
    throw new Error(mapGoogleAuthError(err));
  }

  const userRef = doc(db, 'users', fbUser.uid);
  const safeRole: 'learner' | 'tutor' = intendedRole === 'tutor' ? 'tutor' : 'learner';
  let isNewUser = false;
  let needsTutorOnboarding = false;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      isNewUser = true;
      await setDoc(userRef, {
        uid: fbUser.uid,
        name: fbUser.displayName || 'FeLoW WebStaR User',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        whatsappNumber: fbUser.phoneNumber || '',
        photoURL: fbUser.photoURL || '',
        activeRole: safeRole,
        availableRoles: [safeRole],
        learnerSubtype,
        division: 'Dhaka',
        district: 'Dhaka',
        area: 'Dhanmondi',
        phoneVisibility: false,
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (safeRole === 'learner') {
        await setDoc(doc(db, 'learnerProfiles', fbUser.uid), {
          uid: fbUser.uid,
          name: fbUser.displayName || 'FeLoW WebStaR User',
          learnerType: learnerSubtype,
          phone: fbUser.phoneNumber || '',
          whatsappNumber: fbUser.phoneNumber || '',
          division: 'Dhaka',
          district: 'Dhaka',
          area: 'Dhanmondi',
          phoneVisibility: false,
          profileCompletion: 60,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        needsTutorOnboarding = true;
      }
    } else {
      // Preserve existing user data (including legacy email/password migrated accounts).
      // Only fill missing Google display name / photoURL if blank.
      const existingData = snap.data();
      const updates: Record<string, any> = {};
      if (!existingData.name && fbUser.displayName) updates.name = fbUser.displayName;
      if (!existingData.photoURL && fbUser.photoURL) updates.photoURL = fbUser.photoURL;

      // Respect user's role selection on sign-in when switching to tutor/learner
      const currentRoles: string[] = Array.isArray(existingData.availableRoles)
        ? existingData.availableRoles.filter((r: string) => r === 'learner' || r === 'tutor')
        : ['learner'];
      if (intendedRole === 'tutor' && existingData.activeRole !== 'tutor') {
        updates.activeRole = 'tutor';
        updates.availableRoles = Array.from(new Set([...currentRoles, 'tutor']));
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        await updateDoc(userRef, updates);
      }

      const activeRole = updates.activeRole || existingData.activeRole || safeRole;
      if (activeRole === 'tutor' || intendedRole === 'tutor') {
        const tutorSnap = await getDoc(doc(db, 'tutorProfiles', fbUser.uid));
        const tutorData = tutorSnap.exists() ? tutorSnap.data() : null;
        if (!tutorData || tutorData.isPublished !== true) {
          needsTutorOnboarding = true;
        }
      }
    }
  } catch (e) {
    console.warn('Could not sync Google user profile to Firestore:', e);
  }

  return { fbUser, isNewUser, needsTutorOnboarding };
}

export async function fetchUserAccountFromFirestore(uid: string): Promise<Partial<UserAccount> | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      whatsappNumber: data.whatsappNumber || data.phone || '',
      facebookUrl: data.facebookUrl || '',
      role: (data.activeRole as UserRole) || 'learner',
      availableRoles: Array.isArray(data.availableRoles) ? data.availableRoles : [(data.activeRole as UserRole) || 'learner'],
      learnerSubtype: data.learnerSubtype || 'guardian',
      avatar: data.photoURL || '',
      division: data.division || 'Dhaka',
      district: data.district || 'Dhaka',
      upazila: data.upazila || '',
      area: data.area || 'Dhanmondi',
      phoneVisibility: data.phoneVisibility ?? false
    };
  } catch (err) {
    console.warn(`fetchUserAccountFromFirestore warning (${path}):`, err);
    return null;
  }
}

export async function updateUserRoleSettingsInFirestore(
  uid: string,
  activeRole: UserRole,
  availableRoles: UserRole[]
): Promise<void> {
  const path = `users/${uid}`;
  const filteredRoles = availableRoles.filter(r => r === 'learner' || r === 'tutor');
  const safeActiveRole = activeRole === 'admin' ? 'learner' : activeRole;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, {
        activeRole: safeActiveRole,
        availableRoles: filteredRoles.length > 0 ? filteredRoles : [safeActiveRole],
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// -------------------------------------------------------------
// Learner & Tutor Profile CRUD
// -------------------------------------------------------------

export async function saveLearnerProfileInFirestore(
  uid: string,
  profile: Partial<LearnerProfile>
): Promise<void> {
  const path = `learnerProfiles/${uid}`;
  const completion = calculateLearnerCompleteness(profile);
  try {
    const lpRef = doc(db, 'learnerProfiles', uid);
    const existingSnap = await getDoc(lpRef);
    const payload = stripUndefined({
      ...profile,
      uid,
      profileCompletion: completion,
      updatedAt: serverTimestamp(),
      ...(existingSnap.exists() ? {} : { createdAt: serverTimestamp() })
    });
    if (existingSnap.exists()) {
      delete payload.uid;
      delete payload.createdAt;
      await updateDoc(lpRef, payload);
    } else {
      await setDoc(lpRef, payload);
    }

    // Sync contact basics on users doc if it exists
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, stripUndefined({
        name: profile.name,
        phone: profile.phone,
        whatsappNumber: profile.whatsappNumber,
        facebookUrl: profile.facebookUrl,
        division: profile.division,
        district: profile.district,
        upazila: profile.upazila,
        area: profile.area,
        learnerSubtype: profile.learnerType,
        phoneVisibility: profile.phoneVisibility,
        updatedAt: serverTimestamp()
      }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchLearnerProfileFromFirestore(uid: string): Promise<LearnerProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'learnerProfiles', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: d.uid || uid,
      name: d.name || '',
      learnerType: d.learnerType || 'guardian',
      phone: d.phone || '',
      whatsappNumber: d.whatsappNumber || d.phone || '',
      facebookUrl: d.facebookUrl || '',
      division: d.division || 'Dhaka',
      district: d.district || 'Dhaka',
      upazila: d.upazila || '',
      area: d.area || '',
      phoneVisibility: d.phoneVisibility ?? false,
      profileCompletion: d.profileCompletion || 50,
      updatedAt: toIsoDateString(d.updatedAt)
    };
  } catch (err) {
    console.warn('fetchLearnerProfileFromFirestore warning:', err);
    return null;
  }
}

const tutorContactCache = new Map<string, { data: TutorPrivateContact | null; fetchedAt: number }>();
const recentContactFetchTimestamps: number[] = [];

export async function fetchTutorContactDetails(tutorId: string): Promise<TutorPrivateContact | null> {
  if (!auth.currentUser || !tutorId) return null;

  const cached = tutorContactCache.get(tutorId);
  if (cached && Date.now() - cached.fetchedAt < 60_000) {
    return cached.data;
  }

  // Client-side anti-scraping rate guard (max 30 unique contact lookups per 60s)
  const now = Date.now();
  while (recentContactFetchTimestamps.length > 0 && now - recentContactFetchTimestamps[0] > 60_000) {
    recentContactFetchTimestamps.shift();
  }
  if (recentContactFetchTimestamps.length >= 30) {
    console.warn('Contact lookup throttled temporarily to protect tutor privacy.');
    return null;
  }
  recentContactFetchTimestamps.push(now);

  try {
    const snap = await getDoc(doc(db, 'tutorProfiles', tutorId, 'private', 'contact'));
    if (!snap.exists()) {
      tutorContactCache.set(tutorId, { data: null, fetchedAt: now });
      return null;
    }
    const d = snap.data();
    const contact: TutorPrivateContact = {
      uid: d.uid || tutorId,
      whatsappNumber: d.whatsappNumber || '',
      normalizedWhatsappNumber: d.normalizedWhatsappNumber || '',
      facebookUrl: d.facebookUrl || '',
      whatsappConsent: Boolean(d.whatsappConsent),
      contactVisibility: d.contactVisibility || 'authenticated',
      updatedAt: toIsoDateString(d.updatedAt)
    };
    tutorContactCache.set(tutorId, { data: contact, fetchedAt: now });
    return contact;
  } catch {
    // Expected when tutor set contactVisibility to 'shortlisted_only' or 'hidden'
    tutorContactCache.set(tutorId, { data: null, fetchedAt: now });
    return null;
  }
}

export async function fetchTutorProfileById(tutorId: string): Promise<TutorProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'tutorProfiles', tutorId));
    if (!snap.exists()) return null;
    return mapTutorProfileDoc(snap);
  } catch (err) {
    console.warn('fetchTutorProfileById warning:', err);
    return null;
  }
}

export async function saveTutorProfileInFirestore(
  tutorId: string,
  updates: Partial<TutorProfile>
): Promise<void> {
  const path = `tutorProfiles/${tutorId}`;
  try {
    const refDoc = doc(db, 'tutorProfiles', tutorId);
    const [existingSnap, existingPrivate] = await Promise.all([
      getDoc(refDoc),
      getDoc(doc(db, 'tutorProfiles', tutorId, 'private', 'contact')).catch(() => null)
    ]);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};
    const prevPrivData = existingPrivate?.exists() ? existingPrivate.data() : {};

    const hasWhatsappUpdate = updates.whatsappNumber !== undefined || updates.phone !== undefined;
    const rawWaInput = updates.whatsappNumber ?? updates.phone;
    const normalizedWa = hasWhatsappUpdate
      ? (rawWaInput ? normalizeBdPhoneForWhatsApp(rawWaInput) || '' : '')
      : undefined;
    const cleanFacebook =
      updates.facebookUrl !== undefined
        ? (updates.facebookUrl ? sanitizeFacebookUrl(updates.facebookUrl) || '' : '')
        : undefined;

    const finalRawWa = hasWhatsappUpdate ? (rawWaInput || '').trim() : prevPrivData.whatsappNumber || '';
    const finalNormWa =
      normalizedWa !== undefined ? normalizedWa : prevPrivData.normalizedWhatsappNumber || '';
    const finalFb = cleanFacebook !== undefined ? cleanFacebook : prevPrivData.facebookUrl || '';

    const whatsappConsent =
      updates.whatsappConsent ?? existingData.whatsappConsent ?? prevPrivData.whatsappConsent ?? false;
    const contactVisibility =
      updates.contactVisibility ??
      existingData.contactVisibility ??
      prevPrivData.contactVisibility ??
      (updates.whatsappPublic === false ? 'shortlisted_only' : 'authenticated');
    const profileVisibility = updates.profileVisibility ?? existingData.profileVisibility ?? 'public';

    const resolvedAcademicYear = updates.academicYear ?? existingData.academicYear ?? '';
    const resolvedSemester =
      updates.semester !== undefined
        ? updates.semester
        : existingData.semester || (resolvedAcademicYear === 'Graduate / Alumni' ? 'Completed' : '');

    const mergedForScore: Partial<TutorProfile> = {
      ...(existingData as Partial<TutorProfile>),
      ...updates,
      semester:
        resolvedAcademicYear === 'Graduate / Alumni' && !resolvedSemester.trim()
          ? 'Completed'
          : resolvedSemester,
      whatsappNumber: finalRawWa,
      normalizedWhatsappNumber: finalNormWa,
      facebookUrl: finalFb,
      whatsappConsent: Boolean(whatsappConsent),
      contactVisibility
    };

    const profileCompletion = calculateTutorCompleteness(mergedForScore);
    const mandatoryComplete = isTutorProfileMandatoryComplete(mergedForScore, true);

    const requestedPublish = updates.isPublished ?? existingData.isPublished ?? false;
    const isPublished = Boolean(requestedPublish && mandatoryComplete);

    // Never allow client code to self-assign verification/rating fields or store raw PII on public tutor doc
    const sanitized: Record<string, any> = { ...updates };
    delete sanitized.id;
    delete sanitized.isSample;
    delete sanitized.reviews;
    delete sanitized.verification;
    delete sanitized.rating;
    delete sanitized.reviewCount;
    delete sanitized.completedTuitionsCount;
    delete sanitized.isFeatured;
    delete sanitized.badges;
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.whatsappNumber;
    delete sanitized.normalizedWhatsappNumber;
    delete sanitized.facebookUrl;
    delete sanitized.createdAt;

    if (updates.avatar || updates.profilePhotoURL) {
      const photo = updates.profilePhotoURL || updates.avatar || '';
      sanitized.avatar = photo;
      sanitized.profilePhotoURL = photo;
    }

    if (mergedForScore.semester) {
      sanitized.semester = mergedForScore.semester;
    }

    sanitized.isPublished = isPublished;
    sanitized.profileVisibility = profileVisibility;
    sanitized.contactVisibility = contactVisibility;
    sanitized.whatsappConsent = Boolean(whatsappConsent);
    sanitized.whatsappPublic = Boolean(whatsappConsent && contactVisibility === 'authenticated');

    if (Array.isArray(sanitized.achievements)) sanitized.achievements = sanitized.achievements.slice(0, 15);
    if (Array.isArray(sanitized.preferredAreas)) sanitized.preferredAreas = sanitized.preferredAreas.slice(0, 20);
    if (Array.isArray(sanitized.mediums)) sanitized.mediums = sanitized.mediums.slice(0, 10);
    if (Array.isArray(sanitized.classes)) sanitized.classes = sanitized.classes.slice(0, 20);
    if (Array.isArray(sanitized.subjects)) sanitized.subjects = sanitized.subjects.slice(0, 30);
    if (Array.isArray(sanitized.tuitionTypes)) sanitized.tuitionTypes = sanitized.tuitionTypes.slice(0, 10);
    if (Array.isArray(sanitized.daysPerWeek)) sanitized.daysPerWeek = sanitized.daysPerWeek.slice(0, 7);

    if (existingSnap.exists()) {
      delete sanitized.uid;
      await updateDoc(refDoc, stripUndefined({
        ...sanitized,
        profileCompletion,
        updatedAt: serverTimestamp()
      }));
    } else {
      await setDoc(refDoc, stripUndefined({
        ...sanitized,
        uid: updates.uid || tutorId,
        profileCompletion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rating: 0,
        reviewCount: 0,
        completedTuitionsCount: 0,
        isFeatured: false,
        badges: [],
        verification: {
          identity: { status: 'unverified' },
          institution: { status: 'unverified' },
          qualification: { status: 'unverified' }
        }
      }));
    }

    // Store WhatsApp & Facebook contact in isolated /tutorProfiles/{uid}/private/contact
    await setDoc(
      doc(db, 'tutorProfiles', tutorId, 'private', 'contact'),
      stripUndefined({
        uid: tutorId,
        whatsappNumber: finalRawWa,
        normalizedWhatsappNumber: finalNormWa,
        facebookUrl: finalFb,
        whatsappConsent: Boolean(whatsappConsent),
        contactVisibility,
        updatedAt: serverTimestamp()
      })
    );
    tutorContactCache.delete(tutorId);

    // Keep private contact info in users/{uid}
    const userRef = doc(db, 'users', tutorId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, stripUndefined({
        name: updates.name,
        photoURL: sanitized.profilePhotoURL,
        whatsappNumber: finalNormWa ? `+${finalNormWa}` : finalRawWa,
        phone: finalNormWa ? `+${finalNormWa}` : finalRawWa,
        facebookUrl: finalFb,
        division: updates.division,
        district: updates.district,
        upazila: updates.upazila,
        updatedAt: serverTimestamp()
      }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchTutorProfilesPage(
  pageSize = 100,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: TutorProfile[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  const path = 'tutorProfiles';
  try {
    const constraints: any[] = [orderBy('updatedAt', 'desc'), limit(pageSize)];
    if (lastDoc) constraints.splice(1, 0, startAfter(lastDoc));
    const q = query(collection(db, path), ...constraints);
    const snap = await getDocs(q);
    const items: TutorProfile[] = snap.docs.map(mapTutorProfileDoc);
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { items, lastVisible };
  } catch (error) {
    console.warn('fetchTutorProfilesPage fallback:', error);
    return { items: [], lastVisible: null };
  }
}

export async function fetchPublicTuitionPostsPage(
  pageSize = 100
): Promise<TuitionPost[]> {
  const path = 'tuitionPosts';
  try {
    const q = query(collection(db, path), limit(pageSize));
    const snap = await getDocs(q);
    return snap.docs.map(mapTuitionPostDoc);
  } catch (error) {
    console.warn('fetchPublicTuitionPostsPage fallback:', error);
    return [];
  }
}

export function mapTutorProfileDoc(
  docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): TutorProfile {
  const d = docSnap.data() || {};
  const photo = d.profilePhotoURL || d.avatar || DEFAULT_PLACEHOLDER_AVATAR;
  const contactVis =
    d.contactVisibility || (d.whatsappPublic === false ? 'shortlisted_only' : 'authenticated');
  return {
    id: docSnap.id,
    uid: d.uid || docSnap.id,
    name: d.name || 'Tutor',
    gender: d.gender || 'Male',
    avatar: photo,
    profilePhotoURL: photo,
    headline: d.headline || '',
    bio: d.bio || '',
    university: d.university || '',
    degree: d.degree || '',
    department: d.department || '',
    academicYear: d.academicYear || '',
    semester: d.semester || '',
    passingYear: d.passingYear || '',
    gpa: d.gpa || '',
    schoolName: d.schoolName || '',
    collegeName: d.collegeName || '',
    sscGpa: d.sscGpa || '',
    hscGpa: d.hscGpa || '',
    achievements: Array.isArray(d.achievements) ? d.achievements : [],
    experienceSummary: d.experienceSummary || '',
    division: d.division || 'Dhaka',
    district: d.district || 'Dhaka',
    upazila: d.upazila || '',
    preferredAreas: Array.isArray(d.preferredAreas) ? d.preferredAreas : [],
    mediums: Array.isArray(d.mediums) ? d.mediums : ['Bangla Medium'],
    classes: Array.isArray(d.classes) ? d.classes : [],
    subjects: Array.isArray(d.subjects) ? d.subjects : [],
    tuitionTypes: Array.isArray(d.tuitionTypes) ? d.tuitionTypes : ['Home Tuition'],
    expectedSalaryMin: Number(d.expectedSalaryMin) || 5000,
    expectedSalaryMax: Number(d.expectedSalaryMax) || 10000,
    daysPerWeek: Array.isArray(d.daysPerWeek) ? d.daysPerWeek : [3],
    experienceYears: Number(d.experienceYears) || 0,
    verification: d.verification || {
      identity: { status: 'unverified' },
      institution: { status: 'unverified' },
      qualification: { status: 'unverified' }
    },
    badges: Array.isArray(d.badges) ? d.badges : [],
    rating: Number(d.rating) || 0,
    reviewCount: Number(d.reviewCount) || 0,
    completedTuitionsCount: Number(d.completedTuitionsCount) || 0,
    isFeatured: Boolean(d.isFeatured),
    phone: '',
    whatsappNumber: '',
    normalizedWhatsappNumber: '',
    whatsappConsent: d.whatsappConsent ?? true,
    whatsappPublic: d.whatsappPublic ?? contactVis === 'authenticated',
    profileVisibility: d.profileVisibility || 'public',
    contactVisibility: contactVis,
    isPublished: d.isPublished ?? true,
    facebookUrl: '',
    email: '',
    availability: d.availability || 'Available Now',
    teachingStyleSummary: d.teachingStyleSummary || '',
    profileCompletion: Number(d.profileCompletion) || calculateTutorCompleteness(d),
    isSample: false,
    reviews: Array.isArray(d.reviews) ? d.reviews : []
  };
}

// -------------------------------------------------------------
// Tuition Posts CRUD
// -------------------------------------------------------------

export async function createTuitionPostInFirestore(
  post: Omit<TuitionPost, 'id' | 'postedDate' | 'status' | 'totalApplicants'>
): Promise<string> {
  const path = 'tuitionPosts';
  try {
    const { whatsappNumber, detailedAddress, isSample: _s, ...publicFields } = post as any;
    const docRef = await addDoc(collection(db, path), stripUndefined({
      ...publicFields,
      subjects: Array.isArray(publicFields.subjects) ? publicFields.subjects.slice(0, 20) : [],
      status: 'open',
      totalApplicants: 0,
      isFeatured: false,
      postedDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));

    // Store private guardian contact details in isolated subcollection
    await setDoc(doc(db, 'tuitionPosts', docRef.id, 'private', 'contact'), {
      learnerId: post.learnerId,
      whatsappNumber: whatsappNumber || '',
      detailedAddress: detailedAddress || '',
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTuitionPostInFirestore(
  postId: string,
  updates: Partial<TuitionPost>
): Promise<void> {
  const path = `tuitionPosts/${postId}`;
  try {
    const clean = stripUndefined({ ...updates });
    const privateWhatsapp = clean.whatsappNumber;
    const privateAddress = clean.detailedAddress;
    delete clean.id;
    delete clean.learnerId;
    delete clean.createdAt;
    delete clean.totalApplicants;
    delete clean.isFeatured;
    delete clean.postedDate;
    delete clean.isSample;
    delete clean.whatsappNumber;
    delete clean.detailedAddress;
    if (Array.isArray(clean.subjects)) clean.subjects = clean.subjects.slice(0, 20);
    clean.updatedAt = serverTimestamp();

    await updateDoc(doc(db, 'tuitionPosts', postId), clean);

    if (privateWhatsapp !== undefined || privateAddress !== undefined) {
      await setDoc(
        doc(db, 'tuitionPosts', postId, 'private', 'contact'),
        stripUndefined({
          learnerId: auth.currentUser?.uid || '',
          whatsappNumber: privateWhatsapp,
          detailedAddress: privateAddress,
          updatedAt: serverTimestamp()
        }),
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTuitionPostStatusInFirestore(
  postId: string,
  status: TuitionPostStatus
): Promise<void> {
  const path = `tuitionPosts/${postId}`;
  try {
    await updateDoc(doc(db, 'tuitionPosts', postId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchTuitionPrivateContact(
  postId: string
): Promise<{ whatsappNumber: string; detailedAddress: string } | null> {
  if (!auth.currentUser || !postId || postId.startsWith('post-')) return null;
  try {
    const snap = await getDoc(doc(db, 'tuitionPosts', postId, 'private', 'contact'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      whatsappNumber: d.whatsappNumber || '',
      detailedAddress: d.detailedAddress || ''
    };
  } catch {
    return null;
  }
}

export async function deleteTuitionPostInFirestore(postId: string): Promise<void> {
  const path = `tuitionPosts/${postId}`;
  try {
    await deleteDoc(doc(db, 'tuitionPosts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function mapTuitionPostDoc(docSnap: QueryDocumentSnapshot<DocumentData>): TuitionPost {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    title: d.title || '',
    learnerId: d.learnerId || '',
    learnerName: d.learnerName || '',
    learnerType: d.learnerType || 'guardian',
    studentGender: d.studentGender || 'Male',
    studentSchoolCollege: d.studentSchoolCollege || '',
    classGrade: d.classGrade || '',
    curriculum: d.curriculum || 'National Curriculum (NCTB)',
    subjects: Array.isArray(d.subjects) ? d.subjects : [],
    medium: d.medium || 'Bangla Medium',
    tuitionType: d.tuitionType || 'Home Tuition',
    division: d.division || 'Dhaka',
    district: d.district || 'Dhaka',
    upazila: d.upazila || d.area || '',
    area: d.area || '',
    detailedAddress: d.detailedAddress || '',
    preferredTutorGender: d.preferredTutorGender || 'Any',
    preferredUniversity: d.preferredUniversity || '',
    preferredQualifications: d.preferredQualifications || '',
    daysPerWeek: Number(d.daysPerWeek) || 3,
    preferredTime: d.preferredTime || '',
    salaryOfferBDT: Number(d.salaryOfferBDT) || 0,
    isNegotiable: d.isNegotiable ?? true,
    startDate: d.startDate || '',
    deadline: d.deadline || '',
    preferredContactMethod: d.preferredContactMethod || 'WhatsApp',
    whatsappNumber: d.whatsappNumber || '',
    specialInstructions: d.specialInstructions || '',
    postedDate: d.postedDate || toIsoDateString(d.createdAt, new Date().toISOString()).split('T')[0],
    createdAt: toIsoDateString(d.createdAt),
    status: d.status || 'open',
    totalApplicants: Number(d.totalApplicants) || 0,
    requirementsDescription: d.requirementsDescription || '',
    isFeatured: Boolean(d.isFeatured),
    isSample: false
  };
}

// -------------------------------------------------------------
// Applications CRUD (Deterministic Duplicate Prevention)
// -------------------------------------------------------------

export function buildApplicationDocId(tuitionPostId: string, tutorId: string): string {
  return `${tuitionPostId}_${tutorId}`;
}

export async function submitApplicationInFirestore(
  appData: Omit<Application, 'id' | 'appliedAt' | 'status'>
): Promise<string> {
  const deterministicId = buildApplicationDocId(appData.tuitionPostId, appData.tutorId);
  const path = `applications/${deterministicId}`;

  try {
    // 1. Verify live post exists and is still open
    const postRef = doc(db, 'tuitionPosts', appData.tuitionPostId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new Error('This is a sample tuition listing. Please apply to a live tuition post.');
    }
    const postData = postSnap.data();
    if (postData.status !== 'open') {
      throw new Error('This tuition post is no longer accepting applications.');
    }
    if (postData.learnerId === appData.tutorId) {
      throw new Error('You cannot apply to your own tuition post.');
    }

    // 2. Prevent duplicate application
    const appRef = doc(db, 'applications', deterministicId);
    const existingApp = await getDoc(appRef);
    if (existingApp.exists()) {
      throw new Error('You have already applied to this tuition opportunity.');
    }

    // 3. Atomically create application & increment applicant counter
    const safeAppPayload = stripUndefined({ ...appData });
    delete (safeAppPayload as any).guardianWhatsApp;
    delete (safeAppPayload as any).isSample;

    const batch = writeBatch(db);
    batch.set(appRef, {
      ...safeAppPayload,
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    batch.update(postRef, {
      totalApplicants: increment(1),
      updatedAt: serverTimestamp()
    });
    await batch.commit();

    // 4. Notify guardian
    if (appData.learnerId) {
      await createNotificationInFirestore({
        userId: appData.learnerId,
        title: 'New Proposal Received',
        message: `${appData.tutorName} applied for "${appData.tuitionTitle}" at ৳${appData.proposedSalaryBDT.toLocaleString()}/mo.`,
        type: 'application',
        actionView: 'dashboard',
        targetId: deterministicId
      });
    }

    return deterministicId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateApplicationStatusInFirestore(
  appId: string,
  status: ApplicationStatus,
  note?: string,
  meta?: {
    tutorId?: string;
    learnerId?: string;
    tutorName?: string;
    tuitionTitle?: string;
    tuitionPostId?: string;
    guardianWhatsApp?: string;
  }
): Promise<void> {
  const path = `applications/${appId}`;
  try {
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: serverTimestamp()
    };
    if (note !== undefined) updatePayload.feedbackNote = note;
    if (status === 'invited') {
      updatePayload.demoDate = new Date(Date.now() + 2 * 86400000).toISOString();
    }
    if (status === 'shortlisted' || status === 'invited' || status === 'accepted') {
      let resolvedGuardianWa = meta?.guardianWhatsApp || '';
      if (!resolvedGuardianWa && meta?.tuitionPostId) {
        const privPost = await fetchTuitionPrivateContact(meta.tuitionPostId);
        resolvedGuardianWa = privPost?.whatsappNumber || '';
      }
      if (resolvedGuardianWa) {
        updatePayload.guardianWhatsApp = resolvedGuardianWa;
      }
    }
    await updateDoc(doc(db, 'applications', appId), updatePayload);

    // Notify counterpart
    if (status === 'withdrawn' && meta?.learnerId) {
      await createNotificationInFirestore({
        userId: meta.learnerId,
        title: 'Application Withdrawn',
        message: `${meta.tutorName || 'A tutor'} withdrew their application for "${meta.tuitionTitle || 'your tuition post'}".`,
        type: 'application',
        actionView: 'dashboard',
        targetId: appId
      });
    } else if (meta?.tutorId && status !== 'withdrawn') {
      const labelMap: Record<ApplicationStatus, string> = {
        pending: 'Pending Review',
        shortlisted: 'Shortlisted',
        invited: 'Invited for Demo',
        accepted: 'Accepted & Selected',
        rejected: 'Declined',
        withdrawn: 'Withdrawn'
      };
      await createNotificationInFirestore({
        userId: meta.tutorId,
        title: `Application ${labelMap[status]}`,
        message: `Your proposal for "${meta.tuitionTitle || 'tuition'}" was marked as ${labelMap[status]}.${note ? ` Note: ${note}` : ''}`,
        type: 'application',
        actionView: 'dashboard',
        targetId: appId
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Direct Invitations CRUD
// -------------------------------------------------------------

export async function sendInvitationInFirestore(
  invitation: Omit<Invitation, 'id' | 'sentAt' | 'status'>
): Promise<string> {
  const path = 'invitations';
  try {
    const docRef = await addDoc(collection(db, path), stripUndefined({
      ...invitation,
      offerBDT: invitation.offerSalaryBDT,
      status: 'pending',
      sentAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));

    await createNotificationInFirestore({
      userId: invitation.tutorId,
      title: 'Direct Tuition Invitation',
      message: `${invitation.learnerName} invited you for ${invitation.classGrade} at ৳${invitation.offerSalaryBDT.toLocaleString()}/mo.`,
      type: 'invitation',
      actionView: 'dashboard',
      targetId: docRef.id
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function respondToInvitationInFirestore(
  invitationId: string,
  status: 'accepted' | 'declined',
  meta?: {
    learnerId?: string;
    tutorName?: string;
    classGrade?: string;
    tutorWhatsApp?: string;
    tutorFacebookUrl?: string;
  }
): Promise<void> {
  const path = `invitations/${invitationId}`;
  try {
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: serverTimestamp()
    };
    if (status === 'accepted') {
      if (meta?.tutorWhatsApp) updatePayload.tutorWhatsApp = meta.tutorWhatsApp;
      if (meta?.tutorFacebookUrl) updatePayload.tutorFacebookUrl = meta.tutorFacebookUrl;
    }
    await updateDoc(doc(db, 'invitations', invitationId), updatePayload);

    if (meta?.learnerId) {
      await createNotificationInFirestore({
        userId: meta.learnerId,
        title: status === 'accepted' ? 'Invitation Accepted!' : 'Invitation Declined',
        message: `${meta.tutorName || 'The tutor'} has ${status} your direct tuition invitation for ${meta.classGrade || 'your student'}.`,
        type: 'invitation',
        actionView: 'dashboard',
        targetId: invitationId
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Saved Tutors & Saved Tuition Opportunities
// -------------------------------------------------------------

export async function toggleTutorFavouriteInFirestore(
  userId: string,
  tutorId: string,
  shouldSave: boolean
): Promise<void> {
  const docId = `${userId}_${tutorId}`;
  const path = `tutorFavourites/${docId}`;
  try {
    if (shouldSave) {
      await setDoc(doc(db, 'tutorFavourites', docId), {
        userId,
        tutorId,
        createdAt: serverTimestamp()
      });
    } else {
      await deleteDoc(doc(db, 'tutorFavourites', docId));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleSavedTuitionInFirestore(
  userId: string,
  tuitionPostId: string,
  shouldSave: boolean
): Promise<void> {
  const docId = `${userId}_${tuitionPostId}`;
  const path = `savedTuitions/${docId}`;
  try {
    if (shouldSave) {
      await setDoc(doc(db, 'savedTuitions', docId), {
        userId,
        tuitionPostId,
        createdAt: serverTimestamp()
      });
    } else {
      await deleteDoc(doc(db, 'savedTuitions', docId));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Notifications
// -------------------------------------------------------------

export async function createNotificationInFirestore(
  notif: Omit<NotificationItem, 'id' | 'time' | 'read' | 'createdAt'> & { userId: string }
): Promise<void> {
  const path = 'notifications';
  try {
    await addDoc(collection(db, path), stripUndefined({
      ...notif,
      title: (notif.title || 'Notification').slice(0, 128),
      message: (notif.message || '').slice(0, 512),
      senderId: auth.currentUser?.uid || notif.userId,
      time: 'Just now',
      read: false,
      createdAt: serverTimestamp()
    }));
  } catch (err) {
    console.warn('Non-blocking notification creation skipped:', err);
  }
}

export async function markNotificationAsReadInFirestore(id: string): Promise<void> {
  const path = `notifications/${id}`;
  try {
    await updateDoc(doc(db, 'notifications', id), {
      read: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsAsReadInFirestore(userId: string): Promise<void> {
  const path = 'notifications';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(d => updateDoc(doc(db, path, d.id), { read: true }));
    await Promise.all(updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Verifications, Reports & Storage
// -------------------------------------------------------------

export async function submitVerificationInFirestore(req: {
  tutorId: string;
  tutorName: string;
  university: string;
  verificationType: 'identity' | 'institution' | 'qualification';
  documentName: string;
  documentUrl?: string;
}): Promise<string> {
  const path = 'verificationRequests';
  try {
    const docRef = await addDoc(collection(db, path), stripUndefined({
      ...req,
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVerificationInFirestore(
  id: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<{ tutorId: string; verificationType: 'identity' | 'institution' | 'qualification' } | null> {
  const path = `verificationRequests/${id}`;
  try {
    const reqRef = doc(db, 'verificationRequests', id);
    const reqSnap = await getDoc(reqRef);
    const reqData = reqSnap.exists() ? reqSnap.data() : null;

    await updateDoc(reqRef, {
      status,
      rejectionReason: status === 'rejected' ? reason || 'Document unclear or invalid.' : '',
      updatedAt: serverTimestamp()
    });

    if (reqData?.tutorId && reqData?.verificationType) {
      const tutorId = String(reqData.tutorId);
      const verificationType = reqData.verificationType as 'identity' | 'institution' | 'qualification';
      const tutorRef = doc(db, 'tutorProfiles', tutorId);
      const tutorSnap = await getDoc(tutorRef);

      if (tutorSnap.exists()) {
        const tData = tutorSnap.data();
        const prevVerification = tData.verification || {
          identity: { status: 'unverified' },
          institution: { status: 'unverified' },
          qualification: { status: 'unverified' }
        };
        const badgeLabelMap: Record<'identity' | 'institution' | 'qualification', string> = {
          identity: 'Identity Verified',
          institution: 'University Verified',
          qualification: 'Qualification Verified'
        };
        const badgeLabel = badgeLabelMap[verificationType];
        const prevBadges: string[] = Array.isArray(tData.badges) ? tData.badges : [];
        const nextBadges =
          status === 'approved'
            ? Array.from(new Set([...prevBadges, badgeLabel])).slice(0, 15)
            : prevBadges.filter(b => b !== badgeLabel);

        await updateDoc(tutorRef, {
          verification: {
            ...prevVerification,
            [verificationType]: {
              ...(prevVerification[verificationType] || {}),
              status: status === 'approved' ? 'verified' : 'unverified',
              ...(status === 'approved' ? { verifiedAt: new Date().toISOString() } : {})
            }
          },
          badges: nextBadges,
          updatedAt: serverTimestamp()
        });
      }

      await createNotificationInFirestore({
        userId: tutorId,
        title: status === 'approved' ? 'Verification Approved' : 'Verification Update',
        message:
          status === 'approved'
            ? `Your ${verificationType} document (${reqData.documentName || 'document'}) has been verified and a badge was added to your profile.`
            : `Your ${verificationType} verification was declined.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'verification',
        actionView: 'dashboard',
        targetId: id
      });

      return { tutorId, verificationType };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitReportInFirestore(
  report: Omit<ReportItem, 'id' | 'submittedAt' | 'status'>
): Promise<string> {
  const path = 'reports';
  try {
    const docRef = await addDoc(collection(db, path), stripUndefined({
      ...report,
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveReportInFirestore(id: string): Promise<void> {
  const path = `reports/${id}`;
  try {
    await updateDoc(doc(db, 'reports', id), {
      status: 'resolved',
      updatedAt: serverTimestamp(),
      resolvedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTutorProfileInFirestore(
  tutorId: string,
  updates: Partial<TutorProfile>
): Promise<void> {
  return saveTutorProfileInFirestore(tutorId, updates);
}

export async function uploadDocumentToStorage(tutorId: string, file: File): Promise<string> {
  const isAllowedMime =
    file.type.startsWith('image/') || file.type === 'application/pdf';
  if (!isAllowedMime) {
    throw new Error('Please upload an image (JPG, PNG, WebP) or PDF document.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Verification document must be smaller than 10 MB.');
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
  const fileRef = ref(storage, `verifications/${tutorId}/${Date.now()}_${safeName}`);
  const uploadResult = await uploadBytes(fileRef, file, { contentType: file.type });
  return await getDownloadURL(uploadResult.ref);
}

export async function uploadAvatarToStorage(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file (JPG, PNG, or WebP).');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Profile photo must be smaller than 5 MB.');
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
  const fileRef = ref(storage, `avatars/${userId}/${Date.now()}_${safeName}`);
  const uploadResult = await uploadBytes(fileRef, file, { contentType: file.type });
  return await getDownloadURL(uploadResult.ref);
}
