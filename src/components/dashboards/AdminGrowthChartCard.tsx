import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { TuitionPost, UserAccount } from '../../types';

interface AdminGrowthChartCardProps {
  users: UserAccount[];
  tuitionPosts: TuitionPost[];
}

interface DailyGrowthPoint {
  key: string;
  label: string;
  fullDate: string;
  newUsers: number;
  tuitionPosts: number;
}

function toLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractDayKey(isoOrDate?: string): string | null {
  if (!isoOrDate) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate.trim())) {
    return isoOrDate.trim();
  }
  const ms = Date.parse(isoOrDate);
  if (!Number.isFinite(ms)) return null;
  return toLocalDayKey(new Date(ms));
}

export const AdminGrowthChartCard: React.FC<AdminGrowthChartCardProps> = ({
  users,
  tuitionPosts
}) => {
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');

  const { dailyData, totalUsers7d, totalPosts7d } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DailyGrowthPoint[] = [];
    const indexByKey = new Map<string, number>();

    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const key = toLocalDayKey(d);
      const shortDay =
        offset === 0
          ? 'Today'
          : d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      indexByKey.set(key, days.length);
      days.push({
        key,
        label: shortDay,
        fullDate,
        newUsers: 0,
        tuitionPosts: 0
      });
    }

    users.forEach(user => {
      const k = extractDayKey(user.createdAt);
      if (!k) return;
      const idx = indexByKey.get(k);
      if (idx !== undefined) {
        days[idx].newUsers += 1;
      }
    });

    tuitionPosts.forEach(post => {
      const k = extractDayKey(post.createdAt || post.postedDate);
      if (!k) return;
      const idx = indexByKey.get(k);
      if (idx !== undefined) {
        days[idx].tuitionPosts += 1;
      }
    });

    return {
      dailyData: days,
      totalUsers7d: days.reduce((sum, pt) => sum + pt.newUsers, 0),
      totalPosts7d: days.reduce((sum, pt) => sum + pt.tuitionPosts, 0)
    };
  }, [users, tuitionPosts]);

  return (
    <section
      aria-label="Weekly platform growth visualization"
      className="ivory-card p-5 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-display text-base font-extrabold text-[#18181B] flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#FFF4D6] border border-[#F8E4AE] flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-[#18181B]" />
            </span>
            <span>Daily Growth (Last 7 Days)</span>
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Daily new user signups and tuition posts across the past week
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 text-xs font-semibold text-[#52525B] tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#7C5DFA] shrink-0" />
              <span>Users:</span>
              <strong className="font-mono text-[#18181B]">{totalUsers7d}</strong>
            </span>
            <span aria-hidden="true" className="text-[#D4CFCB]">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#EB624B] shrink-0" />
              <span>Tuitions:</span>
              <strong className="font-mono text-[#18181B]">{totalPosts7d}</strong>
            </span>
          </div>

          <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-[#F6F4F3] border border-[#EAE4E1]">
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                chartMode === 'area'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#6B6B6B] hover:text-[#18181B]'
              }`}
            >
              Trend
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                chartMode === 'bar'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#6B6B6B] hover:text-[#18181B]'
              }`}
            >
              Bars
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-[215px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'area' ? (
            <AreaChart data={dailyData} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="adminUsersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5DFA" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7C5DFA" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="adminPostsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EB624B" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#EB624B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEAE7" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
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
                cursor={{ stroke: '#D4CFCB', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const pt = payload[0]?.payload as DailyGrowthPoint | undefined;
                  if (!pt) return null;
                  return (
                    <div className="bg-white border border-[#EFEAE7] rounded-2xl px-3.5 py-2.5 shadow-lg text-xs space-y-1">
                      <div className="font-bold text-[#18181B]">
                        {pt.label} · {pt.fullDate}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[#52525B] tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-xs bg-[#7C5DFA]" />
                          <span>New Users</span>
                        </span>
                        <span className="font-mono font-bold text-[#18181B]">{pt.newUsers}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[#52525B] tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-xs bg-[#EB624B]" />
                          <span>Tuition Posts</span>
                        </span>
                        <span className="font-mono font-bold text-[#18181B]">{pt.tuitionPosts}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                name="New Users"
                stroke="#7C5DFA"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#adminUsersFill)"
                dot={{ r: 3, fill: '#7C5DFA', strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="tuitionPosts"
                name="Tuition Posts"
                stroke="#EB624B"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#adminPostsFill)"
                dot={{ r: 3, fill: '#EB624B', strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={dailyData} margin={{ top: 8, right: 10, left: -22, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEAE7" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
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
                cursor={{ fill: '#F6F4F3', opacity: 0.7 }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const pt = payload[0]?.payload as DailyGrowthPoint | undefined;
                  if (!pt) return null;
                  return (
                    <div className="bg-white border border-[#EFEAE7] rounded-2xl px-3.5 py-2.5 shadow-lg text-xs space-y-1">
                      <div className="font-bold text-[#18181B]">
                        {pt.label} · {pt.fullDate}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[#52525B] tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-xs bg-[#7C5DFA]" />
                          <span>New Users</span>
                        </span>
                        <span className="font-mono font-bold text-[#18181B]">{pt.newUsers}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[#52525B] tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-xs bg-[#EB624B]" />
                          <span>Tuition Posts</span>
                        </span>
                        <span className="font-mono font-bold text-[#18181B]">{pt.tuitionPosts}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="newUsers" name="New Users" fill="#7C5DFA" radius={[6, 6, 0, 0]} maxBarSize={20} />
              <Bar dataKey="tuitionPosts" name="Tuition Posts" fill="#EB624B" radius={[6, 6, 0, 0]} maxBarSize={20} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
};
