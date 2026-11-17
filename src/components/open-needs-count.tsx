import { connection } from "next/server";
import { Suspense } from "react";
import { countOpenNeeds } from "@/lib/board";
import { openNeedsCopy } from "@/lib/board-rules";
import { launchStates } from "@/lib/launch";

/** A count only. This component must not render team names or other Need details. */
export function OpenNeedsCount() {
  return (
    <Suspense fallback={<p className="meta">Checking open needs…</p>}>
      <Count />
    </Suspense>
  );
}

async function Count() {
  await connection();
  const total = await countOpenNeeds();
  return <p>{openNeedsCopy(total, launchStates())}</p>;
}
