"use client";

import type { CategoryBucket } from "@/lib/types";
import { formatNumber } from "@/lib/types";

interface Props {
  categories: CategoryBucket[];
  selected: number[];
  onChange: (categories: number[]) => void;
}

const CATEGORY_COLORS: Record<number, string> = {
  1: "bg-red-500/20 text-red-400 border-red-500/30",
  2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  7: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  10: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  14: "bg-sky-500/20 text-sky-400 border-sky-500/30",
};

function colorFor(cat: number): string {
  return CATEGORY_COLORS[cat] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

export default function CategoryFilter({
  categories,
  selected,
  onChange,
}: Props) {
  const toggle = (cat: number) => {
    onChange(
      selected.includes(cat)
        ? selected.filter((c) => c !== cat)
        : [...selected, cat]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const isActive =
          selected.length === 0 || selected.includes(c.category);
        const isExplicit = selected.includes(c.category);
        return (
          <button
            key={c.category}
            onClick={() => toggle(c.category)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              isExplicit
                ? colorFor(c.category)
                : isActive
                  ? "border-border bg-card text-card-foreground hover:border-accent-amber/40"
                  : "border-border/50 bg-card/50 text-muted-foreground/50 hover:border-border"
            }`}
          >
            <span>{c.label}</span>
            <span className="font-mono opacity-70">
              {formatNumber(c.count)}
            </span>
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs text-muted-foreground hover:text-accent-red transition px-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}
