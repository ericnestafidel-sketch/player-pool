import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { LAUNCH_FREE_SEASON_SPOTS, PLAN_FEATURES } from "@/lib/pricing";
import { PlayerSignupCallToAction } from "@/components/player-signup-gate";
import { launchStateNames } from "@/lib/launch";
import { withRedirect } from "@/lib/redirects";
import { playerSignupStatus } from "@/lib/signup-access";
import { freeSeasonSpotsRemaining } from "@/lib/stripe-billing";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Free first-season listings",
  description:
    "The first 100 players in Indiana, Illinois, and Ohio get their first season, Spring 2027, free through May 31, 2027. No payment is required. Coaches search free after approval.",
  path: "/pricing",
});

/** Request-time render so the free-spot count is not frozen during the build. */
export const instant = false;

export default async function PricingPage() {
  await connection();
  const [spotsLeft, signupStatus] = await Promise.all([freeSeasonSpotsRemaining(), playerSignupStatus()]);
  return (
    <main>
      <section className="pricing-hero">
        <h1>Spring 2027 is free through May 31, 2027, for the first {LAUNCH_FREE_SEASON_SPOTS} players.</h1>
      </section>
      <div className="launch-banner">
        <p className="launch-lead">Launching in {launchStateNames()}.</p>
        <div className="spot-callout">
          <p className="spot-count">
            {signupStatus === "full"
              ? "Player sign-ups are full for now, check back soon."
              : `${spotsLeft} of ${LAUNCH_FREE_SEASON_SPOTS} free spots left`}
          </p>
          <p className="launch-sub">
            {signupStatus === "full"
              ? "Coach sign-up stays open. We are not taking paid listings right now."
              : "No payment is required. Paid listings are not open yet. Coaches use Player Pool free after approval."}
          </p>
        </div>
      </div>
      <section className="wrap">
        <div className="price-grid pricing-plans">
          <article className="price-card featured">
            <h2>Free first season</h2>
            <p className="amt">$0</p>
            <p className="price-cadence">
              <b>for the first {LAUNCH_FREE_SEASON_SPOTS} players</b>
            </p>
            <p className="meta">
              The first season is Spring 2027, free through May 31, 2027, limited to the first{" "}
              {LAUNCH_FREE_SEASON_SPOTS} players.
            </p>
            <ul>
              {PLAN_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div className="price-cta">
              <PlayerSignupCallToAction href={withRedirect("/sign-up", "/parent")} status={signupStatus}>
                Create parent account
              </PlayerSignupCallToAction>
            </div>
          </article>
        </div>
        <p className="pricing-foot">
          <Link href="/coaches">Coaches use Player Pool free after approval.</Link>
        </p>
      </section>
    </main>
  );
}
