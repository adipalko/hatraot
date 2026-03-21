"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { DayBucket } from "@/lib/types";
import { formatNumber, formatTooltipNumber } from "@/lib/types";
import { he } from "@/lib/i18n-he";

interface Props {
  shelterByDay: DayBucket[];
  rocketsByDay: DayBucket[];
}

type Row = {
  date: string;
  shelter: number;
  rockets: number;
  trend: number | null;
};

function formatDateLabel(d: string) {
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function todayIsraelYmd(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jerusalem",
  });
}

function mergeShelterRockets(
  shelter: DayBucket[],
  rockets: DayBucket[]
): Omit<Row, "trend">[] {
  const map = new Map<string, { shelter: number; rockets: number }>();
  for (const d of shelter) {
    map.set(d.date, { shelter: d.count, rockets: 0 });
  }
  for (const d of rockets) {
    const cur = map.get(d.date) ?? { shelter: 0, rockets: 0 };
    cur.rockets = d.count;
    map.set(d.date, cur);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, shelter: v.shelter, rockets: v.rockets }));
}

/** Linear regression y = m*x + b for x = 0..n-1 */
function linearTrendValues(counts: number[]): number[] {
  const n = counts.length;
  if (n === 0) return [];
  if (n === 1) return [counts[0]!];
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = counts[i]!;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) {
    return counts.map(() => sumY / n);
  }
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return counts.map((_, i) => Math.max(0, m * i + b));
}

function DailyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Row }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const dateLabel = label ? formatDateLabel(String(label)) : "";
  return (
    <div
      dir="rtl"
      className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-xl"
    >
      <p className="mb-2 font-semibold text-foreground">{dateLabel}</p>
      <p className="text-sky-300">
        {he.chartShelterAlerts}: {formatNumber(row.shelter)}
      </p>
      <p className="text-red-400">
        {he.chartSirensLine}: {formatNumber(row.rockets)}
      </p>
      {row.trend != null && Number.isFinite(row.trend) && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {he.chartTrendShort}: {formatTooltipNumber(row.trend, 1)}
        </p>
      )}
    </div>
  );
}

export default function DailyTrendChart({
  shelterByDay,
  rocketsByDay,
}: Props) {
  const chartData = useMemo(() => {
    const merged = mergeShelterRockets(shelterByDay, rocketsByDay);
    const todayStr = todayIsraelYmd();
    const completeRows = merged.filter((r) => r.date < todayStr);
    const trendVals = linearTrendValues(completeRows.map((r) => r.shelter));
    const trendByDate = new Map(
      completeRows.map((r, i) => [r.date, trendVals[i]!])
    );
    return merged.map((r) => ({
      ...r,
      trend: trendByDate.get(r.date) ?? null,
    }));
  }, [shelterByDay, rocketsByDay]);

  if (!chartData.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          {he.chartDailyShelterTitle}
        </h3>
        <p className="text-xs text-muted-foreground">
          {he.chartDailyShelterSubtitle}
        </p>
      </div>
      <div
        className="h-72 w-full min-w-0"
        dir="ltr"
        style={{ minHeight: 0 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="gradShelterDaily" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              }
            />
            <Tooltip content={<DailyTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => String(value)}
            />
            <Area
              type="monotone"
              dataKey="shelter"
              name={he.chartShelterAlerts}
              stroke="#38bdf8"
              strokeWidth={2}
              fill="url(#gradShelterDaily)"
            />
            <Line
              type="monotone"
              dataKey="rockets"
              name={he.chartSirensLine}
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="linear"
              dataKey="trend"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
