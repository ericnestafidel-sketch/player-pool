import { privateTextError } from "@/lib/player-rules";
import { locationError } from "@/lib/safety";

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

/** Season end or 60 days from now, whichever is sooner. */
export function boardExpiresAt(now: Date, seasonExpiresAt: Date | null, neededThrough: Date | null): Date {
  const sixty = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  let expires = sixty;
  if (seasonExpiresAt && seasonExpiresAt < expires) expires = seasonExpiresAt;
  if (neededThrough && neededThrough < expires) expires = neededThrough;
  return expires;
}
