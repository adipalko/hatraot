"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Clock,
  ShieldAlert,
  RefreshCw,
  Rocket,
} from "lucide-react";
import type { DashboardPayload } from "@/lib/types";
import { formatNumber } from "@/lib/types";
import { he } from "@/lib/i18n-he";
import MetricCard from "./MetricCard";
import DailyTrendChart from "./DailyTrendChart";
import CityFilter from "./CityFilter";
import CategoryFilter from "./CategoryFilter";
import DateRangeFilter from "./DateRangeFilter";
import ShelterByHourChart from "./ShelterByHourChart";
import ShelterDailyTrendChart from "./ShelterDailyTrendChart";
import AlertsTable from "./AlertsTable";

interface Props {
  initial: DashboardPayload;
}

export default function Dashboard({ initial }: Props) {
  const [data, setData] = useState<DashboardPayload>(initial);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState("2026-02-28");
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [shelterWeekday, setShelterWeekday] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFiltered = useCallback(
    async (
      cities: string[],
      categories: number[],
      from: string,
      to: string
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (cities.length > 0) params.set("cities", cities.join("|"));
        if (categories.length > 0)
          params.set("categories", categories.join("|"));
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);

        const qs = params.toString();
        const res = await fetch(`/api/dashboard${qs ? `?${qs}` : ""}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("fetch failed");
        const payload: DashboardPayload = await res.json();
        setData(payload);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("Failed to fetch filtered data", e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchFiltered(selectedCities, selectedCategories, dateFrom, dateTo);
  }, [selectedCities, selectedCategories, dateFrom, dateTo, fetchFiltered]);

  const dateRange = (() => {
    const dates = [
      ...new Set([
        ...(data.byDay ?? []).map((d) => d.date),
        ...(data.byDayRockets ?? []).map((d) => d.date),
      ]),
    ];
    if (dates.length === 0) return "";
    dates.sort();
    return `${dates[0]} — ${dates[dates.length - 1]}`;
  })();

  const hasFilters =
    selectedCities.length > 0 ||
    selectedCategories.length > 0 ||
    dateFrom ||
    dateTo;

  const rocketsCount =
    data.byCategory.find((c) => c.category === 1)?.count ?? 0;

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-amber/10">
            <ShieldAlert className="h-6 w-6 text-accent-amber" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {he.dashboardTitle}
          </h1>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {he.liveDataFrom}
            <a
              href="https://github.com/dleshem/israel-alerts-data"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border hover:text-accent-amber transition"
            >
              dleshem/israel-alerts-data
            </a>
          </span>
          {dateRange && (
            <span className="text-muted-foreground/70">· {dateRange}</span>
          )}
          {loading && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent-amber" />
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CityFilter
            cities={data.allCities}
            selected={selectedCities}
            onChange={setSelectedCities}
          />
          <DateRangeFilter
            dateMin={initial.dateMin}
            dateMax={initial.dateMax}
            from={dateFrom}
            to={dateTo}
            onChangeFrom={setDateFrom}
            onChangeTo={setDateTo}
          />
        </div>
        <CategoryFilter
          categories={data.filteredCategories}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
        {hasFilters && (
          <button
            onClick={() => {
              setSelectedCities([]);
              setSelectedCategories([]);
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-muted-foreground hover:text-accent-red transition"
          >
            {he.clearAllFilters}
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label={he.metricShelter}
          value={formatNumber(data.totalAlerts)}
          icon={Activity}
          accentClass="text-sky-400"
        />
        <MetricCard
          label={he.metricRockets}
          value={formatNumber(rocketsCount)}
          icon={Rocket}
          accentClass="text-accent-red"
        />
        <MetricCard
          label={he.metricPeakHour}
          value={data.peakHour}
          icon={Clock}
          accentClass="text-accent-emerald"
        />
      </div>

      {/* Charts Row 1 */}
      <DailyTrendChart
        shelterByDay={data.byDay ?? []}
        rocketsByDay={data.byDayRockets ?? []}
      />

      {/* Shelter Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ShelterByHourChart
          data={
            shelterWeekday ? data.shelterByShiftWeekday : data.shelterByShift
          }
          weekdayOnly={shelterWeekday}
          onToggle={setShelterWeekday}
        />
        <ShelterDailyTrendChart data={data.shelterDailyShift ?? []} />
      </div>

      <AlertsTable alerts={data.recentAlerts ?? []} />
    </div>
  );
}
