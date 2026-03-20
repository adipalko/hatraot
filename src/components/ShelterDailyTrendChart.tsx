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

interface Props {
  data: DailyShiftBucket[];
}

const SHIFTS = [
  { key: "morning" as const, label: "Morning (06–08)", color: "#f59e0b" },
  { key: "day" as const, label: "Day (08–16)", color: "#38bdf8" },
  { key: "evening" as const, label: "Evening (16–21)", color: "#a78bfa" },
  { key: "night" as const, label: "Night (21–06)", color: "#1e6091" },
];

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
          Daily Shelter Alerts by Shift
        </h3>
        <p className="text-xs text-muted-foreground">
          &quot;Prepare / Stay Near Shelter&quot; alerts per day, broken down by shift
        </p>
      </div>
      <div className="h-72" style={{ minWidth: 0, minHeight: 0 }}>
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
            {SHIFTS.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
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
