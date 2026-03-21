"use client";

import { useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, X } from "lucide-react";
import { he } from "@/lib/i18n-he";

interface Props {
  dateMin: string;
  dateMax: string;
  from: string;
  to: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
}

function toDate(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateRangeFilter({
  dateMin,
  dateMax,
  from,
  to,
  onChangeFrom,
  onChangeTo,
}: Props) {
  const fromRef = useRef<DatePicker>(null);
  const toRef = useRef<DatePicker>(null);

  const hasValue = from || to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <DatePicker
        ref={fromRef}
        selected={toDate(from)}
        onChange={(d: Date | null) => onChangeFrom(toStr(d))}
        selectsStart
        startDate={toDate(from)}
        endDate={toDate(to)}
        minDate={toDate(dateMin)}
        maxDate={toDate(to) || toDate(dateMax)}
        placeholderText={he.dateFrom}
        dateFormat="dd/MM/yyyy"
        className="w-[120px] rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-accent-amber/30"
        calendarClassName="dark-calendar"
        showPopperArrow={false}
      />
      <span className="text-sm text-muted-foreground">{he.dateRangeTo}</span>
      <DatePicker
        ref={toRef}
        selected={toDate(to)}
        onChange={(d: Date | null) => onChangeTo(toStr(d))}
        selectsEnd
        startDate={toDate(from)}
        endDate={toDate(to)}
        minDate={toDate(from) || toDate(dateMin)}
        maxDate={toDate(dateMax)}
        placeholderText={he.dateTo}
        dateFormat="dd/MM/yyyy"
        className="w-[120px] rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-accent-amber/30"
        calendarClassName="dark-calendar"
        showPopperArrow={false}
      />
      {hasValue && (
        <button
          onClick={() => {
            onChangeFrom("");
            onChangeTo("");
          }}
          className="text-muted-foreground hover:text-accent-red transition"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
