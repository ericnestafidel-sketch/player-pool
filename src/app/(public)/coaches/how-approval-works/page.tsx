import type { Metadata } from "next";
import Link from "next/link";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "How coach approval works",
  description:
    "What travel baseball coaches submit for Player Pool, how our staff reviews applications, and how parents can block or report a coach. Contact details stay off the site.",
  path: "/coaches/how-approval-works",
});

export default function HowApprovalWorksPage() {
  return (
    <main className="wrap">
      <p className="meta">
        <Link href="/coaches">Coaches</Link>
      </p>
      <h1>How coach approval works</h1>
      <p className="lead">
        Every coach is reviewed and approved by our experienced baseball staff before any player
        profile opens. Approval is not a background check, an identity guarantee, or an endorsement
        of a coach or team.
      </p>
      <h2>What you submit</h2>
      <ul>
        <li>
          At least one of: a team website, a league listing, a team social page, a tournament roster,
          or a short call with our staff
        </li>
        <li>One required reference (another coach, a director, or a parent from a current or recent team)</li>
        <li>
          Agreement to the <Link href="/conduct">Coach Code of Conduct</Link> and the{" "}
          <Link href="/terms">Terms of Use</Link>, including the safety rules
        </li>
      </ul>
      <h2>How review works</h2>
      <p>
        Our experienced baseball staff reviews each application, usually within 24–48 hours. You
        cannot see players while the request is pending. We can ask for more information, approve
        access, or decline it.
      </p>
      <h2>After approval</h2>
      <p>
        Parents can block or report a coach. A report suspends that coach while we review it. A coach
        can be removed or suspended for conduct problems. Coach contact information is never shown,
        and all messaging stays in the app.
      </p>
      <p>
        <Link className="btn gold" href="/coach/signup">
          Request coach access
        </Link>
      </p>
    </main>
  );
}
