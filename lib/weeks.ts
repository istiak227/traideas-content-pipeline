const DAY = 24 * 60 * 60 * 1000;

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function parseIsoDate(value: string) {
  const trimmed = value.trim();

  if (trimmed.includes("T") || trimmed.includes(" ")) {
    const normalized = trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T");
    const date = new Date(normalized);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function normalizeDate(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function toIsoDate(date: Date) {
  const normalized = normalizeDate(date);
  return `${normalized.getFullYear()}-${pad(normalized.getMonth() + 1)}-${pad(
    normalized.getDate(),
  )}`;
}

export function getWeekKey(input: Date | string) {
  const date = normalizeDate(typeof input === "string" ? parseIsoDate(input) : input);
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());
  return toIsoDate(sunday);
}

export function getCurrentWeekKey() {
  return getWeekKey(new Date());
}

export function addDays(date: Date | string, amount: number) {
  const base = normalizeDate(typeof date === "string" ? parseIsoDate(date) : date);
  const next = new Date(base);
  next.setDate(base.getDate() + amount);
  return next;
}

export function addWeeks(weekKey: string, amount: number) {
  return toIsoDate(addDays(weekKey, amount * 7));
}

export function getWeekDates(weekKey: string) {
  return Array.from({ length: 5 }, (_, index) => addDays(weekKey, index));
}

export function formatWeekRange(weekKey: string) {
  const start = parseIsoDate(weekKey);
  const end = addDays(start, 4);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: sameYear ? "numeric" : "numeric",
  });
  return `${startLabel} - ${endLabel}`;
}

export function formatDateLabel(dateLike: string | Date) {
  const date = typeof dateLike === "string" ? parseIsoDate(dateLike) : dateLike;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isToday(date: Date) {
  return toIsoDate(date) === toIsoDate(new Date());
}

export function getWeekDateMeta(weekKey: string) {
  return getWeekDates(weekKey).map((date, index) => ({
    date,
    iso: toIsoDate(date),
    dayLabel: ["Sun", "Mon", "Tue", "Wed", "Thu"][index],
  }));
}

export function diffInWeeks(a: string, b: string) {
  return Math.round(
    (normalizeDate(parseIsoDate(a)).getTime() - normalizeDate(parseIsoDate(b)).getTime()) /
      (7 * DAY),
  );
}
