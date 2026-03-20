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
import type { CityBucket } from "@/lib/types";

const PALETTE = [
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
  "#fbbf24",
  "#fcd34d",
  "#ca8a04",
  "#a16207",
  "#854d0e",
];

interface Props {
  data: CityBucket[];
}

export default function TopCitiesChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">
        Top 10 Cities by Alert Volume
      </h3>
      <div className="h-80" style={{ minWidth: 0, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              }
            />
            <YAxis
              type="category"
              dataKey="city"
              width={120}
              tick={{ fontSize: 12, direction: "rtl" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{
                color: "#fafafa",
                fontWeight: 600,
                direction: "rtl",
              }}
              itemStyle={{ color: "#f59e0b" }}
              formatter={(value: number) => [value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), "Alerts"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
