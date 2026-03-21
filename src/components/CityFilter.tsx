"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { he } from "@/lib/i18n-he";

interface Props {
  cities: string[];
  selected: string[];
  onChange: (cities: string[]) => void;
}

export default function CityFilter({ cities, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [close]);

  const filtered = cities.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (city: string) => {
    onChange(
      selected.includes(city)
        ? selected.filter((c) => c !== city)
        : [...selected, city]
    );
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition hover:border-accent-amber/50 focus:outline-none focus:ring-2 focus:ring-accent-amber/30"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-start text-muted-foreground">
          {selected.length === 0
            ? he.cityFilterPlaceholder
            : selected.length === 1
              ? he.cityOneSelected
              : he.cityManySelected(selected.length)}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1 rounded-md bg-accent-amber-dim/50 px-2 py-0.5 text-xs font-medium text-accent-amber"
            >
              <span dir="rtl">{city}</span>
              <button
                onClick={() => toggle(city)}
                className="hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:text-accent-red transition"
          >
            {he.clearAll}
          </button>
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl shadow-black/40">
          <div className="border-b border-border p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={he.searchCities}
              className="w-full rounded-md bg-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {he.noCitiesFound}
              </li>
            )}
            {filtered.slice(0, 100).map((city) => {
              const isSelected = selected.includes(city);
              return (
                <li key={city}>
                  <button
                    onClick={() => toggle(city)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition hover:bg-muted ${
                      isSelected ? "text-accent-amber" : "text-card-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-accent-amber bg-accent-amber text-black"
                          : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span dir="rtl">{city}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
