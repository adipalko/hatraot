import { NextRequest, NextResponse } from "next/server";
import {
  fetchAlerts,
  filterAlerts,
  computePayload,
  categoryLabel,
} from "@/lib/alerts";
import type { CategoryBucket } from "@/lib/alerts";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const citiesParam = params.get("cities");
  const categoriesParam = params.get("categories");
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");

  const allAlerts = await fetchAlerts();

  // Global city list (always from full set)
  const cityCount = new Map<string, number>();
  for (const a of allAlerts) {
    cityCount.set(a.city, (cityCount.get(a.city) || 0) + 1);
  }
  const allCities = [...cityCount.keys()].sort(
    (a, b) => (cityCount.get(b) || 0) - (cityCount.get(a) || 0)
  );

  // Category counts from city + date filtered set (excludes category filter)
  // so the category buttons reflect what's available in the current city/date selection.
  // Uses the same time-window deduplication as computePayload so counts match the metrics.
  const cityDateFiltered = filterAlerts(allAlerts, {
    cities: citiesParam ? citiesParam.split("|") : undefined,
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
  });

  const seenForCat = new Set<string>();
  const catCount = new Map<number, number>();
  for (const a of cityDateFiltered) {
    const mm = parseInt(a.time.substring(3, 5), 10);
    const windowMinutes = a.category === 1 ? 15 : a.category === 14 ? 1 : 2;
    const bucket = Math.floor(mm / windowMinutes);
    const key = `${a.date}|${a.time.substring(0, 2)}:${bucket}|${a.category}`;
    if (!seenForCat.has(key)) {
      seenForCat.add(key);
      catCount.set(a.category, (catCount.get(a.category) || 0) + 1);
    }
  }
  const filteredCategories: CategoryBucket[] = [...catCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: categoryLabel(category),
      count,
    }));

  // Full filter (including category) for the rest of the dashboard
  const filtered = filterAlerts(allAlerts, {
    cities: citiesParam ? citiesParam.split("|") : undefined,
    categories: categoriesParam
      ? categoriesParam.split("|").map(Number)
      : undefined,
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
  });

  const payload = computePayload(filtered, {
    allCities,
    filteredCategories,
  });
  return NextResponse.json(payload);
}
