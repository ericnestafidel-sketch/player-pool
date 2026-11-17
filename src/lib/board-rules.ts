import { privateTextError } from "@/lib/player-rules";
import { locationError } from "@/lib/safety";
import { indianaCalendar, indianaStart } from "@/lib/seasons";

const NOTE_MAX = 500;
const URL_RE = /(?:https?:\/\/|www\.)\S+/i;

export function boardNoteError(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  if (text.length > NOTE_MAX) return `Keep notes under ${NOTE_MAX} characters.`;
  const contact = privateTextError(text, "Notes");
  if (contact) return contact;
  if (URL_RE.test(text)) return "Notes cannot include a link. Message through Player Pool instead.";
  return null;
}

export function boardFieldError(input: {
  teamName: string;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  state: string;
  county: string;
  notes: string;
  ageLabels: string[];
  levelLabels: string[];
  positionLabels: string[];
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.teamName.trim().length < 2) errors.teamName = "Enter the team name.";
  if (!input.ageLabels.includes(input.ageGroup)) errors.ageGroup = "Choose an age group.";
  const positions = input.positionLabels.filter((label) => input.positions.includes(label));
  if (positions.length === 0) errors.positions = "Choose at least one position.";
  const levels = input.levelLabels.filter((label) => input.skillLevels.includes(label));
  if (levels.length === 0) errors.skillLevels = "Choose at least one USSSA skill level.";
  if (levels.length > 2) errors.skillLevels = "Choose at most two USSSA skill levels.";
  const place = locationError(input.state, input.county);
  if (place === "Choose a state.") errors.state = place;
  else if (place) errors.county = place;
  const note = boardNoteError(input.notes);
  if (note) errors.notes = note;
  return errors;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function indianaToday(now: Date): string {
  const { year, month, day } = indianaCalendar(now);
  return formatIso(year, month, day);
}

export function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return formatIso(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

function formatIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
}

/** First instant after the close date, Indiana time. The need is hidden from then on. */
export function closeInstant(closesOn: string): Date {
  const next = shiftIsoDate(closesOn, 1);
  const [year, month, day] = next.split("-").map(Number);
  return indianaStart(year, month, day);
}

export function boardEventError(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  if (text.length > 80) return "Keep the event name under 80 characters.";
  const contact = privateTextError(text, "Event name");
  if (contact) return contact;
  if (URL_RE.test(text)) return "Event name cannot include a link.";
  return null;
}

export function boardSchedule(input: {
  startsOn: string;
  endsOn: string;
  closesOn: string;
  playersNeeded: string;
  eventName: string;
}): { errors: Record<string, string>; closesOn: string; playersNeeded: number } {
  const errors: Record<string, string> = {};
  const startsOn = input.startsOn.trim();
  const endsOn = input.endsOn.trim();
  if (!isIsoDate(startsOn)) errors.startsOn = "Choose the event start date.";
  if (!isIsoDate(endsOn)) errors.endsOn = "Choose the event end date.";
  if (!errors.startsOn && !errors.endsOn && endsOn < startsOn) {
    errors.endsOn = "The end date cannot be before the start date.";
  }
  let closesOn = input.closesOn.trim();
  if (!closesOn && !errors.startsOn) closesOn = shiftIsoDate(startsOn, -1);
  if (!isIsoDate(closesOn)) errors.closesOn = "Choose a close date, or leave it blank to use the day before the start.";
  else if (!errors.endsOn && closesOn > endsOn) errors.closesOn = "The close date cannot be after the end date.";
  const players = Number(input.playersNeeded.trim());
  if (!/^\d+$/.test(input.playersNeeded.trim()) || !Number.isInteger(players) || players < 1 || players > 99) {
    errors.playersNeeded = "Enter how many players you need, from 1 to 99.";
  }
  const event = boardEventError(input.eventName);
  if (event) errors.eventName = event;
  return { errors, closesOn, playersNeeded: players };
}

function shortDate(iso: string): { month: string; day: number; year: number } {
  const [year, month, day] = iso.split("-").map(Number);
  const label = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
  return { month: label, day, year };
}

export function formatNeedRange(startsOn: string, endsOn: string): string {
  const start = shortDate(startsOn);
  const end = shortDate(endsOn);
  if (start.year === end.year && start.month === end.month && start.day === end.day) {
    return `${start.month} ${start.day}`;
  }
  if (start.year === end.year && start.month === end.month) return `${start.month} ${start.day}–${end.day}`;
  if (start.year === end.year) return `${start.month} ${start.day}–${end.month} ${end.day}`;
  return `${start.month} ${start.day}, ${start.year}–${end.month} ${end.day}, ${end.year}`;
}

export function formatNeedDay(iso: string): string {
  const day = shortDate(iso);
  return `${day.month} ${day.day}`;
}

/** Public list line. Team name, notes, and contact details are not included. */
export function boardNeedLine(input: {
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  county: string;
  state: string;
  eventName: string | null;
  startsOn: string;
  endsOn: string;
  playersNeeded: number;
  closesOn: string;
}): string {
  const levels = input.skillLevels.map((level) => (level.startsWith("USSSA ") ? level : `USSSA ${level}`)).join(" / ");
  const event = input.eventName?.trim() ? `${input.eventName.trim()} · ` : "";
  return [
    input.ageGroup,
    input.positions.join(", "),
    levels,
    `${input.county} County, ${input.state}`,
    `${event}${formatNeedRange(input.startsOn, input.endsOn)}`,
    `${input.playersNeeded} needed`,
    `closes ${formatNeedDay(input.closesOn)}`,
  ].join(" · ");
}

export function openNeedsCopy(total: number, states: string[]): string {
  if (total <= 0) return "No open needs right now — check back soon.";
  const noun = total === 1 ? "need" : "needs";
  return `${total} open ${noun} in ${states.join("/")} right now.`;
}

export function needStillOpen(closesOn: string, endsOn: string, now: Date): boolean {
  const today = indianaToday(now);
  return closesOn >= today && endsOn >= today;
}

/** Season end or 60 days from now, whichever is sooner. */
export function boardExpiresAt(now: Date, seasonExpiresAt: Date | null, neededThrough: Date | null): Date {
  const sixty = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  let expires = sixty;
  if (seasonExpiresAt && seasonExpiresAt < expires) expires = seasonExpiresAt;
  if (neededThrough && neededThrough < expires) expires = neededThrough;
  return expires;
}
