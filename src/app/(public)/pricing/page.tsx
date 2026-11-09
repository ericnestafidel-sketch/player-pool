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

export const metadata: Metadata = {
  title: "Pricing",
  description: `Simple, one-time pricing. No auto-renew. A season is ${formatUsd(seasonPlan.amountCents)}. All three seasons are ${formatUsd(yearlyPlan.amountCents)}.`,
};

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
          Launch offer: the first {LAUNCH_FREE_SEASON_SPOTS} players to sign up get their first
          season FREE.
        </p>
        <p className="launch-sub">After that, regular pricing applies.</p>
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
              Seasons: {SEASONS.map((season) => `${season.name} (${season.months})`).join(", ")}.
            </p>
            <ul>
              {PLAN_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="price-cta">
              <Link className="btn gold" href="/sign-up">
                Create parent account
              </Link>
              <p className="meta">Checkout opens at launch.</p>
            </div>
          </article>
          <article className="price-card featured">
            <p className="best-value">Best value</p>
            <h2>Yearly</h2>
            <p className="amt">{formatUsd(yearlyPlan.amountCents)}</p>
            <p className="price-cadence">
              <b>for all three seasons</b>, one-time payment.
            </p>
            <p className="meta">Best value (save {formatUsd(yearlyPlan.savingsCents)}).</p>
            <ul>
              {PLAN_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="price-cta">
              <Link className="btn gold" href="/sign-up">
                Create parent account
              </Link>
              <p className="meta">Checkout opens at launch.</p>
            </div>
          </article>
        </div>
        <p className="pricing-foot">
          Full refund within 15 days if no coach has viewed your player&apos;s profile.
        </p>
        <p className="pricing-foot">
          <Link href="/coach/sign-up">Coaches use Player Pool free after approval.</Link>
        </p>
        <p className="note pricing-foot">
          Payments are processed securely by Stripe. Player Pool never sees your card number.
        </p>
      </section>
    </main>
  );
}
