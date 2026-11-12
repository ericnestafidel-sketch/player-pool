/**
 * Parent listing stays closed until this is true, 1, or yes.
 * Unset means closed, including on the coaches-first launch.
 */
export function playerSignupOpen(): boolean {
  const value = process.env["PLAYER_SIGNUP_OPEN"]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

const LAUNCH_STATE_NAMES: Record<string, string> = {
  IN: "Indiana",
  IL: "Illinois",
  OH: "Ohio",
};

/** Comma-separated state codes. Defaults to Indiana, Illinois, and Ohio. */
export function launchStates(): string[] {
  const raw = process.env["LAUNCH_STATES"]?.trim();
  const codes = (raw && raw.length > 0 ? raw : "IN,IL,OH")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  return codes.length > 0 ? codes : ["IN", "IL", "OH"];
}

export function isLaunchState(state: string): boolean {
  return launchStates().includes(state.trim().toUpperCase());
}

export function launchStateMessage(): string {
  const names = launchStates().map((code) => LAUNCH_STATE_NAMES[code] ?? code);
  const list =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
  return `Player Pool is launching in ${list} first. Your state is coming soon.`;
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
