/**
 * מחרוזות ממשק בעברית — לוח התרעות פיקוד העורף
 */
export const he = {
  metaTitle: "לוח התרעות פיקוד העורף",
  metaDescription:
    "ניתוח נתוני התרעות היסטוריות — מקור: מאגר israel-alerts-data",

  dashboardTitle: "לוח בקרת התרעות פיקוד העורף",
  liveDataFrom: "נתונים חיים מ־",
  clearAllFilters: "ניקוי כל המסננים",

  metricShelter: "התרעה מקדימה",
  metricRockets: "רקטות וטילים",
  metricPeakHour: "שעת שיא להתרעות",

  cityFilterPlaceholder: "סינון לפי יישוב…",
  cityOneSelected: "נבחר יישוב אחד",
  cityManySelected: (n: number) => `נבחרו ${n} יישובים`,
  clearAll: "ניקוי",
  searchCities: "חיפוש יישובים…",
  noCitiesFound: "לא נמצאו יישובים",

  dateFrom: "מתאריך",
  dateTo: "עד תאריך",
  dateRangeTo: "עד",

  categoryClear: "ניקוי",

  tableTitle: "התרעות אחרונות",
  colCity: "יישוב",
  colType: "סוג",
  colDate: "תאריך",
  colTime: "שעה",
  noAlertsFound: "לא נמצאו התרעות",

  chartDailyShelterTitle: "מגמת התרעות מקדימות יומית",
  chartDailyShelterSubtitle:
    "אזור כחול: התרעות מקדימה (קטגוריה 14). קו אדום: רקטות וטילים (קטגוריה 1). קו מקווקו ענבר: מגמה ליניארית על ההתרעות המקדימות (ללא היום הנוכחי, שעון ישראל).",
  chartShelterAlerts: "התרעות מקדימות",
  chartSirensLine: "רקטות וטילים",
  chartTrendShort: "מגמה",

  chartShiftAvgTitle: "ממוצע התרעות מקדימות לפי משמרת",
  chartShiftAvgSubtitle:
    "ממוצע יומי של התרעות ״התרעה מקדימה״ לפי משמרות היום (בוקר, יום, ערב, לילה)",
  shiftWeekdaysOnly: "א׳–ה׳ בלבד",
  tooltipAvgPerDay: "ממוצע ליום:",

  chartDailyShiftTitle: "התרעות מקדימות יומיות לפי משמרת",
  chartDailyShiftSubtitle:
    "התרעות ״התרעה מקדימה״ ליום, מפורטות לפי משמרת",

  shiftMorning: "בוקר (06–08)",
  shiftDay: "יום (08–16)",
  shiftEvening: "ערב (16–21)",
  shiftNight: "לילה (21–06)",

  shiftTrendTitle: "מגמה יומית לפי חלון שעות",
  shiftTrendSubtitle: "בחרו חלון שעות מוגדר מראש, או הגדירו טווח שעות מותאם אישית",
  shiftTrendPickerLabel: "חלון שעות:",
  shiftTrendCount: "התרעות",
  shiftTrendCustom: "מותאם אישית",
  shiftTrendCustomFrom: "משעה",
  shiftTrendCustomTo: "עד שעה",
} as const;
