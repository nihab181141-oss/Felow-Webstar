import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthPage: React.FC = () => {
  const { loginWithGoogleUser, switchUserPersona, setActiveView } = useApp();
  const [roleType, setRoleType] = useState<'learner' | 'tutor'>('learner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginWithGoogleUser(roleType, 'guardian');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#FFFFFF] flex items-center justify-center px-4 py-10">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-3 text-center md:text-left">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#C94A35] tracking-tight">
            Tutorly
          </h1>
          <p className="text-lg sm:text-xl text-[#252525] font-medium leading-snug">
            Find trusted university tutors across Bangladesh and message them directly on WhatsApp.
          </p>
        </div>

        <div className="ivory-card p-6 space-y-4 text-left">
          <h2 className="font-display text-lg font-bold text-[#252525]">
            Sign in with Google
          </h2>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => setRoleType('learner')}
              className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-colors ${
                roleType === 'learner'
                  ? 'border-[#F47C68] bg-[#FFF3EF]'
                  : 'border-[#F1E1DC] bg-white hover:bg-[#FFF3EF]/50'
              }`}
            >
              <div className="font-bold text-[#252525]">Student / Parent</div>
              <div className="text-[11px] text-[#858585] mt-0.5">Browse & contact tutors</div>
            </button>

            <button
              type="button"
              onClick={() => setRoleType('tutor')}
              className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-colors ${
                roleType === 'tutor'
                  ? 'border-[#F47C68] bg-[#FFF3EF]'
                  : 'border-[#F1E1DC] bg-white hover:bg-[#FFF3EF]/50'
              }`}
            >
              <div className="font-bold text-[#252525]">Tutor</div>
              <div className="text-[11px] text-[#858585] mt-0.5">Build my Tutor Page</div>
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            className="w-full h-11 px-5 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] text-sm font-bold flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isSubmitting ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <div className="pt-3 border-t border-[#F1E1DC] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setActiveView('landing')}
              className="text-[#858585] hover:text-[#252525] hover:underline cursor-pointer"
            >
              Browse Directory First
            </button>
            <button
              type="button"
              onClick={() => {
                switchUserPersona(roleType === 'tutor' ? 'user-tutor-1' : 'user-guardian-1');
                setActiveView('dashboard');
              }}
              className="font-semibold text-[#C94A35] hover:underline cursor-pointer"
            >
              Preview Demo Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
