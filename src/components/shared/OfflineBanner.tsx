import React, { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { applyPWAUpdate, subscribePWAUpdateState } from '../../utils/pwaRegister';
import { useApp } from '../../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language, activeView } = useApp();
  const isBn = language === 'bn';
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    return subscribePWAUpdateState(setNeedRefresh);
  }, []);

  if (isOnline && !needRefresh) {
    return null;
  }

  const bottomPosition = activeView === 'login' ? 'bottom-5' : 'bottom-20 md:bottom-5';

  return (
    <div
      className={`fixed left-3 sm:left-5 ${bottomPosition} z-40 flex flex-col gap-2 items-start pointer-events-none`}
    >
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#18181B] text-white text-xs font-semibold shadow-[0_10px_28px_rgba(24,24,27,0.2)] border border-white/10"
        >
          <WifiOff className="w-3.5 h-3.5 text-[#F47C68] shrink-0" />
          <span>
            {isBn
              ? 'অফলাইন মোড — ক্যাশ করা তথ্য দেখাচ্ছে'
              : 'Offline Mode — Cached views active'}
          </span>
        </div>
      )}

      {needRefresh && isOnline && (
        <div
          role="status"
          className="pointer-events-auto inline-flex items-center gap-2.5 pl-3.5 pr-1.5 py-1.5 rounded-full bg-white text-[#18181B] text-xs font-semibold shadow-[0_12px_32px_rgba(24,24,27,0.14)] border border-[#EFEAE7]"
        >
          <span>{isBn ? 'নতুন আপডেট প্রস্তুত' : 'App update ready'}</span>
          <button
            type="button"
            onClick={() => void applyPWAUpdate()}
            className="h-7 px-3 rounded-full bg-[#EB624B] hover:bg-[#DC533D] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{isBn ? 'রিফ্রেশ' : 'Update'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
