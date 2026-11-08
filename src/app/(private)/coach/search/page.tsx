import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach search",
  robots: { index: false, follow: false },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Checking access…</main>}>
      <Search />
    </Suspense>
  );
}

async function Search() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  return (
    <main className="form-wrap">
      <h1>Coach search</h1>
      <p className="lead">
        You are approved, so this page is unlocked. Filters, player cards, notes, and saved searches
        are in the next session. No player rows are loaded here.
      </p>
      <p className="meta">
        When search opens, players appear only as Player #NNN, with state and county. Email and phone
        stay off this screen.
      </p>
      <Link href="/coach/profile">Your team card</Link>
    </main>
  );
}
