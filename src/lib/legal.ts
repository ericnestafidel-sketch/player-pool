/** Stored with a parent's terms acceptance and a coach's conduct agreement. */
export const LEGAL_VERSION = "2026-11-09";

export const LEGAL_EFFECTIVE_DATE = "November 9, 2026";

/** Server-only. Not a NEXT_PUBLIC_ variable, so it is never sent to the browser bundle as a secret. */
export function supportEmail(): string | null {
  const value = process.env["SUPPORT_EMAIL"]?.trim();
  if (!value || !value.includes("@")) return null;
  return value;
}
