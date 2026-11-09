import Link from "next/link";
import type { Metadata } from "next";
import { PlayerSignupClosedButton } from "@/components/player-signup-gate";
import { playerSignupOpen } from "@/lib/launch";
import { formatUsd, LAUNCH_FREE_SEASON_SPOTS, seasonPlan, yearlyPlan } from "@/lib/pricing";
import { withRedirect } from "@/lib/redirects";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Find travel baseball players",
  description:
    "Find players for a travel team and travel baseball tryouts anywhere in the U.S. Parents list a player by number, USSSA level, county, and state. Hand-approved coaches search. Free for coaches.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Link className="founders" href="/pricing">
        Launch offer: the first {LAUNCH_FREE_SEASON_SPOTS} players to sign up get their first season
        FREE.
      </Link>
      <section className="hero">
        <h1>Get your player seen by travel coaches</h1>
        <p>
          Parents list their son in a private, nationwide pool that hand-approved travel coaches search
          by age, position, USSSA level, state, and county. No names, no addresses, no phone numbers
          shown.
        </p>
        {playerSignupOpen() ? (
          <Link className="btn gold" href={withRedirect("/sign-up", "/parent")}>
            List my player
          </Link>
        ) : (
          <PlayerSignupClosedButton />
        )}{" "}
        <Link className="btn ghost" href="/coaches">
          I&apos;m a coach — request access
        </Link>
      </section>
      <section className="wrap" id="how">
        <h2>How it works</h2>
        <div className="cols">
          <div className="box">
            <h3>For parents</h3>
            <p>
              List your travel baseball player for tryouts anywhere in the U.S. The profile uses a
              player number, age group, positions, one or two USSSA levels, and the county and state you
              play in. No name, town, address, email, or phone goes on the card coaches see.
            </p>
          </div>
          <div className="box">
            <h3>For coaches</h3>
            <p>
              Search is free after Eric approves you by hand. Filter for a pickup weekend or a tryout by
              age, USSSA level, state, and county, then message the parent inside Player Pool.{" "}
              <Link href="/coaches">See how coaches request access</Link>.
            </p>
          </div>
        </div>
        <div className="cols">
          <div className="box">
            <div className="num">1</div>
            <h3>Parent signs up</h3>
            <p>Only parents and guardians can create accounts and list a player.</p>
          </div>
          <div className="box">
            <div className="num">2</div>
            <h3>Build the profile</h3>
            <p>
              Age group, positions, USSSA level, state and county, stats, highlight video links, and
              weekend availability for pickup or sub weekends. Your player shows as a number, like
              Player #234 — never by name.
            </p>
          </div>
          <div className="box">
            <div className="num">3</div>
            <h3>Coaches search</h3>
            <p>
              Only coaches Eric has approved by hand can see profiles. They filter by age, position,
              level, state, county, status, and available weekends — handy when you need a pickup
              player.
            </p>
          </div>
          <div className="box">
            <div className="num">4</div>
            <h3>Message in the app</h3>
            <p>
              Coaches and parents message each other inside Player Pool. Neither side ever sees the
              other&apos;s email or phone.
            </p>
          </div>
        </div>
      </section>
      <section className="safety" id="safety">
        <div className="wrap">
          <h2>Safety first</h2>
          <ul>
            <li>Only parents create accounts — kids never sign up.</li>
            <li>Profiles are visible only to logged-in, hand-approved coaches.</li>
            <li>Players appear as a number (Player #234), never by name.</li>
            <li>Location shows state and county only — never a town or home address.</li>
            <li>
              No parent or player email or phone is shown. Messages stay inside Player Pool, and
              neither side ever sees the other&apos;s email or phone.
            </li>
            <li>Parents can delete a profile in one click.</li>
            <li>Payments go through Stripe so the site never handles card numbers.</li>
          </ul>
        </div>
      </section>
      <section className="wrap faq" id="faq">
        <h2>FAQ</h2>
        <h3>Is Player Pool safe for youth players?</h3>
        <p>
          Only a parent or guardian creates the account. Kids never sign up. Coaches are approved by
          hand before they can open a profile, and messages stay in the app.
        </p>
        <h3>What location do coaches see?</h3>
        <p>
          Any U.S. state and county only. A town, street, school, and home address are not collected
          on the player card.
        </p>
        <h3>Who can see a player?</h3>
        <p>
          Signed-in coaches Eric has approved. A public page, a search engine, and a coach who is still
          waiting on approval cannot open the profile.
        </p>
        <h3>What does it cost coaches?</h3>
        <p>Coach search is free. Parents pay a one-time season or yearly listing when sign-up is open.</p>
      </section>
      <section className="wrap" id="price">
        <h2>Simple pricing</h2>
        <div className="price-grid">
          <div className="price-card">
            <div className="amt">{formatUsd(seasonPlan.amountCents)}</div>
            <p>
              <b>per season</b>
            </p>
            <p className="meta">One-time payment.</p>
          </div>
          <div className="price-card featured">
            <div className="status-badge status-pickup">Best value</div>
            <div className="amt">{formatUsd(yearlyPlan.amountCents)}</div>
            <p>
              <b>three seasons in a row</b>
            </p>
            <p className="meta">One-time payment.</p>
          </div>
        </div>
        <p className="note" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 20px" }}>
          One-time payments, no auto-renewal. Seasons: Spring (Nov 1–May 31, named for the year it
          ends) · Summer (Jun 1–Aug 31) · Fall (Sep 1–Oct 31). A yearly listing is those three seasons
          in a row, 12 months. Full refund within 15 days if no coach has viewed the profile.
          Coaches use Player Pool free.
        </p>
        <p style={{ textAlign: "center" }}>
          <Link className="btn gold" href="/pricing">
            See pricing
          </Link>
        </p>
      </section>
    </>
  );
}
