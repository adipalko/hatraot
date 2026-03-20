"use client";

import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accentClass?: string;
}

export default function MetricCard({
  label,
  value,
  icon: Icon,
  accentClass = "text-accent-amber",
}: MetricCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted ${accentClass}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}
