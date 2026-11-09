/** Paths a sign-up or sign-in CTA may send someone to. Anything else is dropped. */
const ALLOWED = new Set([
  "/admin",
  "/parent",
  "/parent/player/new",
  "/parent/inbox",
  "/coach/search",
]);

export function safeRedirectPath(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("\\") || decoded.includes("://") || decoded.includes("?") || decoded.includes("#")) {
    return null;
  }
  const path = decoded.replace(/\/+$/, "") || "/";
  return ALLOWED.has(path) ? path : null;
}

export function withRedirect(path: string, destination: string): string {
  const safe = safeRedirectPath(destination);
  if (!safe) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}redirect_url=${encodeURIComponent(safe)}`;
}
