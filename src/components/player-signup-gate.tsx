import Link from "next/link";

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
