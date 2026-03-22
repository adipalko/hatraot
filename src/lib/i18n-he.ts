/**
 * מחרוזות ממשק בעברית — לוח התרעות פיקוד העורף
 */
export const he = {
  metaTitle: "לוח התרעות פיקוד העורף",
  metaDescription:
    "ניתוח נתוני התרעות היסטוריות — מקור: מאגר israel-alerts-data",

  dashboardTitle: "לוח בקרת התרעות פיקוד העורף - שאגת הארי",
  liveDataFrom: "נתונים חיים מ־",
  clearAllFilters: "ניקוי כל המסננים",

  metricShelter: "התרעה מקדימה",
  metricRockets: "אזעקות",
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

  chartDailyShelterTitle: "מגמה יומית",
  chartDailyShelterSubtitle:
    "אזור כחול: התרעות מקדימות. קו אדום: אזעקות. קו מקווקו ענבר: מגמה ליניארית ללא היום הנוכחי.",
  chartShelterAlerts: "התרעות מקדימות",
  chartSirensLine: "אזעקות",
  chartTrendShort: "מגמה",

  chartShiftAvgTitle: "ממוצע התרעות מקדימות לפי חלון שעות",
  chartShiftAvgSubtitle:
    "ממוצע יומי של התרעות מקדימות לפי חלון שעות",
  shiftWeekdaysOnly: "א׳–ה׳ בלבד",
  tooltipAvgPerDay: "ממוצע ליום:",

  chartDailyShiftTitle: "התרעות מקדימות יומיות לפי חלון שעות",
  chartDailyShiftSubtitle:
    "התרעות ״התרעה מקדימה״ ליום, מפורטות לפי חלון שעות",

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
