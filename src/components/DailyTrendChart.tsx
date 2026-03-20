"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { DayBucket } from "@/lib/types";

interface Props {
  data: DayBucket[];
}

function formatDateLabel(d: string) {
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}`;
}

export default function DailyTrendChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">
        Daily Alert Trend
      </h3>
      <div className="h-72" style={{ minWidth: 0, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: "#fafafa", fontWeight: 600 }}
              labelFormatter={formatDateLabel}
              itemStyle={{ color: "#f59e0b" }}
              formatter={(value: number) => [value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), "Alerts"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradAmber)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
