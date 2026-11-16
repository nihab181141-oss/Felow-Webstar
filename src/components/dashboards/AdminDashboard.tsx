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
    <div className="min-h-screen bg-[#FFFFFF] py-5 px-3 sm:px-6 text-left">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="ivory-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-[#252525]">Admin Moderation</h1>
            <p className="text-xs text-[#858585]">
              Approve tutor verification badges and resolve user reports
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('verifications')}
              className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'verifications'
                  ? 'bg-[#DCEBFA] text-[#252525]'
                  : 'bg-[#FFF3EF] text-[#858585] hover:text-[#252525]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="tabular-nums">Verifications ({pendingVerifications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'reports'
                  ? 'bg-[#DCEBFA] text-[#252525]'
                  : 'bg-[#FFF3EF] text-[#858585] hover:text-[#252525]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="tabular-nums">Reports ({pendingReports.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'verifications' && (
          <div className="space-y-3">
            {pendingVerifications.length === 0 ? (
              <div className="ivory-card p-8 text-center text-sm text-[#858585]">
                No pending verification requests.
              </div>
            ) : (
              pendingVerifications.map(item => (
                <div
                  key={item.id}
                  className="ivory-card p-4 space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-bold text-sm text-[#252525]">{item.tutorName}</div>
                      <div className="text-[#858585] break-words">
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
                        className="h-9 px-4 rounded-full bg-[#FFF3EF] hover:bg-rose-50 text-rose-700 font-semibold cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => approveVerification(item.id)}
                        className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold cursor-pointer transition-colors"
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
                      className="w-full p-2 rounded-xl bg-[#FFF3EF] border border-[#F3D5CC] text-[#252525] placeholder:text-[#858585] outline-none focus:border-[#F47C68]"
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
              <div className="ivory-card p-8 text-center text-sm text-[#858585]">
                No reports submitted.
              </div>
            ) : (
              reports.map(rep => (
                <div
                  key={rep.id}
                  className="ivory-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-sm text-[#252525]">{rep.targetTitle}</div>
                    <div className="text-[#858585]">
                      {rep.reason} · Reported by {rep.reportedBy} ({rep.submittedAt})
                    </div>
                  </div>
                  {rep.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => resolveReport(rep.id)}
                      className="h-9 px-4 rounded-full bg-[#F47C68] hover:bg-[#EB6A55] text-[#252525] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  ) : (
                    <span className="text-[#C94A35] font-semibold">Resolved</span>
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
