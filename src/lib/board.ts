import { and, arrayOverlaps, count, desc, eq, gte, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { boardPosts, boardReports, coaches, needAlerts, players, users } from "@/db/schema";
import { getDb } from "@/db";
import { AGE_GROUPS, BASEBALL_LEVELS, BASEBALL_POSITIONS } from "@/lib/coach-options";
import { isLaunchState, launchStateMessage, launchStates } from "@/lib/launch";
import {
  boardFieldError,
  boardNeedLine,
  boardNoteError,
  boardSchedule,
  closeInstant,
  indianaToday,
  needStillOpen,
  shiftIsoDate,
} from "@/lib/board-rules";
import { toPublicCoach, type PublicCoach } from "@/lib/coach-profile";
import { MATCHING_NEED_SUBJECT } from "@/lib/message-text";
import { sendNotification } from "@/lib/notify";
import { isPlayerId } from "@/lib/player-access";
import type { Viewer } from "@/lib/viewer";

export type BoardPostView = {
  id: string;
  coachId: string;
  teamName: string;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  county: string;
  state: string;
  eventName: string | null;
  startsOn: string;
  endsOn: string;
  playersNeeded: number;
  closesOn: string;
  summary: string;
  notes: string | null;
  expiresAt: Date;
  createdAt: Date;
  closedAt: Date | null;
  coach: PublicCoach;
  mine: boolean;
};

type PostRow = {
  id: string;
  coachId: string;
  teamName: string;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  county: string;
  state: string;
  eventName: string | null;
  startsOn: string;
  endsOn: string;
  playersNeeded: number;
  closesOn: string;
  notes: string | null;
  expiresAt: Date;
  createdAt: Date;
  closedAt: Date | null;
  coachTeamName: string;
  organization: string;
  agesCoached: string;
  yearsExperience: number | null;
  status: "pending" | "approved" | "denied" | "suspended";
  foundingCoach: boolean;
  foundingNumber: number | null;
};

const columns = {
  id: boardPosts.id,
  coachId: boardPosts.coachId,
  teamName: boardPosts.teamName,
  ageGroup: boardPosts.ageGroup,
  positions: boardPosts.positions,
  skillLevels: boardPosts.skillLevels,
  county: boardPosts.county,
  state: boardPosts.state,
  eventName: boardPosts.eventName,
  startsOn: boardPosts.startsOn,
  endsOn: boardPosts.endsOn,
  playersNeeded: boardPosts.playersNeeded,
  closesOn: boardPosts.closesOn,
  notes: boardPosts.notes,
  expiresAt: boardPosts.expiresAt,
  createdAt: boardPosts.createdAt,
  closedAt: boardPosts.closedAt,
  coachTeamName: coaches.teamName,
  organization: coaches.organization,
  agesCoached: coaches.agesCoached,
  yearsExperience: coaches.yearsExperience,
  status: coaches.status,
  foundingCoach: coaches.foundingCoach,
  foundingNumber: coaches.foundingNumber,
};

export function canReadBoard(viewer: Viewer): boolean {
  if (viewer.role === "admin") return true;
  if (viewer.role === "parent") return viewer.emailVerified;
  return viewer.role === "coach" && viewer.coachStatus === "approved";
}

export function canPostBoard(viewer: Viewer): boolean {
  return viewer.role === "coach" && viewer.coachStatus === "approved";
}

function openConditions(now: Date) {
  const today = indianaToday(now);
  return and(
    isNull(boardPosts.closedAt),
    isNull(boardPosts.hiddenAt),
    isNull(boardPosts.removedAt),
    gte(boardPosts.closesOn, today),
    gte(boardPosts.endsOn, today),
    eq(coaches.status, "approved"),
  );
}

/** A Need is deleted 90 days after a coach closes it, or 90 days after its close date. */
export const NEED_RETENTION_DAYS = 90;

export async function purgeExpiredNeeds(now = new Date()): Promise<void> {
  const db = getDb();
  if (!db) return;
  const cutoffDate = shiftIsoDate(indianaToday(now), -NEED_RETENTION_DAYS);
  const cutoffInstant = new Date(now.getTime() - NEED_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(boardPosts).where(
    or(
      and(isNotNull(boardPosts.closedAt), lt(boardPosts.closedAt, cutoffInstant)),
      lt(boardPosts.closesOn, cutoffDate),
    ),
  );
}

export async function countOpenNeeds(now = new Date()): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  await purgeExpiredNeeds(now);
  const states = launchStates();
  if (states.length === 0) return 0;
  const [row] = await db
    .select({ total: count() })
    .from(boardPosts)
    .innerJoin(coaches, eq(coaches.userId, boardPosts.coachId))
    .where(and(openConditions(now), inArray(boardPosts.state, states)));
  return Number(row?.total ?? 0);
}

export async function listBoardPosts(viewer: Viewer, now = new Date()): Promise<BoardPostView[]> {
  if (!canReadBoard(viewer)) return [];
  const db = getDb();
  if (!db) return [];
  await purgeExpiredNeeds(now);
  const rows = await db
    .select(columns)
    .from(boardPosts)
    .innerJoin(coaches, eq(coaches.userId, boardPosts.coachId))
    .where(openConditions(now))
    .orderBy(desc(boardPosts.createdAt));
  return rows.map((row) => toView(row, viewer.userId));
}

export async function loadBoardPost(viewer: Viewer, id: string, now = new Date()): Promise<BoardPostView | null> {
  if (!canReadBoard(viewer) || !isPlayerId(id)) return null;
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({
      ...columns,
      hiddenAt: boardPosts.hiddenAt,
      removedAt: boardPosts.removedAt,
    })
    .from(boardPosts)
    .innerJoin(coaches, eq(coaches.userId, boardPosts.coachId))
    .where(eq(boardPosts.id, id))
    .limit(1);
  if (!row || row.removedAt) return null;
  const owner = row.coachId === viewer.userId;
  const visible =
    !row.hiddenAt && !row.closedAt && needStillOpen(row.closesOn, row.endsOn, now) && row.status === "approved";
  if (!visible && !owner && viewer.role !== "admin") return null;
  return toView(row, viewer.userId);
}

function toView(row: PostRow, viewerId: string): BoardPostView {
  return {
    id: row.id,
    coachId: row.coachId,
    teamName: row.teamName,
    ageGroup: row.ageGroup,
    positions: row.positions,
    skillLevels: row.skillLevels,
    county: row.county,
    state: row.state,
    eventName: row.eventName,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    playersNeeded: row.playersNeeded,
    closesOn: row.closesOn,
    summary: boardNeedLine(row),
    notes: row.notes,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    coach: toPublicCoach({
      teamName: row.coachTeamName,
      organization: row.organization,
      agesCoached: row.agesCoached,
      yearsExperience: row.yearsExperience,
      status: row.status,
      foundingCoach: row.foundingCoach,
      foundingNumber: row.foundingNumber,
    }),
    mine: row.coachId === viewerId,
  };
}

export type BoardInput = {
  teamName: string;
  ageGroup: string;
  positions: string[];
  skillLevels: string[];
  state: string;
  county: string;
  eventName: string;
  startsOn: string;
  endsOn: string;
  closesOn: string;
  playersNeeded: string;
  notes: string;
};

export async function saveBoardPost(
  viewer: Viewer,
  input: BoardInput,
  postId?: string,
  now = new Date(),
): Promise<{ ok: true; id: string } | { ok: false; error?: string; fieldErrors: Record<string, string> }> {
  if (!canPostBoard(viewer)) return { ok: false, error: "Only an approved coach can post.", fieldErrors: {} };
  const errors = boardFieldError({
    ...input,
    ageLabels: [...AGE_GROUPS],
    levelLabels: [...BASEBALL_LEVELS],
    positionLabels: [...BASEBALL_POSITIONS],
  });
  if (!isLaunchState(input.state)) errors.state = launchStateMessage();
  const schedule = boardSchedule(input);
  Object.assign(errors, schedule.errors);
  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet.", fieldErrors: {} };
  const values = {
    teamName: input.teamName.trim(),
    ageGroup: input.ageGroup,
    positions: input.positions,
    skillLevels: input.skillLevels,
    state: input.state.toUpperCase(),
    county: input.county.trim(),
    eventName: input.eventName.trim() || null,
    startsOn: input.startsOn.trim(),
    endsOn: input.endsOn.trim(),
    playersNeeded: schedule.playersNeeded,
    closesOn: schedule.closesOn,
    neededThrough: input.endsOn.trim(),
    notes: input.notes.trim() || null,
    expiresAt: closeInstant(schedule.closesOn),
    updatedAt: now,
  };
  if (postId) {
    if (!isPlayerId(postId)) return { ok: false, error: "That post is not available.", fieldErrors: {} };
    const [updated] = await db
      .update(boardPosts)
      .set(values)
      .where(and(eq(boardPosts.id, postId), eq(boardPosts.coachId, viewer.userId), isNull(boardPosts.removedAt)))
      .returning({ id: boardPosts.id });
    if (!updated) return { ok: false, error: "That post is not available.", fieldErrors: {} };
    return { ok: true, id: updated.id };
  }
  const [created] = await db
    .insert(boardPosts)
    .values({ ...values, coachId: viewer.userId })
    .returning({ id: boardPosts.id });
  if (!created) return { ok: false, error: "Could not save the post.", fieldErrors: {} };
  try {
    await notifyMatchingParents({
      id: created.id,
      coachId: viewer.userId,
      state: values.state,
      county: values.county,
      ageGroup: values.ageGroup,
      positions: values.positions,
    });
  } catch (error) {
    console.error("Could not notify parents about a Need", error instanceof Error ? error.name : "");
  }
  return { ok: true, id: created.id };
}

async function notifyMatchingParents(post: {
  id: string;
  coachId: string;
  state: string;
  county: string;
  ageGroup: string;
  positions: string[];
}): Promise<void> {
  const db = getDb();
  if (!db || post.positions.length === 0) return;
  const matches = await db
    .select({ parentId: players.parentId, email: users.email })
    .from(players)
    .innerJoin(users, eq(users.id, players.parentId))
    .where(
      and(
        isNull(players.deletedAt),
        eq(players.adminTest, false),
        eq(players.state, post.state),
        sql`lower(${players.county}) = ${post.county.toLowerCase()}`,
        eq(players.ageGroup, post.ageGroup),
        arrayOverlaps(players.positions, post.positions),
      ),
    );
  const seen = new Set<string>();
  for (const match of matches) {
    if (!match.parentId || match.parentId === post.coachId || seen.has(match.parentId)) continue;
    seen.add(match.parentId);
    await db
      .insert(needAlerts)
      .values({ parentId: match.parentId, postId: post.id })
      .onConflictDoNothing();
    if (match.email) await sendNotification(match.email, "/board", MATCHING_NEED_SUBJECT);
  }
}

export async function unreadNeedAlertCount(parentId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ total: count() })
    .from(needAlerts)
    .where(and(eq(needAlerts.parentId, parentId), isNull(needAlerts.readAt)));
  return Number(row?.total ?? 0);
}

export async function markNeedAlertsRead(parentId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(needAlerts)
    .set({ readAt: new Date() })
    .where(and(eq(needAlerts.parentId, parentId), isNull(needAlerts.readAt)));
}

export async function closeBoardPost(viewer: Viewer, postId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canPostBoard(viewer) || !isPlayerId(postId)) return { ok: false, error: "That post is not available." };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const [updated] = await db
    .update(boardPosts)
    .set({ closedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(boardPosts.id, postId), eq(boardPosts.coachId, viewer.userId), isNull(boardPosts.removedAt)))
    .returning({ id: boardPosts.id });
  if (!updated) return { ok: false, error: "That post is not available." };
  return { ok: true };
}

export async function reportBoardPost(
  viewer: Viewer,
  postId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canReadBoard(viewer) || !isPlayerId(postId)) return { ok: false, error: "That post is not available." };
  const text = reason.trim();
  if (text.length < 4 || text.length > 500) return { ok: false, error: "Write a short reason." };
  const note = boardNoteError(text);
  if (note) return { ok: false, error: note };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const post = await loadBoardPost(viewer, postId);
  if (!post || post.mine) return { ok: false, error: "That post is not available." };
  await db.insert(boardReports).values({ postId, reporterId: viewer.userId, reason: text });
  return { ok: true };
}

export async function moderateBoardPost(
  postId: string,
  action: "hide" | "remove",
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isPlayerId(postId)) return { ok: false, error: "That post is not available." };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const now = new Date();
  const [updated] = await db
    .update(boardPosts)
    .set(action === "hide" ? { hiddenAt: now, updatedAt: now } : { removedAt: now, updatedAt: now })
    .where(eq(boardPosts.id, postId))
    .returning({ id: boardPosts.id });
  if (!updated) return { ok: false, error: "That post is not available." };
  await db.update(boardReports).set({ status: "reviewed" }).where(eq(boardReports.postId, postId));
  return { ok: true };
}

export async function listOpenBoardReports(): Promise<
  { id: string; postId: string; teamName: string; reason: string; createdAt: Date }[]
> {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: boardReports.id,
      postId: boardReports.postId,
      teamName: boardPosts.teamName,
      reason: boardReports.reason,
      createdAt: boardReports.createdAt,
    })
    .from(boardReports)
    .innerJoin(boardPosts, eq(boardPosts.id, boardReports.postId))
    .where(eq(boardReports.status, "open"))
    .orderBy(desc(boardReports.createdAt));
}
