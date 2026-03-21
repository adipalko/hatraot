"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import type { ShelterShiftBucket } from "@/lib/types";
import { formatNumber } from "@/lib/types";
import { he } from "@/lib/i18n-he";

interface Props {
  data: ShelterShiftBucket[];
  weekdayOnly: boolean;
  onToggle: (v: boolean) => void;
}

const SHIFT_COLORS = ["#f59e0b", "#38bdf8", "#a78bfa", "#1e3a5f"];

function ShiftBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ShelterShiftBucket; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (!row) return null;
  const avg = payload[0].value ?? row.avg;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-xl">
      <p className="mb-1 font-semibold text-foreground">{row.label}</p>
      <p className="text-muted-foreground">
        {he.tooltipAvgPerDay}{" "}
        <span className="font-mono font-semibold text-accent-sky">
          {formatNumber(Number(avg))}
        </span>
      </p>
    </div>
  );
}

export default function ShelterByHourChart({ data, weekdayOnly, onToggle }: Props) {
  if (!data || data.length === 0) return null;

  const peak = data.reduce(
    (max, b) => (b.avg > max ? b.avg : max),
    0
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {he.chartShiftAvgTitle}
          </h3>
          <p className="text-xs text-muted-foreground">
            {he.chartShiftAvgSubtitle}
          </p>
        </div>
        <label
          dir="ltr"
          className="inline-flex cursor-pointer items-center gap-2 text-sm select-none"
        >
          <input
            type="checkbox"
            checked={weekdayOnly}
            onChange={(e) => onToggle(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className="relative h-5 w-9 rounded-full bg-muted transition
              after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4
              after:rounded-full after:bg-muted-foreground after:transition
              peer-checked:bg-accent-sky/30 peer-checked:after:translate-x-4
              peer-checked:after:bg-accent-sky"
          />
          <span className="text-muted-foreground">{he.shiftWeekdaysOnly}</span>
        </label>
      </div>
      <div className="h-64 w-full min-w-0" dir="ltr" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              content={<ShiftBarTooltip />}
              cursor={{ fill: "rgba(63, 63, 70, 0.35)" }}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={entry.shift}
                  fill={entry.avg === peak && peak > 0 ? SHIFT_COLORS[i] : SHIFT_COLORS[i]}
                  fillOpacity={entry.avg === peak && peak > 0 ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
