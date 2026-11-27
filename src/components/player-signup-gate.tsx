import Link from "next/link";
import type { PlayerSignupStatus } from "@/lib/signup-access";

export function PlayerSignupClosedButton({ tone = "button" }: { tone?: "button" | "nav" }) {
  return (
    <button className={tone === "nav" ? "nav-soon" : "btn gold"} type="button" disabled>
      Player sign-up coming soon
    </button>
  );
}

export function PlayerSignupSoon() {
  return (
    <main className="form-wrap">
      <h1>Player sign-up is coming soon</h1>
      <p className="lead">
        Player Pool is open for coaches right now. Parents will be able to list a player here soon.
      </p>
      <p>
        <Link className="btn navy" href="/coaches">
          I&apos;m a coach — request access
        </Link>
      </p>
    </main>
  );
}

export function PlayerSignupFullButton({ tone = "button" }: { tone?: "button" | "nav" }) {
  return (
    <button className={tone === "nav" ? "nav-soon" : "btn gold"} type="button" disabled>
      {tone === "nav" ? "Sign-ups are full for now" : "Player sign-ups are full for now"}
    </button>
  );
}

export function PlayerSignupFull() {
  return (
    <main className="form-wrap">
      <h1>Player sign-ups are full for now</h1>
      <p className="lead">Player sign-ups are full for now, check back soon.</p>
      <p>
        <Link className="btn navy" href="/coaches">
          I&apos;m a coach — request access
        </Link>
      </p>
    </main>
  );
}

export function PlayerSignupUnavailable({ status }: { status: Exclude<PlayerSignupStatus, "open"> }) {
  return status === "full" ? <PlayerSignupFull /> : <PlayerSignupSoon />;
}

export function PlayerSignupCallToAction({
  href,
  children,
  status,
  tone = "button",
  className = "btn gold",
}: {
  href: string;
  children: string;
  status: PlayerSignupStatus;
  tone?: "button" | "nav";
  className?: string;
}) {
  if (status === "open") {
    return (
      <Link className={tone === "nav" ? undefined : className} href={href}>
        {children}
      </Link>
    );
  }
  if (status === "full") return <PlayerSignupFullButton tone={tone} />;
  return <PlayerSignupClosedButton tone={tone} />;
}
