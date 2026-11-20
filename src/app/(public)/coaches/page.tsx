import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { countOpenNeeds } from "@/lib/board";
import { openNeedsCopy } from "@/lib/board-rules";
import { HowApplyingWorks } from "@/components/how-applying-works";
import { launchStates } from "@/lib/launch";
import { withRedirect } from "@/lib/redirects";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Find players for a travel team",
  description:
    "Search travel baseball players by age, USSSA level, state, and county. Player Pool is free for coaches. Request access, get hand-approved, and message parents about tryouts.",
  path: "/coaches",
});

/** Request-time render so the open-need count is not frozen during the build. */
export const instant = false;

export default async function CoachesPage() {
  await connection();
  const openNeeds = await countOpenNeeds();
  return (
    <main className="wrap">
      <h1>Find players for a travel team</h1>
      <p className="lead">
        Player Pool is launching in Indiana, Illinois, and Ohio first. It is a private list for travel baseball tryouts and pickup weekends.
        Parents list a player as a number, with USSSA level, age group, state, and county. You never see
        a child&apos;s name, town, address, email, or phone.
      </p>
      <p>
        Coaches use Player Pool free. Every coach is reviewed and approved by our experienced baseball
        staff before any profile opens. Send one proof that you coach the team, plus one reference.
        Approval is a manual review of what the coach submits, plus a self-attestation. Player Pool
        does not run a criminal background check or a SafeSport check, and approval is not a safety
        certification.
      </p>
      <h2>Coach Needs Board</h2>
      <p>
        Approved coaches post the age group, positions, USSSA level, county and state, weekend or
        tournament dates, how many players they need, and when the post closes. Parents and approved
        coaches read those posts after they sign in. Need details are never public; we only show a
        count. This page does not list teams.
      </p>
      <p>
        <Link className="btn navy" href={withRedirect("/sign-in", "/board")}>
          Sign in to view the board
        </Link>
      </p>
      <p>{openNeedsCopy(openNeeds, launchStates())}</p>
      <HowApplyingWorks />
      <h2>What you can search</h2>
      <ul>
        <li>Age group and positions</li>
        <li>USSSA skill level, including players who list two levels</li>
        <li>State and county only</li>
        <li>Weekend availability for a sub or a tryout</li>
      </ul>
      <p>
        <Link className="btn gold" href="/coach/signup">
          Request coach access
        </Link>
      </p>
      <p className="meta">
        Read <Link href="/coaches/how-approval-works">how approval works</Link> and the{" "}
        <Link href="/conduct">Coach Code of Conduct</Link> before you apply. Parents see pricing on the{" "}
        <Link href="/pricing">pricing page</Link>.
      </p>
    </main>
  );
}
