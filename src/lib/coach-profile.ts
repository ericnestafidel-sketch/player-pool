import { BASEBALL_AGES } from "@/lib/coach-options";
import type { CoachStatus } from "@/lib/viewer";

/**
 * The only coach shape a parent may see. Email, phone, and address are not fields
 * on this type. Messages stay in the app.
 */
export type PublicCoach = {
  teamName: string;
  organization: string;
  agesCoached: string;
  yearsExperience: number | null;
  approved: boolean;
  foundingCoach: boolean;
  foundingNumber: number | null;
};

const PUBLIC_ROW_KEYS = new Set([
  "teamName",
  "organization",
  "agesCoached",
  "yearsExperience",
  "status",
  "foundingCoach",
  "foundingNumber",
]);

function isStatus(value: unknown): value is CoachStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "denied" ||
    value === "suspended"
  );
}

/** Fail closed: any column outside the team card throws instead of rendering. */
export function toPublicCoach(row: Record<string, unknown>): PublicCoach {
  for (const key of Object.keys(row)) {
    if (!PUBLIC_ROW_KEYS.has(key)) {
      throw new Error("Refusing to expose a private coach field.");
    }
  }
  const years = row.yearsExperience;
  const foundingNumber = row.foundingNumber;
  if (
    typeof row.teamName !== "string" ||
    typeof row.organization !== "string" ||
    typeof row.agesCoached !== "string" ||
    !isStatus(row.status) ||
    typeof row.foundingCoach !== "boolean" ||
    (years != null && typeof years !== "number") ||
    (foundingNumber != null && typeof foundingNumber !== "number")
  ) {
    throw new Error("Coach card is missing a public field.");
  }
  return {
    teamName: row.teamName,
    organization: row.organization,
    agesCoached: row.agesCoached,
    yearsExperience: typeof years === "number" ? years : null,
    approved: row.status === "approved",
    foundingCoach: row.foundingCoach,
    foundingNumber: typeof foundingNumber === "number" ? foundingNumber : null,
  };
}

export function ageTags(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function selectedAges(value: string): string[] {
  const known = new Set<string>(BASEBALL_AGES);
  return ageTags(value).filter((age) => known.has(age));
}

export function yearsLabel(years: number | null): string | null {
  if (years == null) return null;
  if (years === 1) return "1 year coaching";
  return `${years} years coaching`;
}
