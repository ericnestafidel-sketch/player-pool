import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { countOpenNeeds } from "@/lib/board";
import { openNeedsCopy } from "@/lib/board-rules";
import { PlayerSignupCallToAction } from "@/components/player-signup-gate";
import { launchStateNames, launchStates } from "@/lib/launch";
import { LAUNCH_FREE_SEASON_SPOTS } from "@/lib/pricing";
import { withRedirect } from "@/lib/redirects";
import { publicMetadata } from "@/lib/seo";
import { playerSignupStatus } from "@/lib/signup-access";
import { freeSeasonSpotsRemaining } from "@/lib/stripe-billing";

export const metadata: Metadata = publicMetadata({
  title: "Find travel baseball players",
  description:
    "Find players for a travel team. Player Pool is launching in Indiana, Illinois, and Ohio first. Parents list a player by number, USSSA level, county, and state. Free for coaches.",
  path: "/",
});

/** Request-time render so the free-spot count is not frozen during the build. */
export const instant = false;

export default async function HomePage() {
  await connection();
  const [spotsLeft, openNeeds, signupStatus] = await Promise.all([
    freeSeasonSpotsRemaining(),
    countOpenNeeds(),
    playerSignupStatus(),
  ]);
  return (
    <>
      <Link className="founders" href="/pricing">
        {signupStatus === "full"
          ? "Player sign-ups are full for now, check back soon."
          : `Launch offer: the first ${LAUNCH_FREE_SEASON_SPOTS} players in ${launchStates().join("/")} get their first season, Spring 2027, free through May 31, 2027, no payment needed — ${spotsLeft} of ${LAUNCH_FREE_SEASON_SPOTS} spots left.`}
      </Link>
      <section className="hero">
        <h1>Get your player seen by travel coaches</h1>
        <p>
          Parents list their player in a private pool that approved travel coaches search by age, position,
          USSSA level, state, and county. Player Pool is launching in Indiana, Illinois, and Ohio
          first. No names, no addresses, no phone numbers shown.
        </p>
        <PlayerSignupCallToAction href={withRedirect("/sign-up", "/parent")} status={signupStatus}>
          List my player
        </PlayerSignupCallToAction>{" "}
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
              List your travel baseball player for tryouts in Indiana, Illinois, or Ohio. The profile uses a
              player number, age group, positions, one or two USSSA levels, and the county and state you
              play in. No name, town, address, email, or phone goes on the card coaches see.
            </p>
          </div>
          <div className="box">
            <h3>For coaches</h3>
            <p>
              Search is free after our experienced baseball staff approves you. Filter for a pickup weekend or a tryout by
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
              Only coaches our experienced baseball staff has approved can see profiles. They filter by age, position,
              level, state, county, status, and available weekends — handy when you need a pickup
              player.
            </p>
          </div>
          <div className="box">
            <div className="num">4</div>
            <h3>Message in the app</h3>
            <p>
              Coaches and parents message each other inside Player Pool. Neither side ever sees the
              other&apos;s email or phone. Approved coaches can also post what they need. Sign in to see
              those posts.
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
      <section className="wrap" id="board">
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
        <p className="open-needs-count">{openNeedsCopy(openNeeds, launchStates())}</p>
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
          Players are listed in {launchStateNames("or")}, by county and state only. A town, street,
          school, and home address are not collected on the player card.
        </p>
        <h3>Who can see a player?</h3>
        <p>
          Signed-in coaches our experienced baseball staff has approved. A public page, a search engine,
          and a coach who is still waiting on approval cannot open the profile.{" "}
          <Link href="/coaches/how-approval-works">How coach approval works</Link>.
        </p>
        <h3>What does it cost?</h3>
        <p>
          Coach search is free. The first {LAUNCH_FREE_SEASON_SPOTS} players get their first season, Spring
          2027, free through May 31, 2027, with no payment needed.
        </p>
      </section>
      <section className="wrap" id="price">
        <h2>First season free</h2>
        <p className="note" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 20px" }}>
          {signupStatus === "full"
            ? "Player sign-ups are full for now, check back soon."
            : `The first ${LAUNCH_FREE_SEASON_SPOTS} players in Indiana, Illinois, and Ohio get their first season, Spring 2027, free through May 31, 2027. ${spotsLeft} of ${LAUNCH_FREE_SEASON_SPOTS} spots are left. No payment is required. Coaches use Player Pool free after approval.`}
        </p>
        <p style={{ textAlign: "center" }}>
          <PlayerSignupCallToAction href={withRedirect("/sign-up", "/parent")} status={signupStatus}>
            List my player
          </PlayerSignupCallToAction>
        </p>
      </section>
    </>
  );
}
