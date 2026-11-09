import type { Metadata } from "next";
import Link from "next/link";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Find travel baseball players in Indiana",
  description:
    "Travel baseball coaches search Indiana players by age, USSSA level, and county. Player Pool is free for coaches. Request access, get hand-approved, and message parents in the app.",
  path: "/coaches",
});

export default function CoachesPage() {
  return (
    <main className="wrap">
      <h1>Find travel baseball players in Indiana</h1>
      <p className="lead">
        Player Pool is a private list for travel baseball tryouts and pickup weekends. Parents list a
        player as a number, with USSSA level, age group, state, and county. You never see a child&apos;s
        name, town, address, email, or phone.
      </p>
      <p>
        Coaches use Player Pool free. Every coach is approved by hand before any profile opens. Send one
        proof that you coach the team, plus one reference. Approval is not a background check.
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
        Read the <Link href="/conduct">Coach Code of Conduct</Link> before you apply. Parents see pricing
        on the <Link href="/pricing">pricing page</Link>.
      </p>
    </main>
  );
}
