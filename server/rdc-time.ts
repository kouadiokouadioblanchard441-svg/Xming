import { RDC_COUNTRY } from "@shared/country-config";

const KINSHASA_DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getKinshasaParts(date: Date): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: RDC_COUNTRY.timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
}

function getPartValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function getPartNumber(parts: Intl.DateTimeFormatPart[], type: string): number {
  return Number(getPartValue(parts, type));
}

export function getKinshasaLocalDayAndHour(date = new Date()): {
  dayIndex: number;
  hour: number;
} {
  const parts = getKinshasaParts(date);
  const weekday = getPartValue(parts, "weekday");

  return {
    dayIndex: KINSHASA_DAY_INDEX[weekday] ?? -1,
    hour: getPartNumber(parts, "hour"),
  };
}

export function getKinshasaStartOfDay(date = new Date()): Date {
  const parts = getKinshasaParts(date);
  const year = getPartNumber(parts, "year");
  const month = getPartNumber(parts, "month");
  const day = getPartNumber(parts, "day");
  const localMidnightAsUtc = Date.UTC(year, month - 1, day);

  // Convert local midnight to an instant, adjusting against the timezone's
  // actual offset instead of assuming the server runs in Kinshasa.
  let candidate = localMidnightAsUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidateParts = getKinshasaParts(new Date(candidate));
    const candidateAsLocalUtc = Date.UTC(
      getPartNumber(candidateParts, "year"),
      getPartNumber(candidateParts, "month") - 1,
      getPartNumber(candidateParts, "day"),
      getPartNumber(candidateParts, "hour"),
      getPartNumber(candidateParts, "minute"),
      getPartNumber(candidateParts, "second"),
    );
    candidate += localMidnightAsUtc - candidateAsLocalUtc;
  }

  return new Date(candidate);
}