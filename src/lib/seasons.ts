const TZ = "America/Indiana/Indianapolis";
const REFUND_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export type SeasonCode = "spring" | "summer" | "fall-winter";

export type CurrentSeason = {
  code: SeasonCode;
  seasonCode: string;
  year: number;
  /** First instant after the season's last day, Indiana time. */
  expiresAt: Date;
};

export function indianaCalendar(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function indianaOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** 00:00 on that calendar date in Indiana. */
export function indianaStart(year: number, month: number, day: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const start = new Date(guess.getTime() - indianaOffsetMinutes(guess) * 60000);
  const adjusted = indianaOffsetMinutes(start);
  return new Date(guess.getTime() - adjusted * 60000);
}

function nextDay(year: number, month: number, day: number): Date {
  const cursor = new Date(Date.UTC(year, month - 1, day));
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  return indianaStart(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate());
}

/** Spring Jan–May, Summer Jun–Aug, Fall/Winter Sep–Dec. Active through the last day. */
export function currentSeason(now: Date): CurrentSeason {
  const { year, month } = indianaCalendar(now);
  if (month <= 5) {
    return { code: "spring", seasonCode: `spring-${year}`, year, expiresAt: nextDay(year, 5, 31) };
  }
  if (month <= 8) {
    return { code: "summer", seasonCode: `summer-${year}`, year, expiresAt: nextDay(year, 8, 31) };
  }
  return {
    code: "fall-winter",
    seasonCode: `fall-winter-${year}`,
    year,
    expiresAt: nextDay(year, 12, 31),
  };
}

/** Yearly covers every season through December 31 of the purchase year. */
export function yearlyExpiresAt(now: Date): Date {
  const { year } = indianaCalendar(now);
  return nextDay(year, 12, 31);
}

export function promoFreeSeason(amountTotal: number, discountCents: number): boolean {
  return amountTotal === 0 || discountCents > 0;
}

export function refundEligible(input: {
  paidAt: Date | null;
  expiresAt: Date | null;
  amountCents: number;
  paymentIntent: string | null;
  viewsSincePayment: number;
  now: Date;
}): boolean {
  if (!input.paidAt || !input.expiresAt || !input.paymentIntent) return false;
  if (input.amountCents <= 0) return false;
  if (input.expiresAt.getTime() <= input.now.getTime()) return false;
  if (input.viewsSincePayment > 0) return false;
  return input.now.getTime() - input.paidAt.getTime() <= REFUND_WINDOW_MS;
}
