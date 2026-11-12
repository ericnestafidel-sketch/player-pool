import Link from "next/link";
import type { Metadata } from "next";
import {
  formatUsd,
  LAUNCH_FREE_SEASON_SPOTS,
  PLAN_FEATURES,
  SEASONS,
  seasonPlan,
  yearlyPlan,
} from "@/lib/pricing";
import { PlayerSignupClosedButton } from "@/components/player-signup-gate";
import { playerSignupOpen } from "@/lib/launch";
import { withRedirect } from "@/lib/redirects";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Travel baseball listing prices",
  description: `One-time prices to list a player for travel baseball tryouts. A season is ${formatUsd(seasonPlan.amountCents)} and three seasons are ${formatUsd(yearlyPlan.amountCents)}, with no auto-renew. Coaches search USSSA profiles free.`,
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <main>
      <section className="pricing-hero">
        <h1>
          Simple, one-time pricing.
          <br />
          No auto-renew.
        </h1>
      </section>
      <div className="launch-banner">
        <p className="launch-lead">
          Launch offer: the first {LAUNCH_FREE_SEASON_SPOTS} players get their first season free, then{" "}
          {formatUsd(seasonPlan.amountCents)} per season or {formatUsd(yearlyPlan.amountCents)} per year.
        </p>
        <p className="launch-sub">
          At checkout, use code FIRST25. It covers the first {LAUNCH_FREE_SEASON_SPOTS} season listings
          only. Yearly is not included.
        </p>
      </div>
      <section className="wrap">
        <div className="price-grid pricing-plans">
          <article className="price-card">
            <h2>Season</h2>
            <p className="amt">{formatUsd(seasonPlan.amountCents)}</p>
            <p className="price-cadence">
              <b>per season</b>, one-time payment
            </p>
            <p className="meta">
              One season you choose: {SEASONS.map((season) => `${season.name} (${season.months})`).join(", ")}.
              It ends on that season&apos;s last day.
            </p>
            <ul>
              {PLAN_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="price-cta">
              {playerSignupOpen() ? (
                <Link className="btn gold" href={withRedirect("/sign-up", "/parent")}>
                  Create parent account
                </Link>
              ) : (
                <PlayerSignupClosedButton />
              )}
              <p className="meta">You choose the season at checkout.</p>
            </div>
          </article>
          <article className="price-card featured">
            <p className="best-value">Best value</p>
            <h2>Yearly</h2>
            <p className="amt">{formatUsd(yearlyPlan.amountCents)}</p>
            <p className="price-cadence">
              <b>12 months, three seasons in a row</b>, one-time payment.
            </p>
            <p className="meta">
              Starts with the season you choose and ends on the last day of the third season. Save{" "}
              {formatUsd(yearlyPlan.savingsCents)} versus three season payments. Spring 2027 is Nov 1,
              2026 to May 31, 2027. Summer is Jun 1–Aug 31. Fall is Sep 1–Oct 31.
            </p>
            <ul>
              {PLAN_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="price-cta">
              {playerSignupOpen() ? (
                <Link className="btn gold" href={withRedirect("/sign-up", "/parent")}>
                  Create parent account
                </Link>
              ) : (
                <PlayerSignupClosedButton />
              )}
              <p className="meta">You choose the season at checkout.</p>
            </div>
          </article>
        </div>
        <p className="pricing-foot">
          Full refund within 15 days if no coach has viewed your player&apos;s profile.
        </p>
        <p className="pricing-foot">
          <Link href="/coaches">Coaches use Player Pool free after approval.</Link>
        </p>
        <p className="note pricing-foot">
          Payments are processed securely by Stripe. Player Pool never sees your card number.
        </p>
      </section>
    </main>
  );
}
