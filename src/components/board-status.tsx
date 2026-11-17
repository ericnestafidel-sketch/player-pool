import Link from "next/link";
import { boardGate } from "@/lib/board";
import { homeFor, type Viewer } from "@/lib/viewer";

/** Board-only explanations. Do not send these people to the player-profile access page. */
export function BoardStatus({ viewer }: { viewer: Viewer }) {
  const gate = boardGate(viewer);
  if (gate === "ok") return null;
  if (gate === "verify-email") {
    return (
      <main className="form-wrap">
        <h1>Verify your email</h1>
        <p className="lead">
          Verify the email on your sign-in account before you use the Coach Needs Board. Needs stay
          hidden until then.
        </p>
      </main>
    );
  }
  if (gate === "pending") {
    const inReview = viewer.coachStatus === "pending" || viewer.coachStatus === null;
    return (
      <main className="form-wrap">
        <h1>{inReview ? "Coach application in review" : "Coach account not approved"}</h1>
        <p className="lead">
          {inReview
            ? "Your coach application is in review. You can post a Need after Player Pool approves it."
            : "This coach account cannot post a Need right now."}
        </p>
        <Link className="btn navy" href="/coach/pending">
          Request status
        </Link>
      </main>
    );
  }
  return (
    <main className="form-wrap">
      <h1>Finish setup</h1>
      <p className="lead">
        Finish your account before you use the Coach Needs Board. A coach application has to be saved
        before you can post a Need.
      </p>
      <Link className="btn navy" href={homeFor(viewer)}>
        Finish setup
      </Link>
    </main>
  );
}
