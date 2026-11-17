import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Instagram,
  MessageCircle,
  Send,
  Share2,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { trackAnalyticsEvent } from '../../utils/analytics';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  shareUrl: string;
  shareText: string;
  instagramCaption?: string;
  badgeLabel?: string;
  contentType?: 'tutor' | 'tuition';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  shareUrl,
  shareText,
  instagramCaption,
  badgeLabel = 'Share Link',
  contentType = 'tutor'
}) => {
  const { showToast, language } = useApp();
  const isBn = language === 'bn';
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIg, setCopiedIg] = useState(false);

  if (!isOpen) return null;

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const fullTextWithUrl = `${shareText}\n\n${shareUrl}`;
  const igPayload = instagramCaption
    ? `${instagramCaption}\n\n${shareUrl}`
    : fullTextWithUrl;

  const trackShare = (method: string) => {
    trackAnalyticsEvent('share_content', {
      method,
      content_type: contentType
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      trackShare('copy_link');
      showToast(
        isBn ? 'লিংক কপি হয়েছে!' : 'Link copied to clipboard!',
        'success'
      );
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      showToast(
        isBn ? 'লিংক কপি করা যায়নি।' : 'Could not copy link automatically.',
        'error'
      );
    }
  };

  const handleInstagramCopy = async () => {
    try {
      await navigator.clipboard.writeText(igPayload);
      setCopiedIg(true);
      trackShare('instagram');
      showToast(
        isBn
          ? 'Instagram ক্যাপশন ও লিংক কপি হয়েছে! স্টোরি, বায়ো বা ডিএম-এ পেস্ট করুন।'
          : 'Copied for Instagram! Paste in your Story, Bio, or DM.',
        'success'
      );
      window.setTimeout(() => setCopiedIg(false), 3000);
    } catch {
      showToast('Could not copy Instagram caption.', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title,
        text: shareText,
        url: shareUrl
      });
      trackShare('native_share');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        handleCopyLink();
      }
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(fullTextWithUrl)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}&quote=${encodeURIComponent(shareText)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-up"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="bg-white rounded-[28px] border border-[#EFEAE7] max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#EB624B]">
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>{badgeLabel}</span>
            </div>
            <h3
              id="share-modal-title"
              className="font-display text-lg font-extrabold text-[#18181B] leading-snug break-words"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#6B6B6B] line-clamp-2">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-9 h-9 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] flex items-center justify-center text-[#18181B] cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full h-11 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>
              {isBn ? 'ফোন / ডিভাইস শেয়ার মেনু খুলুন' : 'Share via Device Apps'}
            </span>
          </button>
        )}

        {/* Social Platform Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('whatsapp')}
            className="p-3 rounded-[18px] bg-[#E8F8EE] hover:bg-[#D5F2E0] border border-[#C6EBD5] text-[#14532D] font-bold flex items-center gap-2 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#15803D] text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </span>
            <span className="truncate">WhatsApp</span>
          </a>

          <a
            href={facebookHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('facebook')}
            className="p-3 rounded-[18px] bg-[#EAF2FF] hover:bg-[#DCE9FF] border border-[#CFE0FF] text-[#1E3A8A] font-bold flex items-center gap-2 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 font-display text-sm font-extrabold">
              f
            </span>
            <span className="truncate">Facebook</span>
          </a>

          <button
            type="button"
            onClick={handleInstagramCopy}
            className="p-3 rounded-[18px] bg-[#FFF0F6] hover:bg-[#FFE0EC] border border-[#FAD0E2] text-[#831843] font-bold flex items-center gap-2 cursor-pointer transition-colors text-left"
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0">
              {copiedIg ? <Check className="w-4 h-4" /> : <Instagram className="w-4 h-4" />}
            </span>
            <span className="truncate">{copiedIg ? 'Copied!' : 'Instagram'}</span>
          </button>

          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('telegram')}
            className="p-3 rounded-[18px] bg-[#E7F5FF] hover:bg-[#D4ECFF] border border-[#C2E2FA] text-[#0C4A6E] font-bold flex items-center gap-2 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#229ED9] text-white flex items-center justify-center shrink-0">
              <Send className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">Telegram</span>
          </a>

          <a
            href={xHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('x')}
            className="p-3 rounded-[18px] bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-[#E4E4E7] text-[#18181B] font-bold flex items-center gap-2 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0 font-display text-xs font-extrabold">
              𝕏
            </span>
            <span className="truncate">X / Twitter</span>
          </a>

          <a
            href={linkedinHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('linkedin')}
            className="p-3 rounded-[18px] bg-[#EEF4FB] hover:bg-[#DCE9F8] border border-[#CCE0F5] text-[#1E3A8A] font-bold flex items-center gap-2 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shrink-0 font-display text-xs font-extrabold">
              in
            </span>
            <span className="truncate">LinkedIn</span>
          </a>
        </div>

        {copiedIg && (
          <div className="p-3 rounded-2xl bg-[#FFF0F6] border border-[#FAD0E2] flex items-center justify-between gap-2 text-xs text-[#831843]">
            <span className="font-medium">
              {isBn
                ? 'ক্যাপশন ও লিংক কপি হয়েছে। Instagram-এ পেস্ট করুন!'
                : 'Caption & link copied! Open Instagram to paste in Bio, Story, or DM.'}
            </span>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-[#831843] text-white font-bold inline-flex items-center gap-1 shrink-0"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Direct Copy Link Box */}
        <div className="pt-1">
          <div className="text-[11px] font-semibold text-[#6B6B6B] mb-1.5">
            {isBn ? 'ডাইরেক্ট শেয়ার লিংক' : 'Direct Share Link'}
          </div>
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#F6F4F3] border border-[#EAE4E1]">
            <input
              type="text"
              readOnly
              value={shareUrl}
              aria-label="Share URL"
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 bg-transparent text-xs text-[#18181B] font-mono focus:outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`h-9 px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-all ${
                copiedLink
                  ? 'bg-[#15803D] text-white'
                  : 'bg-[#EB624B] hover:bg-[#DC533D] text-white'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কপি হয়েছে' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কপি লিংক' : 'Copy Link'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
