import { isValidBdWhatsAppNumber, sanitizeFacebookUrl } from '../utils/contactLinks';

export type UserRole = 'learner' | 'tutor' | 'admin';
export type LearnerSubtype = 'student' | 'guardian';

export type CurriculumMedium =
  | 'Bangla Medium'
  | 'English Version'
  | 'English Medium'
  | 'Madrasa'
  | 'Other';

export type CurriculumSystem =
  | 'National Curriculum (NCTB)'
  | 'Cambridge / Edexcel'
  | 'IB'
  | 'Madrasa Board'
  | 'University / Admission'
  | 'Other';

export type TuitionType =
  | 'Home Tuition'
  | 'Online 1-on-1'
  | 'Group Tuition'
  | 'Coaching / Small Group';

export type VerificationState = 'verified' | 'pending' | 'unverified';
export type ProfileVisibility = 'public' | 'hidden';
export type ContactVisibility = 'authenticated' | 'shortlisted_only' | 'hidden';

export interface VerificationDetails {
  identity: {
    status: VerificationState;
    documentType?: string;
    verifiedAt?: string;
  };
  institution: {
    status: VerificationState;
    studentIdCard?: string;
    universityName?: string;
    verifiedAt?: string;
  };
  qualification: {
    status: VerificationState;
    certificatesCount?: number;
    verifiedAt?: string;
  };
}

export interface Review {
  id: string;
  tutorId: string;
  learnerId: string;
  learnerName: string;
  learnerRole: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  subjects: string[];
  classGrade: string;
}

export interface TutorPrivateContact {
  uid: string;
  whatsappNumber: string;
  normalizedWhatsappNumber: string;
  facebookUrl: string;
  whatsappConsent: boolean;
  contactVisibility: ContactVisibility;
  updatedAt?: string;
}

export interface TutorProfile {
  id: string;
  uid?: string;
  name: string;
  gender: 'Male' | 'Female';
  avatar: string;
  profilePhotoURL?: string;
  headline: string;
  bio: string;
  university: string;
  degree: string;
  department: string;
  academicYear?: string;
  semester?: string;
  passingYear: string;
  gpa: string;
  schoolName?: string;
  collegeName?: string;
  sscGpa?: string;
  hscGpa?: string;
  achievements?: string[];
  experienceSummary?: string;
  division: string;
  district: string;
  upazila?: string;
  preferredAreas: string[];
  mediums: CurriculumMedium[];
  classes: string[];
  subjects: string[];
  tuitionTypes: TuitionType[];
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  daysPerWeek: number[];
  experienceYears: number;
  verification: VerificationDetails;
  badges: string[];
  rating: number;
  reviewCount: number;
  completedTuitionsCount: number;
  isFeatured: boolean;
  phone: string;
  whatsappNumber?: string;
  normalizedWhatsappNumber?: string;
  whatsappConsent?: boolean;
  whatsappPublic?: boolean;
  facebookUrl?: string;
  profileVisibility?: ProfileVisibility;
  contactVisibility?: ContactVisibility;
  isPublished?: boolean;
  email: string;
  availability: 'Available Now' | 'Busy' | 'Available from Next Month';
  teachingStyleSummary: string;
  profileCompletion?: number;
  isSample?: boolean;
  reviews?: Review[];
}

export interface LearnerProfile {
  uid: string;
  name: string;
  learnerType: LearnerSubtype;
  phone: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  division: string;
  district: string;
  upazila?: string;
  area: string;
  phoneVisibility: boolean;
  profileCompletion: number;
  updatedAt?: string;
}

export type TuitionPostStatus =
  | 'open'
  | 'paused'
  | 'assigned'
  | 'closed'
  | 'expired';

export interface TuitionPost {
  id: string;
  title: string;
  learnerId: string;
  learnerName: string;
  learnerType: LearnerSubtype;
  studentGender: 'Male' | 'Female';
  studentSchoolCollege?: string;
  classGrade: string;
  curriculum?: CurriculumSystem;
  subjects: string[];
  medium: CurriculumMedium;
  tuitionType: TuitionType;
  division: string;
  district: string;
  upazila?: string;
  area: string;
  detailedAddress?: string;
  preferredTutorGender: 'Any' | 'Male' | 'Female';
  preferredUniversity?: string;
  preferredQualifications?: string;
  daysPerWeek: number;
  preferredTime?: string;
  salaryOfferBDT: number;
  isNegotiable: boolean;
  startDate?: string;
  deadline?: string;
  preferredContactMethod?: 'WhatsApp' | 'Phone Call' | 'Platform Proposal First';
  whatsappNumber?: string;
  specialInstructions?: string;
  postedDate: string;
  createdAt?: string;
  status: TuitionPostStatus;
  totalApplicants: number;
  requirementsDescription: string;
  isFeatured?: boolean;
  isSample?: boolean;
}

export type ApplicationStatus =
  | 'pending'
  | 'shortlisted'
  | 'invited'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  tuitionPostId: string;
  tuitionTitle: string;
  learnerId: string;
  learnerName?: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorUniversity: string;
  tutorDepartment?: string;
  tutorAcademicYear?: string;
  tutorRating: number;
  tutorExperienceYears: number;
  tutorWhatsApp?: string;
  tutorFacebookUrl?: string;
  guardianWhatsApp?: string;
  proposedSalaryBDT: number;
  introduction?: string;
  coverLetter: string;
  experienceSummary: string;
  suitabilityReason?: string;
  availableSchedule?: string;
  additionalQualifications?: string;
  appliedAt: string;
  updatedAt?: string;
  status: ApplicationStatus;
  demoDate?: string;
  feedbackNote?: string;
  isSample?: boolean;
}

export interface Invitation {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerWhatsApp?: string;
  tutorId: string;
  tutorName: string;
  tutorWhatsApp?: string;
  tutorFacebookUrl?: string;
  tuitionPostId?: string;
  tuitionTitle?: string;
  classGrade: string;
  subjects: string[];
  offerSalaryBDT: number;
  preferredSchedule?: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  isSample?: boolean;
}

export interface VerificationQueueItem {
  id: string;
  tutorId: string;
  tutorName: string;
  university: string;
  verificationType: 'identity' | 'institution' | 'qualification';
  documentName: string;
  documentUrl?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'application' | 'invitation' | 'verification' | 'tuition' | 'system';
  actionView?: string;
  targetId?: string;
  createdAt?: string;
}

export interface ReportItem {
  id: string;
  reportedItemType: 'tutor' | 'tuition' | 'user';
  targetTitle: string;
  targetId?: string;
  reportedBy: string;
  reportedById?: string;
  reason: string;
  status: 'pending' | 'investigating' | 'resolved';
  submittedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  role: UserRole;
  availableRoles?: UserRole[];
  learnerSubtype?: LearnerSubtype;
  avatar: string;
  division?: string;
  district: string;
  upazila?: string;
  area: string;
  university?: string;
  department?: string;
  academicYear?: string;
  tutorProfileId?: string;
  phoneVisibility: boolean;
  joinedDate?: string;
}

export const DEFAULT_PLACEHOLDER_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23FFF4EE'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23FFE6DA' stroke='%23FF6B4A' stroke-width='3'/%3E%3Cpath d='M26 104C29 84 43 74 60 74C77 74 91 84 94 104' fill='%23DCEBFF' stroke='%234D8AF0' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

export function isPlaceholderAvatar(url?: string): boolean {
  if (!url || !url.trim()) return true;
  return url.trim() === DEFAULT_PLACEHOLDER_AVATAR;
}

export function getMissingTutorMandatoryFields(
  tutor: Partial<TutorProfile>,
  requireContactInObject = true
): string[] {
  const missing: string[] = [];
  if (!tutor.name || tutor.name.trim().length < 2) missing.push('Full Name');
  if (!tutor.avatar && !tutor.profilePhotoURL) {
    missing.push('Profile Photo');
  } else if (isPlaceholderAvatar(tutor.profilePhotoURL || tutor.avatar)) {
    missing.push('Profile Photo');
  }
  if (requireContactInObject) {
    const rawWa = tutor.normalizedWhatsappNumber || tutor.whatsappNumber || tutor.phone;
    if (!isValidBdWhatsAppNumber(rawWa)) missing.push('Valid Bangladeshi WhatsApp Number');
    if (!sanitizeFacebookUrl(tutor.facebookUrl)) missing.push('Valid Facebook Profile Link');
    if (tutor.whatsappConsent !== true) missing.push('WhatsApp Contact Consent');
  }
  if (!tutor.university || tutor.university.trim().length < 2) missing.push('Current University / Institution');
  if (!tutor.department || tutor.department.trim().length < 2) missing.push('Department / Major');
  if (!tutor.academicYear || tutor.academicYear.trim().length < 1) missing.push('Current Academic Year');
  const isGraduate = tutor.academicYear === 'Graduate / Alumni';
  if (!isGraduate && (!tutor.semester || tutor.semester.trim().length < 1)) {
    missing.push('Current Semester / Status');
  }
  if (!tutor.district || tutor.district.trim().length < 1) missing.push('District');
  if (!tutor.subjects || tutor.subjects.length === 0) missing.push('Teaching Subjects');
  if (!tutor.classes || tutor.classes.length === 0) missing.push('Target Classes');
  if (!tutor.expectedSalaryMin || tutor.expectedSalaryMin <= 0) missing.push('Expected Monthly Fee');
  return missing;
}

export function isTutorProfileMandatoryComplete(
  tutor: Partial<TutorProfile>,
  requireContactInObject = true
): boolean {
  return getMissingTutorMandatoryFields(tutor, requireContactInObject).length === 0;
}

export function calculateTutorCompleteness(tutor: Partial<TutorProfile>): number {
  const hasAvatar = Boolean((tutor.profilePhotoURL || tutor.avatar) && !isPlaceholderAvatar(tutor.profilePhotoURL || tutor.avatar));
  const hasValidWa = isValidBdWhatsAppNumber(
    tutor.normalizedWhatsappNumber || tutor.whatsappNumber || tutor.phone
  );
  const hasFb = Boolean(sanitizeFacebookUrl(tutor.facebookUrl));
  const hasSemesterOrGrad =
    tutor.academicYear === 'Graduate / Alumni' ||
    Boolean(tutor.semester && tutor.semester.trim().length > 0);

  const checks = [
    Boolean(tutor.name && tutor.name.trim().length > 1),
    hasAvatar,
    hasValidWa,
    hasFb,
    Boolean(tutor.whatsappConsent),
    Boolean(tutor.university && tutor.university.trim().length > 2),
    Boolean(tutor.department && tutor.department.trim().length > 1),
    Boolean(tutor.academicYear && tutor.academicYear.trim().length > 0),
    hasSemesterOrGrad,
    Boolean(tutor.district && tutor.preferredAreas && tutor.preferredAreas.length > 0),
    Boolean(tutor.subjects && tutor.subjects.length > 0),
    Boolean(tutor.classes && tutor.classes.length > 0),
    Boolean(tutor.mediums && tutor.mediums.length > 0),
    Boolean(tutor.tuitionTypes && tutor.tuitionTypes.length > 0),
    Boolean(tutor.expectedSalaryMin && tutor.expectedSalaryMin > 0),
    // Optional enriching fields
    Boolean(tutor.headline && tutor.headline.trim().length > 8),
    Boolean(tutor.bio && tutor.bio.trim().length > 25),
    Boolean(tutor.gpa && tutor.gpa.trim().length > 0),
    Boolean(tutor.schoolName || tutor.collegeName),
    Boolean(tutor.sscGpa || tutor.hscGpa),
    Boolean(tutor.experienceSummary || tutor.teachingStyleSummary)
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return Math.max(10, Math.min(100, score));
}

export function calculateLearnerCompleteness(profile: Partial<LearnerProfile>): number {
  const checks = [
    Boolean(profile.name && profile.name.trim().length > 1),
    Boolean(profile.learnerType),
    Boolean(profile.phone && profile.phone.trim().length > 6),
    Boolean(profile.whatsappNumber && profile.whatsappNumber.trim().length > 6),
    Boolean(profile.division),
    Boolean(profile.district),
    Boolean(profile.area && profile.area.trim().length > 1)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function isTutorVerified(tutor: TutorProfile): boolean {
  return (
    tutor.verification.identity.status === 'verified' &&
    tutor.verification.institution.status === 'verified'
  );
}
