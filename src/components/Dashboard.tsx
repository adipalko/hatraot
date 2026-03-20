"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Activity, MapPin, Clock, ShieldAlert, RefreshCw } from "lucide-react";
import type { DashboardPayload } from "@/lib/types";
import { formatNumber } from "@/lib/types";
import MetricCard from "./MetricCard";
import DailyTrendChart from "./DailyTrendChart";
import TopCitiesChart from "./TopCitiesChart";
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

  const dateRange =
    data.byDay.length > 0
      ? `${data.byDay[0].date} — ${data.byDay[data.byDay.length - 1].date}`
      : "";

  const hasFilters =
    selectedCities.length > 0 ||
    selectedCategories.length > 0 ||
    dateFrom ||
    dateTo;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-amber/10">
            <ShieldAlert className="h-6 w-6 text-accent-amber" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pikud HaOref Alert Dashboard
          </h1>
        </div>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Live data from{" "}
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
            Clear all filters
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Shelter Alerts"
          value={formatNumber(data.totalAlerts)}
          icon={Activity}
          accentClass="text-accent-amber"
        />
        <MetricCard
          label="Most Targeted City"
          value={data.topCity}
          icon={MapPin}
          accentClass="text-accent-red"
        />
        <MetricCard
          label="Peak Alert Hour"
          value={data.peakHour}
          icon={Clock}
          accentClass="text-accent-emerald"
        />
      </div>

      {/* Charts Row 1 */}
      <DailyTrendChart data={data.byDay} />

      {/* Shelter Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ShelterByHourChart
          data={shelterWeekday ? data.shelterByShiftWeekday : data.shelterByShift}
          weekdayOnly={shelterWeekday}
          onToggle={setShelterWeekday}
        />
        <ShelterDailyTrendChart data={data.shelterDailyShift} />
      </div>

      {/* Charts Row 2 + Table */}
      <div className={`grid grid-cols-1 gap-6 ${selectedCities.length === 0 ? "lg:grid-cols-2" : ""}`}>
        {selectedCities.length === 0 && (
          <TopCitiesChart data={data.topCities} />
        )}
        <AlertsTable alerts={data.recentAlerts} />
      </div>
    </div>
  );
}
