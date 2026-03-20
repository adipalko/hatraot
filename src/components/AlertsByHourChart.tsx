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
import type { HourStackedBucket } from "@/lib/types";
import { categoryLabel, categoryChartColor, formatNumber } from "@/lib/types";

interface Props {
  data: HourStackedBucket[];
  categoriesInData: number[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((s, p) => s + (p.value || 0), 0);

  return (
    <div className="rounded-lg border border-[#3f3f46] bg-[#18181b] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-semibold text-white">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((p) => {
          const cat = parseInt(p.dataKey.replace("cat_", ""), 10);
          return (
            <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: p.color }}
              />
              <span className="text-[#a1a1aa]">{categoryLabel(cat)}</span>
              <span className="ml-auto font-mono text-white">
                {formatNumber(p.value)}
              </span>
            </div>
          );
        })}
      <div className="mt-1.5 border-t border-[#3f3f46] pt-1.5 font-semibold text-white">
        Total: {formatNumber(total)}
      </div>
    </div>
  );
}

export default function AlertsByHourChart({
  data,
  categoriesInData,
}: Props) {
  // Sort categories so active threats render on top (most important first)
  const sortedCats = [...categoriesInData].sort((a, b) => {
    const order: Record<number, number> = { 1: 0, 2: 1, 10: 2, 7: 3, 14: 4 };
    return (order[a] ?? 6) - (order[b] ?? 6);
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">
        Alerts by Hour of Day
      </h3>
      <div className="h-80" style={{ minWidth: 0, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval={1}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value: string) => {
                const cat = parseInt(value.replace("cat_", ""), 10);
                return categoryLabel(cat);
              }}
            />
            {sortedCats.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={`cat_${cat}`}
                stackId="hour"
                fill={categoryChartColor(cat)}
                radius={
                  i === 0 ? [3, 3, 0, 0] : undefined
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
