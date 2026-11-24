/** Display-only. Stored county values stay unchanged. */
export function formatLocation(county: string, state: string): string {
  const name = county.trim().replace(/\s+(county|co\.?)$/i, "");
  return `${name} Co., ${state}`;
}
