import { and, eq, exists, gt, isNotNull, isNull, notExists, type SQL } from "drizzle-orm";
import { blocks, players, subscriptions } from "@/db/schema";
import { getDb } from "@/db";
import { toPublicPlayer, type PublicPlayer } from "@/lib/safety";
import type { Viewer } from "@/lib/viewer";

/**
 * Off until launch. Set REQUIRE_PAID_LISTING=true so search only shows a player
 * with paid_at set and expires_at in the future. $0 promo checkouts count.
 */
export function paidListingEnforced(): boolean {
  const value = process.env["REQUIRE_PAID_LISTING"]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export async function hasActivePaidListing(playerId: string, now = new Date()): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const [paid] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.playerId, playerId),
        isNotNull(subscriptions.paidAt),
        gt(subscriptions.expiresAt, now),
      ),
    )
    .limit(1);
  return Boolean(paid);
}

export async function listingOpenForCoaches(player: {
  id: string;
  paused: boolean;
  deletedAt: Date | null;
}): Promise<boolean> {
  if (player.paused || player.deletedAt) return false;
  if (!paidListingEnforced()) return true;
  return hasActivePaidListing(player.id);
}

/**
 * Coach search WHERE clause. Keep this in step with coachMaySee:
 * not paused, not deleted, not blocked, and the paid-listing hook above.
 */
export function coachVisibilityConditions(
  coachId: string,
  now: Date,
  options?: { includeAdminTests?: boolean },
): SQL[] | null {
  const db = getDb();
  if (!db) return null;
  const conditions: SQL[] = [
    eq(players.paused, false),
    isNull(players.deletedAt),
  ];
  if (!options?.includeAdminTests) conditions.push(eq(players.adminTest, false));
  conditions.push(
    notExists(
      db
        .select({ parentId: blocks.parentId })
        .from(blocks)
        .where(and(eq(blocks.parentId, players.parentId), eq(blocks.coachId, coachId))),
    ),
  );
  if (paidListingEnforced()) {
    conditions.push(
      exists(
        db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.playerId, players.id),
              isNotNull(subscriptions.paidAt),
              gt(subscriptions.expiresAt, now),
            ),
          ),
      ),
    );
  }
  return conditions;
}

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
      adminTest: players.adminTest,
    })
    .from(players)
    .where(eq(players.id, id))
    .limit(1);
  return row ?? null;
}

async function coachMaySee(
  coachId: string,
  player: { id: string; parentId: string; paused: boolean; deletedAt: Date | null },
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  if (!(await listingOpenForCoaches(player))) return false;
  const [blocked] = await db
    .select({ parentId: blocks.parentId })
    .from(blocks)
    .where(and(eq(blocks.parentId, player.parentId), eq(blocks.coachId, coachId)))
    .limit(1);
  return !blocked;
}

/** Approved coach (visible listing) or the parent who owns the profile. */
export async function canReadPlayer(viewer: Viewer, playerId: string): Promise<boolean> {
  const player = await loadPlayer(playerId);
  if (!player || player.deletedAt) return false;
  if ((viewer.role === "parent" || viewer.role === "admin") && viewer.userId === player.parentId) {
    return true;
  }
  if (viewer.role === "admin") {
    if (player.adminTest) return true;
    return listingOpenForCoaches(player);
  }
  if (viewer.role === "coach" && viewer.coachStatus === "approved" && !player.adminTest) {
    return coachMaySee(viewer.userId, player);
  }
  return false;
}

/** Parent editor. Coaches do not get this route. */
export async function canEditPlayer(viewer: Viewer, playerId: string): Promise<boolean> {
  const player = await loadPlayer(playerId);
  if (!player || player.deletedAt) return false;
  return (viewer.role === "parent" || viewer.role === "admin") && viewer.userId === player.parentId;
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
