import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SplitDirectoryWorkspace } from './components/workspace/SplitDirectoryWorkspace';
import { AuthModal } from './components/auth/AuthModal';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';

// Lazy-load secondary full-page views and modals for fast initial landing paint
const TutorFullProfilePage = lazy(() =>
  import('./components/tutors/TutorFullProfilePage').then(m => ({ default: m.TutorFullProfilePage }))
);
const TuitionFullDetailPage = lazy(() =>
  import('./components/tuitions/TuitionFullDetailPage').then(m => ({ default: m.TuitionFullDetailPage }))
);
const AuthPage = lazy(() =>
  import('./components/auth/AuthPage').then(m => ({ default: m.AuthPage }))
);
const TutorOnboardingWizard = lazy(() =>
  import('./components/tutors/TutorOnboardingWizard').then(m => ({ default: m.TutorOnboardingWizard }))
);
const LearnerDashboard = lazy(() =>
  import('./components/dashboards/LearnerDashboard').then(m => ({ default: m.LearnerDashboard }))
);
const TutorDashboard = lazy(() =>
  import('./components/dashboards/TutorDashboard').then(m => ({ default: m.TutorDashboard }))
);
const AdminDashboard = lazy(() =>
  import('./components/dashboards/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);
const PostTuitionModal = lazy(() =>
  import('./components/tuitions/PostTuitionModal').then(m => ({ default: m.PostTuitionModal }))
);
const ApplyProposalModal = lazy(() =>
  import('./components/tuitions/ApplyProposalModal').then(m => ({ default: m.ApplyProposalModal }))
);

const ViewFallback: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-10 space-y-4 animate-pulse">
    <div className="h-36 rounded-3xl bg-[#FFF3EF]" />
    <div className="h-24 rounded-2xl bg-[#FFF3EF]/80" />
    <div className="h-24 rounded-2xl bg-[#DCEBFA]/50" />
  </div>
);

const MainAppContent: React.FC = () => {
  const {
    activeView,
    currentRole,
    selectedTuition,
    isPostTuitionOpen,
    isApplyModalOpen,
    setIsApplyModalOpen,
    toast
  } = useApp();

  const isDirectoryView =
    activeView === 'landing' ||
    activeView === 'how-it-works' ||
    activeView === 'about' ||
    activeView === 'tutors' ||
    activeView === 'tuitions';

  const isAuthView = activeView === 'login';
  const [hasMountedDirectory, setHasMountedDirectory] = useState(isDirectoryView);

  useEffect(() => {
    if (isDirectoryView && !hasMountedDirectory) {
      setHasMountedDirectory(true);
    }
  }, [isDirectoryView, hasMountedDirectory]);

  // Warm up secondary route chunks on browser idle for instant tab/page switches
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefetch = () => {
      void import('./components/tutors/TutorFullProfilePage');
      void import('./components/dashboards/LearnerDashboard');
      void import('./components/dashboards/TutorDashboard');
      void import('./components/tuitions/PostTuitionModal');
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const idleId = w.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(idleId);
    }
    const timer = window.setTimeout(prefetch, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FFFFFF] text-[#252525] font-sans overflow-x-clip ${
        isAuthView ? '' : 'pb-16 md:pb-0'
      }`}
    >
      {!isAuthView && <Header />}

      <main className="flex-1 min-w-0">
        {hasMountedDirectory && (
          <div className={isDirectoryView ? 'block' : 'hidden'}>
            <SplitDirectoryWorkspace />
          </div>
        )}

        <Suspense fallback={<ViewFallback />}>
          {activeView === 'tutor-detail' && <TutorFullProfilePage />}
          {activeView === 'tuition-detail' && <TuitionFullDetailPage />}
          {activeView === 'login' && <AuthPage />}
          {activeView === 'tutor-onboarding' && <TutorOnboardingWizard />}
          {activeView === 'admin' && currentRole === 'admin' && <AdminDashboard />}
          {activeView === 'dashboard' && (
            <>
              {currentRole === 'learner' && <LearnerDashboard />}
              {currentRole === 'tutor' && <TutorDashboard />}
              {currentRole === 'admin' && <AdminDashboard />}
            </>
          )}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {isPostTuitionOpen && <PostTuitionModal />}
        {isApplyModalOpen && (
          <ApplyProposalModal
            post={selectedTuition}
            onClose={() => setIsApplyModalOpen(false)}
          />
        )}
      </Suspense>
      <AuthModal />

      {toast && (
        <div
          className={`fixed right-3 sm:right-5 left-3 sm:left-auto z-50 animate-fade-up flex justify-end pointer-events-none ${
            isAuthView ? 'bottom-5' : 'bottom-20 md:bottom-5'
          }`}
        >
          <div
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-semibold max-w-sm bg-white border ${
              toast.type === 'success'
                ? 'text-[#252525] border-[#15803D]/35'
                : toast.type === 'error'
                ? 'text-rose-800 border-rose-200'
                : 'text-[#252525] border-[#F1E1DC]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#F47C68] shrink-0" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {!isAuthView && <MobileBottomNav />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
