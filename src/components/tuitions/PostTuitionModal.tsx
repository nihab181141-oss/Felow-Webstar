import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BD_DIVISIONS,
  BD_DISTRICTS_BY_DIVISION,
  getDivisionByDistrict,
  getAreasOrUpazilas,
  EDUCATION_MEDIUMS,
  CLASS_GRADES,
  POPULAR_SUBJECTS,
  TUITION_TYPES
} from '../../data/bangladeshData';
import { CurriculumMedium, TuitionType } from '../../types';
import { isValidBdWhatsAppNumber } from '../../utils/contactLinks';

export const PostTuitionModal: React.FC = () => {
  const {
    isPostTuitionOpen,
    setIsPostTuitionOpen,
    editingTuition,
    setEditingTuition,
    postNewTuition,
    updateTuitionPost,
    currentUser,
    showToast
  } = useApp();

  const [title, setTitle] = useState('');
  const [classGrade, setClassGrade] = useState('Class 11 - 12 (HSC)');
  const [medium, setMedium] = useState<CurriculumMedium>('Bangla Medium');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Physics', 'Higher Mathematics']);
  const [customSubject, setCustomSubject] = useState('');
  const [tuitionType, setTuitionType] = useState<TuitionType>('Home Tuition');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('Dhanmondi');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [salaryOfferBDT, setSalaryOfferBDT] = useState(10000);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [preferredTutorGender, setPreferredTutorGender] = useState<'Any' | 'Male' | 'Female'>('Any');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser.whatsappNumber || currentUser.phone || '');
  const [requirementsDescription, setRequirementsDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initializedPostKeyRef = useRef<string | null>(null);
  const waTouchedRef = useRef(false);

  useEffect(() => {
    if (!isPostTuitionOpen) {
      initializedPostKeyRef.current = null;
      waTouchedRef.current = false;
      return;
    }

    const targetKey = editingTuition ? `edit:${editingTuition.id}` : 'create';
    if (initializedPostKeyRef.current === targetKey) {
      if (editingTuition && !waTouchedRef.current && editingTuition.whatsappNumber) {
        setWhatsappNumber(editingTuition.whatsappNumber);
      }
      return;
    }
    initializedPostKeyRef.current = targetKey;
    waTouchedRef.current = false;

    if (editingTuition) {
      setTitle(editingTuition.title);
      setClassGrade(editingTuition.classGrade);
      setMedium(editingTuition.medium);
      setSelectedSubjects(editingTuition.subjects);
      setTuitionType(editingTuition.tuitionType);
      const div = editingTuition.division || getDivisionByDistrict(editingTuition.district);
      setDivision(div);
      setDistrict(editingTuition.district);
      setArea(editingTuition.area);
      setDaysPerWeek(editingTuition.daysPerWeek);
      setSalaryOfferBDT(editingTuition.salaryOfferBDT);
      setIsNegotiable(editingTuition.isNegotiable);
      setPreferredTutorGender(editingTuition.preferredTutorGender);
      setWhatsappNumber(editingTuition.whatsappNumber || currentUser.whatsappNumber || currentUser.phone || '');
      setRequirementsDescription(editingTuition.requirementsDescription);
    } else {
      const userDist = currentUser.district || 'Dhaka';
      const userDiv = currentUser.division || getDivisionByDistrict(userDist);
      const areas = getAreasOrUpazilas(userDist);
      setTitle('');
      setClassGrade('Class 11 - 12 (HSC)');
      setMedium('Bangla Medium');
      setSelectedSubjects(['Higher Mathematics', 'Physics']);
      setTuitionType('Home Tuition');
      setDivision(userDiv);
      setDistrict(userDist);
      setArea(areas.includes(currentUser.area) ? currentUser.area : areas[0]);
      setDaysPerWeek(3);
      setSalaryOfferBDT(8000);
      setIsNegotiable(true);
      setPreferredTutorGender('Any');
      setWhatsappNumber(currentUser.whatsappNumber || currentUser.phone || '');
      setRequirementsDescription('');
    }
  }, [isPostTuitionOpen, editingTuition, currentUser]);

  if (!isPostTuitionOpen) return null;

  const closeModal = () => {
    setIsPostTuitionOpen(false);
    setEditingTuition(null);
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (!selectedSubjects.includes(trimmed)) {
      setSelectedSubjects(prev => [...prev, trimmed]);
    }
    setCustomSubject('');
  };

  const districtsForDivision = BD_DISTRICTS_BY_DIVISION[division] || ['Dhaka'];
  const areasForDistrict = getAreasOrUpazilas(district);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSalary = Math.round(Number(salaryOfferBDT));
    if (!Number.isFinite(cleanSalary) || cleanSalary < 1000 || cleanSalary > 500000) {
      showToast('Monthly salary must be between ৳1,000 and ৳500,000.', 'error');
      return;
    }
    const cleanWa = whatsappNumber.trim();
    if (cleanWa && !isValidBdWhatsAppNumber(cleanWa)) {
      showToast('Enter a valid Bangladeshi WhatsApp number (e.g. 01712345678) or leave blank.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const subjectsToSave = selectedSubjects.length > 0 ? selectedSubjects : ['Higher Mathematics'];
      const finalTitle =
        title.trim() ||
        `${classGrade} ${subjectsToSave.slice(0, 2).join(' & ')} Tutor Needed in ${area}`;

      const payload = {
        title: finalTitle,
        learnerType: editingTuition?.learnerType || currentUser.learnerSubtype || 'guardian',
        studentGender: editingTuition?.studentGender || ('Male' as const),
        classGrade,
        curriculum: editingTuition?.curriculum || ('National Curriculum (NCTB)' as const),
        subjects: subjectsToSave,
        medium,
        tuitionType,
        division,
        district,
        upazila: area,
        area,
        preferredTutorGender,
        daysPerWeek: Number(daysPerWeek),
        salaryOfferBDT: cleanSalary,
        isNegotiable,
        preferredContactMethod: editingTuition?.preferredContactMethod || ('WhatsApp' as const),
        whatsappNumber: editingTuition ? cleanWa : cleanWa || undefined,
        requirementsDescription:
          requirementsDescription.trim() ||
          `Looking for an experienced tutor for ${classGrade} (${subjectsToSave.join(', ')}) in ${area}, ${district}.`
      };

      if (editingTuition) {
        await updateTuitionPost(editingTuition.id, payload);
      } else {
        await postNewTuition(payload);
      }
      closeModal();
    } catch {
      // Toast already shown by AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-[28px] border border-[#EFEAE7] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#EFEAE7] flex items-center justify-between z-10">
          <h2 className="font-display text-lg font-extrabold text-[#18181B]">
            {editingTuition ? 'Edit Tuition Post' : 'Create Tuition Post'}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] flex items-center justify-center text-[#18181B] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#18181B] mb-1">
              Post Title (Optional — auto-created if blank)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need HSC Physics & Math Tutor in Dhanmondi"
              className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-sm text-[#18181B] placeholder:text-[#858585] focus:bg-white focus:outline-none focus:border-[#18181B]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Class *</label>
              <select
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {CLASS_GRADES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Medium *</label>
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value as CurriculumMedium)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {EDUCATION_MEDIUMS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#18181B] mb-1.5">Subjects Needed *</label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set([...POPULAR_SUBJECTS.slice(0, 10), ...selectedSubjects])).map(sub => {
                const active = selectedSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#18181B] text-white'
                        : 'bg-[#F6F4F3] text-[#52525B] hover:bg-[#EFEAFF] hover:text-[#18181B]'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2.5">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Other subject..."
                className="flex-1 h-9 px-3.5 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
              />
              <button
                type="button"
                onClick={addCustomSubject}
                className="h-9 px-4 rounded-full bg-[#EFEAFF] hover:bg-[#E1D8FF] text-[#18181B] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Division</label>
              <select
                value={division}
                onChange={(e) => {
                  const nextDiv = e.target.value;
                  setDivision(nextDiv);
                  const nextDist = BD_DISTRICTS_BY_DIVISION[nextDiv]?.[0] || 'Dhaka';
                  setDistrict(nextDist);
                  setArea(getAreasOrUpazilas(nextDist)[0]);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {BD_DIVISIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">District</label>
              <select
                value={district}
                onChange={(e) => {
                  const nextDist = e.target.value;
                  setDistrict(nextDist);
                  setArea(getAreasOrUpazilas(nextDist)[0]);
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {districtsForDivision.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Area</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {areasForDistrict.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Monthly Salary (৳) *</label>
              <input
                type="number"
                required
                min={1000}
                step={500}
                value={salaryOfferBDT}
                onChange={(e) => setSalaryOfferBDT(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] font-mono font-bold tabular-nums outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Days / Week</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {[1, 2, 3, 4, 5, 6].map(d => (
                  <option key={d} value={d}>{d} days / week</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-[#18181B] mb-1">Tuition Mode</label>
              <select
                value={tuitionType}
                onChange={(e) => setTuitionType(e.target.value as TuitionType)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                {TUITION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#18181B] mb-1">Preferred Tutor</label>
              <select
                value={preferredTutorGender}
                onChange={(e) => setPreferredTutorGender(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] outline-none focus:bg-white focus:border-[#18181B]"
              >
                <option value="Any">Any Tutor</option>
                <option value="Male">Male Tutor</option>
                <option value="Female">Female Tutor</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#18181B] mb-1">
                WhatsApp Number (Shared after accept)
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => {
                  waTouchedRef.current = true;
                  setWhatsappNumber(e.target.value);
                }}
                placeholder="017XXXXXXXX"
                className="w-full h-10 px-3 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#18181B] mb-1">Details / Note</label>
            <textarea
              rows={2}
              value={requirementsDescription}
              onChange={(e) => setRequirementsDescription(e.target.value)}
              placeholder="Write timing, preferred university, or student needs..."
              className="w-full p-2.5 rounded-xl bg-[#F6F4F3] border border-[#EAE4E1] text-[#18181B] placeholder:text-[#858585] outline-none focus:bg-white focus:border-[#18181B]"
            />
          </div>

          <label className="flex items-center gap-2 text-[#52525B] cursor-pointer">
            <input
              type="checkbox"
              checked={isNegotiable}
              onChange={(e) => setIsNegotiable(e.target.checked)}
              className="accent-[#EB624B]"
            />
            <span>Salary is negotiable</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Posting...' : editingTuition ? 'Save Changes' : 'Post Tuition'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
