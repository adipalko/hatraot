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
} from "recharts";
import type { DailyShiftBucket, ShelterDailyHourBucket } from "@/lib/types";
import { formatNumber, formatTooltipNumber } from "@/lib/types";
import { he } from "@/lib/i18n-he";

interface Props {
  shiftData: DailyShiftBucket[];
  hourData: ShelterDailyHourBucket[];
}

type ShiftKey = "morning" | "day" | "evening" | "night" | "custom";

const PRESET_SHIFTS: { key: Exclude<ShiftKey, "custom">; label: string; color: string }[] = [
  { key: "morning", label: he.shiftMorning, color: "#f59e0b" },
  { key: "day",     label: he.shiftDay,     color: "#38bdf8" },
  { key: "evening", label: he.shiftEvening, color: "#a78bfa" },
  { key: "night",   label: he.shiftNight,   color: "#6366f1" },
];

const CUSTOM_COLOR = "#10b981";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

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
      <p style={{ color }}>
        {he.shiftTrendCount}: {formatNumber(row.count)}
      </p>
      {row.trend != null && Number.isFinite(row.trend) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {he.chartTrendShort}: {formatTooltipNumber(row.trend, 1)}
        </p>
      )}
    </div>
  );
}

export default function ShelterShiftTrendChart({ shiftData, hourData }: Props) {
  const [selected, setSelected] = useState<ShiftKey>("day");
  const [customFrom, setCustomFrom] = useState(8);
  const [customTo, setCustomTo] = useState(12);

  const activeColor =
    selected === "custom"
      ? CUSTOM_COLOR
      : (PRESET_SHIFTS.find((s) => s.key === selected)?.color ?? "#38bdf8");

  const activeLabel =
    selected === "custom"
      ? `${hourLabel(customFrom)}–${hourLabel(customTo)}`
      : (PRESET_SHIFTS.find((s) => s.key === selected)?.label ?? "");

  const chartData = useMemo((): Row[] => {
    const todayStr = todayIsraelYmd();

    let rows: { date: string; count: number }[];

    if (selected === "custom") {
      // Build a map from hourData for O(1) lookup
      const hourMap = new Map(hourData.map((d) => [d.date, d.byHour]));
      // Collect all dates present
      const allDates = [...hourMap.keys()].sort();
      rows = allDates.map((date) => {
        const h = hourMap.get(date) ?? new Array(24).fill(0);
        // Sum hours in [customFrom, customTo] inclusive, wrapping midnight if from > to
        let count = 0;
        if (customFrom <= customTo) {
          for (let i = customFrom; i <= customTo; i++) count += h[i] ?? 0;
        } else {
          // e.g. 22:00 – 04:00
          for (let i = customFrom; i < 24; i++) count += h[i] ?? 0;
          for (let i = 0; i <= customTo; i++) count += h[i] ?? 0;
        }
        return { date, count };
      });
    } else {
      rows = shiftData.map((d) => ({ date: d.date, count: d[selected] }));
    }

    const complete = rows.filter((r) => r.date < todayStr);
    const trendVals = linearTrendValues(complete.map((r) => r.count));
    const trendByDate = new Map(complete.map((r, i) => [r.date, trendVals[i]!]));
    return rows.map((r) => ({
      ...r,
      trend: trendByDate.get(r.date) ?? null,
    }));
  }, [shiftData, hourData, selected, customFrom, customTo]);

  if (!shiftData.length && !hourData.length) return null;

  const gradId = `gradShiftTrend_${selected}_${customFrom}_${customTo}`;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          {he.shiftTrendTitle}
        </h3>
        <p className="text-xs text-muted-foreground">{he.shiftTrendSubtitle}</p>
      </div>

      {/* Pickers row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{he.shiftTrendPickerLabel}</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SHIFTS.map((opt) => (
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
          <button
            onClick={() => setSelected("custom")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              selected === "custom"
                ? "border-transparent text-black"
                : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
            }`}
            style={
              selected === "custom"
                ? { background: CUSTOM_COLOR, borderColor: CUSTOM_COLOR }
                : {}
            }
          >
            {he.shiftTrendCustom}
          </button>
        </div>

        {/* Custom range selectors — only when custom is active */}
        {selected === "custom" && (
          <div
            dir="ltr"
            className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5"
          >
            <span className="text-xs text-muted-foreground">{he.shiftTrendCustomFrom}</span>
            <select
              value={customFrom}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCustomFrom(v);
              }}
              className="rounded bg-muted text-xs text-foreground focus:outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">{he.shiftTrendCustomTo}</span>
            <select
              value={customTo}
              onChange={(e) => setCustomTo(Number(e.target.value))}
              className="rounded bg-muted text-xs text-foreground focus:outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
        )}
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
                <stop offset="5%"  stopColor={activeColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
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
            <Tooltip content={<ShiftTooltip color={activeColor} />} />
            <Area
              type="monotone"
              dataKey="count"
              name={activeLabel}
              stroke={activeColor}
              strokeWidth={2}
              fill={`url(#${gradId})`}
            />
            <Line
              type="linear"
              dataKey="trend"
              stroke={activeColor}
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeOpacity={0.6}
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
