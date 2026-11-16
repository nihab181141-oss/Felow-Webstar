import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandWordmark } from './BrandWordmark';

export const DeleteAccountSection: React.FC = () => {
  const { currentRole, deleteMyAccount, language } = useApp();
  const isBn = language === 'bn';

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setErrorMsg(
        isBn
          ? 'নিশ্চিত করতে নিচের বক্সে DELETE লিখুন।'
          : 'Please type DELETE in the confirmation box to proceed.'
      );
      return;
    }

    setErrorMsg('');
    setIsDeleting(true);
    try {
      await deleteMyAccount();
      setIsConfirmOpen(false);
      setConfirmText('');
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isBn
            ? 'অ্যাকাউন্ট ডিলিট করা সম্ভব হয়নি। আবার চেষ্টা করুন।'
            : 'Could not delete account. Please try again.')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      aria-labelledby="delete-account-heading"
      className="ivory-card p-5 border-rose-200/90 bg-rose-50/35 space-y-3 text-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h2
            id="delete-account-heading"
            className="font-display text-base font-bold text-rose-800 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{isBn ? 'অ্যাকাউন্ট ডিলিট করুন' : 'Delete Account'}</span>
          </h2>
          <p className="text-[#858585] leading-relaxed max-w-xl">
            {isBn ? (
              <>
                আপনার <BrandWordmark /> অ্যাকাউন্ট, প্রোফাইল, সংরক্ষিত তথ্য এবং সংশ্লিষ্ট সব ডেটা স্থায়ীভাবে মুছে ফেলুন। এই কাজটি আর ফিরিয়ে আনা যাবে না।
              </>
            ) : (
              <>
                Permanently delete your <BrandWordmark />{' '}
                {currentRole === 'tutor' ? 'tutor' : 'student / guardian'} account, saved contacts, posts, and profile data. This action cannot be undone.
              </>
            )}
          </p>
        </div>

        {!isConfirmOpen && (
          <button
            type="button"
            onClick={() => {
              setIsConfirmOpen(true);
              setErrorMsg('');
              setConfirmText('');
            }}
            className="h-10 px-4 rounded-full border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isBn ? 'অ্যাকাউন্ট মুছুন' : 'Delete My Account'}</span>
          </button>
        )}
      </div>

      {isConfirmOpen && (
        <form
          onSubmit={handleConfirmDelete}
          className="p-4 rounded-2xl bg-white border border-rose-200 space-y-3 animate-fade-up"
        >
          <div className="text-xs font-semibold text-[#252525]">
            {isBn
              ? 'সতর্কতা: অ্যাকাউন্ট ডিলিট করলে নিচের তথ্যগুলো চিরতরে মুছে যাবে:'
              : 'Permanent removal includes:'}
          </div>
          <ul className="text-xs text-[#858585] space-y-1 list-disc pl-4">
            <li>
              {isBn
                ? 'আপনার স্টুডেন্ট/গার্জিয়ান এবং টিউটর প্রোফাইল ও যোগাযোগ নম্বর'
                : 'Your student/guardian profile, tutor profile, and private contact info'}
            </li>
            <li>
              {isBn
                ? 'আপনার পোস্ট করা টিউশন, আবেদন, আমন্ত্রণ এবং সেভ করা তালিকা'
                : 'Your tuition posts, sent applications, invitations, and saved lists'}
            </li>
            <li>
              {isBn
                ? 'নিরাপত্তার জন্য Google দিয়ে পুনরায় যাচাই করতে হতে পারে'
                : 'You may be asked to quickly re-confirm with Google if your session is older'}
            </li>
          </ul>

          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="delete-account-confirm-input"
              className="block text-xs font-semibold text-[#252525]"
            >
              {isBn ? 'নিশ্চিত করতে DELETE লিখুন' : 'Type DELETE to confirm'}
            </label>
            <input
              id="delete-account-confirm-input"
              type="text"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="DELETE"
              className="w-full sm:max-w-xs h-10 px-3 rounded-xl border border-rose-200 bg-rose-50/30 text-sm font-mono text-[#252525] focus:outline-none focus:border-rose-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-700">{errorMsg}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isDeleting || !isConfirmed}
              className="h-10 px-5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting Account...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'স্থায়ীভাবে ডিলিট করুন' : 'Permanently Delete Account'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setIsConfirmOpen(false);
                setConfirmText('');
                setErrorMsg('');
              }}
              className="h-10 px-4 rounded-full bg-[#FFF3EF] hover:bg-[#FFE6DD] text-[#252525] text-xs font-semibold cursor-pointer transition-colors"
            >
              {isBn ? 'বাতিল করুন' : 'Cancel'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
