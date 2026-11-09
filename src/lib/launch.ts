/**
 * Parent listing stays closed until this is true, 1, or yes.
 * Unset means closed, including on the coaches-first launch.
 */
export function playerSignupOpen(): boolean {
  const value = process.env["PLAYER_SIGNUP_OPEN"]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

/** Production origin used when APP_URL is unset, so canonicals stay on the live site. */
export const PRODUCTION_ORIGIN = "https://player-pool.net";

/** Public site origin with no trailing slash. APP_URL when set, otherwise production. */
export function siteOrigin(): string {
  return appOriginFromEnv() ?? PRODUCTION_ORIGIN;
}

/** Public site origin with no trailing slash. Empty when APP_URL is unset. */
export function appOriginFromEnv(): string | null {
  const configured = process.env["APP_URL"]?.trim();
  if (!configured) return null;
  return configured.replace(/\/$/, "");
}

export function fallbackOrigin(): string {
  const vercel = process.env["VERCEL_URL"]?.trim();
  if (!vercel) return "";
  return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
}

/** APP_URL wins whenever it is set. Otherwise use the supplied fallback origin. */
export function absoluteUrl(path: string, fallback = ""): string | null {
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("://") || path.includes("\\") || path.includes("\n") || path.includes(" ")) {
    return null;
  }
  const origin = appOriginFromEnv() ?? fallback.replace(/\/$/, "");
  if (!origin) return null;
  return `${origin}${path}`;
}
