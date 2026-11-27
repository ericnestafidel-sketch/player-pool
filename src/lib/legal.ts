/** Stored with a parent's terms acceptance and a coach's conduct agreement. */
export const LEGAL_VERSION = "2026-11-20";

export const LEGAL_EFFECTIVE_DATE = "November 20, 2026";

/** Public contact address. Shown on the site. Not a secret. */
export const DEFAULT_SUPPORT_EMAIL = "coachericllc@gmail.com";

/** Server-only. SUPPORT_EMAIL wins when set; otherwise the public fallback. */
export function supportEmail(): string {
  const value = process.env["SUPPORT_EMAIL"]?.trim();
  if (value && value.includes("@")) return value;
  return DEFAULT_SUPPORT_EMAIL;
}
