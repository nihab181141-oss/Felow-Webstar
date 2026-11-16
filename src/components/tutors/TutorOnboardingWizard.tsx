import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BD_DIVISIONS,
  BD_DISTRICTS_BY_DIVISION,
  getDivisionByDistrict,
  getAreasOrUpazilas,
  POPULAR_SUBJECTS,
  CLASS_GRADES,
  EDUCATION_MEDIUMS,
  ACADEMIC_YEARS,
  TUITION_TYPES
} from '../../data/bangladeshData';
import {
  CurriculumMedium,
  TuitionType,
  ProfileVisibility,
  ContactVisibility,
  DEFAULT_PLACEHOLDER_AVATAR,
  isPlaceholderAvatar,
  getMissingTutorMandatoryFields,
  isTutorProfileMandatoryComplete,
  calculateTutorCompleteness
} from '../../types';
import {
  normalizeBdPhoneForWhatsApp,
  isValidBdWhatsAppNumber,
  sanitizeFacebookUrl
} from '../../utils/contactLinks';

export const TutorOnboardingWizard: React.FC = () => {
  const {
    currentUser,
    myTutorProfile,
    updateTutorProfile,
    uploadTutorAvatar,
    setActiveView,
    showToast
  } = useApp();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  // Mandatory Personal & Contact
  const [fullName, setFullName] = useState(myTutorProfile?.name || currentUser.name || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(myTutorProfile?.gender || 'Male');
  const [photoUrl, setPhotoUrl] = useState(
    myTutorProfile?.profilePhotoURL ||
      myTutorProfile?.avatar ||
      currentUser.avatar ||
      DEFAULT_PLACEHOLDER_AVATAR
  );
  const [whatsappInput, setWhatsappInput] = useState(
    myTutorProfile?.whatsappNumber || currentUser.whatsappNumber || currentUser.phone || ''
  );
  const [whatsappConsent, setWhatsappConsent] = useState<boolean>(
    myTutorProfile?.whatsappConsent ?? true
  );
  const [facebookInput, setFacebookInput] = useState(
    myTutorProfile?.facebookUrl || currentUser.facebookUrl || ''
  );
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>(
    myTutorProfile?.profileVisibility || 'public'
  );
  const [contactVisibility, setContactVisibility] = useState<ContactVisibility>(
    myTutorProfile?.contactVisibility || 'authenticated'
  );

  // Mandatory Academics
  const [university, setUniversity] = useState(
    myTutorProfile?.university || currentUser.university || ''
  );
  const [department, setDepartment] = useState(
    myTutorProfile?.department || currentUser.department || ''
  );
  const [degree, setDegree] = useState(myTutorProfile?.degree || 'B.Sc. / Honours');
  const [academicYear, setAcademicYear] = useState(
    myTutorProfile?.academicYear || currentUser.academicYear || '3rd Year'
  );
  const [semester, setSemester] = useState(myTutorProfile?.semester || '');

  // Optional Academic & Experience
  const [schoolName, setSchoolName] = useState(myTutorProfile?.schoolName || '');
  const [sscGpa, setSscGpa] = useState(myTutorProfile?.sscGpa || '');
  const [collegeName, setCollegeName] = useState(myTutorProfile?.collegeName || '');
  const [hscGpa, setHscGpa] = useState(myTutorProfile?.hscGpa || '');
  const [gpa, setGpa] = useState(myTutorProfile?.gpa || '');
  const [experienceYears, setExperienceYears] = useState<number>(
    myTutorProfile?.experienceYears ?? 0
  );
  const [experienceSummary, setExperienceSummary] = useState(
    myTutorProfile?.experienceSummary || ''
  );
  const [headline, setHeadline] = useState(myTutorProfile?.headline || '');
  const [bio, setBio] = useState(myTutorProfile?.bio || '');

  // Teaching Preferences
  const initialDist = myTutorProfile?.district || currentUser.district || 'Dhaka';
  const [division, setDivision] = useState(
    myTutorProfile?.division || getDivisionByDistrict(initialDist)
  );
  const [district, setDistrict] = useState(initialDist);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    myTutorProfile?.preferredAreas && myTutorProfile.preferredAreas.length > 0
      ? myTutorProfile.preferredAreas
      : [currentUser.area || getAreasOrUpazilas(initialDist)[0]]
  );
  const [selectedMediums, setSelectedMediums] = useState<CurriculumMedium[]>(
    myTutorProfile?.mediums && myTutorProfile.mediums.length > 0
      ? myTutorProfile.mediums
      : ['Bangla Medium']
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    myTutorProfile?.classes && myTutorProfile.classes.length > 0
      ? myTutorProfile.classes
      : ['Class 9 - 10 (SSC)']
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    myTutorProfile?.subjects && myTutorProfile.subjects.length > 0
      ? myTutorProfile.subjects
      : ['Higher Mathematics', 'Physics']
  );
  const [selectedTuitionTypes, setSelectedTuitionTypes] = useState<TuitionType[]>(
    myTutorProfile?.tuitionTypes && myTutorProfile.tuitionTypes.length > 0
      ? myTutorProfile.tuitionTypes
      : ['Home Tuition']
  );
  const [expectedMin, setExpectedMin] = useState<number>(
    myTutorProfile?.expectedSalaryMin || 6000
  );
  const [expectedMax, setExpectedMax] = useState<number>(
    myTutorProfile?.expectedSalaryMax || 10000
  );

  const hydratedProfileKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!myTutorProfile) {
      setFullName(prev => prev || currentUser.name || '');
      return;
    }
    const syncKey = `${myTutorProfile.id}:${myTutorProfile.whatsappNumber || ''}:${myTutorProfile.facebookUrl || ''}:${myTutorProfile.university || ''}`;
    if (hydratedProfileKeyRef.current === syncKey) return;
    hydratedProfileKeyRef.current = syncKey;

    setFullName(myTutorProfile.name || currentUser.name || '');
    if (myTutorProfile.gender) setGender(myTutorProfile.gender);
    if (myTutorProfile.profilePhotoURL || myTutorProfile.avatar) {
      setPhotoUrl(myTutorProfile.profilePhotoURL || myTutorProfile.avatar);
    }
    if (myTutorProfile.whatsappNumber) setWhatsappInput(myTutorProfile.whatsappNumber);
    if (myTutorProfile.whatsappConsent !== undefined) setWhatsappConsent(myTutorProfile.whatsappConsent);
    if (myTutorProfile.facebookUrl) setFacebookInput(myTutorProfile.facebookUrl);
    if (myTutorProfile.profileVisibility) setProfileVisibility(myTutorProfile.profileVisibility);
    if (myTutorProfile.contactVisibility) setContactVisibility(myTutorProfile.contactVisibility);
    if (myTutorProfile.university) setUniversity(myTutorProfile.university);
    if (myTutorProfile.department) setDepartment(myTutorProfile.department);
    if (myTutorProfile.degree) setDegree(myTutorProfile.degree);
    if (myTutorProfile.academicYear) setAcademicYear(myTutorProfile.academicYear);
    if (myTutorProfile.semester) setSemester(myTutorProfile.semester);
    if (myTutorProfile.schoolName) setSchoolName(myTutorProfile.schoolName);
    if (myTutorProfile.sscGpa) setSscGpa(myTutorProfile.sscGpa);
    if (myTutorProfile.collegeName) setCollegeName(myTutorProfile.collegeName);
    if (myTutorProfile.hscGpa) setHscGpa(myTutorProfile.hscGpa);
    if (myTutorProfile.gpa) setGpa(myTutorProfile.gpa);
    if (myTutorProfile.experienceYears !== undefined) setExperienceYears(myTutorProfile.experienceYears);
    if (myTutorProfile.experienceSummary) setExperienceSummary(myTutorProfile.experienceSummary);
    if (myTutorProfile.headline) setHeadline(myTutorProfile.headline);
    if (myTutorProfile.bio) setBio(myTutorProfile.bio);
    if (myTutorProfile.division) setDivision(myTutorProfile.division);
    if (myTutorProfile.district) setDistrict(myTutorProfile.district);
    if (myTutorProfile.preferredAreas?.length) setSelectedAreas(myTutorProfile.preferredAreas);
    if (myTutorProfile.mediums?.length) setSelectedMediums(myTutorProfile.mediums);
    if (myTutorProfile.classes?.length) setSelectedClasses(myTutorProfile.classes);
    if (myTutorProfile.subjects?.length) setSelectedSubjects(myTutorProfile.subjects);
    if (myTutorProfile.tuitionTypes?.length) setSelectedTuitionTypes(myTutorProfile.tuitionTypes);
    if (myTutorProfile.expectedSalaryMin) setExpectedMin(myTutorProfile.expectedSalaryMin);
    if (myTutorProfile.expectedSalaryMax) setExpectedMax(myTutorProfile.expectedSalaryMax);
  }, [myTutorProfile, currentUser.name]);

  const normalizedWa = useMemo(() => normalizeBdPhoneForWhatsApp(whatsappInput), [whatsappInput]);
  const validWa = isValidBdWhatsAppNumber(whatsappInput);
  const cleanFb = useMemo(() => sanitizeFacebookUrl(facebookInput), [facebookInput]);
  const hasRealPhoto = Boolean(photoUrl && !isPlaceholderAvatar(photoUrl));

  const draftProfile = useMemo(
    () => ({
      name: fullName.trim(),
      gender,
      avatar: photoUrl,
      profilePhotoURL: photoUrl,
      whatsappNumber: whatsappInput.trim(),
      normalizedWhatsappNumber: normalizedWa || '',
      whatsappConsent,
      facebookUrl: cleanFb || '',
      profileVisibility,
      contactVisibility,
      university: university.trim(),
      department: department.trim(),
      degree: degree.trim(),
      academicYear,
      semester:
        semester.trim() || (academicYear === 'Graduate / Alumni' ? 'Completed' : ''),
      schoolName: schoolName.trim() || undefined,
      sscGpa: sscGpa.trim() || undefined,
      collegeName: collegeName.trim() || undefined,
      hscGpa: hscGpa.trim() || undefined,
      gpa: gpa.trim(),
      experienceSummary: experienceSummary.trim() || undefined,
      experienceYears: Math.min(60, Math.max(0, Number.isFinite(experienceYears) ? experienceYears : 0)),
      headline: headline.trim() || `${department.trim() || 'Subject'} Tutor at ${university.trim() || 'University'}`,
      bio: bio.trim(),
      division,
      district,
      upazila: selectedAreas[0] || district,
      preferredAreas: selectedAreas,
      mediums: selectedMediums,
      classes: selectedClasses,
      subjects: selectedSubjects,
      tuitionTypes: selectedTuitionTypes,
      daysPerWeek: myTutorProfile?.daysPerWeek?.length ? myTutorProfile.daysPerWeek : [3, 4],
      expectedSalaryMin: Math.min(500000, Math.max(0, Number.isFinite(expectedMin) ? expectedMin : 0)),
      expectedSalaryMax: Math.min(
        500000,
        Math.max(
          Math.max(0, Number.isFinite(expectedMin) ? expectedMin : 0),
          Number.isFinite(expectedMax) ? expectedMax : 0
        )
      )
    }),
    [
      fullName,
      gender,
      photoUrl,
      whatsappInput,
      normalizedWa,
      whatsappConsent,
      cleanFb,
      profileVisibility,
      contactVisibility,
      university,
      department,
      degree,
      academicYear,
      semester,
      schoolName,
      sscGpa,
      collegeName,
      hscGpa,
      gpa,
      experienceSummary,
      experienceYears,
      headline,
      bio,
      division,
      district,
      selectedAreas,
      selectedMediums,
      selectedClasses,
      selectedSubjects,
      selectedTuitionTypes,
      myTutorProfile?.daysPerWeek,
      expectedMin,
      expectedMax
    ]
  );

  const missingFields = useMemo(
    () => getMissingTutorMandatoryFields(draftProfile, true),
    [draftProfile]
  );
  const isReadyToPublish = useMemo(
    () => isTutorProfileMandatoryComplete(draftProfile, true),
    [draftProfile]
  );
  const completenessScore = useMemo(
    () => calculateTutorCompleteness(draftProfile),
    [draftProfile]
  );

  const toggleItem = <T,>(
    arr: T[],
    item: T,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const uploadedUrl = await uploadTutorAvatar(file);
      if (uploadedUrl) setPhotoUrl(uploadedUrl);
    } catch {
      // Error toast already shown by uploadTutorAvatar
    } finally {
      e.target.value = '';
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (publish && !isReadyToPublish) {
      showToast(`Complete required fields: ${missingFields.join(', ')}`, 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateTutorProfile(currentUser.tutorProfileId || currentUser.id, {
        ...draftProfile,
        isPublished: publish,
        whatsappPublic: Boolean(whatsappConsent && contactVisibility === 'authenticated')
      });
      if (publish) {
        setActiveView('dashboard');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const availableAreas = getAreasOrUpazilas(district);

  return (
    <div className="min-h-screen bg-[#FCFBFA] py-6 px-3 sm:px-6 text-left animate-fade-up">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Card */}
        <div className="ivory-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#18181B]">
                Set Up Your Tutor Profile
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
                Fill out your basic details so students and parents can find and message you on WhatsApp.
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-[18px] bg-[#EFEAFF] border border-[#E1D8FF] text-right shrink-0">
              <div className="text-[11px] font-medium text-[#52525B]">Completeness</div>
              <div className="font-display text-xl font-extrabold text-[#18181B] font-mono tabular-nums">
                {completenessScore}%
              </div>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-[#F6F4F3] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#EB624B] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(4, completenessScore))}%` }}
            />
          </div>
        </div>

        {/* Section 1: Photo & Contact */}
        <div className="ivory-card p-5 sm:p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2.5 border-b border-[#EFEAE7] pb-3">
            <span className="w-7 h-7 rounded-full bg-[#FFE4A0] text-[#18181B] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
              01
            </span>
            <h2 className="font-display text-base font-extrabold text-[#18181B]">
              Photo &amp; WhatsApp Contact (Required)
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={photoUrl || DEFAULT_PLACEHOLDER_AVATAR}
                alt={fullName || 'Tutor'}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#EFEAE7]"
              />
              {hasRealPhoto && (
                <CheckCircle2 className="w-5 h-5 text-[#15803D] bg-white rounded-full absolute bottom-0 right-0" />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="font-semibold text-[#18181B]">
                Profile Photo * {!hasRealPhoto && <span className="text-rose-700">(Upload required)</span>}
              </div>
              <label className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#DCEBFA] hover:bg-[#CBE0F7] text-[#18181B] font-semibold cursor-pointer transition-colors">
                <Camera className="w-4 h-4 shrink-0" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingPhoto}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">
                Bangladeshi WhatsApp Number *
              </label>
              <input
                type="tel"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
              />
              {whatsappInput && !validWa && (
                <p className="text-[11px] text-rose-700 mt-1">
                  Enter a valid BD number (e.g. 01712345678).
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">
                Facebook Profile Link *
              </label>
              <input
                type="url"
                value={facebookInput}
                onChange={(e) => setFacebookInput(e.target.value)}
                placeholder="https://facebook.com/your.profile"
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
              />
              {facebookInput && !cleanFb && (
                <p className="text-[11px] text-rose-700 mt-1">
                  Enter a valid https://facebook.com/... link.
                </p>
              )}
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8F6F5] border border-[#EFEAE7] text-[#52525B] cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="mt-0.5 accent-[#EB624B]"
            />
            <span>
              I agree to let signed-in students and parents contact me on WhatsApp for tuition.
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Profile Visibility</label>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value as ProfileVisibility)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                <option value="public">Public (Visible on FeLoW WebStaR)</option>
                <option value="hidden">Hidden (Only when I apply)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">WhatsApp Privacy</label>
              <select
                value={contactVisibility}
                onChange={(e) => setContactVisibility(e.target.value as ContactVisibility)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                <option value="authenticated">Signed-in Users (Recommended)</option>
                <option value="shortlisted_only">Shortlisted / Invited Only</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: University & Academics */}
        <div className="ivory-card p-5 sm:p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2.5 border-b border-[#EFEAE7] pb-3">
            <span className="w-7 h-7 rounded-full bg-[#EDE9FE] text-[#18181B] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
              02
            </span>
            <h2 className="font-display text-base font-extrabold text-[#18181B]">
              Education Details (Required)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">
                University / Institution *
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. BUET, Dhaka University, NSU"
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Department / Major *</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CSE, EEE, Economics"
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Academic Year *</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {ACADEMIC_YEARS.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">
                Current Semester / Status *
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. 6th Semester, Completed"
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowOptional(prev => !prev)}
            className="text-xs font-bold text-[#EB624B] hover:underline cursor-pointer"
          >
            {showOptional ? 'Hide Optional Details' : '+ Add Optional School, College, GPA & Bio'}
          </button>

          {showOptional && (
            <div className="p-4 rounded-[20px] bg-[#F8F6F5] border border-[#EFEAE7] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">Degree (Optional)</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">University CGPA (Optional)</label>
                  <input
                    type="text"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="e.g. 3.85"
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">School Name (Optional)</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">SSC GPA (Optional)</label>
                  <input
                    type="text"
                    value={sscGpa}
                    onChange={(e) => setSscGpa(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">College Name (Optional)</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">HSC GPA (Optional)</label>
                  <input
                    type="text"
                    value={hscGpa}
                    onChange={(e) => setHscGpa(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] outline-none focus:border-[#18181B]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">Teaching Years (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] font-mono tabular-nums outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#18181B] mb-1">Experience Summary (Optional)</label>
                  <input
                    type="text"
                    value={experienceSummary}
                    onChange={(e) => setExperienceSummary(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] outline-none focus:border-[#18181B]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#18181B] mb-1">Profile Headline (Optional)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. BUET CSE Tutor · HSC Physics & Higher Math Specialist"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:border-[#18181B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#18181B] mb-1">Short Bio (Optional)</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#EAE4E1] text-[#18181B] outline-none focus:border-[#18181B]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Subjects, Locations & Fee */}
        <div className="ivory-card p-5 sm:p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2.5 border-b border-[#EFEAE7] pb-3">
            <span className="w-7 h-7 rounded-full bg-[#DBEAFE] text-[#18181B] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
              03
            </span>
            <h2 className="font-display text-base font-extrabold text-[#18181B]">
              What &amp; Where You Teach (Required)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Division</label>
              <select
                value={division}
                onChange={(e) => {
                  const nextDiv = e.target.value;
                  setDivision(nextDiv);
                  const nextDist = BD_DISTRICTS_BY_DIVISION[nextDiv]?.[0] || 'Dhaka';
                  setDistrict(nextDist);
                  setSelectedAreas([getAreasOrUpazilas(nextDist)[0]]);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {BD_DIVISIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">District *</label>
              <select
                value={district}
                onChange={(e) => {
                  const nextDist = e.target.value;
                  setDistrict(nextDist);
                  setSelectedAreas([getAreasOrUpazilas(nextDist)[0]]);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {(BD_DISTRICTS_BY_DIVISION[division] || ['Dhaka']).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Expected Salary Min (৳/mo) *</label>
              <input
                type="number"
                min={1000}
                step={500}
                value={expectedMin}
                onChange={(e) => setExpectedMin(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] font-mono tabular-nums outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Expected Salary Max (৳/mo)</label>
              <input
                type="number"
                min={1000}
                step={500}
                value={expectedMax}
                onChange={(e) => setExpectedMax(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] font-mono tabular-nums outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#18181B] mb-1.5">Preferred Areas in {district}</label>
            <div className="flex flex-wrap gap-1.5">
              {availableAreas.map(area => {
                const active = selectedAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleItem(selectedAreas, area, setSelectedAreas)}
                    className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                      active ? 'bg-[#18181B] text-white' : 'bg-[#F6F4F3] text-[#52525B] hover:bg-[#EFEAFF] hover:text-[#18181B]'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#18181B] mb-1.5">Subjects *</label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set([...POPULAR_SUBJECTS, ...selectedSubjects])).map(sub => {
                const active = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleItem(selectedSubjects, sub, setSelectedSubjects)}
                    className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                      active ? 'bg-[#18181B] text-white' : 'bg-[#F6F4F3] text-[#52525B] hover:bg-[#EFEAFF] hover:text-[#18181B]'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#18181B] mb-1.5">Classes *</label>
            <div className="flex flex-wrap gap-1.5">
              {CLASS_GRADES.map(cls => {
                const active = selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => toggleItem(selectedClasses, cls, setSelectedClasses)}
                    className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                      active ? 'bg-[#18181B] text-white' : 'bg-[#F6F4F3] text-[#52525B] hover:bg-[#EFEAFF] hover:text-[#18181B]'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1.5">Mediums</label>
              <div className="flex flex-wrap gap-1.5">
                {EDUCATION_MEDIUMS.map(med => {
                  const active = selectedMediums.includes(med);
                  return (
                    <button
                      key={med}
                      type="button"
                      onClick={() => toggleItem(selectedMediums, med, setSelectedMediums)}
                      className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                        active ? 'bg-[#18181B] text-white' : 'bg-[#F6F4F3] text-[#52525B] hover:bg-[#EFEAFF] hover:text-[#18181B]'
                      }`}
                    >
                      {med}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1.5">Tuition Modes</label>
              <div className="flex flex-wrap gap-1.5">
                {TUITION_TYPES.map(mode => {
                  const active = selectedTuitionTypes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => toggleItem(selectedTuitionTypes, mode, setSelectedTuitionTypes)}
                      className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                        active ? 'bg-[#18181B] text-white' : 'bg-[#F6F4F3] text-[#52525B] hover:bg-[#EFEAFF] hover:text-[#18181B]'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Publish Bar */}
        <div className="ivory-card p-5 space-y-3">
          {!isReadyToPublish && (
            <div className="p-3.5 rounded-2xl bg-[#FFF4D6] border border-[#F8E4AE] text-[#18181B] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Still needed to publish: </span>
                <span>{missingFields.join(', ')}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="h-10 px-5 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={isSaving || !isReadyToPublish}
              onClick={() => handleSave(true)}
              className="h-11 px-6 rounded-full bg-[#EB624B] hover:bg-[#DC533D] disabled:opacity-50 text-white text-sm font-bold cursor-pointer transition-all active:scale-[0.98] whitespace-nowrap"
            >
              {isSaving ? 'Publishing...' : 'Publish Tutor Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
