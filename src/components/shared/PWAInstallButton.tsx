import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

interface PWAInstallButtonProps {
  variant?: 'pill' | 'menu-item' | 'tile';
  onAction?: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'pill',
  onAction,
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useApp();
  const isBn = language === 'bn';
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
        onAction?.();
      }
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const label = isInstallable
    ? isBn
      ? installing
        ? 'ইনস্টল হচ্ছে...'
        : 'অ্যাপ ইনস্টল করুন'
      : installing
        ? 'Installing...'
        : 'Install App'
    : isBn
      ? 'আইফোনে ইনস্টল করুন'
      : 'Install on iOS';

  return (
    <>
      {variant === 'menu-item' && (
        <button
          type="button"
          onClick={handleClick}
          disabled={installing}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF6F3] text-sm font-medium text-[#18181B] cursor-pointer disabled:opacity-60 transition-colors ${className}`}
        >
          <Download className="w-4 h-4 text-[#EB624B] shrink-0" />
          <span>{label}</span>
        </button>
      )}

      {variant === 'tile' && (
        <div className="ivory-card overflow-hidden">
          <button
            type="button"
            onClick={handleClick}
            disabled={installing}
            className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 text-sm font-semibold text-[#18181B] bg-[#FFF6F3]/80 hover:bg-[#FFEBE6] cursor-pointer disabled:opacity-60 transition-colors ${className}`}
          >
            <span className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[#EB624B] shrink-0" />
              <span>{label}</span>
            </span>
            <Download className="w-4 h-4 text-[#EB624B] shrink-0" />
          </button>
        </div>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={handleClick}
          disabled={installing}
          className={`h-9 px-3.5 rounded-full bg-[#EFEAFF] hover:bg-[#E4DCFF] border border-[#E1D8FF] text-[#18181B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#EB624B] shrink-0" />
          <span>{label}</span>
        </button>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
          onClick={() => setShowIOSGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div
            className="w-full max-w-sm rounded-[24px] bg-white border border-[#EFEAE7] p-5 sm:p-6 shadow-[0_20px_50px_rgba(24,24,27,0.18)] space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="FeLoW WebStaR"
                  className="w-11 h-11 rounded-2xl border border-[#EFEAE7] shrink-0"
                />
                <div>
                  <h3 id="ios-install-title" className="font-display text-base font-extrabold text-[#18181B]">
                    {isBn ? 'iPhone / iPad-এ ইনস্টল করুন' : 'Install FeLoW WebStaR'}
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    {isBn ? 'হোম স্ক্রিনে অ্যাপ হিসেবে যোগ করুন' : 'Add to your iOS Home Screen'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close install instructions"
                className="w-8 h-8 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] flex items-center justify-center text-[#52525B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-[#252525]">
              <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7]">
                <Share className="w-4 h-4 text-[#EB624B] shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? '১. Safari ব্রাউজারের নিচে বা উপরে থাকা Share বাটনে ট্যাপ করুন।'
                    : '1. Tap the Share button in Safari’s toolbar.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFF6F3] border border-[#F5E4DF]">
                <PlusSquare className="w-4 h-4 text-[#EB624B] shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? '২. নিচে স্ক্রল করে "Add to Home Screen" এবং তারপর "Add" ট্যাপ করুন।'
                    : '2. Scroll down, tap "Add to Home Screen", then tap "Add".'}
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => {
                setShowIOSGuide(false);
                onAction?.();
              }}
              className="w-full h-10 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-bold cursor-pointer transition-colors"
            >
              {isBn ? 'বুঝেছি' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
