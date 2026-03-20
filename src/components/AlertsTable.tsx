"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Alert } from "@/lib/types";
import { categoryLabel } from "@/lib/types";

type SortKey = "city" | "date" | "time" | "category";
type SortDir = "asc" | "desc";

const CAT_DOT: Record<number, string> = {
  1: "bg-red-400",
  2: "bg-orange-400",
  7: "bg-purple-400",
  10: "bg-rose-400",
  14: "bg-sky-400",
};

interface Props {
  alerts: Alert[];
}

export default function AlertsTable({ alerts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...alerts]
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "city") {
          cmp = a.city.localeCompare(b.city, "he");
        } else if (sortKey === "date") {
          cmp = (a.date + "T" + a.time).localeCompare(b.date + "T" + b.time);
        } else if (sortKey === "time") {
          cmp = a.time.localeCompare(b.time);
        } else {
          cmp = a.category - b.category;
        }
        return sortDir === "asc" ? cmp : -cmp;
      })
      .slice(0, 20);
  }, [alerts, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-accent-amber" />
    ) : (
      <ChevronDown className="h-3 w-3 text-accent-amber" />
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-lg shadow-black/20 overflow-hidden">
      <h3 className="px-5 pt-5 pb-3 text-lg font-semibold text-card-foreground">
        Recent Alerts
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("city")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition"
                >
                  City <SortIcon col="city" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("category")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition"
                >
                  Type <SortIcon col="category" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("date")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition"
                >
                  Date <SortIcon col="date" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => toggleSort("time")}
                  className="inline-flex items-center gap-1 hover:text-foreground transition"
                >
                  Time <SortIcon col="time" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((alert, i) => (
              <tr
                key={`${alert.date}-${alert.time}-${alert.city}-${i}`}
                className="border-b border-border/50 transition hover:bg-muted/30"
              >
                <td className="px-4 py-2.5 font-medium" dir="rtl">
                  {alert.city}
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${CAT_DOT[alert.category] ?? "bg-zinc-400"}`}
                    />
                    {categoryLabel(alert.category)}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">
                  {alert.date}
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">
                  {alert.time}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-muted-foreground"
                >
                  No alerts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
