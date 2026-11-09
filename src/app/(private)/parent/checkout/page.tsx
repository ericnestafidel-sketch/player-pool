import { connection } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { players } from "@/db/schema";
import { getDb } from "@/db";
import { CheckoutForm } from "@/components/checkout-form";
import { PlayerSignupSoon } from "@/components/player-signup-gate";
import { playerSignupOpen } from "@/lib/launch";
import { formatPlayerLabel } from "@/lib/safety";
import { seasonOffers } from "@/lib/seasons";
import { stripeConfigured } from "@/lib/stripe-billing";
import { getRequestViewer, usesParentArea } from "@/lib/viewer";

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
  if (!playerSignupOpen() && viewer.role !== "admin") return <PlayerSignupSoon />;
  if (!usesParentArea(viewer)) redirect("/parent");
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
        <CheckoutForm
          players={rows.map((row) => ({ id: row.id, label: formatPlayerLabel(row.publicNumber) }))}
          offers={seasonOffers(new Date())}
          defaultPlayer={params.player ?? rows[0]?.id ?? ""}
          allowPromo={viewer.role !== "admin"}
        />
      )}
    </main>
  );
}
