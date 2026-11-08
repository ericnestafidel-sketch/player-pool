import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get your player seen by travel coaches",
  description:
    "Parents list their player in a private pool. Hand-approved travel coaches search by age, position, level, state, and county. No names or addresses.",
};

export default function HomePage() {
  return (
    <>
      <div className="founders">
        ⭐ Founding Families: first 25 parents pay $15 a season (or $36/year for all three seasons),
        locked in for good.
      </div>
      <section className="hero">
        <h1>Get your player seen by travel coaches</h1>
        <p>
          Parents list their son in a private, nationwide pool that verified travel coaches search
          by age, position, USSSA level, state, and county. No names, no addresses, no phone numbers
          shown.
        </p>
        <Link className="btn gold" href="/sign-up">
          List my player
        </Link>{" "}
        <Link className="btn ghost" href="/coach/signup">
          I&apos;m a coach — request access
        </Link>
      </section>
      <section className="wrap" id="how">
        <h2>How it works</h2>
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
            <h3>Contact through relay</h3>
            <p>
              Coaches message parents through the site. Your email and phone stay private until you
              choose to reply.
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
            <li>No parent or player email or phone is shown; contact goes through a relay form.</li>
            <li>Parents can delete a profile in one click.</li>
            <li>Payments go through Stripe so the site never handles card numbers.</li>
          </ul>
        </div>
      </section>
      <section className="wrap" id="price">
        <h2>Simple pricing</h2>
        <div className="price-grid">
          <div className="price-card featured">
            <div className="status-badge status-pickup">Founding Families</div>
            <div className="amt">$15</div>
            <p>
              <b>per season</b>
            </p>
            <p className="meta">First 25 parents. Locked in for good.</p>
            <div className="amt" style={{ fontSize: "1.5rem", marginTop: 12 }}>
              $36 / year
            </div>
            <p className="meta">All three seasons</p>
          </div>
          <div className="price-card">
            <div className="status-badge status-full">Regular</div>
            <div className="amt">$25</div>
            <p>
              <b>per season</b>
            </p>
            <p className="meta">After founding spots fill.</p>
            <div className="amt" style={{ fontSize: "1.5rem", marginTop: 12 }}>
              $60 / year
            </div>
            <p className="meta">All three seasons</p>
          </div>
        </div>
        <p className="note" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 20px" }}>
          One-time payments, no auto-renewal. Seasons: Spring (Jan–May) · Summer (Jun–Aug) ·
          Fall/Winter (Sep–Dec). Full refund within 15 days if no coach has viewed the profile.
          Coaches use Player Pool free.
        </p>
        <p style={{ textAlign: "center" }}>
          <Link className="btn gold" href="/sign-up">
            Claim a founding spot
          </Link>
        </p>
      </section>
    </>
  );
}
