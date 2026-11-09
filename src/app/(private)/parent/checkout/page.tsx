import { connection } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { players } from "@/db/schema";
import { getDb } from "@/db";
import { formatUsd, LAUNCH_FREE_SEASON_SPOTS, seasonPlan, SEASONS, yearlyPlan } from "@/lib/pricing";
import { formatPlayerLabel } from "@/lib/safety";
import { PROMO_CODE, stripeConfigured } from "@/lib/stripe-billing";
import { getRequestViewer } from "@/lib/viewer";
import { startCheckout } from "./actions";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ player?: string; notice?: string }>;
}) {
  return (
    <Suspense fallback={<main className="parent-panel">Loading…</main>}>
      <Checkout searchParams={searchParams} />
    </Suspense>
  );
}

async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ player?: string; notice?: string }>;
}) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  const db = getDb();
  const params = await searchParams;
  const rows = db
    ? await db
        .select({ id: players.id, publicNumber: players.publicNumber })
        .from(players)
        .where(and(eq(players.parentId, viewer.userId), isNull(players.deletedAt)))
    : [];
  const ready = stripeConfigured();
  return (
    <main className="parent-panel">
      <p className="meta">
        <Link href="/parent">Back to your players</Link>
      </p>
      <h1>Checkout</h1>
      <p className="lead">
        One-time payment. No auto-renew. Card numbers are entered on Stripe, not on Player Pool.
      </p>
      {params.notice === "soon" ? (
        <p className="field-error">Payments coming soon. Stripe prices are not set up yet.</p>
      ) : null}
      {!ready ? (
        <div className="hint">Payments coming soon.</div>
      ) : rows.length === 0 ? (
        <div className="hint">
          Add a player before paying. <Link href="/parent/player/new">Add a player</Link>
        </div>
      ) : (
        <form action={startCheckout} className="section-card">
          <label htmlFor="playerId">Player</label>
          <select id="playerId" name="playerId" required defaultValue={params.player ?? rows[0]?.id}>
            {rows.map((row) => (
              <option key={row.id} value={row.id}>
                {formatPlayerLabel(row.publicNumber)}
              </option>
            ))}
          </select>
          <fieldset className="field">
            <legend>Plan</legend>
            <label className="check">
              <input type="radio" name="plan" value="season" defaultChecked required />
              <span>
                Season · {formatUsd(seasonPlan.amountCents)} ·{" "}
                {SEASONS.map((season) => season.name).join(", ")}
              </span>
            </label>
            <label className="check">
              <input type="radio" name="plan" value="yearly" />
              <span>Yearly · {formatUsd(yearlyPlan.amountCents)} · through December 31</span>
            </label>
          </fieldset>
          <p className="meta">
            Season only: code {PROMO_CODE} on the Stripe page covers the first {LAUNCH_FREE_SEASON_SPOTS}{" "}
            free seasons. A $0 checkout still turns the listing on.
          </p>
          <button className="btn gold" type="submit">
            Continue to Stripe
          </button>
        </form>
      )}
    </main>
  );
}
