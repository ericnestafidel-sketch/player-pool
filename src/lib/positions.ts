const POSITION_ABBREVIATIONS: Record<string, string> = {
  pitcher: "P",
  p: "P",
  catcher: "C",
  c: "C",
  "first base": "1B",
  "1b": "1B",
  "second base": "2B",
  "2b": "2B",
  "third base": "3B",
  "3b": "3B",
  shortstop: "SS",
  ss: "SS",
  "left field": "LF",
  lf: "LF",
  "center field": "CF",
  cf: "CF",
  "right field": "RF",
  rf: "RF",
  outfield: "OF",
  of: "OF",
  infield: "IF",
  if: "IF",
  utility: "UT",
  ut: "UT",
  "designated hitter": "DH",
  dh: "DH",
};

/** Display-only. Stored position values stay unchanged. */
export function formatPosition(label: string): string {
  return POSITION_ABBREVIATIONS[label.trim().toLowerCase()] ?? label;
}

/** Form and filter labels: "1B (First base)". Values submitted stay the stored label. */
export function formatPositionOption(label: string): string {
  const trimmed = label.trim();
  const abbr = formatPosition(trimmed);
  if (abbr.toLowerCase() === trimmed.toLowerCase()) return abbr;
  return `${abbr} (${trimmed})`;
}

export function formatPositions(labels: string[]): string {
  return labels.map(formatPosition).join(", ");
}
