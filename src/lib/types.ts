export interface Alert {
  city: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  category: number;
  categoryDesc: string;
}

export interface HourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface HourStackedBucket {
  hour: number;
  label: string;
  [catKey: `cat_${number}`]: number;
}

export interface CityBucket {
  city: string;
  count: number;
}

export interface DayBucket {
  date: string;
  count: number;
}

export interface CategoryBucket {
  category: number;
  label: string;
  count: number;
}

export interface ShelterHourBucket {
  hour: number;
  label: string;
  avg: number;
}

export interface ShelterShiftBucket {
  shift: number;
  label: string;
  avg: number;
}

export const SHELTER_SHIFTS = [
  { label: "Morning (06–08)", hours: [6, 7] },
  { label: "Day (08–16)", hours: [8, 9, 10, 11, 12, 13, 14, 15] },
  { label: "Evening (16–21)", hours: [16, 17, 18, 19, 20] },
  { label: "Night (21–06)", hours: [21, 22, 23, 0, 1, 2, 3, 4, 5] },
] as const;

export interface DailyShiftBucket {
  date: string;
  morning: number;
  day: number;
  evening: number;
  night: number;
}

export interface DashboardPayload {
  /** Count of "Prepare / Stay Near Shelter" (category 14) alerts only */
  totalAlerts: number;
  topCity: string;
  peakHour: string;
  byHour: HourBucket[];
  byHourStacked: HourStackedBucket[];
  categoriesInData: number[];
  byDay: DayBucket[];
  topCities: CityBucket[];
  byCategory: CategoryBucket[];
  shelterByHour: ShelterHourBucket[];
  shelterByHourWeekday: ShelterHourBucket[];
  shelterByShift: ShelterShiftBucket[];
  shelterByShiftWeekday: ShelterShiftBucket[];
  shelterDailyShift: DailyShiftBucket[];
  allCities: string[];
  /** Category counts reflecting city + date filters (but not category filter) */
  filteredCategories: CategoryBucket[];
  dateMin: string;
  dateMax: string;
  recentAlerts: Alert[];
}

const CATEGORY_LABELS: Record<number, string> = {
  1: "Rockets & Missiles",
  2: "Hostile Aircraft",
  7: "Earthquake",
  10: "Terrorist Infiltration",
  14: "Prepare / Stay Near Shelter",
};

export function categoryLabel(cat: number): string {
  return CATEGORY_LABELS[cat] ?? `Category ${cat}`;
}

export const CATEGORY_CHART_COLORS: Record<number, string> = {
  1: "#ef4444",  // red
  2: "#f97316",  // orange
  7: "#a855f7",  // purple
  10: "#f43f5e", // rose
  14: "#38bdf8", // sky
};

export function categoryChartColor(cat: number): string {
  return CATEGORY_CHART_COLORS[cat] ?? "#71717a";
}

export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
