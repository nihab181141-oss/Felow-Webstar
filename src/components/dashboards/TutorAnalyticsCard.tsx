import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { BarChart3, Eye, Mail } from 'lucide-react';
import { Invitation, TutorProfileView } from '../../types';

interface TutorAnalyticsCardProps {
  profileViews: TutorProfileView[];
  invitations: Invitation[];
  language?: 'en' | 'bn';
  onViewInquiries?: () => void;
}

interface DailyAnalyticsPoint {
  dayKey: string;
  shortLabel: string;
  fullDate: string;
  views: number;
  inquiries: number;
}

function toLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractDayKey(isoOrDate?: string): string | null {
  if (!isoOrDate) return null;
  const trimmed = isoOrDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return toLocalDayKey(new Date(ms));
}

export const TutorAnalyticsCard: React.FC<TutorAnalyticsCardProps> = ({
  profileViews,
  invitations,
  language = 'en',
  onViewInquiries
}) => {
  const isBn = language === 'bn';

  const {
    monthTitle,
    dailyPoints,
    totalViewsThisMonth,
    totalInquiriesThisMonth
  } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDay = now.getDate();

    const monthLabel = now.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
      month: 'long',
      year: 'numeric'
    });

    const points: DailyAnalyticsPoint[] = [];
    const indexByDay = new Map<string, number>();

    for (let day = 1; day <= todayDay; day++) {
      const d = new Date(year, month, day);
      const dayKey = toLocalDayKey(d);
      const shortLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const fullDate = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      indexByDay.set(dayKey, points.length);
      points.push({
        dayKey,
        shortLabel,
        fullDate,
        views: 0,
        inquiries: 0
      });
    }

    profileViews.forEach(view => {
      const key = extractDayKey(view.createdAt || view.viewedDate);
      if (!key) return;
      const idx = indexByDay.get(key);
      if (idx !== undefined) {
        points[idx].views += 1;
      }
    });

    invitations.forEach(inv => {
      const key = extractDayKey(inv.createdAt || inv.sentAt);
      if (!key) return;
      const idx = indexByDay.get(key);
      if (idx !== undefined) {
        points[idx].inquiries += 1;
      }
    });

    return {
      monthTitle: monthLabel,
      dailyPoints: points,
      totalViewsThisMonth: points.reduce((sum, pt) => sum + pt.views, 0),
      totalInquiriesThisMonth: points.reduce((sum, pt) => sum + pt.inquiries, 0)
    };
  }, [profileViews, invitations, isBn]);

  const hasActivity = totalViewsThisMonth > 0 || totalInquiriesThisMonth > 0;

  return (
    <section
      aria-label={isBn ? 'এই মাসের প্রোফাইল ও ইনকোয়ারি পরিসংখ্যান' : 'Monthly profile views and inquiries summary'}
      className="ivory-card p-4 sm:p-5 space-y-4"
    >
      {/* Header + Summary Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <h2 className="font-display text-base font-extrabold text-[#18181B] flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#EFEAFF] border border-[#E1D8FF] flex items-center justify-center shrink-0">
              <BarChart3 className="w-3.5 h-3.5 text-[#18181B]" />
            </span>
            <span>{isBn ? 'এই মাসের সারসংক্ষেপ' : 'This Month at a Glance'}</span>
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            {monthTitle} · {isBn ? 'প্রোফাইল ভিজিট ও প্রাপ্ত টিউশন ইনকোয়ারি' : 'Profile views and tuition inquiries received'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-[16px] bg-[#EFEAFF]/75 border border-[#E1D8FF] flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#7C5DFA] shrink-0" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#52525B]">
                {isBn ? 'প্রোফাইল ভিউ' : 'Profile Views'}
              </div>
              <div className="font-display text-base sm:text-lg font-extrabold text-[#18181B] font-mono tabular-nums leading-tight">
                {totalViewsThisMonth}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewInquiries}
            disabled={!onViewInquiries}
            className={`px-3.5 py-2 rounded-[16px] bg-[#FFF6F3] border border-[#F5E4DF] flex items-center gap-2.5 text-left transition-colors ${
              onViewInquiries ? 'hover:bg-[#FFEBE6] cursor-pointer' : ''
            }`}
          >
            <Mail className="w-4 h-4 text-[#EB624B] shrink-0" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#52525B]">
                {isBn ? 'ইনকোয়ারি' : 'Inquiries'}
              </div>
              <div className="font-display text-base sm:text-lg font-extrabold text-[#18181B] font-mono tabular-nums leading-tight">
                {totalInquiriesThisMonth}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Simple Monthly Bar Chart */}
      <div className="w-full h-[185px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyPoints} margin={{ top: 6, right: 8, left: -22, bottom: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEAE7" />
            <XAxis
              dataKey="shortLabel"
              axisLine={false}
              tickLine={false}
              minTickGap={22}
              tick={{ fill: '#6B6B6B', fontSize: 11, fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#858585', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: '#F8F6F5' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const pt = payload[0]?.payload as DailyAnalyticsPoint | undefined;
                if (!pt) return null;
                return (
                  <div className="bg-white border border-[#EFEAE7] rounded-2xl px-3.5 py-2.5 shadow-lg text-xs space-y-1">
                    <div className="font-bold text-[#18181B]">{pt.fullDate}</div>
                    <div className="flex items-center justify-between gap-4 text-[#52525B] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs bg-[#7C5DFA]" />
                        <span>{isBn ? 'প্রোফাইল ভিউ' : 'Profile Views'}</span>
                      </span>
                      <span className="font-mono font-bold text-[#18181B]">{pt.views}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[#52525B] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs bg-[#EB624B]" />
                        <span>{isBn ? 'ইনকোয়ারি' : 'Inquiries'}</span>
                      </span>
                      <span className="font-mono font-bold text-[#18181B]">{pt.inquiries}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="views"
              name={isBn ? 'প্রোফাইল ভিউ' : 'Profile Views'}
              fill="#7C5DFA"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
            <Bar
              dataKey="inquiries"
              name={isBn ? 'ইনকোয়ারি' : 'Inquiries'}
              fill="#EB624B"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + Honest Empty Helper */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F4EFEA] text-[11px] text-[#6B6B6B]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#7C5DFA] shrink-0" />
            <span>{isBn ? 'প্রোফাইল ভিউ' : 'Profile Views'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EB624B] shrink-0" />
            <span>{isBn ? 'ইনকোয়ারি (আমন্ত্রণ)' : 'Inquiries Received'}</span>
          </span>
        </div>
        {!hasActivity && (
          <span>
            {isBn
              ? 'শিক্ষার্থীরা আপনার প্রোফাইল দেখলে বা আমন্ত্রণ জানালে এখানে রিয়েল-টাইম ডেটা দেখা যাবে।'
              : 'Live data updates automatically as learners view your profile or send invitations.'}
          </span>
        )}
      </div>
    </section>
  );
};
