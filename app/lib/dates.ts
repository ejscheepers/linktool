import { appTimeZone } from "./env.shared";

/**
 * The admin stores dates as UTC instants but edits them in the configured
 * local timezone (Africa/Johannesburg by default). These helpers convert
 * between the two without pulling in a date library.
 */

function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );

  return asUtc - date.getTime();
}

/** "2026-11-12T18:30" (local) -> Date (UTC instant). */
export function zonedInputToDate(
  value: string,
  timeZone = appTimeZone
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value.trim()
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match.map(Number) as unknown as number[];
  const naive = Date.UTC(year, month - 1, day, hour, minute, second || 0);
  if (Number.isNaN(naive)) return null;

  // Two passes settle the offset even across a DST boundary.
  const firstGuess = new Date(naive - zoneOffsetMs(new Date(naive), timeZone));
  const offset = zoneOffsetMs(firstGuess, timeZone);
  return new Date(naive - offset);
}

/** Date -> "2026-11-12T18:30" for a datetime-local input. */
export function dateToZonedInput(
  date: Date | null | undefined,
  timeZone = appTimeZone
): string {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
    "minute"
  )}`;
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: appTimeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Shorter variant for list rows: "12 Nov 2026". */
export function formatDateShort(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: appTimeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
