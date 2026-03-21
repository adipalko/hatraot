"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { DailyShiftBucket } from "@/lib/types";
import { he } from "@/lib/i18n-he";

interface Props {
  data: DailyShiftBucket[];
}

const SHIFT_META = [
  { key: "morning" as const, color: "#f59e0b" },
  { key: "day" as const, color: "#38bdf8" },
  { key: "evening" as const, color: "#a78bfa" },
  { key: "night" as const, color: "#1e6091" },
];

function shiftLegendLabel(key: (typeof SHIFT_META)[number]["key"]): string {
  switch (key) {
    case "morning":
      return he.shiftMorning;
    case "day":
      return he.shiftDay;
    case "evening":
      return he.shiftEvening;
    default:
      return he.shiftNight;
  }
}

function formatDateLabel(d: string) {
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}`;
}

export default function ShelterDailyTrendChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          {he.chartDailyShiftTitle}
        </h3>
        <p className="text-xs text-muted-foreground">
          {he.chartDailyShiftSubtitle}
        </p>
      </div>
      <div className="h-72 w-full min-w-0" dir="ltr" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
          >
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
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: "#fafafa", fontWeight: 600 }}
              labelFormatter={(label) => formatDateLabel(String(label))}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            {SHIFT_META.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={shiftLegendLabel(s.key)}
                stackId="1"
                fill={s.color}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
