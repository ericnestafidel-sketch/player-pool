import { isUsState } from "./states";

const BANNED_PUBLIC_KEYS = [
  "email",
  "phone",
  "contact",
  "address",
  "street",
  "city",
  "town",
  "zip",
  "givenName",
  "given_name",
  "fullName",
  "full_name",
  "firstName",
  "lastName",
  "parentEmail",
  "parentPhone",
] as const;

/** Location is state + county. Reject street numbers and address words. */
export function locationError(state: string, county: string): string | null {
  if (!isUsState(state)) return "Choose a state.";
  const value = county.trim();
  if (value.length < 2 || value.length > 60) return "Enter a county name.";
  if (/\d/.test(value)) return "County only — no street numbers or ZIP codes.";
  if (
    /\b(street|avenue|ave|road|rd|boulevard|blvd|lane|drive|court|po box|zip)\b/i.test(value)
  ) {
    return "County only — no street address.";
  }
  return null;
}

export function httpUrlError(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Enter a public http(s) link.";
    }
    return null;
  } catch {
    return "Enter a valid public http(s) link.";
  }
}

export function formatPlayerLabel(publicNumber: number): string {
  return `Player #${String(publicNumber).padStart(3, "0")}`;
}

export const PLAYER_STATUS_LABEL = {
  full: "Full-time player",
  pickup: "Open to pickup/sub weekends",
  not: "Not looking right now",
} as const;

export type PublicPlayer = {
  id: string;
  label: string;
  sport: string;
  birthYear: number;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  state: string;
  county: string;
  status: keyof typeof PLAYER_STATUS_LABEL;
  travelMiles: number | null;
  note: string | null;
  paused: boolean;
  adminTest: boolean;
};

/** The only player shape that may be rendered. Contact fields throw. */
export function toPublicPlayer(row: {
  id: string;
  publicNumber: number;
  sport: string;
  birthYear: number;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  state: string;
  county: string;
  status: keyof typeof PLAYER_STATUS_LABEL;
  travelMiles: number | null;
  note: string | null;
  paused: boolean;
  adminTest: boolean;
}): PublicPlayer {
  const player: PublicPlayer = {
    id: row.id,
    label: formatPlayerLabel(row.publicNumber),
    sport: row.sport,
    birthYear: row.birthYear,
    ageGroup: row.ageGroup,
    positions: row.positions,
    skillLevels: row.skillLevels,
    state: row.state,
    county: row.county,
    status: row.status,
    travelMiles: row.travelMiles,
    note: row.note,
    paused: row.paused,
    adminTest: row.adminTest,
  };
  for (const key of BANNED_PUBLIC_KEYS) {
    if (key in player) {
      throw new Error("Refusing to expose a private player field.");
    }
  }
  return player;
}
