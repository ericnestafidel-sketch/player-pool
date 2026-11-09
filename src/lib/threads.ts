import { and, desc, eq, inArray, isNull, notExists, sql } from "drizzle-orm";
import {
  blocks,
  coaches,
  contactMessages,
  contactRequests,
  players,
  profileViews,
  reports,
  users,
} from "@/db/schema";
import { getDb } from "@/db";
import { setCoachStatus } from "@/lib/accounts";
import { toPublicCoach, type PublicCoach } from "@/lib/coach-profile";
import { DAILY_CONTACT_CAP, messageError } from "@/lib/message-text";
import { sendNotification } from "@/lib/notify";
import { canReadPlayer, isPlayerId } from "@/lib/player-access";
import { assertNoContactFields, isSaturdayDate, weekendInRange } from "@/lib/player-rules";
import { formatPlayerLabel } from "@/lib/safety";
import { mergePublicMetadata, type Viewer } from "@/lib/viewer";

export type ThreadMessage = {
  id: string;
  author: "parent" | "coach";
  body: string;
  createdAt: Date;
};

export type ParentThreadSummary = {
  id: string;
  playerLabel: string;
  preview: string;
  createdAt: Date;
  coachId: string;
  coach: PublicCoach;
  blocked: boolean;
};

export type ParentThread = ParentThreadSummary & {
  weekend: string | null;
  messages: ThreadMessage[];
  coachApproved: boolean;
};

export type CoachThreadSummary = {
  id: string;
  playerLabel: string;
  preview: string;
  createdAt: Date;
  paused: boolean;
};

export type CoachThread = CoachThreadSummary & {
  weekend: string | null;
  messages: ThreadMessage[];
};

const coachCardColumns = {
  teamName: coaches.teamName,
  organization: coaches.organization,
  agesCoached: coaches.agesCoached,
  yearsExperience: coaches.yearsExperience,
  status: coaches.status,
};

export async function startContact(
  viewer: Viewer,
  playerId: string,
  weekend: string,
  rawMessage: string,
): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    return { ok: false, error: "Only an approved coach can send a message." };
  }
  const problem = messageError(rawMessage);
  if (problem) return { ok: false, error: problem };
  if (!isSaturdayDate(weekend) || !weekendInRange(weekend, new Date())) {
    return { ok: false, error: "Choose a Saturday from the list." };
  }
  if (!(await canReadPlayer(viewer, playerId))) {
    return { ok: false, error: "That profile is not available." };
  }
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const message = rawMessage.trim();
  try {
    const created: { error: string } | { requestId: string; parentId: string } = await db.transaction(
      async (tx) => {
      const [coach] = await tx
        .select({ userId: coaches.userId, status: coaches.status })
        .from(coaches)
        .where(eq(coaches.userId, viewer.userId))
        .for("update")
        .limit(1);
      if (!coach || coach.status !== "approved") return { error: "Only an approved coach can send a message." };
      const [player] = await tx
        .select({
          id: players.id,
          parentId: players.parentId,
          paused: players.paused,
          deletedAt: players.deletedAt,
        })
        .from(players)
        .where(eq(players.id, playerId))
        .limit(1);
      if (!player || player.paused || player.deletedAt) return { error: "That profile is not available." };
      const [blocked] = await tx
        .select({ parentId: blocks.parentId })
        .from(blocks)
        .where(and(eq(blocks.parentId, player.parentId), eq(blocks.coachId, viewer.userId)))
        .limit(1);
      if (blocked) return { error: "That profile is not available." };
      const [tally] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(contactRequests)
        .where(
          and(
            eq(contactRequests.coachId, viewer.userId),
            sql`(${contactRequests.createdAt} at time zone 'America/Indiana/Indianapolis')::date = (now() at time zone 'America/Indiana/Indianapolis')::date`,
          ),
        );
      const sentToday = tally?.total ?? 0;
      if (sentToday >= DAILY_CONTACT_CAP) {
        return { error: `You can send ${DAILY_CONTACT_CAP} new messages a day. Replies on a thread do not count.` };
      }
      const [request] = await tx
        .insert(contactRequests)
        .values({
          playerId,
          coachId: viewer.userId,
          weekend,
          message,
        })
        .returning({ id: contactRequests.id });
      if (!request) return { error: "Could not send the message." };
      await tx
        .update(coaches)
        .set({ dailyContactCount: sentToday + 1, contactCountResetAt: new Date() })
        .where(eq(coaches.userId, viewer.userId));
      return { requestId: request.id, parentId: player.parentId };
    },
    );
    if ("error" in created) return { ok: false, error: created.error };
    const parentEmail = await emailFor(created.parentId);
    if (parentEmail) await sendNotification(parentEmail, `/parent/inbox/${created.requestId}`);
    return { ok: true, requestId: created.requestId };
  } catch {
    return { ok: false, error: "Could not send the message." };
  }
}

export async function replyToRequest(
  viewer: Viewer,
  requestId: string,
  rawMessage: string,
): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  const problem = messageError(rawMessage);
  if (problem) return { ok: false, error: problem };
  if (!isPlayerId(requestId)) return { ok: false, error: "That message is not available." };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const request = await loadRequest(requestId);
  if (!request) return { ok: false, error: "That message is not available." };
  const message = rawMessage.trim();
  if (viewer.role === "parent" && viewer.userId === request.parentId) {
    if (request.blocked) return { ok: false, error: "Unblock this coach before you reply." };
    if (request.coachStatus !== "approved") {
      return { ok: false, error: "This coach cannot reply right now." };
    }
    await db.insert(contactMessages).values({
      requestId,
      authorRole: "parent",
      body: message,
    });
    const coachEmail = await emailFor(request.coachId);
    if (coachEmail) await sendNotification(coachEmail, `/coach/messages/${requestId}`);
    return { ok: true, requestId };
  }
  if (viewer.role === "coach" && viewer.userId === request.coachId) {
    if (viewer.coachStatus !== "approved" || request.coachStatus !== "approved") {
      return { ok: false, error: "Only an approved coach can reply." };
    }
    if (request.blocked || request.paused || request.deletedAt) {
      return { ok: false, error: "That profile is not available." };
    }
    await db.insert(contactMessages).values({
      requestId,
      authorRole: "coach",
      body: message,
    });
    const parentEmail = await emailFor(request.parentId);
    if (parentEmail) await sendNotification(parentEmail, `/parent/inbox/${requestId}`);
    return { ok: true, requestId };
  }
  return { ok: false, error: "That message is not available." };
}

export async function listParentThreads(parentId: string): Promise<ParentThreadSummary[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: contactRequests.id,
      message: contactRequests.message,
      createdAt: contactRequests.createdAt,
      publicNumber: players.publicNumber,
      coachId: contactRequests.coachId,
      ...coachCardColumns,
    })
    .from(contactRequests)
    .innerJoin(players, eq(players.id, contactRequests.playerId))
    .innerJoin(coaches, eq(coaches.userId, contactRequests.coachId))
    .where(eq(players.parentId, parentId))
    .orderBy(desc(contactRequests.createdAt));
  const [blocked, previews] = await Promise.all([
    blockedSet(parentId),
    latestPreviews(rows.map((row) => row.id)),
  ]);
  const threads = rows.map((row) => ({
    id: row.id,
    playerLabel: formatPlayerLabel(row.publicNumber),
    preview: previews.get(row.id) ?? row.message,
    createdAt: row.createdAt,
    coachId: row.coachId,
    blocked: blocked.has(row.coachId),
    coach: publicCoach(row),
  }));
  assertNoContactFields(threads);
  return threads;
}

export async function loadParentThread(parentId: string, requestId: string): Promise<ParentThread | null> {
  if (!isPlayerId(requestId)) return null;
  const request = await loadRequest(requestId);
  if (!request || request.parentId !== parentId) return null;
  const messages = await threadMessages(request);
  const thread: ParentThread = {
    id: request.id,
    playerLabel: formatPlayerLabel(request.publicNumber),
    preview: messages.at(-1)?.body ?? request.message,
    createdAt: request.createdAt,
    weekend: request.weekend,
    coachId: request.coachId,
    blocked: request.blocked,
    coachApproved: request.coachStatus === "approved",
    coach: request.coach,
    messages,
  };
  assertNoContactFields(thread);
  return thread;
}

export async function listCoachThreads(coachId: string): Promise<CoachThreadSummary[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: contactRequests.id,
      message: contactRequests.message,
      createdAt: contactRequests.createdAt,
      publicNumber: players.publicNumber,
      paused: players.paused,
    })
    .from(contactRequests)
    .innerJoin(players, eq(players.id, contactRequests.playerId))
    .where(
      and(
        eq(contactRequests.coachId, coachId),
        isNull(players.deletedAt),
        notExists(
          db
            .select({ parentId: blocks.parentId })
            .from(blocks)
            .where(
              and(eq(blocks.parentId, players.parentId), eq(blocks.coachId, contactRequests.coachId)),
            ),
        ),
      ),
    )
    .orderBy(desc(contactRequests.createdAt));
  const previews = await latestPreviews(rows.map((row) => row.id));
  const threads = rows.map((row) => ({
    id: row.id,
    playerLabel: formatPlayerLabel(row.publicNumber),
    preview: previews.get(row.id) ?? row.message,
    createdAt: row.createdAt,
    paused: row.paused,
  }));
  assertNoContactFields(threads);
  return threads;
}

export async function listCoachPlayerThreads(coachId: string, playerId: string): Promise<CoachThreadSummary[]> {
  const threads = await listCoachThreads(coachId);
  if (!isPlayerId(playerId)) return [];
  const db = getDb();
  if (!db) return [];
  const ids = new Set(
    (
      await db
        .select({ id: contactRequests.id })
        .from(contactRequests)
        .where(and(eq(contactRequests.coachId, coachId), eq(contactRequests.playerId, playerId)))
    ).map((row) => row.id),
  );
  return threads.filter((thread) => ids.has(thread.id));
}

export async function loadCoachThread(coachId: string, requestId: string): Promise<CoachThread | null> {
  if (!isPlayerId(requestId)) return null;
  const request = await loadRequest(requestId);
  if (!request || request.coachId !== coachId || request.deletedAt || request.blocked) return null;
  const messages = await threadMessages(request);
  const thread: CoachThread = {
    id: request.id,
    playerLabel: formatPlayerLabel(request.publicNumber),
    preview: messages.at(-1)?.body ?? request.message,
    createdAt: request.createdAt,
    paused: request.paused,
    weekend: request.weekend,
    messages,
  };
  assertNoContactFields(thread);
  return thread;
}

export async function blockCoach(
  parentId: string,
  coachId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  if (!(await parentMetCoach(parentId, coachId))) {
    return { ok: false, error: "That coach is not available." };
  }
  await db.insert(blocks).values({ parentId, coachId }).onConflictDoNothing();
  return { ok: true };
}

export async function unblockCoach(
  parentId: string,
  coachId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  await db.delete(blocks).where(and(eq(blocks.parentId, parentId), eq(blocks.coachId, coachId)));
  return { ok: true };
}

export async function reportCoach(
  parentId: string,
  coachId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = reason.trim();
  if (text.length < 4 || text.length > 500) return { ok: false, error: "Write a short reason." };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  if (!(await parentMetCoach(parentId, coachId))) {
    return { ok: false, error: "That coach is not available." };
  }
  const reported = await db.transaction(async (tx) => {
    const [coach] = await tx
      .select({ userId: coaches.userId })
      .from(coaches)
      .where(eq(coaches.userId, coachId))
      .limit(1);
    if (!coach) return false;
    await tx.insert(reports).values({
      reporterParentId: parentId,
      coachId,
      reason: text,
    });
    await tx
      .update(coaches)
      .set({
        status: "suspended",
        statusReason: "Suspended after a parent report.",
        approvedAt: null,
        approvedBy: null,
      })
      .where(eq(coaches.userId, coachId));
    return true;
  });
  if (!reported) return { ok: false, error: "That coach is not available." };
  try {
    await mergePublicMetadata(coachId, { role: "coach", coachStatus: "suspended" });
  } catch (error) {
    console.error("Could not sync coach suspension to Clerk", error instanceof Error ? error.name : "");
  }
  return { ok: true };
}

export async function resolveReport(input: {
  reportId: string;
  decision: "reinstate" | "keep";
  adminId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  if (!isPlayerId(input.reportId)) return { ok: false, error: "That report is not available." };
  const [report] = await db
    .select({
      id: reports.id,
      coachId: reports.coachId,
      status: reports.status,
    })
    .from(reports)
    .where(eq(reports.id, input.reportId))
    .limit(1);
  if (!report) return { ok: false, error: "That report is not available." };
  if (report.status === "open" && input.decision === "reinstate") {
    const result = await setCoachStatus({
      adminId: input.adminId,
      coachId: report.coachId,
      status: "approved",
      reason: "Reinstated after a parent report.",
    });
    if (!result.ok) return result;
  }
  if (report.status === "open" && input.decision === "keep") {
    const result = await setCoachStatus({
      adminId: input.adminId,
      coachId: report.coachId,
      status: "suspended",
      reason: "Kept suspended after a parent report.",
    });
    if (!result.ok) return result;
  }
  await db.update(reports).set({ status: "reviewed" }).where(eq(reports.id, report.id));
  return { ok: true };
}

export async function countContactRequests(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(contactRequests);
  return Number(row?.total ?? 0);
}

type RequestRecord = {
  id: string;
  playerId: string;
  parentId: string;
  coachId: string;
  message: string;
  weekend: string | null;
  createdAt: Date;
  publicNumber: number;
  paused: boolean;
  deletedAt: Date | null;
  blocked: boolean;
  coachStatus: "pending" | "approved" | "denied" | "suspended";
  coach: PublicCoach;
};

async function loadRequest(requestId: string): Promise<RequestRecord | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({
      id: contactRequests.id,
      playerId: contactRequests.playerId,
      parentId: players.parentId,
      coachId: contactRequests.coachId,
      message: contactRequests.message,
      weekend: contactRequests.weekend,
      createdAt: contactRequests.createdAt,
      publicNumber: players.publicNumber,
      paused: players.paused,
      deletedAt: players.deletedAt,
      ...coachCardColumns,
    })
    .from(contactRequests)
    .innerJoin(players, eq(players.id, contactRequests.playerId))
    .innerJoin(coaches, eq(coaches.userId, contactRequests.coachId))
    .where(eq(contactRequests.id, requestId))
    .limit(1);
  if (!row) return null;
  const [blocked] = await db
    .select({ parentId: blocks.parentId })
    .from(blocks)
    .where(and(eq(blocks.parentId, row.parentId), eq(blocks.coachId, row.coachId)))
    .limit(1);
  return {
    id: row.id,
    playerId: row.playerId,
    parentId: row.parentId,
    coachId: row.coachId,
    message: row.message,
    weekend: row.weekend,
    createdAt: row.createdAt,
    publicNumber: row.publicNumber,
    paused: row.paused,
    deletedAt: row.deletedAt,
    blocked: Boolean(blocked),
    coachStatus: row.status,
    coach: publicCoach(row),
  };
}

async function threadMessages(request: RequestRecord): Promise<ThreadMessage[]> {
  const db = getDb();
  if (!db) return [];
  const replies = await db
    .select({
      id: contactMessages.id,
      authorRole: contactMessages.authorRole,
      body: contactMessages.body,
      createdAt: contactMessages.createdAt,
    })
    .from(contactMessages)
    .where(eq(contactMessages.requestId, request.id))
    .orderBy(contactMessages.createdAt);
  return [
    { id: request.id, author: "coach", body: request.message, createdAt: request.createdAt },
    ...replies.map((reply) => ({
      id: reply.id,
      author: reply.authorRole,
      body: reply.body,
      createdAt: reply.createdAt,
    })),
  ];
}

async function latestPreviews(requestIds: string[]): Promise<Map<string, string>> {
  const previews = new Map<string, string>();
  const db = getDb();
  if (!db || requestIds.length === 0) return previews;
  const rows = await db
    .select({
      requestId: contactMessages.requestId,
      body: contactMessages.body,
      createdAt: contactMessages.createdAt,
    })
    .from(contactMessages)
    .where(inArray(contactMessages.requestId, requestIds))
    .orderBy(desc(contactMessages.createdAt));
  for (const row of rows) {
    if (!previews.has(row.requestId)) previews.set(row.requestId, row.body);
  }
  return previews;
}

async function blockedSet(parentId: string): Promise<Set<string>> {
  const db = getDb();
  if (!db) return new Set();
  const rows = await db
    .select({ coachId: blocks.coachId })
    .from(blocks)
    .where(eq(blocks.parentId, parentId));
  return new Set(rows.map((row) => row.coachId));
}

async function parentMetCoach(parentId: string, coachId: string): Promise<boolean> {
  const db = getDb();
  if (!db || !coachId) return false;
  const [request] = await db
    .select({ id: contactRequests.id })
    .from(contactRequests)
    .innerJoin(players, eq(players.id, contactRequests.playerId))
    .where(and(eq(players.parentId, parentId), eq(contactRequests.coachId, coachId)))
    .limit(1);
  if (request) return true;
  const [view] = await db
    .select({ id: profileViews.id })
    .from(profileViews)
    .innerJoin(players, eq(players.id, profileViews.playerId))
    .where(and(eq(players.parentId, parentId), eq(profileViews.coachId, coachId)))
    .limit(1);
  return Boolean(view);
}

async function emailFor(userId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.email ?? null;
}

function publicCoach(row: {
  teamName: string;
  organization: string;
  agesCoached: string;
  yearsExperience: number | null;
  status: "pending" | "approved" | "denied" | "suspended";
}): PublicCoach {
  return toPublicCoach({
    teamName: row.teamName,
    organization: row.organization,
    agesCoached: row.agesCoached,
    yearsExperience: row.yearsExperience,
    status: row.status,
  });
}
