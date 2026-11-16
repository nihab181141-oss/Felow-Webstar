import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Check, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sanitizeSafeHttpUrl } from '../../utils/contactLinks';

export const AdminDashboard: React.FC = () => {
  const {
    verificationQueue,
    approveVerification,
    rejectVerification,
    reports,
    resolveReport
  } = useApp();

  const [activeTab, setActiveTab] = useState<'verifications' | 'reports'>('verifications');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const pendingVerifications = verificationQueue.filter(v => v.status === 'pending');
  const pendingReports = reports.filter(r => r.status !== 'resolved');

  return (
    <div className="min-h-screen bg-[#FCFBFA] py-6 px-3 sm:px-6 text-left animate-fade-up">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="ivory-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#18181B]">
                Admin Moderation
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
                Approve tutor verification badges and resolve user reports
              </p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#F6F4F3] border border-[#EAE4E1] self-start">
              <button
                type="button"
                onClick={() => setActiveTab('verifications')}
                className={`h-9 px-4 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'verifications'
                    ? 'bg-[#18181B] text-white font-bold shadow-xs'
                    : 'text-[#52525B] font-semibold hover:text-[#18181B]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="tabular-nums">Verifications ({pendingVerifications.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`h-9 px-4 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'bg-[#18181B] text-white font-bold shadow-xs'
                    : 'text-[#52525B] font-semibold hover:text-[#18181B]'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="tabular-nums">Reports ({pendingReports.length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('verifications')}
              className={`p-4 rounded-[20px] border text-left cursor-pointer transition-all ${
                activeTab === 'verifications'
                  ? 'bg-[#FFF4D6] border-[#F5A04E]/70 shadow-xs'
                  : 'bg-[#FFF4D6]/65 border-[#F8E4AE] hover:bg-[#FFF4D6]'
              }`}
            >
              <div className="text-xs font-medium text-[#52525B]">Pending Verifications</div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                {pendingVerifications.length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`p-4 rounded-[20px] border text-left cursor-pointer transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#FFEBE6] border-[#EB624B]/60 shadow-xs'
                  : 'bg-[#FFEBE6]/65 border-[#FAD5CB] hover:bg-[#FFEBE6]'
              }`}
            >
              <div className="text-xs font-medium text-[#52525B]">Pending Reports</div>
              <div className="font-display text-2xl font-extrabold text-[#18181B] font-mono tabular-nums mt-0.5">
                {pendingReports.length}
              </div>
            </button>
          </div>
        </div>

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
                      <div className="font-display font-bold text-base text-[#18181B]">{item.tutorName}</div>
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
                    <div className="font-display font-bold text-sm sm:text-base text-[#18181B]">{rep.targetTitle}</div>
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

      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-12 pb-6 flex justify-center">
        <img
          src="/assets/aistudio/felow-webstar-color_11ef6d13.svg"
          alt="FeLoW WebStaR"
          className="w-[300px] sm:w-[420px] md:w-[500px] max-w-full h-auto block select-none"
        />
      </div>
    </div>
  );
};
