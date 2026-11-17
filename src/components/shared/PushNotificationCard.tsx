import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, CheckCircle2, Loader2, Send, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getWebPushStatus,
  sendTestWebPush,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  WebPushStatus
} from '../../utils/webPush';
import { PWAInstallButton } from './PWAInstallButton';

export const PushNotificationCard: React.FC = () => {
  const { currentUser, isAuthenticated, language } = useApp();
  const isBn = language === 'bn';

  const [status, setStatus] = useState<WebPushStatus | null>(null);
  const [busy, setBusy] = useState<'enable' | 'disable' | 'test' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshStatus = useCallback(async () => {
    const next = await getWebPushStatus();
    setStatus(next);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const handleEnable = async () => {
    if (!isAuthenticated || !currentUser?.id) {
      setFeedback({
        type: 'error',
        text: isBn ? 'অনুগ্রহ করে প্রথমে Google দিয়ে সাইন ইন করুন।' : 'Please sign in first to enable push alerts.'
      });
      return;
    }
    setBusy('enable');
    setFeedback(null);
    try {
      const result = await subscribeToWebPush(currentUser.id);
      setFeedback({ type: result.ok ? 'success' : 'error', text: result.message });
      await refreshStatus();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to enable push notifications.'
      });
    } finally {
      setBusy(null);
    }
  };

  const handleDisable = async () => {
    setBusy('disable');
    setFeedback(null);
    try {
      const result = await unsubscribeFromWebPush(currentUser.id);
      setFeedback({ type: result.ok ? 'success' : 'error', text: result.message });
      await refreshStatus();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to disable push notifications.'
      });
    } finally {
      setBusy(null);
    }
  };

  const handleTestPush = async () => {
    setBusy('test');
    setFeedback(null);
    try {
      const result = await sendTestWebPush(
        'FeLoW WebStaR',
        isBn
          ? 'অভিনন্দন! আপনার ডিভাইসে পুশ নোটিফিকেশন সঠিকভাবে কাজ করছে।'
          : 'Web Push alerts are connected and active on this device.',
        '/dashboard'
      );
      setFeedback({ type: result.ok ? 'success' : 'error', text: result.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="ivory-card p-5 sm:p-6 space-y-3.5 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-[#FFF6F3] border border-[#F5E4DF] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-[#EB624B]" />
          </span>
          <div>
            <h2 className="font-display text-base font-extrabold text-[#18181B]">
              {isBn ? 'অ্যাপ ও পুশ নোটিফিকেশন' : 'App & Push Notifications'}
            </h2>
            <p className="text-[11px] text-[#6B6B6B]">
              {isBn
                ? 'অ্যাপ বন্ধ থাকলেও নতুন টিউশন ও প্রোপোজাল অ্যালার্ট পান'
                : 'Receive tuition & proposal alerts even when the app is closed'}
            </p>
          </div>
        </div>

        <PWAInstallButton variant="pill" />
      </div>

      {status === null ? (
        <div className="p-3 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] text-[#6B6B6B] flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{isBn ? 'পুশ স্ট্যাটাস যাচাই হচ্ছে...' : 'Checking device notification status...'}</span>
        </div>
      ) : !status.supported ? (
        <div className="p-3.5 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] text-[#52525B] leading-relaxed">
          {isBn
            ? 'এই ব্রাউজারে Web Push সমর্থিত নয়। iOS-এ প্রথমে Safari থেকে "Add to Home Screen" ব্যবহার করে অ্যাপটি ইনস্টল করুন।'
            : 'Web Push is not supported in this browser tab. On iPhone/iPad, install FeLoW to your Home Screen first via Safari Share → Add to Home Screen.'}
        </div>
      ) : status.permission === 'denied' ? (
        <div className="p-3.5 rounded-2xl bg-[#FFEBE6] border border-[#FAD5CB] text-[#9A3412] flex items-start gap-2 leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isBn
              ? 'ব্রাউজার সেটিংস থেকে এই সাইটের নোটিফিকেশন ব্লক করা আছে। চালু করতে ব্রাউজারের Lock/Settings আইকন থেকে Notifications অনুমোদন করুন।'
              : 'Notifications are currently blocked in your browser settings. Allow notifications in site permissions to subscribe.'}
          </span>
        </div>
      ) : status.isSubscribed ? (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-[#E8F8EE] border border-[#C6EBD5] text-[#15803D] flex items-center justify-between gap-2">
            <span className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isBn
                  ? 'এই ডিভাইসে পুশ নোটিফিকেশন চালু আছে'
                  : 'Push notifications active on this device'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestPush}
              disabled={busy !== null}
              className="h-9 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] disabled:opacity-60 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {busy === 'test' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Send className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isBn ? 'টেস্ট পুশ পাঠান' : 'Send Test Push'}</span>
            </button>

            <button
              type="button"
              onClick={handleDisable}
              disabled={busy !== null}
              className="h-9 px-4 rounded-full bg-[#F6F4F3] hover:bg-[#EAE4E1] disabled:opacity-60 text-[#18181B] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {busy === 'disable' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <BellOff className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isBn ? 'বন্ধ করুন' : 'Disable Push'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-[#F8F6F5] border border-[#EFEAE7] text-[#52525B] leading-relaxed">
            {isBn
              ? 'ক্লিক করার পরেই কেবল আপনার ডিভাইসে নোটিফিকেশন পারমিশন চাওয়া হবে।'
              : 'Notification permission is only requested when you explicitly click Enable Notifications below.'}
          </div>

          <button
            type="button"
            onClick={handleEnable}
            disabled={busy !== null}
            className="h-10 px-5 rounded-full bg-[#EB624B] hover:bg-[#DC533D] disabled:opacity-60 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {busy === 'enable' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <BellRing className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isBn ? 'নোটিফিকেশন চালু করুন' : 'Enable Notifications'}</span>
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-[11px] font-medium leading-relaxed ${
            feedback.type === 'success'
              ? 'bg-[#E8F8EE]/80 border-[#C6EBD5] text-[#15803D]'
              : 'bg-[#FFF6F3] border-[#F5E4DF] text-[#9A3412]'
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
};
