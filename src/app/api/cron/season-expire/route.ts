import { and, isNotNull, lte, sql } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { getDb } from "@/db";

/**
 * Daily hook for Vercel cron. Listings past expires_at are already hidden by
 * the search filter when REQUIRE_PAID_LISTING is on. This route only reports
 * how many paid rows are past that date.
 */
export async function GET(request: Request) {
  const secret = process.env["CRON_SECRET"];
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = getDb();
  if (!db) return Response.json({ expired: 0 });
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(and(isNotNull(subscriptions.paidAt), lte(subscriptions.expiresAt, new Date())));
  return Response.json({ expired: Number(row?.total ?? 0) });
}
