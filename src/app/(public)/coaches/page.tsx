import type { Metadata } from "next";
import Link from "next/link";
import { withRedirect } from "@/lib/redirects";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Find players for a travel team",
  description:
    "Search travel baseball players by age, USSSA level, state, and county. Player Pool is free for coaches. Request access, get hand-approved, and message parents about tryouts.",
  path: "/coaches",
});

export default function CoachesPage() {
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
        Approval is not a background check.
      </p>
      <h2>Coach Needs Board</h2>
      <p>
        Approved coaches post the age group, positions, and USSSA level they need, plus county and
        state. Parents and approved coaches read those posts after they sign in. This page does not
        list teams.
      </p>
      <p>
        <Link className="btn navy" href={withRedirect("/sign-in", "/board")}>
          Sign in to view the board
        </Link>
      </p>
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
