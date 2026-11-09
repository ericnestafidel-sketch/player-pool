import { asc } from "drizzle-orm";
import { sports } from "@/db/schema";
import { getDb } from "@/db";
import type { SportConfig } from "@/lib/player-rules";

export async function listSports(): Promise<SportConfig[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      slug: sports.slug,
      label: sports.label,
      ageLabels: sports.ageLabels,
      levelLabels: sports.levelLabels,
      positionLabels: sports.positionLabels,
    })
    .from(sports)
    .orderBy(asc(sports.label));
}

export function preferredSport(rows: SportConfig[]): SportConfig | null {
  return rows.find((sport) => sport.slug === "baseball") ?? rows[0] ?? null;
}
