import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { fulfillCheckoutSession, getStripe } from "@/lib/stripe-billing";
import { getRequestViewer, usesParentArea } from "@/lib/viewer";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return (
    <Suspense fallback={<main className="parent-panel">Loading…</main>}>
      <Success searchParams={searchParams} />
    </Suspense>
  );
}

async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (!usesParentArea(viewer)) redirect("/parent");
  const params = await searchParams;
  const stripe = getStripe();
  let confirmed = false;
  if (stripe && params.session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(params.session_id);
      if (session.metadata?.parent_id === viewer.userId) {
        const result = await fulfillCheckoutSession(session);
        confirmed = result === "created" || result === "exists";
        if (confirmed) {
          revalidatePath("/parent");
          revalidatePath("/coach/search");
        }
      }
    } catch (error) {
      console.error("Could not confirm checkout", error instanceof Error ? error.name : "");
    }
  }
  return (
    <main className="parent-panel">
      <h1>Payment received</h1>
      <p className="lead">
        {confirmed
          ? "This listing is active. Approved coaches can see the player until the season ends."
          : "Stripe is confirming the payment. The listing appears on your dashboard when that finishes."}
      </p>
      <p>
        <Link className="btn gold" href="/parent">
          Back to your players
        </Link>
      </p>
    </main>
  );
}
