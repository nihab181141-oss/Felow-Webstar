import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  reauthenticateWithPopup,
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
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserAccount,
  TutorProfile,
  TutorPrivateContact,
  Review,
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
  isPlaceholderAvatar,
  DEFAULT_PLACEHOLDER_AVATAR
} from '../types';
import { getDivisionByDistrict } from '../data/bangladeshData';
import { normalizeBdPhoneForWhatsApp, sanitizeFacebookUrl } from '../utils/contactLinks';
import { prepareAvatarImageFile, prepareDocumentFileForUpload } from '../utils/imageUpload';

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
  const safeDisplayName = (fbUser.displayName || 'FeLoW WebStaR User').trim().slice(0, 128) || 'FeLoW WebStaR User';
  const safeEmail = (fbUser.email || '').trim().slice(0, 128);
  const safePhone = (fbUser.phoneNumber || '').trim().slice(0, 32);
  const safePhotoUrl = (fbUser.photoURL || '').trim().slice(0, 512);
  let isNewUser = false;
  let needsTutorOnboarding = false;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      isNewUser = true;
      await setDoc(userRef, {
        uid: fbUser.uid,
        name: safeDisplayName,
        email: safeEmail,
        phone: safePhone,
        whatsappNumber: safePhone,
        photoURL: safePhotoUrl,
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
          name: safeDisplayName,
          learnerType: learnerSubtype,
          phone: safePhone,
          whatsappNumber: safePhone,
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

      if (fbUser.email !== 'nihabalmahjabin@gmail.com') {
        const roleLabel =
          safeRole === 'tutor' ? 'Tutor' : learnerSubtype === 'student' ? 'Student' : 'Guardian';
        await notifyAdminsInFirestore({
          title: `New ${roleLabel} Signed Up`,
          message: `${safeDisplayName} (${safeEmail || 'Google account'}) created a ${roleLabel} account.`,
          type: 'system',
          actionView: 'user-profile',
          targetId: fbUser.uid
        }).catch(() => undefined);
      }
    } else {
      // Keep Tutor and Student/Guardian sessions strictly separated by the chosen login portal,
      // even when signing in with the same Google email.
      const existingData = snap.data();
      const updates: Record<string, any> = {};
      if (!existingData.name && safeDisplayName) updates.name = safeDisplayName;
      if (!existingData.photoURL && safePhotoUrl) updates.photoURL = safePhotoUrl;

      const currentRoles: string[] = Array.isArray(existingData.availableRoles)
        ? existingData.availableRoles.filter((r: string) => r === 'learner' || r === 'tutor')
        : ['learner'];

      if (existingData.activeRole !== safeRole) {
        updates.activeRole = safeRole;
      }
      if (!currentRoles.includes(safeRole)) {
        updates.availableRoles = Array.from(new Set([...currentRoles, safeRole]));
      }
      if (safeRole === 'learner' && existingData.learnerSubtype !== learnerSubtype) {
        updates.learnerSubtype = learnerSubtype;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        await updateDoc(userRef, updates);
      }

      if (safeRole === 'learner') {
        const learnerSnap = await getDoc(doc(db, 'learnerProfiles', fbUser.uid));
        if (!learnerSnap.exists()) {
          await setDoc(doc(db, 'learnerProfiles', fbUser.uid), {
            uid: fbUser.uid,
            name: existingData.name || safeDisplayName,
            learnerType: learnerSubtype,
            phone: existingData.phone || safePhone,
            whatsappNumber: existingData.whatsappNumber || safePhone,
            division: existingData.division || 'Dhaka',
            district: existingData.district || 'Dhaka',
            area: existingData.area || 'Dhanmondi',
            phoneVisibility: existingData.phoneVisibility ?? false,
            profileCompletion: 60,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } else {
        const tutorSnap = await getDoc(doc(db, 'tutorProfiles', fbUser.uid));
        const tutorData = tutorSnap.exists() ? tutorSnap.data() : null;
        if (!tutorData || tutorData.isPublished !== true) {
          needsTutorOnboarding = true;
        }
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${fbUser.uid}`);
  }

  return { fbUser, isNewUser, needsTutorOnboarding };
}

export function mapUserAccountDoc(
  docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): UserAccount {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    whatsappNumber: data.whatsappNumber || data.phone || '',
    facebookUrl: data.facebookUrl || '',
    role: (data.activeRole as UserRole) || 'learner',
    availableRoles: Array.isArray(data.availableRoles)
      ? data.availableRoles
      : [(data.activeRole as UserRole) || 'learner'],
    learnerSubtype: data.learnerSubtype || 'guardian',
    avatar: data.photoURL || '',
    division: data.division || 'Dhaka',
    district: data.district || 'Dhaka',
    upazila: data.upazila || '',
    area: data.area || 'Dhanmondi',
    phoneVisibility: data.phoneVisibility ?? false,
    createdAt: toIsoDateString(data.createdAt),
    updatedAt: toIsoDateString(data.updatedAt)
  };
}

export async function fetchUserAccountFromFirestore(uid: string): Promise<Partial<UserAccount> | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return mapUserAccountDoc(snap);
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
  const safeActiveRole: 'learner' | 'tutor' = activeRole === 'tutor' ? 'tutor' : 'learner';
  const finalRoles = filteredRoles.length > 0 ? filteredRoles : [safeActiveRole];
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, {
        activeRole: safeActiveRole,
        availableRoles: finalRoles,
        updatedAt: serverTimestamp()
      });
    } else if (auth.currentUser && auth.currentUser.uid === uid) {
      await setDoc(userRef, {
        uid,
        name: (auth.currentUser.displayName || 'FeLoW WebStaR User').trim().slice(0, 128),
        email: (auth.currentUser.email || '').trim().slice(0, 128),
        phone: (auth.currentUser.phoneNumber || '').trim().slice(0, 32),
        whatsappNumber: (auth.currentUser.phoneNumber || '').trim().slice(0, 32),
        photoURL: (auth.currentUser.photoURL || '').trim().slice(0, 512),
        activeRole: safeActiveRole,
        availableRoles: finalRoles,
        learnerSubtype: 'guardian',
        division: 'Dhaka',
        district: 'Dhaka',
        area: 'Dhanmondi',
        phoneVisibility: false,
        accountStatus: 'active',
        createdAt: serverTimestamp(),
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
  const cleanName = profile.name !== undefined ? profile.name.trim().slice(0, 128) : undefined;
  const cleanPhone = profile.phone !== undefined ? profile.phone.trim().slice(0, 32) : undefined;
  const cleanWa = profile.whatsappNumber !== undefined ? profile.whatsappNumber.trim().slice(0, 32) : undefined;
  const cleanFb =
    profile.facebookUrl !== undefined
      ? (profile.facebookUrl.trim() ? sanitizeFacebookUrl(profile.facebookUrl) || '' : '').slice(0, 512)
      : undefined;
  const cleanArea = profile.area !== undefined ? profile.area.trim().slice(0, 128) : undefined;
  const cleanDistrict = profile.district !== undefined ? profile.district.trim().slice(0, 64) : undefined;
  const cleanDivision = profile.division !== undefined ? profile.division.trim().slice(0, 64) : undefined;
  const cleanUpazila = profile.upazila !== undefined ? profile.upazila.trim().slice(0, 64) : undefined;

  const sanitizedInput: Partial<LearnerProfile> = {
    learnerType: profile.learnerType,
    name: cleanName,
    phone: cleanPhone,
    whatsappNumber: cleanWa,
    facebookUrl: cleanFb,
    division: cleanDivision,
    district: cleanDistrict,
    upazila: cleanUpazila,
    area: cleanArea,
    phoneVisibility: profile.phoneVisibility
  };

  const completion = calculateLearnerCompleteness(sanitizedInput);
  try {
    const lpRef = doc(db, 'learnerProfiles', uid);
    const existingSnap = await getDoc(lpRef);
    const payload = stripUndefined({
      ...sanitizedInput,
      uid,
      learnerType: sanitizedInput.learnerType || existingSnap.data()?.learnerType || 'guardian',
      district: sanitizedInput.district || existingSnap.data()?.district || 'Dhaka',
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
      if (auth.currentUser?.email !== 'nihabalmahjabin@gmail.com') {
        const roleLabel = sanitizedInput.learnerType === 'student' ? 'Student' : 'Guardian';
        await notifyAdminsInFirestore({
          title: `New ${roleLabel} Profile Created`,
          message: `${cleanName || auth.currentUser?.displayName || 'A user'} created a ${roleLabel} profile in ${cleanDistrict || 'Bangladesh'}.`,
          type: 'system',
          actionView: 'user-profile',
          targetId: uid
        });
      }
    }

    // Sync contact basics on users doc if it exists
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, stripUndefined({
        name: cleanName,
        phone: cleanPhone,
        whatsappNumber: cleanWa,
        facebookUrl: cleanFb,
        division: cleanDivision,
        district: cleanDistrict,
        upazila: cleanUpazila,
        area: cleanArea,
        learnerSubtype: sanitizedInput.learnerType,
        phoneVisibility: sanitizedInput.phoneVisibility,
        updatedAt: serverTimestamp()
      }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function mapLearnerProfileDoc(
  docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): LearnerProfile {
  const d = docSnap.data() || {};
  return {
    uid: d.uid || docSnap.id,
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
}

export async function fetchLearnerProfileFromFirestore(uid: string): Promise<LearnerProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'learnerProfiles', uid));
    if (!snap.exists()) return null;
    return mapLearnerProfileDoc(snap);
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

    const wasPublishedBefore = Boolean(existingSnap.exists() && existingData.isPublished === true);
    const requestedPublish = updates.isPublished ?? existingData.isPublished ?? false;
    const isPublished = Boolean(requestedPublish && mandatoryComplete);

    // Never allow client code to self-assign verification/rating fields or store raw PII on public tutor doc
    const sanitized: Record<string, any> = { ...updates };
    delete sanitized.id;
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

    if (updates.avatar !== undefined || updates.profilePhotoURL !== undefined) {
      const candidatePhoto = (updates.profilePhotoURL || updates.avatar || '').trim();
      if (candidatePhoto && !isPlaceholderAvatar(candidatePhoto)) {
        const cleanPhoto = candidatePhoto.slice(0, 512);
        sanitized.avatar = cleanPhoto;
        sanitized.profilePhotoURL = cleanPhoto;
      } else {
        delete sanitized.avatar;
        delete sanitized.profilePhotoURL;
      }
    }

    if (typeof sanitized.name === 'string') sanitized.name = sanitized.name.trim().slice(0, 128);
    if (typeof sanitized.headline === 'string') sanitized.headline = sanitized.headline.trim().slice(0, 256);
    if (typeof sanitized.bio === 'string') sanitized.bio = sanitized.bio.trim().slice(0, 2048);
    if (typeof sanitized.experienceSummary === 'string') sanitized.experienceSummary = sanitized.experienceSummary.trim().slice(0, 1024);
    if (typeof sanitized.university === 'string') sanitized.university = sanitized.university.trim().slice(0, 256);
    if (typeof sanitized.degree === 'string') sanitized.degree = sanitized.degree.trim().slice(0, 128);
    if (typeof sanitized.department === 'string') sanitized.department = sanitized.department.trim().slice(0, 128);
    if (typeof sanitized.academicYear === 'string') sanitized.academicYear = sanitized.academicYear.trim().slice(0, 64);
    if (typeof sanitized.passingYear === 'string') sanitized.passingYear = sanitized.passingYear.trim().slice(0, 16);
    if (typeof sanitized.gpa === 'string') sanitized.gpa = sanitized.gpa.trim().slice(0, 32);
    if (typeof sanitized.schoolName === 'string') sanitized.schoolName = sanitized.schoolName.trim().slice(0, 256);
    if (typeof sanitized.collegeName === 'string') sanitized.collegeName = sanitized.collegeName.trim().slice(0, 256);
    if (typeof sanitized.sscGpa === 'string') sanitized.sscGpa = sanitized.sscGpa.trim().slice(0, 32);
    if (typeof sanitized.hscGpa === 'string') sanitized.hscGpa = sanitized.hscGpa.trim().slice(0, 32);
    if (typeof sanitized.division === 'string') sanitized.division = sanitized.division.trim().slice(0, 64);
    if (typeof sanitized.district === 'string') sanitized.district = sanitized.district.trim().slice(0, 64);
    if (typeof sanitized.upazila === 'string') sanitized.upazila = sanitized.upazila.trim().slice(0, 64);
    if (typeof sanitized.teachingStyleSummary === 'string') sanitized.teachingStyleSummary = sanitized.teachingStyleSummary.trim().slice(0, 1024);

    if (mergedForScore.semester) {
      sanitized.semester = String(mergedForScore.semester).trim().slice(0, 64);
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
        name: sanitized.name || (auth.currentUser?.displayName || 'Tutor').slice(0, 128),
        university: sanitized.university ?? '',
        department: sanitized.department ?? '',
        district: sanitized.district || 'Dhaka',
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
    const safeRawWa = (finalRawWa || '').slice(0, 32);
    const safeNormWa = (finalNormWa || '').slice(0, 20);
    const safeFb = (finalFb || '').slice(0, 512);
    await setDoc(
      doc(db, 'tutorProfiles', tutorId, 'private', 'contact'),
      stripUndefined({
        uid: tutorId,
        whatsappNumber: safeRawWa,
        normalizedWhatsappNumber: safeNormWa,
        facebookUrl: safeFb,
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
      const formattedPhone = (finalNormWa ? `+${finalNormWa}` : finalRawWa).slice(0, 32);
      await updateDoc(userRef, stripUndefined({
        name: sanitized.name,
        photoURL: sanitized.profilePhotoURL,
        whatsappNumber: formattedPhone,
        phone: formattedPhone,
        facebookUrl: safeFb,
        division: sanitized.division,
        district: sanitized.district,
        upazila: sanitized.upazila,
        updatedAt: serverTimestamp()
      }));
    }

    if (!wasPublishedBefore && isPublished) {
      await notifyAdminsInFirestore({
        title: 'New Tutor Profile Published',
        message: `${updates.name || existingData.name || 'A tutor'} (${updates.university || existingData.university || 'University Tutor'}) published a tutor profile in ${updates.district || existingData.district || 'Bangladesh'}.`,
        type: 'system',
        actionView: 'tutor-detail',
        targetId: tutorId
      });
    } else if (!existingSnap.exists() && auth.currentUser?.email !== 'nihabalmahjabin@gmail.com') {
      await notifyAdminsInFirestore({
        title: 'New Tutor Profile Started',
        message: `${updates.name || auth.currentUser?.displayName || 'A tutor'} started creating a tutor profile.`,
        type: 'system',
        actionView: 'user-profile',
        targetId: tutorId
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchTutorProfilesPage(
  pageSize = 1000,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: TutorProfile[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  const path = 'tutorProfiles';
  try {
    const constraints: any[] = [where('isPublished', '==', true), limit(pageSize)];
    if (lastDoc) constraints.push(startAfter(lastDoc));
    const q = query(collection(db, path), ...constraints);
    const snap = await getDocs(q);
    const itemsWithTs = snap.docs
      .map(docSnap => {
        const raw = docSnap.data() || {};
        const tsMs = Date.parse(toIsoDateString(raw.updatedAt || raw.createdAt)) || 0;
        return { tutor: mapTutorProfileDoc(docSnap), tsMs };
      })
      .filter(({ tutor }) => tutor.profileVisibility !== 'hidden')
      .sort((a, b) => b.tsMs - a.tsMs);
    const items = itemsWithTs.map(entry => entry.tutor);
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { items, lastVisible };
  } catch (error) {
    console.warn('fetchTutorProfilesPage fallback:', error);
    return { items: [], lastVisible: null };
  }
}

export async function fetchPublicTuitionPostsPage(
  pageSize = 500
): Promise<TuitionPost[]> {
  const path = 'tuitionPosts';
  try {
    const q = query(collection(db, path), where('status', '==', 'open'), limit(pageSize));
    const snap = await getDocs(q);
    return snap.docs
      .map(mapTuitionPostDoc)
      .sort((a, b) => {
        const tb = Date.parse(b.createdAt || b.postedDate || '') || 0;
        const ta = Date.parse(a.createdAt || a.postedDate || '') || 0;
        return tb - ta;
      });
  } catch (error) {
    console.warn('fetchPublicTuitionPostsPage fallback:', error);
    return [];
  }
}

export async function fetchTuitionPostById(postId: string): Promise<TuitionPost | null> {
  if (!postId) return null;
  try {
    const snap = await getDoc(doc(db, 'tuitionPosts', postId));
    if (!snap.exists()) return null;
    return mapTuitionPostDoc(snap);
  } catch (error) {
    console.warn('fetchTuitionPostById warning:', error);
    return null;
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
    reviews: Array.isArray(d.reviews) ? d.reviews : [],
    createdAt: toIsoDateString(d.createdAt),
    updatedAt: toIsoDateString(d.updatedAt)
  };
}

// -------------------------------------------------------------
// Tutor Reviews & Ratings Subcollection
// -------------------------------------------------------------

function mapTutorReviewDoc(
  tutorId: string,
  docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): Review {
  const d = docSnap.data() || {};
  return {
    id: docSnap.id,
    tutorId: d.tutorId || tutorId,
    learnerId: d.learnerId || docSnap.id,
    learnerName: d.learnerName || 'Verified Student',
    learnerRole: d.learnerRole || 'Student',
    learnerAvatar: d.learnerAvatar || '',
    rating: Number(d.rating) || 5,
    comment: d.comment || '',
    date: d.date || toIsoDateString(d.updatedAt || d.createdAt, new Date().toISOString()).split('T')[0],
    subjects: Array.isArray(d.subjects) ? d.subjects : [],
    classGrade: d.classGrade || '',
    createdAt: toIsoDateString(d.createdAt),
    updatedAt: toIsoDateString(d.updatedAt)
  };
}

export async function fetchTutorReviewsFromFirestore(tutorId: string): Promise<Review[]> {
  if (!tutorId) return [];
  const path = `tutorProfiles/${tutorId}/reviews`;
  try {
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => mapTutorReviewDoc(tutorId, d));
  } catch (error) {
    console.warn('fetchTutorReviewsFromFirestore fallback:', error);
    return [];
  }
}

export async function submitTutorReviewInFirestore(
  tutorId: string,
  review: Omit<Review, 'id' | 'date' | 'tutorId' | 'createdAt' | 'updatedAt'>
): Promise<{ reviews: Review[]; rating: number; reviewCount: number }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in with Google to submit a review.');
  }
  const reviewerId = user.uid;
  if (reviewerId === tutorId) {
    throw new Error('You cannot review your own tutor profile.');
  }

  const ratingInt = Math.round(Number(review.rating));
  if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    throw new Error('Please choose a star rating between 1 and 5.');
  }
  const trimmedComment = (review.comment || '').trim().slice(0, 1000);
  if (trimmedComment.length < 10) {
    throw new Error('Please write at least 10 characters of helpful feedback.');
  }

  const cleanSubjects = Array.isArray(review.subjects)
    ? review.subjects.map(s => String(s).trim()).filter(Boolean).slice(0, 10)
    : [];
  const cleanClassGrade = (review.classGrade || '').trim().slice(0, 64);
  const cleanLearnerName = (review.learnerName || user.displayName || 'Student').trim().slice(0, 128) || 'Student';
  const cleanLearnerRole = (review.learnerRole || 'Student / Guardian').trim().slice(0, 64) || 'Student / Guardian';
  const cleanLearnerAvatar = (review.learnerAvatar || user.photoURL || '').trim().slice(0, 512);
  const todayStr = new Date().toISOString().split('T')[0];

  const path = `tutorProfiles/${tutorId}/reviews/${reviewerId}`;
  try {
    const tutorRef = doc(db, 'tutorProfiles', tutorId);
    const reviewRef = doc(db, 'tutorProfiles', tutorId, 'reviews', reviewerId);

    const [tutorSnap, existingReviewSnap, allReviewsSnap] = await Promise.all([
      getDoc(tutorRef),
      getDoc(reviewRef),
      getDocs(query(collection(db, 'tutorProfiles', tutorId, 'reviews'), limit(500)))
    ]);

    const reviewMap = new Map<string, Review>();
    allReviewsSnap.docs.forEach(d => {
      reviewMap.set(d.id, mapTutorReviewDoc(tutorId, d));
    });

    const nowIso = new Date().toISOString();
    const isEditing = existingReviewSnap.exists();
    const optimisticReview: Review = {
      id: reviewerId,
      tutorId,
      learnerId: reviewerId,
      learnerName: cleanLearnerName,
      learnerRole: cleanLearnerRole,
      learnerAvatar: cleanLearnerAvatar,
      rating: ratingInt,
      comment: trimmedComment,
      date: todayStr,
      subjects: cleanSubjects,
      classGrade: cleanClassGrade,
      createdAt: isEditing ? toIsoDateString(existingReviewSnap.data()?.createdAt, nowIso) : nowIso,
      updatedAt: nowIso
    };
    reviewMap.set(reviewerId, optimisticReview);

    const reviewsList = Array.from(reviewMap.values()).sort((a, b) => {
      const ta = Date.parse(a.updatedAt || a.date || '') || 0;
      const tb = Date.parse(b.updatedAt || b.date || '') || 0;
      return tb - ta;
    });

    const reviewCount = reviewsList.length;
    const totalStars = reviewsList.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const rating = reviewCount > 0 ? Number((totalStars / reviewCount).toFixed(2)) : 0;

    const batch = writeBatch(db);
    const payload = stripUndefined({
      tutorId,
      learnerId: reviewerId,
      learnerName: cleanLearnerName,
      learnerRole: cleanLearnerRole,
      ...(cleanLearnerAvatar ? { learnerAvatar: cleanLearnerAvatar } : {}),
      rating: ratingInt,
      comment: trimmedComment,
      date: todayStr,
      classGrade: cleanClassGrade,
      subjects: cleanSubjects,
      updatedAt: serverTimestamp()
    });

    if (isEditing) {
      batch.update(reviewRef, payload);
    } else {
      batch.set(reviewRef, {
        ...payload,
        createdAt: serverTimestamp()
      });
    }

    if (tutorSnap.exists()) {
      batch.update(tutorRef, {
        rating,
        reviewCount,
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();

    if (!isEditing) {
      await createNotificationInFirestore({
        userId: tutorId,
        title: 'New Student Review',
        message: `${cleanLearnerName} left a ${ratingInt}-star review on your tutor profile.`,
        type: 'system',
        actionView: 'tutor-detail',
        targetId: tutorId
      });
    }

    return { reviews: reviewsList, rating, reviewCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTutorReviewInFirestore(
  tutorId: string,
  reviewerId: string
): Promise<{ reviews: Review[]; rating: number; reviewCount: number }> {
  const path = `tutorProfiles/${tutorId}/reviews/${reviewerId}`;
  try {
    const tutorRef = doc(db, 'tutorProfiles', tutorId);
    const reviewRef = doc(db, 'tutorProfiles', tutorId, 'reviews', reviewerId);
    const [tutorSnap, existingReviewSnap, allReviewsSnap] = await Promise.all([
      getDoc(tutorRef),
      getDoc(reviewRef),
      getDocs(query(collection(db, 'tutorProfiles', tutorId, 'reviews'), limit(500)))
    ]);

    const reviewMap = new Map<string, Review>();
    allReviewsSnap.docs.forEach(d => {
      if (d.id !== reviewerId) {
        reviewMap.set(d.id, mapTutorReviewDoc(tutorId, d));
      }
    });

    const reviewsList = Array.from(reviewMap.values()).sort((a, b) => {
      const ta = Date.parse(a.updatedAt || a.date || '') || 0;
      const tb = Date.parse(b.updatedAt || b.date || '') || 0;
      return tb - ta;
    });
    const reviewCount = reviewsList.length;
    const totalStars = reviewsList.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const rating = reviewCount > 0 ? Number((totalStars / reviewCount).toFixed(2)) : 0;

    const batch = writeBatch(db);
    if (existingReviewSnap.exists()) {
      batch.delete(reviewRef);
    }
    if (tutorSnap.exists()) {
      batch.update(tutorRef, {
        rating,
        reviewCount,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
    return { reviews: reviewsList, rating, reviewCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Tuition Posts CRUD
// -------------------------------------------------------------

export async function createTuitionPostInFirestore(
  post: Omit<TuitionPost, 'id' | 'postedDate' | 'status' | 'totalApplicants'>
): Promise<string> {
  const path = 'tuitionPosts';
  try {
    const { whatsappNumber, detailedAddress, ...publicFields } = post as any;
    const cleanPublic = stripUndefined({
      ...publicFields,
      title: String(publicFields.title || 'Tuition Needed').trim().slice(0, 256),
      learnerName: publicFields.learnerName ? String(publicFields.learnerName).trim().slice(0, 128) : undefined,
      classGrade: String(publicFields.classGrade || '').trim().slice(0, 64),
      medium: String(publicFields.medium || 'Bangla Medium').trim().slice(0, 64),
      division: publicFields.division ? String(publicFields.division).trim().slice(0, 64) : undefined,
      district: String(publicFields.district || 'Dhaka').trim().slice(0, 64),
      upazila: publicFields.upazila ? String(publicFields.upazila).trim().slice(0, 64) : undefined,
      area: publicFields.area ? String(publicFields.area).trim().slice(0, 128) : undefined,
      requirementsDescription: publicFields.requirementsDescription
        ? String(publicFields.requirementsDescription).trim().slice(0, 2048)
        : undefined,
      subjects: Array.isArray(publicFields.subjects) ? publicFields.subjects.slice(0, 20) : [],
      status: 'open',
      totalApplicants: 0,
      isFeatured: false,
      postedDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    const docRef = await addDoc(collection(db, path), cleanPublic);

    // Store private guardian contact details in isolated subcollection
    await setDoc(doc(db, 'tuitionPosts', docRef.id, 'private', 'contact'), {
      learnerId: post.learnerId,
      whatsappNumber: String(whatsappNumber || '').trim().slice(0, 32),
      detailedAddress: String(detailedAddress || '').trim().slice(0, 256),
      updatedAt: serverTimestamp()
    });

    await notifyAdminsInFirestore({
      title: 'New Tuition Post',
      message: `${post.learnerName || 'A user'} posted "${cleanPublic.title}" in ${cleanPublic.area ? `${cleanPublic.area}, ` : ''}${cleanPublic.district} (৳${Number(post.salaryOfferBDT || 0).toLocaleString()}/mo).`,
      type: 'tuition',
      actionView: 'tuition-detail',
      targetId: docRef.id
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
    delete clean.whatsappNumber;
    delete clean.detailedAddress;
    if (typeof clean.title === 'string') clean.title = clean.title.trim().slice(0, 256);
    if (typeof clean.learnerName === 'string') clean.learnerName = clean.learnerName.trim().slice(0, 128);
    if (typeof clean.classGrade === 'string') clean.classGrade = clean.classGrade.trim().slice(0, 64);
    if (typeof clean.division === 'string') clean.division = clean.division.trim().slice(0, 64);
    if (typeof clean.district === 'string') clean.district = clean.district.trim().slice(0, 64);
    if (typeof clean.upazila === 'string') clean.upazila = clean.upazila.trim().slice(0, 64);
    if (typeof clean.area === 'string') clean.area = clean.area.trim().slice(0, 128);
    if (typeof clean.requirementsDescription === 'string') {
      clean.requirementsDescription = clean.requirementsDescription.trim().slice(0, 2048);
    }
    if (Array.isArray(clean.subjects)) clean.subjects = clean.subjects.slice(0, 20);
    clean.updatedAt = serverTimestamp();

    await updateDoc(doc(db, 'tuitionPosts', postId), clean);

    if (privateWhatsapp !== undefined || privateAddress !== undefined) {
      await setDoc(
        doc(db, 'tuitionPosts', postId, 'private', 'contact'),
        stripUndefined({
          learnerId: auth.currentUser?.uid || '',
          whatsappNumber:
            privateWhatsapp !== undefined ? String(privateWhatsapp).trim().slice(0, 32) : undefined,
          detailedAddress:
            privateAddress !== undefined ? String(privateAddress).trim().slice(0, 256) : undefined,
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
  if (!auth.currentUser || !postId) return null;
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

export function mapTuitionPostDoc(
  docSnap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): TuitionPost {
  const d = docSnap.data() || {};
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
    isFeatured: Boolean(d.isFeatured)
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
      throw new Error('This tuition post could not be found. It may have been removed.');
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
    if (typeof safeAppPayload.tuitionTitle === 'string') safeAppPayload.tuitionTitle = safeAppPayload.tuitionTitle.trim().slice(0, 256);
    if (typeof safeAppPayload.learnerName === 'string') safeAppPayload.learnerName = safeAppPayload.learnerName.trim().slice(0, 128);
    if (typeof safeAppPayload.tutorName === 'string') safeAppPayload.tutorName = safeAppPayload.tutorName.trim().slice(0, 128);
    if (typeof safeAppPayload.tutorAvatar === 'string') safeAppPayload.tutorAvatar = safeAppPayload.tutorAvatar.trim().slice(0, 512);
    if (typeof safeAppPayload.tutorUniversity === 'string') safeAppPayload.tutorUniversity = safeAppPayload.tutorUniversity.trim().slice(0, 128);
    if (typeof safeAppPayload.tutorDepartment === 'string') safeAppPayload.tutorDepartment = safeAppPayload.tutorDepartment.trim().slice(0, 128);
    if (typeof safeAppPayload.tutorAcademicYear === 'string') safeAppPayload.tutorAcademicYear = safeAppPayload.tutorAcademicYear.trim().slice(0, 64);
    if (typeof safeAppPayload.tutorWhatsApp === 'string') safeAppPayload.tutorWhatsApp = safeAppPayload.tutorWhatsApp.trim().slice(0, 32);
    if (typeof safeAppPayload.tutorFacebookUrl === 'string') safeAppPayload.tutorFacebookUrl = safeAppPayload.tutorFacebookUrl.trim().slice(0, 512);
    if (typeof safeAppPayload.introduction === 'string') safeAppPayload.introduction = safeAppPayload.introduction.trim().slice(0, 1024);
    if (typeof safeAppPayload.coverLetter === 'string') safeAppPayload.coverLetter = safeAppPayload.coverLetter.trim().slice(0, 2048);
    if (typeof safeAppPayload.experienceSummary === 'string') safeAppPayload.experienceSummary = safeAppPayload.experienceSummary.trim().slice(0, 1024);
    if (typeof safeAppPayload.suitabilityReason === 'string') safeAppPayload.suitabilityReason = safeAppPayload.suitabilityReason.trim().slice(0, 1024);
    if (typeof safeAppPayload.availableSchedule === 'string') safeAppPayload.availableSchedule = safeAppPayload.availableSchedule.trim().slice(0, 256);
    if (typeof safeAppPayload.additionalQualifications === 'string') safeAppPayload.additionalQualifications = safeAppPayload.additionalQualifications.trim().slice(0, 512);

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

export async function notifyAdminsInFirestore(
  notif: Omit<NotificationItem, 'id' | 'time' | 'read' | 'createdAt' | 'userId'>
): Promise<void> {
  if (!auth.currentUser) return;
  await createNotificationInFirestore({
    ...notif,
    userId: 'ADMIN'
  });
}

export async function sendAdminDirectMessageInFirestore(params: {
  userId: string;
  title?: string;
  message: string;
}): Promise<void> {
  const sender = auth.currentUser;
  if (!sender) {
    throw new Error('Please sign in with your admin account first.');
  }
  const recipientId = (params.userId || '').trim();
  if (!recipientId || recipientId === 'ADMIN') {
    throw new Error('Target user ID is missing.');
  }
  const cleanMessage = (params.message || '').trim().slice(0, 512);
  if (!cleanMessage) {
    throw new Error('Please enter a message before sending.');
  }
  const cleanTitle =
    (params.title || 'Message from FeLoW WebStaR Admin').trim().slice(0, 128) ||
    'Message from FeLoW WebStaR Admin';

  const path = 'notifications';
  try {
    await addDoc(collection(db, path), {
      userId: recipientId,
      senderId: sender.uid,
      title: cleanTitle,
      message: cleanMessage,
      time: 'Just now',
      read: false,
      type: 'system',
      actionView: 'dashboard',
      targetId: recipientId,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
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

export async function markAllNotificationsAsReadInFirestore(
  userId: string,
  includeAdmin = false
): Promise<void> {
  const path = 'notifications';
  try {
    const queries = [
      getDocs(query(collection(db, path), where('userId', '==', userId), where('read', '==', false)))
    ];
    if (includeAdmin) {
      queries.push(
        getDocs(query(collection(db, path), where('userId', '==', 'ADMIN'), where('read', '==', false)))
      );
    }
    const snapshots = await Promise.all(queries);
    const updates = snapshots.flatMap(snap =>
      snap.docs.map(d => updateDoc(doc(db, path, d.id), { read: true }))
    );
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
    const cleanDocName = (req.documentName || 'Verification Document').trim().slice(0, 256) || 'Verification Document';
    const docRef = await addDoc(collection(db, path), stripUndefined({
      ...req,
      tutorName: (req.tutorName || '').trim().slice(0, 128),
      university: (req.university || '').trim().slice(0, 256),
      documentName: cleanDocName,
      documentUrl: req.documentUrl ? req.documentUrl.trim().slice(0, 512) : undefined,
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));

    await notifyAdminsInFirestore({
      title: 'Verification Document Submitted',
      message: `${req.tutorName || 'A tutor'} uploaded ${req.verificationType} verification (${cleanDocName}).`,
      type: 'verification',
      actionView: 'admin',
      targetId: docRef.id
    });

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
      rejectionReason: status === 'rejected' ? (reason || 'Document unclear or invalid.').trim().slice(0, 512) : '',
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
        const updatedVerification = {
          ...prevVerification,
          [verificationType]: {
            ...(prevVerification[verificationType] || {}),
            status: status === 'approved' ? 'verified' : 'unverified',
            ...(status === 'approved' ? { verifiedAt: new Date().toISOString() } : {})
          }
        };
        const bothVerified =
          updatedVerification.identity?.status === 'verified' &&
          updatedVerification.institution?.status === 'verified';

        let nextBadges =
          status === 'approved'
            ? Array.from(new Set([...prevBadges, badgeLabel]))
            : prevBadges.filter(b => b !== badgeLabel && b !== 'Verified');

        if (bothVerified) {
          nextBadges = Array.from(new Set([...nextBadges, 'Verified']));
        }
        nextBadges = nextBadges.slice(0, 15);

        await updateDoc(tutorRef, {
          verification: updatedVerification,
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
    const cleanTargetTitle = (report.targetTitle || 'Reported Item').trim().slice(0, 256) || 'Reported Item';
    const cleanReason = (report.reason || 'Policy violation').trim().slice(0, 1024) || 'Policy violation';
    const docRef = await addDoc(collection(db, path), stripUndefined({
      ...report,
      targetTitle: cleanTargetTitle,
      targetId: report.targetId ? report.targetId.trim().slice(0, 128) : undefined,
      reportedBy: report.reportedBy ? report.reportedBy.trim().slice(0, 128) : undefined,
      reason: cleanReason,
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));

    await notifyAdminsInFirestore({
      title: 'New Safety Report Submitted',
      message: `${report.reportedBy || 'A user'} reported "${cleanTargetTitle}" (${cleanReason}).`,
      type: 'system',
      actionView: 'admin',
      targetId: docRef.id
    });

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

export function mapStorageError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'storage/unauthorized':
      return 'Upload permission denied by Cloud Storage rules. Verify you are signed in with a verified Google account and Firebase Storage rules are deployed.';
    case 'storage/unauthenticated':
      return 'Your login session expired. Please sign in again and retry the upload.';
    case 'storage/canceled':
      return 'Upload was cancelled. Please try again.';
    case 'storage/quota-exceeded':
      return 'Cloud Storage quota exceeded. Contact support or upgrade the Firebase Storage plan.';
    case 'storage/retry-limit-exceeded':
      return 'Network timeout while uploading photo. Check your connection and retry.';
    case 'storage/unknown':
      return 'Could not reach Cloud Storage. Ensure Firebase Storage is enabled and CORS/rules are configured.';
    default:
      return error instanceof Error ? error.message : 'File upload failed. Please try again.';
  }
}

export async function uploadDocumentToStorage(tutorId: string, file: File): Promise<string> {
  const prepared = await prepareDocumentFileForUpload(file);
  const ext = prepared.contentType === 'application/pdf' ? 'pdf' : 'jpg';
  const safeStem = (file.name || 'document')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .slice(0, 40) || 'document';
  const fileRef = ref(storage, `verifications/${tutorId}/${Date.now()}_${safeStem}.${ext}`);
  try {
    const uploadResult = await uploadBytes(fileRef, prepared.file, {
      contentType: prepared.contentType
    });
    return await getDownloadURL(uploadResult.ref);
  } catch (err) {
    throw new Error(mapStorageError(err));
  }
}

export async function uploadAvatarToStorage(userId: string, file: File): Promise<string> {
  const prepared = await prepareAvatarImageFile(file);
  const ext = prepared.type === 'image/png' ? 'png' : prepared.type === 'image/webp' ? 'webp' : 'jpg';
  const fileRef = ref(storage, `avatars/${userId}/${Date.now()}.${ext}`);
  try {
    const uploadResult = await uploadBytes(fileRef, prepared, {
      contentType: prepared.type,
      cacheControl: 'public,max-age=31536000'
    });
    return await getDownloadURL(uploadResult.ref);
  } catch (err) {
    throw new Error(mapStorageError(err));
  }
}

export async function deleteStorageFileByUrl(uid: string, fileUrl?: string | null): Promise<void> {
  if (!uid || !fileUrl) return;
  if (!fileUrl.includes('firebasestorage.googleapis.com') && !fileUrl.includes('firebasestorage.app')) {
    return;
  }
  // Only delete avatars owned by this user
  if (!fileUrl.includes(`avatars%2F${encodeURIComponent(uid)}%2F`) && !fileUrl.includes(`avatars/${uid}/`)) {
    return;
  }
  try {
    const targetRef = ref(storage, fileUrl);
    await deleteObject(targetRef);
  } catch {
    // Non-blocking best-effort cleanup of superseded avatar
  }
}

export async function persistUserAvatarInFirestore(
  uid: string,
  photoUrl: string,
  previousPhotoUrl?: string | null
): Promise<void> {
  const cleanPhotoUrl = photoUrl.trim().slice(0, 512);
  if (!uid || !cleanPhotoUrl) return;

  const userRef = doc(db, 'users', uid);
  const tutorRef = doc(db, 'tutorProfiles', uid);
  try {
    const [userSnap, tutorSnap] = await Promise.all([getDoc(userRef), getDoc(tutorRef)]);
    const ops: Promise<void>[] = [];
    if (userSnap.exists()) {
      ops.push(
        updateDoc(userRef, {
          photoURL: cleanPhotoUrl,
          updatedAt: serverTimestamp()
        })
      );
    }
    if (tutorSnap.exists()) {
      ops.push(
        updateDoc(tutorRef, {
          avatar: cleanPhotoUrl,
          profilePhotoURL: cleanPhotoUrl,
          updatedAt: serverTimestamp()
        })
      );
    }
    await Promise.all(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }

  if (previousPhotoUrl && previousPhotoUrl !== cleanPhotoUrl) {
    void deleteStorageFileByUrl(uid, previousPhotoUrl);
  }
}

async function deleteDocsFromQuery(q: ReturnType<typeof query>): Promise<void> {
  try {
    const snap = await getDocs(q);
    if (snap.empty) return;
    const chunks: (typeof snap.docs)[] = [];
    for (let i = 0; i < snap.docs.length; i += 400) {
      chunks.push(snap.docs.slice(i, i + 400));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('Non-blocking cleanup step skipped:', err);
  }
}

export async function deleteUserAccountFromFirebase(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in first to delete your account.');
  }

  const uid = user.uid;

  // Re-authenticate proactively inside the click gesture if session is older than 4 minutes
  // so the user isn't wiped in Firestore and then blocked by auth/requires-recent-login.
  const lastSignInMs = user.metadata.lastSignInTime ? Date.parse(user.metadata.lastSignInTime) : 0;
  const isStaleSession = !lastSignInMs || Date.now() - lastSignInMs > 4 * 60 * 1000;
  if (isStaleSession) {
    try {
      await reauthenticateWithPopup(user, googleProvider);
    } catch (reauthErr: any) {
      if (reauthErr?.code === 'auth/popup-closed-by-user' || reauthErr?.code === 'auth/cancelled-popup-request') {
        throw new Error('Google verification popup was closed. Account deletion was cancelled.');
      }
      throw reauthErr;
    }
  }

  // 1. Delete user's tuition posts and their private contact subdocs
  try {
    const postsSnap = await getDocs(query(collection(db, 'tuitionPosts'), where('learnerId', '==', uid), limit(200)));
    for (const postDoc of postsSnap.docs) {
      await deleteDoc(doc(db, 'tuitionPosts', postDoc.id, 'private', 'contact')).catch(() => undefined);
      await deleteDoc(postDoc.ref).catch(() => undefined);
    }
  } catch (err) {
    console.warn('Tuition post cleanup warning:', err);
  }

  // 2. Delete user-scoped bookmarks, notifications, applications, invitations, and verifications
  await Promise.all([
    deleteDocsFromQuery(query(collection(db, 'tutorFavourites'), where('userId', '==', uid), limit(200))),
    deleteDocsFromQuery(query(collection(db, 'savedTuitions'), where('userId', '==', uid), limit(200))),
    deleteDocsFromQuery(query(collection(db, 'notifications'), where('userId', '==', uid), limit(200))),
    deleteDocsFromQuery(query(collection(db, 'applications'), where('tutorId', '==', uid), limit(200))),
    deleteDocsFromQuery(query(collection(db, 'applications'), where('learnerId', '==', uid), limit(200))),
    deleteDocsFromQuery(query(collection(db, 'invitations'), where('tutorId', '==', uid), limit(200))),
    deleteDocsFromQuery(query(collection(db, 'invitations'), where('learnerId', '==', uid), limit(200))),
    deleteDocsFromQuery(query(collection(db, 'verificationRequests'), where('tutorId', '==', uid), limit(100))),
    deleteDocsFromQuery(query(collection(db, 'pushSubscriptions'), where('userId', '==', uid), limit(50))),
    deleteDocsFromQuery(query(collection(db, 'tutorProfiles', uid, 'reviews'), limit(200)))
  ]);

  // 3. Delete tutor profile, tutor private contact, learner profile, and root user record
  await Promise.all([
    deleteDoc(doc(db, 'tutorProfiles', uid, 'private', 'contact')).catch(() => undefined),
    deleteDoc(doc(db, 'tutorProfiles', uid)).catch(() => undefined),
    deleteDoc(doc(db, 'learnerProfiles', uid)).catch(() => undefined),
    deleteDoc(doc(db, 'users', uid)).catch(() => undefined)
  ]);

  tutorContactCache.delete(uid);

  // 4. Delete Firebase Auth account
  try {
    await deleteUser(user);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(user, googleProvider);
      await deleteUser(user);
    } else {
      throw err;
    }
  }
}

// -------------------------------------------------------------
// Web Push Subscription Helpers (Owner-Scoped in Firestore)
// -------------------------------------------------------------

function hashEndpointForDocId(uid: string, endpoint: string): string {
  let hash = 5381;
  for (let i = 0; i < endpoint.length; i += 1) {
    hash = ((hash << 5) + hash) ^ endpoint.charCodeAt(i);
  }
  const suffix = Math.abs(hash >>> 0).toString(36);
  return `${uid}_${suffix}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export async function getCurrentUserIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export async function savePushSubscriptionInFirestore(
  uid: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  if (!uid || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error('Invalid push subscription data.');
  }
  const subId = hashEndpointForDocId(uid, subscription.endpoint);
  const subRef = doc(db, 'pushSubscriptions', subId);
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 256) : undefined;

  try {
    const existingSnap = await getDoc(subRef);
    const payload: Record<string, unknown> = {
      userId: uid,
      endpoint: subscription.endpoint.slice(0, 1024),
      keys: {
        p256dh: subscription.keys.p256dh.slice(0, 256),
        auth: subscription.keys.auth.slice(0, 128)
      },
      updatedAt: serverTimestamp()
    };
    if (userAgent) payload.userAgent = userAgent;

    if (existingSnap.exists()) {
      await updateDoc(subRef, payload);
    } else {
      await setDoc(subRef, {
        ...payload,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `pushSubscriptions/${subId}`);
  }
}

export async function deletePushSubscriptionFromFirestore(
  uid: string,
  endpoint: string
): Promise<void> {
  if (!uid || !endpoint) return;
  const subId = hashEndpointForDocId(uid, endpoint);
  try {
    await deleteDoc(doc(db, 'pushSubscriptions', subId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `pushSubscriptions/${subId}`);
  }
}

// -------------------------------------------------------------
// Tutor Profile Views Analytics
// -------------------------------------------------------------

const recordedProfileViewsToday = new Set<string>();

function getLocalTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function recordTutorProfileViewInFirestore(
  tutorId: string,
  source = 'profile'
): Promise<void> {
  const viewer = auth.currentUser;
  const targetTutorId = (tutorId || '').trim();
  if (!viewer || !viewer.emailVerified || !targetTutorId || targetTutorId === viewer.uid) {
    return;
  }

  const todayKey = getLocalTodayKey();
  const dedupeKey = `felow_pv_${viewer.uid}_${targetTutorId}_${todayKey}`;
  if (recordedProfileViewsToday.has(dedupeKey)) {
    return;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage.getItem(dedupeKey) === '1') {
      recordedProfileViewsToday.add(dedupeKey);
      return;
    }
  } catch {
    // Ignore storage quota/privacy mode failures
  }

  // Mark optimistic dedupe immediately to avoid duplicate concurrent writes in React StrictMode
  recordedProfileViewsToday.add(dedupeKey);

  const compactDate = todayKey.replace(/-/g, '');
  const viewId = `${viewer.uid}_${compactDate}_${Date.now().toString(36)}`
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  const path = `tutorProfiles/${targetTutorId}/profileViews/${viewId}`;

  try {
    await setDoc(doc(db, 'tutorProfiles', targetTutorId, 'profileViews', viewId), {
      tutorId: targetTutorId,
      viewerId: viewer.uid,
      viewedDate: todayKey,
      source: (source || 'profile').trim().slice(0, 64) || 'profile',
      createdAt: serverTimestamp()
    });
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(dedupeKey, '1');
      }
    } catch {
      // Ignore storage write errors
    }
  } catch (error) {
    recordedProfileViewsToday.delete(dedupeKey);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}



