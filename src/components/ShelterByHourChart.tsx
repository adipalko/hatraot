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

interface Props {
  data: ShelterShiftBucket[];
  weekdayOnly: boolean;
  onToggle: (v: boolean) => void;
}

const SHIFT_COLORS = ["#f59e0b", "#38bdf8", "#a78bfa", "#1e3a5f"];

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
            Avg. Shelter Alerts per Shift
          </h3>
          <p className="text-xs text-muted-foreground">
            Average daily &quot;Prepare / Stay Near Shelter&quot; alerts by shift
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm select-none">
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
          <span className="text-muted-foreground">Sun–Thu only</span>
        </label>
      </div>
      <div className="h-64" style={{ minWidth: 0, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
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
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: "#fafafa", fontWeight: 600 }}
              formatter={(value) => [
                formatNumber(Number(value)),
                "Avg. Shelter Alerts",
              ]}
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
