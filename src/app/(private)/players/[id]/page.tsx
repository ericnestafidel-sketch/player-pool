import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PlayerCard } from "@/components/player-card";
import { readPublicPlayer } from "@/lib/player-access";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Player",
  robots: { index: false, follow: false },
};

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="form-wrap">Checking access…</main>}>
      <PlayerView params={params} />
    </Suspense>
  );
}

async function PlayerView({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const { id } = await params;
  const player = await readPublicPlayer(viewer, id, "read");
  if (!player) notFound();
  return (
    <main className="form-wrap">
      <h1>{player.label}</h1>
      <PlayerCard player={player} />
    </main>
  );
}
