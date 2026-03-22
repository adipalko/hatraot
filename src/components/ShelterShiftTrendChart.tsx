"use client";

import { useState, useMemo } from "react";
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
import type { DailyShiftBucket } from "@/lib/types";
import { formatNumber, formatTooltipNumber } from "@/lib/types";
import { he } from "@/lib/i18n-he";

interface Props {
  data: DailyShiftBucket[];
}

type ShiftKey = "morning" | "day" | "evening" | "night";

const SHIFT_OPTIONS: { key: ShiftKey; label: string; color: string }[] = [
  { key: "morning", label: he.shiftMorning, color: "#f59e0b" },
  { key: "day",     label: he.shiftDay,     color: "#38bdf8" },
  { key: "evening", label: he.shiftEvening, color: "#a78bfa" },
  { key: "night",   label: he.shiftNight,   color: "#6366f1" },
];

function formatDateLabel(d: string) {
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function todayIsraelYmd(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jerusalem",
  });
}

function linearTrendValues(counts: number[]): number[] {
  const n = counts.length;
  if (n === 0) return [];
  if (n === 1) return [counts[0]!];
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += counts[i]!;
    sumXY += i * counts[i]!; sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) return counts.map(() => sumY / n);
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return counts.map((_, i) => Math.max(0, m * i + b));
}

type Row = { date: string; count: number; trend: number | null };

function ShiftTooltip({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Row }>;
  label?: string;
  color: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div
      dir="rtl"
      className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-xl"
    >
      <p className="mb-1.5 font-semibold text-foreground">
        {label ? formatDateLabel(String(label)) : ""}
      </p>
      <p style={{ color }}>{he.shiftTrendCount}: {formatNumber(row.count)}</p>
      {row.trend != null && Number.isFinite(row.trend) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {he.chartTrendShort}: {formatTooltipNumber(row.trend, 1)}
        </p>
      )}
    </div>
  );
}

export default function ShelterShiftTrendChart({ data }: Props) {
  const [selected, setSelected] = useState<ShiftKey>("day");

  const shift = SHIFT_OPTIONS.find((s) => s.key === selected)!;

  const chartData = useMemo((): Row[] => {
    const todayStr = todayIsraelYmd();
    const rows = data.map((d) => ({ date: d.date, count: d[selected] }));
    const complete = rows.filter((r) => r.date < todayStr);
    const trendVals = linearTrendValues(complete.map((r) => r.count));
    const trendByDate = new Map(complete.map((r, i) => [r.date, trendVals[i]!]));
    return rows.map((r) => ({
      ...r,
      trend: trendByDate.get(r.date) ?? null,
    }));
  }, [data, selected]);

  if (!data.length) return null;

  const gradId = `gradShiftTrend_${selected}`;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      {/* Header + picker */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {he.shiftTrendTitle}
          </h3>
          <p className="text-xs text-muted-foreground">
            {he.shiftTrendSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">{he.shiftTrendPickerLabel}</span>
          <div className="flex flex-wrap gap-1.5">
            {SHIFT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  selected === opt.key
                    ? "border-transparent text-black"
                    : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
                style={
                  selected === opt.key
                    ? { background: opt.color, borderColor: opt.color }
                    : {}
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full min-w-0" dir="ltr" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={shift.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={shift.color} stopOpacity={0} />
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
            <Tooltip content={<ShiftTooltip color={shift.color} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => String(value)}
            />
            <Area
              type="monotone"
              dataKey="count"
              name={shift.label}
              stroke={shift.color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
            />
            <Line
              type="linear"
              dataKey="trend"
              stroke={shift.color}
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeOpacity={0.65}
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
