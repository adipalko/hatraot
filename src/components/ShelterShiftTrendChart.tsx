"use client";

import { useState, useMemo, Fragment } from "react";
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
import type { DailyShiftBucket, ShelterDailyHourBucket } from "@/lib/types";
import { formatNumber, formatTooltipNumber } from "@/lib/types";
import { he } from "@/lib/i18n-he";

interface Props {
  shiftData: DailyShiftBucket[];
  hourData: ShelterDailyHourBucket[];
}

type PresetKey = "morning" | "day" | "evening" | "night";

const PRESET_SHIFTS: { key: PresetKey; label: string; color: string }[] = [
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
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
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

// A series descriptor used at render time
interface SeriesMeta {
  dataKey: string;   // e.g. "morning", "custom"
  trendKey: string;  // e.g. "morning_trend"
  label: string;
  color: string;
}

// ---- Tooltip ---------------------------------------------------------------
type TooltipPayloadItem = {
  dataKey: string;
  value: number;
  color: string;
  name: string;
};

function MultiTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  series: SeriesMeta[];
}) {
  if (!active || !payload?.length) return null;
  const date = label ? formatDateLabel(String(label)) : "";

  // Only show count rows (not trend rows)
  const countItems = payload.filter((p) =>
    series.some((s) => s.dataKey === p.dataKey)
  );

  return (
    <div
      dir="rtl"
      className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-xl"
    >
      <p className="mb-2 font-semibold text-foreground">{date}</p>
      {countItems.map((item) => {
        const s = series.find((s) => s.dataKey === item.dataKey);
        const trendItem = payload.find(
          (p) => p.dataKey === s?.trendKey
        );
        return (
          <div key={item.dataKey} className="mb-1">
            <span style={{ color: item.color }}>
              {s?.label ?? item.dataKey}: {formatNumber(item.value)}
            </span>
            {trendItem?.value != null &&
              Number.isFinite(trendItem.value) && (
                <span className="mr-2 text-xs text-muted-foreground">
                  ({he.chartTrendShort}: {formatTooltipNumber(trendItem.value, 1)})
                </span>
              )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Main component --------------------------------------------------------
export default function ShelterShiftTrendChart({ shiftData, hourData }: Props) {
  const [activePresets, setActivePresets] = useState<Set<PresetKey>>(
    new Set(["day"])
  );
  const [customActive, setCustomActive] = useState(false);
  const [customFrom, setCustomFrom] = useState(8);
  const [customTo, setCustomTo] = useState(12);

  const togglePreset = (key: PresetKey) => {
    setActivePresets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Keep at least one active if no custom
        if (next.size === 1 && !customActive) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleCustom = () => {
    setCustomActive((prev) => {
      // Keep at least one active
      if (prev && activePresets.size === 0) return prev;
      return !prev;
    });
  };

  // Build the series list that are currently active
  const activeSeries: SeriesMeta[] = useMemo(() => {
    const list: SeriesMeta[] = [];
    for (const p of PRESET_SHIFTS) {
      if (activePresets.has(p.key)) {
        list.push({
          dataKey: p.key,
          trendKey: `${p.key}_trend`,
          label: p.label,
          color: p.color,
        });
      }
    }
    if (customActive) {
      list.push({
        dataKey: "custom",
        trendKey: "custom_trend",
        label: `${hourLabel(customFrom)}–${hourLabel(customTo)}`,
        color: CUSTOM_COLOR,
      });
    }
    return list;
  }, [activePresets, customActive, customFrom, customTo]);

  // Build chart rows: one entry per date with a field per active series
  const chartData = useMemo(() => {
    const todayStr = todayIsraelYmd();

    // Merge all dates from shiftData + hourData
    const dateSet = new Set<string>();
    shiftData.forEach((d) => dateSet.add(d.date));
    hourData.forEach((d) => dateSet.add(d.date));
    const dates = [...dateSet].sort();

    const shiftMap = new Map(shiftData.map((d) => [d.date, d]));
    const hourMap = new Map(hourData.map((d) => [d.date, d.byHour]));

    // Per-series counts per date (for trend calculation)
    const seriesCounts: Record<string, number[]> = {};
    for (const s of activeSeries) seriesCounts[s.dataKey] = [];

    const rawRows = dates.map((date) => {
      const row: Record<string, string | number | null> = { date };
      const sd = shiftMap.get(date);
      const hd = hourMap.get(date) ?? new Array(24).fill(0);

      for (const s of activeSeries) {
        let count = 0;
        if (s.dataKey === "custom") {
          if (customFrom <= customTo) {
            for (let i = customFrom; i <= customTo; i++) count += hd[i] ?? 0;
          } else {
            for (let i = customFrom; i < 24; i++) count += hd[i] ?? 0;
            for (let i = 0; i <= customTo; i++) count += hd[i] ?? 0;
          }
        } else {
          count = sd ? sd[s.dataKey as PresetKey] : 0;
        }
        row[s.dataKey] = count;
        seriesCounts[s.dataKey]!.push(count);
      }
      return row;
    });

    // Compute trend per series (only on complete days)
    const completeIdxs = dates
      .map((d, i) => (d < todayStr ? i : -1))
      .filter((i) => i >= 0);

    const trendMaps: Record<string, Map<string, number>> = {};
    for (const s of activeSeries) {
      const completeCounts = completeIdxs.map((i) => seriesCounts[s.dataKey]![i]!);
      const trendVals = linearTrendValues(completeCounts);
      trendMaps[s.dataKey] = new Map(
        completeIdxs.map((dateIdx, ti) => [dates[dateIdx]!, trendVals[ti]!])
      );
    }

    // Attach trend fields
    return rawRows.map((row, i) => {
      const date = dates[i]!;
      for (const s of activeSeries) {
        row[s.trendKey] = trendMaps[s.dataKey]?.get(date) ?? null;
      }
      return row;
    });
  }, [shiftData, hourData, activeSeries, customFrom, customTo]);

  if (!shiftData.length && !hourData.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          {he.shiftTrendTitle}
        </h3>
        <p className="text-xs text-muted-foreground">{he.shiftTrendSubtitle}</p>
      </div>

      {/* Pickers */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{he.shiftTrendPickerLabel}</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SHIFTS.map((opt) => {
            const active = activePresets.has(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => togglePreset(opt.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-transparent text-black"
                    : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
                style={active ? { background: opt.color, borderColor: opt.color } : {}}
              >
                {opt.label}
              </button>
            );
          })}
          <button
            onClick={toggleCustom}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              customActive
                ? "border-transparent text-black"
                : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
            }`}
            style={customActive ? { background: CUSTOM_COLOR, borderColor: CUSTOM_COLOR } : {}}
          >
            {he.shiftTrendCustom}
          </button>
        </div>

        {/* Custom range — shown whenever customActive, even alongside presets */}
        {customActive && (
          <div
            dir="ltr"
            className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5"
          >
            <span className="text-xs text-muted-foreground">{he.shiftTrendCustomFrom}</span>
            <select
              value={customFrom}
              onChange={(e) => setCustomFrom(Number(e.target.value))}
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
              {activeSeries.map((s) => (
                <linearGradient
                  key={s.dataKey}
                  id={`grad_${s.dataKey}`}
                  x1="0" y1="0" x2="0" y2="1"
                >
                  <stop offset="5%"  stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
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
            <Tooltip
              content={
                <MultiTooltip series={activeSeries} />
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => String(value)}
            />
            {activeSeries.map((s) => (
              <Fragment key={s.dataKey}>
                <Area
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad_${s.dataKey})`}
                  fillOpacity={activeSeries.length > 1 ? 0.6 : 1}
                />
                <Line
                  type="linear"
                  dataKey={s.trendKey}
                  stroke={s.color}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  strokeOpacity={0.7}
                  dot={false}
                  connectNulls={false}
                  legendType="none"
                />
              </Fragment>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
