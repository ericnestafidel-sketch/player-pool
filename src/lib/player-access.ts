import { and, eq, gt, isNotNull } from "drizzle-orm";
import { blocks, players, subscriptions } from "@/db/schema";
import { getDb } from "@/db";
import { toPublicPlayer, type PublicPlayer } from "@/lib/safety";
import type { Viewer } from "@/lib/viewer";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPlayerId(value: string): boolean {
  return UUID_RE.test(value);
}

async function loadPlayer(id: string) {
  const db = getDb();
  if (!db || !isPlayerId(id)) return null;
  const [row] = await db
    .select({
      id: players.id,
      publicNumber: players.publicNumber,
      parentId: players.parentId,
      sport: players.sport,
      birthYear: players.birthYear,
      ageGroup: players.ageGroup,
      positions: players.positions,
      skillLevel: players.skillLevel,
      state: players.state,
      county: players.county,
      status: players.status,
      travelMiles: players.travelMiles,
      note: players.note,
      paused: players.paused,
      deletedAt: players.deletedAt,
    })
    .from(players)
    .where(eq(players.id, id))
    .limit(1);
  return row ?? null;
}

async function coachMaySee(
  coachId: string,
  player: { id: string; parentId: string; paused: boolean },
): Promise<boolean> {
  const db = getDb();
  if (!db || player.paused) return false;
  const [blocked] = await db
    .select({ parentId: blocks.parentId })
    .from(blocks)
    .where(and(eq(blocks.parentId, player.parentId), eq(blocks.coachId, coachId)))
    .limit(1);
  if (blocked) return false;
  const [paid] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.playerId, player.id),
        isNotNull(subscriptions.paidAt),
        gt(subscriptions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(paid);
}

/** Approved coach (visible listing) or the parent who owns the profile. */
export async function canReadPlayer(viewer: Viewer, playerId: string): Promise<boolean> {
  const player = await loadPlayer(playerId);
  if (!player || player.deletedAt) return false;
  if (viewer.role === "parent" && viewer.userId === player.parentId) return true;
  if (viewer.role === "coach" && viewer.coachStatus === "approved") {
    return coachMaySee(viewer.userId, player);
  }
  return false;
}

/** Parent editor. Coaches do not get this route. */
export async function canEditPlayer(viewer: Viewer, playerId: string): Promise<boolean> {
  const player = await loadPlayer(playerId);
  if (!player || player.deletedAt) return false;
  return viewer.role === "parent" && viewer.userId === player.parentId;
}

export async function readPublicPlayer(
  viewer: Viewer,
  playerId: string,
  mode: "read" | "edit",
): Promise<PublicPlayer | null> {
  const allowed =
    mode === "edit" ? await canEditPlayer(viewer, playerId) : await canReadPlayer(viewer, playerId);
  if (!allowed) return null;
  const player = await loadPlayer(playerId);
  if (!player || player.deletedAt) return null;
  return toPublicPlayer(player);
}
