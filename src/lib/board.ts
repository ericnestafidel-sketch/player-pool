import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { boardPosts, boardReports, coaches } from "@/db/schema";
import { getDb } from "@/db";
import { AGE_GROUPS, BASEBALL_LEVELS, BASEBALL_POSITIONS } from "@/lib/coach-options";
import { isLaunchState, launchStateMessage } from "@/lib/launch";
import { boardExpiresAt, boardFieldError, boardNoteError } from "@/lib/board-rules";
import { toPublicCoach, type PublicCoach } from "@/lib/coach-profile";
import { isPlayerId } from "@/lib/player-access";
import { currentSeason, followingSeason, seasonOffers } from "@/lib/seasons";
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
  seasonCode: string | null;
  seasonLabel: string | null;
  neededThrough: string | null;
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
  seasonCode: string | null;
  neededThrough: string | null;
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
  seasonCode: boardPosts.seasonCode,
  neededThrough: boardPosts.neededThrough,
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
  if (viewer.role === "admin" || viewer.role === "parent") return true;
  return viewer.role === "coach" && viewer.coachStatus === "approved";
}

export function canPostBoard(viewer: Viewer): boolean {
  return viewer.role === "coach" && viewer.coachStatus === "approved";
}

function openConditions(now: Date) {
  return and(
    isNull(boardPosts.closedAt),
    isNull(boardPosts.hiddenAt),
    isNull(boardPosts.removedAt),
    gt(boardPosts.expiresAt, now),
    eq(coaches.status, "approved"),
  );
}

export async function listBoardPosts(viewer: Viewer, now = new Date()): Promise<BoardPostView[]> {
  if (!canReadBoard(viewer)) return [];
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select(columns)
    .from(boardPosts)
    .innerJoin(coaches, eq(coaches.userId, boardPosts.coachId))
    .where(openConditions(now))
    .orderBy(desc(boardPosts.createdAt));
  return rows.map((row) => toView(row, viewer.userId, now));
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
  const visible = !row.hiddenAt && !row.closedAt && row.expiresAt > now && row.status === "approved";
  if (!visible && !owner && viewer.role !== "admin") return null;
  return toView(row, viewer.userId, now);
}

function toView(row: PostRow, viewerId: string, now: Date): BoardPostView {
  const offer = seasonOffers(now).find((item) => item.seasonCode === row.seasonCode);
  return {
    id: row.id,
    coachId: row.coachId,
    teamName: row.teamName,
    ageGroup: row.ageGroup,
    positions: row.positions,
    skillLevels: row.skillLevels,
    county: row.county,
    state: row.state,
    seasonCode: row.seasonCode,
    seasonLabel: offer?.rangeLabel ?? null,
    neededThrough: row.neededThrough,
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
  seasonCode: string;
  neededThrough: string;
  notes: string;
};

function seasonExpiry(code: string, now: Date): Date | null {
  const current = currentSeason(now);
  const next = followingSeason(current);
  if (code === current.seasonCode) return current.expiresAt;
  if (code === next.seasonCode) return next.expiresAt;
  return null;
}

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
  if (!input.seasonCode && !input.neededThrough) errors.seasonCode = "Choose a season or a last date needed.";
  const seasonEnd = input.seasonCode ? seasonExpiry(input.seasonCode, now) : null;
  if (input.seasonCode && !seasonEnd) errors.seasonCode = "Choose a current or next season.";
  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet.", fieldErrors: {} };
  const needed = input.neededThrough ? new Date(`${input.neededThrough}T23:59:59.000Z`) : null;
  const expiresAt = boardExpiresAt(now, seasonEnd, needed);
  const values = {
    teamName: input.teamName.trim(),
    ageGroup: input.ageGroup,
    positions: input.positions,
    skillLevels: input.skillLevels,
    state: input.state.toUpperCase(),
    county: input.county.trim(),
    seasonCode: input.seasonCode || null,
    neededThrough: input.neededThrough || null,
    notes: input.notes.trim() || null,
    expiresAt,
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
  return { ok: true, id: created.id };
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
