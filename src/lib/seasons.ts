const TZ = "America/Indiana/Indianapolis";
const REFUND_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export type SeasonCode = "spring" | "summer" | "fall";

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

function makeSeason(code: SeasonCode, year: number): CurrentSeason {
  const expiresAt =
    code === "spring"
      ? nextDay(year, 5, 31)
      : code === "summer"
        ? nextDay(year, 8, 31)
        : nextDay(year, 10, 31);
  return { code, seasonCode: `${code}-${year}`, year, expiresAt };
}

/**
 * Spring is November 1 through May 31 and is named for the year it ends
 * (Spring 2027 = Nov 1, 2026 – May 31, 2027). Summer is June 1 – August 31.
 * Fall is September 1 – October 31.
 */
export function currentSeason(now: Date): CurrentSeason {
  const { year, month } = indianaCalendar(now);
  if (month >= 11) return makeSeason("spring", year + 1);
  if (month <= 5) return makeSeason("spring", year);
  if (month <= 8) return makeSeason("summer", year);
  return makeSeason("fall", year);
}

/** Spring, then Summer, then Fall, then next Spring. */
export function followingSeason(start: CurrentSeason): CurrentSeason {
  if (start.code === "spring") return makeSeason("summer", start.year);
  if (start.code === "summer") return makeSeason("fall", start.year);
  return makeSeason("spring", start.year + 1);
}

/** Yearly is 12 months: the chosen season plus the next two, through the third season's last day. */
export function yearlyFrom(start: CurrentSeason): { seasons: CurrentSeason[]; expiresAt: Date } {
  const second = followingSeason(start);
  const third = followingSeason(second);
  return { seasons: [start, second, third], expiresAt: third.expiresAt };
}

export function yearlyExpiresAt(now: Date): Date {
  return yearlyFrom(currentSeason(now)).expiresAt;
}

export type SeasonOffer = {
  seasonCode: string;
  label: string;
  startsOn: string;
  endsOn: string;
  yearlyLabels: string;
  yearlyEndsOn: string;
};

export function seasonStart(season: CurrentSeason): Date {
  if (season.code === "spring") return indianaStart(season.year - 1, 11, 1);
  if (season.code === "summer") return indianaStart(season.year, 6, 1);
  return indianaStart(season.year, 9, 1);
}

function offerFrom(season: CurrentSeason): SeasonOffer {
  const yearly = yearlyFrom(season);
  const label = `${seasonTitle(season.code)} ${season.year}`;
  return {
    seasonCode: season.seasonCode,
    label,
    startsOn: formatIndianaDate(seasonStart(season)),
    endsOn: formatIndianaDate(new Date(season.expiresAt.getTime() - 60_000)),
    yearlyLabels: yearly.seasons.map((item) => `${seasonTitle(item.code)} ${item.year}`).join(", "),
    yearlyEndsOn: formatIndianaDate(new Date(yearly.expiresAt.getTime() - 60_000)),
  };
}

export function seasonTitle(code: SeasonCode): string {
  if (code === "spring") return "Spring";
  if (code === "summer") return "Summer";
  return "Fall";
}

export function formatIndianaDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Current season and the next one. Both can be chosen at checkout. */
export function seasonOffers(now: Date): [SeasonOffer, SeasonOffer] {
  const current = currentSeason(now);
  return [offerFrom(current), offerFrom(followingSeason(current))];
}

/** Accept only the current season or the next one. */
export function coverageFor(
  startCode: string,
  plan: "season" | "yearly",
  now: Date,
): { expiresAt: Date; seasonCode: string; covered: string } | null {
  const current = currentSeason(now);
  const next = followingSeason(current);
  const start = startCode === current.seasonCode ? current : startCode === next.seasonCode ? next : null;
  if (!start) return null;
  if (plan === "season") {
    return {
      expiresAt: start.expiresAt,
      seasonCode: start.seasonCode,
      covered: `${seasonTitle(start.code)} ${start.year}`,
    };
  }
  const yearly = yearlyFrom(start);
  return {
    expiresAt: yearly.expiresAt,
    seasonCode: start.seasonCode,
    covered: yearly.seasons.map((item) => `${seasonTitle(item.code)} ${item.year}`).join(", "),
  };
}

/** Admin test listings never consume a FIRST25 spot, even at a $0 total. */
export function promoFreeSeasonForPlayer(
  adminTest: boolean,
  amountTotal: number,
  discountCents: number,
): boolean {
  if (adminTest) return false;
  return promoFreeSeason(amountTotal, discountCents);
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
