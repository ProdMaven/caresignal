// Time helpers shared by the mocks, the seed and the UI.
// Times are kept as ISO strings with an offset, and the UI shows the wall-clock
// time written in the string, so "3:00 PM" stays "3:00 PM" on any device.
import type { TimeBand } from "./types";

// Demo households are in Phoenix (no daylight saving).
export const DEMO_OFFSET = "-07:00";

const pad = (n: number) => String(n).padStart(2, "0");

export function bandForHour(hour: number): TimeBand {
  if (hour >= 5 && hour < 8) return "early_morning";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export interface WallParts {
  date: string; // YYYY-MM-DD
  hour: number;
  minute: number;
  offset: string; // "+HH:MM" or "-HH:MM"
}

// Reads the wall-clock parts straight from the ISO string. Returns null if it is not ISO.
export function wallParts(iso: string): WallParts | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.exec(iso);
  if (!m) return null;
  const offset = !m[4] || m[4] === "Z" ? "+00:00" : m[4];
  return { date: m[1], hour: Number(m[2]), minute: Number(m[3]), offset };
}

export function isoAt(date: string, hour: number, minute: number, offset: string = DEMO_OFFSET): string {
  return `${date}T${pad(hour)}:${pad(minute)}:00${offset}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 0 = Sunday ... 6 = Saturday
export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function offsetMinutes(offset: string): number {
  const sign = offset.startsWith("-") ? -1 : 1;
  return sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));
}

// The current moment as an ISO string in the given offset.
export function nowIso(offset: string = DEMO_OFFSET, now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + offsetMinutes(offset) * 60_000);
  return `${shifted.toISOString().slice(0, 19)}${offset}`;
}

// Today's date (YYYY-MM-DD) in the demo time zone.
export function demoToday(now: Date = new Date()): string {
  return nowIso(DEMO_OFFSET, now).slice(0, 10);
}

// Browser helper: the device clock as ISO with the device's own offset.
export function localIso(d: Date = new Date()): string {
  const off = -d.getTimezoneOffset();
  const sign = off < 0 ? "-" : "+";
  const abs = Math.abs(off);
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`
  );
}

export function setWallTime(iso: string, hour: number, minute: number): string {
  const p = wallParts(iso);
  if (!p) return iso;
  return isoAt(p.date, hour, minute, p.offset);
}

export function timeInputValue(iso: string): string {
  const p = wallParts(iso);
  return p ? `${pad(p.hour)}:${pad(p.minute)}` : "";
}

export function formatTime(iso: string): string {
  const p = wallParts(iso);
  if (!p) return "";
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${h12}:${pad(p.minute)} ${p.hour < 12 ? "AM" : "PM"}`;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export const TIME_BAND_ORDER: TimeBand[] = ["early_morning", "morning", "afternoon", "evening", "night"];

export const TIME_BAND_LABEL: Record<TimeBand, string> = {
  early_morning: "Early morning",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};
