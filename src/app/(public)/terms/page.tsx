import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <main className="legal">
      <h1>Terms of Use</h1>
      <div className="draft">
        <strong>Draft – pending attorney review.</strong> Not legal advice. Effective date and
        remaining brackets will be finalized with counsel before launch.
      </div>
      <p className="meta">
        <strong>Effective date:</strong> [DATE]
      </p>
      <h2>1. Agreement</h2>
      <p>
        By creating an account you agree to these Terms and the Privacy Policy. You must be 18 or
        older.
      </p>
      <h2>2. Accounts</h2>
      <ul>
        <li>
          <strong>Parents:</strong> you must be the parent or legal guardian of any player you list.
          You are responsible for the accuracy of the information you post.
        </li>
        <li>
          <strong>Coaches:</strong> you must be an active coach or official of a youth baseball team
          or organization. Access is granted only after manual approval and can be suspended or
          revoked at any time, for any reason, without refund.
        </li>
        <li>Keep your login private. One account per person, and no sharing accounts.</li>
      </ul>
      <h2>3. Fees</h2>
      <ul>
        <li>
          Parent listings cost <strong>$25 per season</strong> as a one-time payment.{" "}
          <strong>There is no automatic renewal.</strong>
        </li>
        <li>
          Founding Families (the first 25 Parent sign-ups) pay <strong>$15 per season</strong>, and
          that price is kept for as long as they renew.
        </li>
        <li>
          <strong>Yearly special</strong> (all three seasons in one payment): <strong>$60</strong>{" "}
          regular, <strong>$36</strong> for Founding Families. Still one-time — no auto-renewal.
        </li>
        <li>
          &quot;Season&quot; means: <strong>Spring</strong> (January–May), <strong>Summer</strong>{" "}
          (June–August), and <strong>Fall/Winter</strong> (September–December).
        </li>
        <li>
          Payments are processed by Stripe. <strong>Refund policy:</strong> full refund within 15
          days of payment if no Coach has viewed the profile; otherwise no refund.
        </li>
        <li>Coach access is free.</li>
      </ul>
      <h2>4. No guarantees</h2>
      <p>
        Player Pool is a listing and search tool only. We do not guarantee that a player will be
        contacted, invited to tryouts, or placed on a team. We are not a party to any agreement
        between Parents and Coaches or teams.
      </p>
      <h2>5. Prohibited conduct</h2>
      <p>You may not:</p>
      <ul>
        <li>
          Post a player&apos;s full name, school, home address, phone, email, or social media handles
          in any profile field or video title.
        </li>
        <li>
          Contact players directly, or try to identify or locate a player or family outside the relay
          system without the Parent&apos;s consent.
        </li>
        <li>Copy, scrape, download, or share profile information outside the site.</li>
        <li>Use the site to recruit for anything other than youth baseball.</li>
        <li>
          Send harassing, misleading, or excessive messages (Coaches are limited to [10] new contact
          requests per day).
        </li>
        <li>Create fake accounts or misrepresent your identity, team, or organization.</li>
      </ul>
      <h2>6. Reporting and enforcement</h2>
      <p>
        Anyone can report a message or profile. A report against a Coach suspends that Coach&apos;s
        access until reviewed. We may remove content or terminate accounts that violate these Terms,
        and we may report suspected abuse of a minor to law enforcement.
      </p>
      <h2>7. Content</h2>
      <p>
        Parents keep ownership of what they post and give us permission to display it to approved
        Coaches for the purpose of the service. We may remove any content at our discretion.
      </p>
      <h2>8. Disclaimers and limitation of liability</h2>
      <p>
        The site is provided &quot;as is.&quot; To the fullest extent allowed by law, On Deck Player
        Pool LLC is not liable for the conduct of any user, or for indirect or consequential damages.
        Our total liability is limited to the amount you paid in the past 12 months. [ATTORNEY TO
        REVIEW]
      </p>
      <h2>9. Indemnity</h2>
      <p>
        You agree to cover our costs if your misuse of the site leads to a claim against us.
        [ATTORNEY TO REVIEW]
      </p>
      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Indiana, with venue in Montgomery
        County, Indiana.
      </p>
      <h2>11. Changes</h2>
      <p>We may update these Terms and will email users about material changes.</p>
    </main>
  );
}
