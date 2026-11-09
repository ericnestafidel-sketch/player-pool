import { and, isNotNull, lte, sql } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { getDb } from "@/db";
import { purgeDeletedPlayers } from "@/lib/player-store";

/**
 * Daily Vercel cron. Soft-deleted profiles older than 30 days are erased here,
 * not when someone happens to open a page. Listings past expires_at are already
 * hidden by search when REQUIRE_PAID_LISTING is on. A season ends the day after
 * its last day: Spring through May 31, Summer through August 31, Fall through October 31.
 */
export async function GET(request: Request) {
  const secret = process.env["CRON_SECRET"];
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await purgeDeletedPlayers();
  const db = getDb();
  if (!db) return Response.json({ expired: 0, purged: true });
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(and(isNotNull(subscriptions.paidAt), lte(subscriptions.expiresAt, new Date())));
  return Response.json({ expired: Number(row?.total ?? 0), purged: true });
}
