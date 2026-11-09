import { locationError, PLAYER_STATUS_LABEL } from "@/lib/safety";
import { isUsState } from "@/lib/states";

export type SportConfig = {
  slug: string;
  label: string;
  ageLabels: string[];
  levelLabels: string[];
  positionLabels: string[];
};

export type PlayerStatus = keyof typeof PLAYER_STATUS_LABEL;

export type StatEntry = { name: string; value: string };

export type HighlightEntry = { url: string; title: string };

export type WeekendMark = { weekendStart: string; state: "avail" | "busy" };

export type PlayerDraft = {
  playerId: string;
  sport: string;
  birthYear: string;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  state: string;
  county: string;
  status: string;
  travelMiles: string;
  note: string;
  stats: { name: string; value: string; lockedName: boolean }[];
  highlights: HighlightEntry[];
  availability: Record<string, "avail" | "busy" | "">;
};

export type PlayerInput = {
  sport: string;
  birthYear: number;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  state: string;
  county: string;
  status: PlayerStatus;
  travelMiles: number | null;
  note: string | null;
  stats: StatEntry[];
  highlights: HighlightEntry[];
  weekends: WeekendMark[];
};

export type SearchFilters = {
  ageGroup: string;
  position: string;
  skillLevel: string;
  state: string;
  county: string;
  weekend: string;
  status: "" | PlayerStatus;
};

export const SUGGESTED_STATS = [
  "Batting average",
  "On-base percentage",
  "ERA",
  "Innings pitched",
] as const;

export const WEEKENDS_SHOWN = 16;
const NOTE_MAX = 280;
const STAT_MAX = 12;
const HIGHLIGHT_MAX = 5;
const MIN_AGE = 5;
const MAX_AGE = 19;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]\d{4}/;
const LONG_DIGITS_RE = /\d{10,}/;
const STREET_RE =
  /\b\d{1,6}\s+[A-Za-z0-9.'-]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct)\b/i;
const PO_BOX_RE = /\b(po box|p\.o\. box|zip code|street address|mailing address)\b/i;
const BANNED_STAT_NAME =
  /^(e-?mail|phone|mobile|cell|address|street|city|town|zip|zipcode|name|full name|first name|last name|parent|jersey)$/i;

export function skillLevelLabel(sport: SportConfig): string {
  return sport.slug === "baseball" ? "USSSA skill level" : "Skill level";
}

/** Parent-facing list, in the order they chose. Example: "AA / AAA". */
export function formatSkillLevels(levels: string[]): string {
  return levels.filter((level) => level.length > 0).join(" / ");
}

export function emptyFilters(): SearchFilters {
  return {
    ageGroup: "",
    position: "",
    skillLevel: "",
    state: "",
    county: "",
    weekend: "",
    status: "",
  };
}

export function emptyDraft(sport: string): PlayerDraft {
  return {
    playerId: "",
    sport,
    birthYear: "",
    ageGroup: "",
    positions: [],
    skillLevels: [],
    state: "",
    county: "",
    status: "",
    travelMiles: "",
    note: "",
    stats: draftStats([]),
    highlights: [{ url: "", title: "" }],
    availability: {},
  };
}

export function draftStats(saved: StatEntry[]): PlayerDraft["stats"] {
  const used = new Set<string>();
  const suggested = SUGGESTED_STATS.map((name) => {
    const found = saved.find((stat) => stat.name.toLowerCase() === name.toLowerCase());
    if (found) used.add(found.name);
    return { name, value: found?.value ?? "", lockedName: true };
  });
  const custom = saved
    .filter((stat) => !used.has(stat.name))
    .map((stat) => ({ name: stat.name, value: stat.value, lockedName: false }));
  while (custom.length < 2) custom.push({ name: "", value: "", lockedName: false });
  return [...suggested, ...custom];
}

export function calendarYear(now: Date): number {
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Indiana/Indianapolis",
    year: "numeric",
  })
    .formatToParts(now)
    .find((part) => part.type === "year")?.value;
  return Number(year);
}

export function upcomingWeekends(count: number, now: Date): string[] {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Indiana/Indianapolis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const daysUntilSaturday = (6 - cursor.getUTCDay() + 7) % 7;
  cursor.setUTCDate(cursor.getUTCDate() + daysUntilSaturday);
  const weekends: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    weekends.push(`${y}-${m}-${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return weekends;
}

export function isSaturdayDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return false;
  }
  return check.getUTCDay() === 6;
}

export function weekendInRange(iso: string, now: Date): boolean {
  if (!isSaturdayDate(iso)) return false;
  const [nextOrToday] = upcomingWeekends(1, now);
  const start = Date.parse(`${nextOrToday}T00:00:00Z`) - 7 * 24 * 60 * 60 * 1000;
  const end = Date.parse(`${nextOrToday}T00:00:00Z`) + 400 * 24 * 60 * 60 * 1000;
  const value = Date.parse(`${iso}T00:00:00Z`);
  return value >= start && value <= end;
}

export function formatViewedDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Indiana/Indianapolis",
  }).format(value);
}

export function formatWeekend(iso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [, month, day] = iso.split("-");
  const label = months[Number(month) - 1] ?? month;
  return `${label} ${Number(day)}`;
}

export function highlightIsFresh(uploadedAt: Date | null, now: Date): boolean {
  if (!uploadedAt) return false;
  return now.getTime() - uploadedAt.getTime() <= 90 * 24 * 60 * 60 * 1000;
}

export function normalizeCounty(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/\s+county$/i, "");
}

export function highlightUrlError(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return "Enter a YouTube or Hudl link.";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "Enter a YouTube or Hudl link.";
  }
  if (url.username || url.password) return "That link is not a public video URL.";
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const allowed =
    host === "youtu.be" ||
    host.endsWith(".youtu.be") ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "hudl.com" ||
    host.endsWith(".hudl.com");
  if (!allowed) return "Use a YouTube or Hudl link. Other sites are not accepted.";
  return null;
}

/** Free text may not carry an email, phone, or street address. */
export function privateTextError(value: string, label: string): string | null {
  if (EMAIL_RE.test(value)) return `${label} cannot include an email address.`;
  if (PHONE_RE.test(value) || LONG_DIGITS_RE.test(value)) {
    return `${label} cannot include a phone number.`;
  }
  if (STREET_RE.test(value) || PO_BOX_RE.test(value)) {
    return `${label} cannot include a street address.`;
  }
  return null;
}

export function filtersToQuery(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.ageGroup) params.set("age", filters.ageGroup);
  if (filters.position) params.set("position", filters.position);
  if (filters.skillLevel) params.set("level", filters.skillLevel);
  if (filters.state) params.set("state", filters.state);
  if (filters.county) params.set("county", filters.county);
  if (filters.weekend) params.set("weekend", filters.weekend);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function oneParam(raw: Record<string, string | string[] | undefined>, key: string): string {
  const value = raw[key];
  const picked = Array.isArray(value) ? value[0] : value;
  return typeof picked === "string" ? picked.trim() : "";
}

export function filtersFromParams(
  raw: Record<string, string | string[] | undefined>,
  sport: SportConfig | null,
  now: Date,
): SearchFilters {
  return filtersFromUnknown(
    {
      ageGroup: oneParam(raw, "age"),
      position: oneParam(raw, "position"),
      skillLevel: oneParam(raw, "level"),
      state: oneParam(raw, "state"),
      county: oneParam(raw, "county"),
      weekend: oneParam(raw, "weekend"),
      status: oneParam(raw, "status"),
    },
    sport,
    now,
  );
}

export function filtersFromUnknown(value: unknown, sport: SportConfig | null, now: Date): SearchFilters {
  const filters = emptyFilters();
  if (!value || typeof value !== "object") return filters;
  const source = value as Record<string, unknown>;
  const text = (key: string) => (typeof source[key] === "string" ? source[key].trim() : "");
  const age = text("ageGroup");
  if (sport?.ageLabels.includes(age)) filters.ageGroup = age;
  const position = text("position");
  if (sport?.positionLabels.includes(position)) filters.position = position;
  const level = text("skillLevel") || text("level");
  if (sport?.levelLabels.includes(level)) filters.skillLevel = level;
  const state = text("state").toUpperCase();
  if (isUsState(state)) filters.state = state;
  const county = normalizeCounty(text("county"));
  if (county && !locationError("IN", county)) filters.county = county;
  const weekend = text("weekend");
  if (isSaturdayDate(weekend) && weekendInRange(weekend, now)) filters.weekend = weekend;
  const status = text("status");
  if (status === "full" || status === "pickup" || status === "not") filters.status = status;
  return filters;
}

function formText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parsePlayerForm(
  formData: FormData,
  sports: SportConfig[],
  now: Date,
): { ok: true; value: PlayerInput } | { ok: false; error: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  const sportSlug = formText(formData.get("sport")) || "baseball";
  const sport = sports.find((item) => item.slug === sportSlug);
  if (!sport) fieldErrors.sport = "Choose a sport from the list.";

  const birthYearText = formText(formData.get("birthYear"));
  let birthYear = 0;
  if (!/^\d{4}$/.test(birthYearText)) {
    fieldErrors.birthYear = "Enter a four-digit birth year.";
  } else {
    birthYear = Number(birthYearText);
    const year = calendarYear(now);
    if (birthYear < year - MAX_AGE || birthYear > year - MIN_AGE) {
      fieldErrors.birthYear = "Enter a birth year for a youth player.";
    }
  }

  const ageGroup = formText(formData.get("ageGroup"));
  if (!sport || !sport.ageLabels.includes(ageGroup)) fieldErrors.ageGroup = "Choose an age group.";

  const picked = formData
    .getAll("positions")
    .filter((value): value is string => typeof value === "string");
  const positions = sport ? sport.positionLabels.filter((label) => picked.includes(label)) : [];
  if (positions.length === 0) fieldErrors.positions = "Choose at least one position.";
  if (sport && picked.some((label) => !sport.positionLabels.includes(label))) {
    fieldErrors.positions = "Choose a position from the list.";
  }

  const submittedLevels = [...formData.getAll("skillLevel"), ...formData.getAll("skillLevel2")]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const skillLevels = sport
    ? submittedLevels.filter((level) => sport.levelLabels.includes(level))
    : [];
  const levelNoun = sport?.slug === "baseball" ? "USSSA skill level" : "skill level";
  if (submittedLevels.length === 0) {
    fieldErrors.skillLevel = `Choose at least one ${levelNoun}.`;
  } else if (submittedLevels.length > 2) {
    fieldErrors.skillLevel = `Choose at most two ${levelNoun}s.`;
  } else if (skillLevels.length !== submittedLevels.length) {
    fieldErrors.skillLevel = `Choose a ${levelNoun} from the list.`;
  } else if (new Set(skillLevels).size !== skillLevels.length) {
    fieldErrors.skillLevel = `Choose two different ${levelNoun}s.`;
  }

  const state = formText(formData.get("state")).toUpperCase();
  const county = normalizeCounty(formText(formData.get("county")));
  if (!isUsState(state)) {
    fieldErrors.state = "Choose a state.";
  } else {
    const countyProblem = locationError(state, county);
    if (countyProblem) fieldErrors.county = countyProblem;
  }

  const statusText = formText(formData.get("status"));
  const status = statusText === "full" || statusText === "pickup" || statusText === "not" ? statusText : null;
  if (!status) fieldErrors.status = "Choose full-time, pickup, or not looking.";

  const travelText = formText(formData.get("travelMiles"));
  let travelMiles: number | null = null;
  if (travelText) {
    if (!/^\d{1,4}$/.test(travelText)) {
      fieldErrors.travelMiles = "Enter miles as a whole number, or leave it blank.";
    } else {
      travelMiles = Number(travelText);
      if (travelMiles > 1500) fieldErrors.travelMiles = "Enter a travel distance up to 1500 miles.";
    }
  }

  const noteText = formText(formData.get("note"));
  let note: string | null = null;
  if (noteText.length > NOTE_MAX) {
    fieldErrors.note = `Keep the note to ${NOTE_MAX} characters.`;
  } else if (noteText) {
    const noteProblem = privateTextError(noteText, "The note");
    if (noteProblem) fieldErrors.note = noteProblem;
    else note = noteText;
  }

  const statNames = formData.getAll("statName");
  const statValues = formData.getAll("statValue");
  const stats: StatEntry[] = [];
  const statCount = Math.max(statNames.length, statValues.length);
  if (statCount > 24) fieldErrors.stats = `You can add up to ${STAT_MAX} stats.`;
  for (let index = 0; index < statCount && !fieldErrors.stats; index += 1) {
    const name = formText(statNames[index] ?? null);
    const value = formText(statValues[index] ?? null);
    if (!name && !value) continue;
    if (!value) {
      const suggested = SUGGESTED_STATS.some((label) => label.toLowerCase() === name.toLowerCase());
      if (suggested) continue;
      fieldErrors.stats = "Each stat needs a name and a value, or leave the row blank.";
      break;
    }
    if (!name) {
      fieldErrors.stats = "Each stat needs a name and a value, or leave the row blank.";
      break;
    }
    if (name.length > 40 || value.length > 40) {
      fieldErrors.stats = "Keep each stat name and value to 40 characters.";
      break;
    }
    if (BANNED_STAT_NAME.test(name)) {
      fieldErrors.stats = "Stats cannot be a name, town, address, email, or phone.";
      break;
    }
    const nameProblem = privateTextError(name, "A stat");
    const valueProblem = privateTextError(value, "A stat");
    if (nameProblem || valueProblem) {
      fieldErrors.stats = nameProblem ?? valueProblem ?? "Check the stats.";
      break;
    }
    stats.push({ name, value });
  }
  if (!fieldErrors.stats && stats.length > STAT_MAX) {
    fieldErrors.stats = `You can add up to ${STAT_MAX} stats.`;
  }

  const highlightUrls = formData.getAll("highlightUrl");
  const highlightTitles = formData.getAll("highlightTitle");
  const highlights: HighlightEntry[] = [];
  const highlightCount = Math.max(highlightUrls.length, highlightTitles.length);
  if (highlightCount > 8) fieldErrors.highlights = `You can add up to ${HIGHLIGHT_MAX} highlight links.`;
  for (let index = 0; index < highlightCount && !fieldErrors.highlights; index += 1) {
    const url = formText(highlightUrls[index] ?? null);
    const title = formText(highlightTitles[index] ?? null);
    if (!url && !title) continue;
    if (!url || !title) {
      fieldErrors.highlights = "Each highlight needs a link and a title, or leave the row blank.";
      break;
    }
    const urlProblem = highlightUrlError(url);
    if (urlProblem) {
      fieldErrors.highlights = urlProblem;
      break;
    }
    if (title.length > 80) {
      fieldErrors.highlights = "Keep each highlight title to 80 characters.";
      break;
    }
    const titleProblem = privateTextError(title, "A highlight title");
    if (titleProblem) {
      fieldErrors.highlights = `${titleProblem} Leave the player's name, jersey, and school out of the title.`;
      break;
    }
    highlights.push({ url, title });
  }
  if (!fieldErrors.highlights && highlights.length > HIGHLIGHT_MAX) {
    fieldErrors.highlights = `You can add up to ${HIGHLIGHT_MAX} highlight links.`;
  }

  const weekends: WeekendMark[] = [];
  let weekendFields = 0;
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("weekend:") || typeof raw !== "string") continue;
    weekendFields += 1;
    if (raw === "") continue;
    const weekendStart = key.slice("weekend:".length);
    if (raw !== "avail" && raw !== "busy") {
      fieldErrors.weekends = "Mark each weekend available, busy, or not set.";
      break;
    }
    if (!isSaturdayDate(weekendStart) || !weekendInRange(weekendStart, now)) {
      fieldErrors.weekends = "Pick a Saturday on the calendar.";
      break;
    }
    weekends.push({ weekendStart, state: raw });
  }
  if (!fieldErrors.weekends && weekendFields > 40) {
    fieldErrors.weekends = "Too many weekends were submitted.";
  }

  if (!sport || !status || Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Check the fields below.", fieldErrors };
  }

  return {
    ok: true,
    value: {
      sport: sport.slug,
      birthYear,
      ageGroup,
      positions,
      skillLevels,
      state,
      county,
      status,
      travelMiles,
      note,
      stats,
      highlights,
      weekends,
    },
  };
}

export function readStatsData(data: unknown): StatEntry[] {
  if (!data || typeof data !== "object") return [];
  const entries = (data as { entries?: unknown }).entries;
  if (Array.isArray(entries)) {
    return entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const name = "name" in entry && typeof entry.name === "string" ? entry.name : "";
      const value = "value" in entry && typeof entry.value === "string" ? entry.value : "";
      if (!name || !value) return [];
      return [{ name, value }];
    });
  }
  return Object.entries(data as Record<string, unknown>).flatMap(([name, value]) => {
    if (name === "entries") return [];
    if (typeof value !== "string" && typeof value !== "number") return [];
    return [{ name, value: String(value) }];
  });
}

const CONTACT_KEYS = new Set([
  "email",
  "phone",
  "contact",
  "parentemail",
  "parentphone",
  "coachemail",
  "coachphone",
  "givenname",
  "fullname",
  "firstname",
  "lastname",
  "address",
  "street",
  "city",
  "town",
  "zip",
]);

/** Throws if a coach-facing or parent-facing payload picked up a contact column. */
export function assertNoContactFields(value: unknown): void {
  const walk = (current: unknown) => {
    if (Array.isArray(current)) {
      for (const item of current) walk(item);
      return;
    }
    if (!current || typeof current !== "object") return;
    for (const [key, child] of Object.entries(current)) {
      const normalized = key.toLowerCase().replace(/[_-]/g, "");
      if (CONTACT_KEYS.has(normalized)) {
        throw new Error("Refusing to expose a contact field.");
      }
      walk(child);
    }
  };
  walk(value);
}
