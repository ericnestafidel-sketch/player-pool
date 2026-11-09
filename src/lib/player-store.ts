import { and, desc, eq, exists, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import {
  availabilityWeekends,
  blocks,
  coachNotes,
  coaches,
  highlights,
  playerStats,
  players,
  profileViews,
  savedSearches,
  subscriptions,
} from "@/db/schema";
import { getDb, type Database } from "@/db";
import { toPublicCoach, type PublicCoach } from "@/lib/coach-profile";
import { coachVisibilityConditions, isPlayerId } from "@/lib/player-access";
import {
  assertNoContactFields,
  draftStats,
  emptyDraft,
  filtersFromUnknown,
  filtersToQuery,
  highlightIsFresh,
  readStatsData,
  type HighlightEntry,
  type PlayerDraft,
  type PlayerInput,
  type SearchFilters,
  type SportConfig,
  type StatEntry,
  type WeekendMark,
} from "@/lib/player-rules";
import { formatPlayerLabel, toPublicPlayer, type PublicPlayer } from "@/lib/safety";

const PURGE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const VIEW_DEDUPE_MS = 60 * 60 * 1000;
const SEARCH_LIMIT = 100;

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type ProfileViewer = {
  coachId: string;
  coach: PublicCoach;
  viewedAt: Date;
  blocked: boolean;
};

export type ParentPlayer = {
  player: PublicPlayer;
  highlightFresh: boolean;
  weekends: WeekendMark[];
  viewers: ProfileViewer[];
};

export type PlayerEditor = {
  id: string;
  label: string;
  paused: boolean;
  highlightFresh: boolean;
  draft: PlayerDraft;
  viewers: ProfileViewer[];
};

export type PlayerDetail = {
  player: PublicPlayer;
  highlightFresh: boolean;
  stats: StatEntry[];
  highlights: HighlightEntry[];
  weekends: WeekendMark[];
};

export type SearchHit = {
  player: PublicPlayer;
  highlightFresh: boolean;
  weekends: WeekendMark[];
  note: string | null;
};

export type SavedSearch = {
  id: string;
  name: string;
  href: string;
};

const playerColumns = {
  id: players.id,
  publicNumber: players.publicNumber,
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
};

export async function purgeDeletedPlayers(now = new Date()): Promise<void> {
  const db = getDb();
  if (!db) return;
  const cutoff = new Date(now.getTime() - PURGE_AFTER_MS);
  await db.delete(players).where(and(isNotNull(players.deletedAt), lt(players.deletedAt, cutoff)));
}

export async function saveParentPlayer(
  parentId: string,
  input: PlayerInput,
  playerId?: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  if (playerId && !isPlayerId(playerId)) return { ok: false, error: "That profile is not available." };
  try {
    const id = await db.transaction(async (tx) => {
      const savedId = playerId
        ? await updateOwnedPlayer(tx, parentId, playerId, input)
        : await insertOwnedPlayer(tx, parentId, input);
      if (!savedId) return null;
      const latestHighlight = await replaceHighlights(tx, savedId, input.highlights);
      await tx
        .update(players)
        .set({ highlightUploadedAt: latestHighlight, updatedAt: new Date() })
        .where(eq(players.id, savedId));
      await replaceWeekends(tx, savedId, input.weekends);
      await tx
        .insert(playerStats)
        .values({ playerId: savedId, data: { entries: input.stats } })
        .onConflictDoUpdate({
          target: playerStats.playerId,
          set: { data: { entries: input.stats } },
        });
      return savedId;
    });
    if (!id) return { ok: false, error: "That profile is not available." };
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not save the profile." };
  }
}

async function insertOwnedPlayer(tx: Tx, parentId: string, input: PlayerInput): Promise<string | null> {
  const [created] = await tx
    .insert(players)
    .values({
      parentId,
      sport: input.sport,
      birthYear: input.birthYear,
      ageGroup: input.ageGroup,
      positions: input.positions,
      skillLevel: input.skillLevel,
      state: input.state,
      county: input.county,
      status: input.status,
      travelMiles: input.travelMiles,
      note: input.note,
      updatedAt: new Date(),
    })
    .returning({ id: players.id });
  return created?.id ?? null;
}

async function updateOwnedPlayer(
  tx: Tx,
  parentId: string,
  playerId: string,
  input: PlayerInput,
): Promise<string | null> {
  const [updated] = await tx
    .update(players)
    .set({
      sport: input.sport,
      birthYear: input.birthYear,
      ageGroup: input.ageGroup,
      positions: input.positions,
      skillLevel: input.skillLevel,
      state: input.state,
      county: input.county,
      status: input.status,
      travelMiles: input.travelMiles,
      note: input.note,
      updatedAt: new Date(),
    })
    .where(and(eq(players.id, playerId), eq(players.parentId, parentId), isNull(players.deletedAt)))
    .returning({ id: players.id });
  return updated?.id ?? null;
}

async function replaceHighlights(tx: Tx, playerId: string, next: HighlightEntry[]): Promise<Date | null> {
  const existing = await tx
    .select({ url: highlights.url, uploadedAt: highlights.uploadedAt })
    .from(highlights)
    .where(eq(highlights.playerId, playerId));
  const previous = new Map(existing.map((row) => [row.url, row.uploadedAt]));
  await tx.delete(highlights).where(eq(highlights.playerId, playerId));
  let latest: Date | null = null;
  for (const item of next) {
    const uploadedAt = previous.get(item.url) ?? new Date();
    if (!latest || uploadedAt > latest) latest = uploadedAt;
    await tx.insert(highlights).values({
      playerId,
      url: item.url,
      title: item.title,
      uploadedAt,
    });
  }
  return latest;
}

async function replaceWeekends(tx: Tx, playerId: string, weekends: WeekendMark[]): Promise<void> {
  await tx.delete(availabilityWeekends).where(eq(availabilityWeekends.playerId, playerId));
  if (weekends.length === 0) return;
  await tx.insert(availabilityWeekends).values(
    weekends.map((weekend) => ({
      playerId,
      weekendStart: weekend.weekendStart,
      state: weekend.state,
    })),
  );
}

export async function setPlayerPaused(
  parentId: string,
  playerId: string,
  paused: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  if (!isPlayerId(playerId)) return { ok: false, error: "That profile is not available." };
  const [updated] = await db
    .update(players)
    .set({ paused, updatedAt: new Date() })
    .where(and(eq(players.id, playerId), eq(players.parentId, parentId), isNull(players.deletedAt)))
    .returning({ id: players.id });
  if (!updated) return { ok: false, error: "That profile is not available." };
  return { ok: true };
}

export async function softDeletePlayer(
  parentId: string,
  playerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  if (!isPlayerId(playerId)) return { ok: false, error: "That profile is not available." };
  const [updated] = await db
    .update(players)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(players.id, playerId), eq(players.parentId, parentId), isNull(players.deletedAt)))
    .returning({ id: players.id });
  if (!updated) return { ok: false, error: "That profile is not available." };
  await purgeDeletedPlayers();
  return { ok: true };
}

export async function listParentPlayers(parentId: string, now = new Date()): Promise<ParentPlayer[]> {
  const db = getDb();
  if (!db) return [];
  await purgeDeletedPlayers(now);
  const rows = await db
    .select({
      ...playerColumns,
      highlightUploadedAt: players.highlightUploadedAt,
    })
    .from(players)
    .where(and(eq(players.parentId, parentId), isNull(players.deletedAt)))
    .orderBy(desc(players.updatedAt));
  const ids = rows.map((row) => row.id);
  const [weekendRows, viewers] = await Promise.all([
    loadWeekends(ids),
    loadViewers(ids),
  ]);
  const roster = rows.map((row) => ({
    player: toPublicPlayer(row),
    highlightFresh: highlightIsFresh(row.highlightUploadedAt, now),
    weekends: weekendRows.get(row.id) ?? [],
    viewers: viewers.get(row.id) ?? [],
  }));
  assertNoContactFields(roster);
  return roster;
}

export async function loadPlayerEditor(
  parentId: string,
  playerId: string,
  now = new Date(),
): Promise<PlayerEditor | null> {
  const db = getDb();
  if (!db || !isPlayerId(playerId)) return null;
  const [row] = await db
    .select({
      ...playerColumns,
      highlightUploadedAt: players.highlightUploadedAt,
    })
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.parentId, parentId), isNull(players.deletedAt)))
    .limit(1);
  if (!row) return null;
  const [statsRow, highlightRows, weekendRows, viewers] = await Promise.all([
    db.select({ data: playerStats.data }).from(playerStats).where(eq(playerStats.playerId, playerId)).limit(1),
    db
      .select({ url: highlights.url, title: highlights.title })
      .from(highlights)
      .where(eq(highlights.playerId, playerId))
      .orderBy(highlights.uploadedAt),
    loadWeekends([playerId]),
    loadViewers([playerId]),
  ]);
  const availability: PlayerDraft["availability"] = {};
  for (const weekend of weekendRows.get(playerId) ?? []) {
    availability[weekend.weekendStart] = weekend.state;
  }
  const editor: PlayerEditor = {
    id: row.id,
    label: formatPlayerLabel(row.publicNumber),
    paused: row.paused,
    highlightFresh: highlightIsFresh(row.highlightUploadedAt, now),
    viewers: viewers.get(playerId) ?? [],
    draft: {
      ...emptyDraft(row.sport),
      playerId: row.id,
      sport: row.sport,
      birthYear: String(row.birthYear),
      ageGroup: row.ageGroup,
      positions: row.positions,
      skillLevel: row.skillLevel,
      state: row.state,
      county: row.county,
      status: row.status,
      travelMiles: row.travelMiles == null ? "" : String(row.travelMiles),
      note: row.note ?? "",
      stats: draftStats(readStatsData(statsRow[0]?.data)),
      highlights: highlightRows.length > 0 ? highlightRows : [{ url: "", title: "" }],
      availability,
    },
  };
  assertNoContactFields(editor);
  return editor;
}

export async function loadReadableDetail(playerId: string, now = new Date()): Promise<PlayerDetail | null> {
  const db = getDb();
  if (!db || !isPlayerId(playerId)) return null;
  const [row] = await db
    .select({
      ...playerColumns,
      deletedAt: players.deletedAt,
      highlightUploadedAt: players.highlightUploadedAt,
    })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);
  if (!row || row.deletedAt) return null;
  const [statsRow, highlightRows, weekendRows] = await Promise.all([
    db.select({ data: playerStats.data }).from(playerStats).where(eq(playerStats.playerId, playerId)).limit(1),
    db
      .select({ url: highlights.url, title: highlights.title })
      .from(highlights)
      .where(eq(highlights.playerId, playerId))
      .orderBy(desc(highlights.uploadedAt)),
    loadWeekends([playerId]),
  ]);
  const detail: PlayerDetail = {
    player: toPublicPlayer(row),
    highlightFresh: highlightIsFresh(row.highlightUploadedAt, now),
    stats: readStatsData(statsRow[0]?.data),
    highlights: highlightRows,
    weekends: weekendRows.get(playerId) ?? [],
  };
  assertNoContactFields(detail);
  return detail;
}

export async function searchPlayers(
  coachId: string,
  filters: SearchFilters,
  now = new Date(),
): Promise<{ hits: SearchHit[]; truncated: boolean }> {
  const db = getDb();
  const visibility = coachVisibilityConditions(coachId, now);
  if (!db || !visibility) return { hits: [], truncated: false };
  await purgeDeletedPlayers(now);
  const conditions = [...visibility];
  if (filters.ageGroup) conditions.push(eq(players.ageGroup, filters.ageGroup));
  if (filters.position) conditions.push(sql`${filters.position} = any(${players.positions})`);
  if (filters.skillLevel) conditions.push(eq(players.skillLevel, filters.skillLevel));
  if (filters.state) conditions.push(eq(players.state, filters.state));
  if (filters.county) conditions.push(sql`lower(${players.county}) = ${filters.county.toLowerCase()}`);
  if (filters.status) conditions.push(eq(players.status, filters.status));
  if (filters.weekend) {
    conditions.push(
      exists(
        db
          .select({ playerId: availabilityWeekends.playerId })
          .from(availabilityWeekends)
          .where(
            and(
              eq(availabilityWeekends.playerId, players.id),
              eq(availabilityWeekends.weekendStart, filters.weekend),
              eq(availabilityWeekends.state, "avail"),
            ),
          ),
      ),
    );
  }
  const rows = await db
    .select({
      ...playerColumns,
      highlightUploadedAt: players.highlightUploadedAt,
      noteBody: coachNotes.body,
    })
    .from(players)
    .leftJoin(coachNotes, and(eq(coachNotes.playerId, players.id), eq(coachNotes.coachId, coachId)))
    .where(and(...conditions))
    .orderBy(desc(players.updatedAt))
    .limit(SEARCH_LIMIT + 1);
  const truncated = rows.length > SEARCH_LIMIT;
  const page = truncated ? rows.slice(0, SEARCH_LIMIT) : rows;
  const weekendRows = await loadWeekends(page.map((row) => row.id));
  const hits = page.map((row) => ({
    player: toPublicPlayer(row),
    highlightFresh: highlightIsFresh(row.highlightUploadedAt, now),
    weekends: weekendRows.get(row.id) ?? [],
    note: row.noteBody,
  }));
  assertNoContactFields(hits);
  return { hits, truncated };
}

export async function listPlayerViewers(playerId: string): Promise<ProfileViewer[]> {
  if (!isPlayerId(playerId)) return [];
  const grouped = await loadViewers([playerId]);
  const viewers = grouped.get(playerId) ?? [];
  assertNoContactFields(viewers);
  return viewers;
}

export async function loadCoachNote(coachId: string, playerId: string): Promise<string | null> {
  const db = getDb();
  if (!db || !isPlayerId(playerId)) return null;
  const [row] = await db
    .select({ body: coachNotes.body })
    .from(coachNotes)
    .where(and(eq(coachNotes.coachId, coachId), eq(coachNotes.playerId, playerId)))
    .limit(1);
  return row?.body ?? null;
}

export async function saveCoachNote(
  coachId: string,
  playerId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  if (!isPlayerId(playerId)) return { ok: false, error: "That profile is not available." };
  const text = body.trim();
  if (text.length > 2000) return { ok: false, error: "Keep the note under 2000 characters." };
  if (!text) {
    await db
      .delete(coachNotes)
      .where(and(eq(coachNotes.coachId, coachId), eq(coachNotes.playerId, playerId)));
    return { ok: true };
  }
  await db
    .insert(coachNotes)
    .values({ coachId, playerId, body: text, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [coachNotes.coachId, coachNotes.playerId],
      set: { body: text, updatedAt: new Date() },
    });
  return { ok: true };
}

export async function recordCoachView(coachId: string, playerId: string, now = new Date()): Promise<void> {
  const db = getDb();
  if (!db || !isPlayerId(playerId)) return;
  const since = new Date(now.getTime() - VIEW_DEDUPE_MS);
  const [recent] = await db
    .select({ id: profileViews.id })
    .from(profileViews)
    .where(
      and(
        eq(profileViews.playerId, playerId),
        eq(profileViews.coachId, coachId),
        sql`${profileViews.viewedAt} > ${since}`,
      ),
    )
    .limit(1);
  if (!recent) {
    await db.insert(profileViews).values({ playerId, coachId });
  }
  await db
    .update(subscriptions)
    .set({ viewedByCoach: true })
    .where(eq(subscriptions.playerId, playerId));
}

export async function listSavedSearches(
  coachId: string,
  sport: SportConfig | null,
  now: Date,
): Promise<SavedSearch[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: savedSearches.id,
      name: savedSearches.name,
      filters: savedSearches.filters,
    })
    .from(savedSearches)
    .where(eq(savedSearches.coachId, coachId))
    .orderBy(desc(savedSearches.createdAt));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    href: `/coach/search${filtersToQuery(filtersFromUnknown(row.filters, sport, now))}`,
  }));
}

export async function saveCoachSearch(
  coachId: string,
  name: string,
  filters: SearchFilters,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const label = name.trim();
  if (label.length < 2 || label.length > 40) {
    return { ok: false, error: "Name the search with 2 to 40 characters." };
  }
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(savedSearches)
    .where(eq(savedSearches.coachId, coachId));
  if ((countRow?.count ?? 0) >= 20) {
    return { ok: false, error: "You can save up to 20 searches. Delete one first." };
  }
  await db.insert(savedSearches).values({
    coachId,
    name: label,
    filters,
  });
  return { ok: true };
}

export async function deleteSavedSearch(
  coachId: string,
  searchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db || !isPlayerId(searchId)) return { ok: false, error: "That saved search is not available." };
  const [removed] = await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, searchId), eq(savedSearches.coachId, coachId)))
    .returning({ id: savedSearches.id });
  if (!removed) return { ok: false, error: "That saved search is not available." };
  return { ok: true };
}

async function loadWeekends(playerIds: string[]): Promise<Map<string, WeekendMark[]>> {
  const grouped = new Map<string, WeekendMark[]>();
  const db = getDb();
  if (!db || playerIds.length === 0) return grouped;
  const rows = await db
    .select({
      playerId: availabilityWeekends.playerId,
      weekendStart: availabilityWeekends.weekendStart,
      state: availabilityWeekends.state,
    })
    .from(availabilityWeekends)
    .where(inArray(availabilityWeekends.playerId, playerIds));
  for (const row of rows) {
    const list = grouped.get(row.playerId) ?? [];
    list.push({ weekendStart: row.weekendStart, state: row.state });
    grouped.set(row.playerId, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.weekendStart.localeCompare(b.weekendStart));
  }
  return grouped;
}

async function loadViewers(playerIds: string[]): Promise<Map<string, ProfileViewer[]>> {
  const grouped = new Map<string, Map<string, ProfileViewer>>();
  const db = getDb();
  if (!db || playerIds.length === 0) return new Map();
  const rows = await db
    .select({
      playerId: profileViews.playerId,
      parentId: players.parentId,
      coachId: profileViews.coachId,
      viewedAt: profileViews.viewedAt,
      teamName: coaches.teamName,
      organization: coaches.organization,
      agesCoached: coaches.agesCoached,
      yearsExperience: coaches.yearsExperience,
      status: coaches.status,
    })
    .from(profileViews)
    .innerJoin(players, eq(players.id, profileViews.playerId))
    .innerJoin(coaches, eq(coaches.userId, profileViews.coachId))
    .where(inArray(profileViews.playerId, playerIds))
    .orderBy(desc(profileViews.viewedAt));
  const parentIds = [...new Set(rows.map((row) => row.parentId))];
  const blockRows =
    parentIds.length === 0
      ? []
      : await db
          .select({ parentId: blocks.parentId, coachId: blocks.coachId })
          .from(blocks)
          .where(inArray(blocks.parentId, parentIds));
  const blockedKeys = new Set(blockRows.map((row) => `${row.parentId}:${row.coachId}`));
  for (const row of rows) {
    const byCoach = grouped.get(row.playerId) ?? new Map<string, ProfileViewer>();
    if (!byCoach.has(row.coachId)) {
      byCoach.set(row.coachId, {
        coachId: row.coachId,
        blocked: blockedKeys.has(`${row.parentId}:${row.coachId}`),
        coach: toPublicCoach({
          teamName: row.teamName,
          organization: row.organization,
          agesCoached: row.agesCoached,
          yearsExperience: row.yearsExperience,
          status: row.status,
        }),
        viewedAt: row.viewedAt,
      });
    }
    grouped.set(row.playerId, byCoach);
  }
  const result = new Map<string, ProfileViewer[]>();
  for (const [playerId, byCoach] of grouped) {
    result.set(playerId, [...byCoach.values()].slice(0, 12));
  }
  return result;
}
