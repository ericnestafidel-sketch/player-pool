import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getRequestViewer, usesParentArea } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="parent-panel">Loading…</main>}>
      <Checkout />
    </Suspense>
  );
}

async function Checkout() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (!usesParentArea(viewer)) redirect("/parent");
  return (
    <main className="parent-panel">
      <p className="meta">
        <Link href="/parent">Back to your players</Link>
      </p>
      <h1>Payments are not open yet</h1>
      <p className="lead">
        Paid listings are not available right now. During the first 100 player launch, your first
        season is free when you add a player. No checkout is needed.
      </p>
    </main>
  );
}
