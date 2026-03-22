import type {
  Alert,
  CategoryBucket,
  DailyShiftBucket,
  DashboardPayload,
  HourBucket,
  HourStackedBucket,
  ShelterDailyHourBucket,
  ShelterHourBucket,
  ShelterShiftBucket,
} from "./types";
import { categoryLabel, SHELTER_SHIFTS } from "./types";

export type { Alert, CategoryBucket, DashboardPayload, HourBucket };
export { categoryLabel };

const CSV_URL =
  "https://raw.githubusercontent.com/dleshem/israel-alerts-data/main/israel-alerts.csv";

let alertsCache: { alerts: Alert[]; ts: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function parseCsvLine(line: string): { city: string; rest: string } | null {
  if (!line.trim()) return null;

  let city: string;
  let rest: string;

  if (line.startsWith('"')) {
    let i = 1;
    let buf = "";
    while (i < line.length) {
      if (line[i] === '"') {
        if (line[i + 1] === '"') {
          buf += '"';
          i += 2;
        } else {
          break;
        }
      } else {
        buf += line[i];
        i++;
      }
    }
    city = buf;
    rest = line.substring(i + 2);
  } else {
    const idx = line.indexOf(",");
    if (idx === -1) return null;
    city = line.substring(0, idx);
    rest = line.substring(idx + 1);
  }

  return { city: city.trim(), rest };
}

function parseAlertFromRest(city: string, rest: string): Alert | null {
  const m = rest.match(/^(\d{2})\.(\d{2})\.(\d{4}),(\d{2}:\d{2}:\d{2}),/);
  if (!m) return null;

  const date = `${m[3]}-${m[2]}-${m[1]}`;
  const time = m[4];

  const afterTime = rest.substring(m[0].length);
  const cm = afterTime.match(/^[^,]+,(\d+),([^,]+),/);
  const category = cm ? parseInt(cm[1], 10) : 0;
  const categoryDesc = cm ? cm[2].trim() : "";

  return { city, date, time, category, categoryDesc };
}

function cutoffDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 33);
  return d.toISOString().slice(0, 10);
}

export async function fetchAlerts(): Promise<Alert[]> {
  const now = Date.now();
  if (alertsCache && now - alertsCache.ts < CACHE_TTL) {
    return alertsCache.alerts;
  }

  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);

  const text = await res.text();
  const lines = text.split("\n");

  const minDate = cutoffDate();
  const alerts: Alert[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCsvLine(lines[i]);
    if (!parsed) continue;

    const alert = parseAlertFromRest(parsed.city, parsed.rest);
    if (!alert) continue;

    if (alert.date >= minDate && alert.category !== 13) {
      alerts.push(alert);
    }
  }

  alerts.sort((a, b) => {
    const ka = a.date + "T" + a.time;
    const kb = b.date + "T" + b.time;
    return kb.localeCompare(ka);
  });

  alertsCache = { alerts, ts: now };
  return alerts;
}

export interface FilterParams {
  cities?: string[];
  categories?: number[];
  dateFrom?: string;
  dateTo?: string;
}

export function filterAlerts(alerts: Alert[], params: FilterParams): Alert[] {
  let result = alerts;

  if (params.cities && params.cities.length > 0) {
    const set = new Set(params.cities);
    result = result.filter((a) => set.has(a.city));
  }

  if (params.categories && params.categories.length > 0) {
    const set = new Set(params.categories);
    result = result.filter((a) => set.has(a.category));
  }

  if (params.dateFrom) {
    const from = params.dateFrom;
    result = result.filter((a) => a.date >= from);
  }

  if (params.dateTo) {
    const to = params.dateTo;
    result = result.filter((a) => a.date <= to);
  }

  return result;
}

export function computePayload(
  alerts: Alert[],
  opts?: {
    allCities?: string[];
    filteredCategories?: CategoryBucket[];
  }
): DashboardPayload {
  // Deduplicate alerts into unique events:
  // - Rockets (cat 1): 15-minute bucket — a salvo can span many minutes as
  //   alerts propagate to distant cities.
  // - All other categories: 2-minute bucket — alerts cluster more tightly.
  const seenEvents = new Set<string>();
  const uniqueAlerts: Alert[] = [];
  for (const a of alerts) {
    const mm = parseInt(a.time.substring(3, 5), 10);
    const windowMinutes = a.category === 1 ? 15 : a.category === 14 ? 1 : 2;
    const bucket = Math.floor(mm / windowMinutes);
    const key = `${a.date}|${a.time.substring(0, 2)}:${bucket}|${a.category}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      uniqueAlerts.push(a);
    }
  }

  const hourCounts = new Array(24).fill(0);
  const cityMap = new Map<string, number>();
  const dayMap = new Map<string, number>();
  /** Daily counts for category 14 — daily trend chart */
  const shelterDayMap = new Map<string, number>();
  /** Daily counts for category 1 (רקטות וטילים) — daily trend chart */
  const rocketsDayMap = new Map<string, number>();
  const catMap = new Map<number, number>();

  // hour -> category -> count
  const hourCatMap: Map<number, Map<number, number>> = new Map();

  // City map uses original alerts (all city-rows) so we know which cities were alerted
  for (const a of alerts) {
    cityMap.set(a.city, (cityMap.get(a.city) || 0) + 1);
  }

  // All other metrics use deduplicated events
  for (const a of uniqueAlerts) {
    const h = parseInt(a.time.substring(0, 2), 10);
    hourCounts[h]++;
    dayMap.set(a.date, (dayMap.get(a.date) || 0) + 1);
    if (a.category === 14) {
      shelterDayMap.set(
        a.date,
        (shelterDayMap.get(a.date) || 0) + 1
      );
    }
    if (a.category === 1) {
      rocketsDayMap.set(
        a.date,
        (rocketsDayMap.get(a.date) || 0) + 1
      );
    }
    catMap.set(a.category, (catMap.get(a.category) || 0) + 1);

    if (!hourCatMap.has(h)) hourCatMap.set(h, new Map());
    const hm = hourCatMap.get(h)!;
    hm.set(a.category, (hm.get(a.category) || 0) + 1);
  }

  // Collect all category IDs present in the data
  const categoriesInData = [...catMap.keys()].sort((a, b) => a - b);

  const byHour: HourBucket[] = hourCounts.map((count, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    count,
  }));

  // Build stacked hour data: { hour, label, cat_1: n, cat_2: n, ... }
  const byHourStacked: HourStackedBucket[] = Array.from({ length: 24 }, (_, hour) => {
    const bucket: HourStackedBucket = {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
    };
    const hm = hourCatMap.get(hour);
    if (hm) {
      for (const [cat, count] of hm) {
        (bucket as unknown as Record<string, number>)[`cat_${cat}`] = count;
      }
    }
    return bucket;
  });

  // Ranks 2–11: omit the single busiest city so differences stay visible on the axis
  const allCities =
    opts?.allCities ??
    [...cityMap.keys()].sort(
      (a, b) => (cityMap.get(b) || 0) - (cityMap.get(a) || 0)
    );

  const byCategory: CategoryBucket[] = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: categoryLabel(category),
      count,
    }));

  const filteredCategories = opts?.filteredCategories ?? byCategory;

  const byDay = [...shelterDayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  const byDayRockets = [...rocketsDayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  let peakIdx = 0;
  for (let i = 1; i < 24; i++) {
    if (hourCounts[i] > hourCounts[peakIdx]) peakIdx = i;
  }

  // Average "Prepare / Stay Near Shelter" (cat 14) per hour of day
  const numDays = dayMap.size || 1;
  const shelterHourTotals = new Array(24).fill(0);
  const shelterHourTotalsWd = new Array(24).fill(0);
  const weekdayDates = new Set<string>();
  for (const d of dayMap.keys()) {
    const dow = new Date(d + "T00:00:00").getDay();
    if (dow >= 0 && dow <= 4) weekdayDates.add(d);
  }
  const numWeekdays = weekdayDates.size || 1;

  for (const a of uniqueAlerts) {
    if (a.category !== 14) continue;
    const h = parseInt(a.time.substring(0, 2), 10);
    shelterHourTotals[h]++;
    if (weekdayDates.has(a.date)) shelterHourTotalsWd[h]++;
  }

  const shelterByHour: ShelterHourBucket[] = shelterHourTotals.map(
    (total, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      avg: Math.round((total / numDays) * 10) / 10,
    })
  );

  const shelterByHourWeekday: ShelterHourBucket[] = shelterHourTotalsWd.map(
    (total, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      avg: Math.round((total / numWeekdays) * 10) / 10,
    })
  );

  const shelterByShift: ShelterShiftBucket[] = SHELTER_SHIFTS.map(
    (s, idx) => {
      const total = s.hours.reduce((sum, h) => sum + shelterHourTotals[h], 0);
      return {
        shift: idx,
        label: s.label,
        avg: Math.round((total / numDays) * 10) / 10,
      };
    }
  );

  const shelterByShiftWeekday: ShelterShiftBucket[] = SHELTER_SHIFTS.map(
    (s, idx) => {
      const total = s.hours.reduce((sum, h) => sum + shelterHourTotalsWd[h], 0);
      return {
        shift: idx,
        label: s.label,
        avg: Math.round((total / numWeekdays) * 10) / 10,
      };
    }
  );

  // Daily shelter alerts broken down by shift (index matches DailyShiftBucket keys)
  const SHIFT_KEYS = ["morning", "day", "evening", "night"] as const;
  const hourToShift = new Map<number, (typeof SHIFT_KEYS)[number]>();
  SHELTER_SHIFTS.forEach((s, idx) => {
    const key = SHIFT_KEYS[idx];
    for (const h of s.hours) hourToShift.set(h, key);
  });

  const dailyShiftMap = new Map<string, { morning: number; day: number; evening: number; night: number }>();
  for (const a of uniqueAlerts) {
    if (a.category !== 14) continue;
    const h = parseInt(a.time.substring(0, 2), 10);
    const shift = hourToShift.get(h) ?? ("night" as const);
    if (!dailyShiftMap.has(a.date)) {
      dailyShiftMap.set(a.date, { morning: 0, day: 0, evening: 0, night: 0 });
    }
    const entry = dailyShiftMap.get(a.date)!;
    entry[shift as keyof typeof entry]++;
  }

  const shelterDailyShift: DailyShiftBucket[] = [...dailyShiftMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, counts]) => ({ date, ...counts }));

  // Per-day hourly breakdown for cat 14 (for custom time window chart)
  const dailyHourMap = new Map<string, number[]>();
  for (const a of uniqueAlerts) {
    if (a.category !== 14) continue;
    const h = parseInt(a.time.substring(0, 2), 10);
    if (!dailyHourMap.has(a.date)) {
      dailyHourMap.set(a.date, new Array(24).fill(0));
    }
    dailyHourMap.get(a.date)![h]++;
  }
  const shelterDailyByHour: ShelterDailyHourBucket[] = [...dailyHourMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, byHour]) => ({ date, byHour }));

  const dates = alerts.map((a) => a.date);
  const dateMin = dates.length > 0 ? dates[dates.length - 1] : "";
  const dateMax = dates.length > 0 ? dates[0] : "";

  return {
    totalAlerts: catMap.get(14) ?? 0,
    peakHour: `${String(peakIdx).padStart(2, "0")}:00`,
    byHour,
    byHourStacked,
    categoriesInData,
    byDay,
    byDayRockets,
    byCategory,
    shelterByHour,
    shelterByHourWeekday,
    shelterByShift,
    shelterByShiftWeekday,
    shelterDailyShift,
    shelterDailyByHour,
    allCities,
    filteredCategories,
    dateMin,
    dateMax,
    recentAlerts: alerts.slice(0, 200),
  };
}
