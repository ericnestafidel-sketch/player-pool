import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="legal">
      <h1>Privacy Policy</h1>
      <div className="draft">
        <strong>Draft – pending attorney review.</strong> Not legal advice. Effective date and
        remaining brackets will be finalized with counsel before launch.
      </div>
      <p className="meta">
        <strong>Effective date:</strong> [DATE]
      </p>
      <p className="meta">
        <strong>Operator:</strong> On Deck Player Pool LLC (&quot;Player Pool,&quot; &quot;we,&quot;
        &quot;us&quot;), operating as Player Pool, Crawfordsville, Indiana. Contact: [business email
        coming soon]
      </p>
      <h2>Who this site is for</h2>
      <p>
        Player Pool lets parents and legal guardians (&quot;Parents&quot;) list their child&apos;s
        baseball information so approved travel baseball coaches (&quot;Coaches&quot;) can find
        players. <strong>Children may not create accounts or use the site.</strong> Only an adult
        Parent may create a player profile, and only for a child in their legal care.
      </p>
      <h2>What we collect</h2>
      <h3>From Parents</h3>
      <ul>
        <li>
          The Parent&apos;s name, email address, and phone number. These are used for the account
          and for contact relay and are <strong>never shown to Coaches or the public</strong>.
        </li>
        <li>
          Player information the Parent chooses to enter: age group, birth year, position(s), USSSA
          skill level, state and county, stats, availability, and links to highlight videos.
        </li>
        <li>
          Payment is handled entirely by Stripe. <strong>We never receive or store card numbers.</strong>{" "}
          We only receive confirmation that payment was made.
        </li>
      </ul>
      <h3>From Coaches</h3>
      <ul>
        <li>
          Name, email, phone, team name, organization, and verification details (for example a team
          website or USSSA team page).
        </li>
      </ul>
      <h3>Automatically</h3>
      <ul>
        <li>
          Basic technical data such as IP address, browser type, and pages viewed, for security and
          to prevent abuse.
        </li>
        <li>
          <strong>A view log</strong> recording which Coach viewed which player profile and when.
        </li>
      </ul>
      <h2>What we do NOT collect or show</h2>
      <ul>
        <li>We do not show a player&apos;s name. Players appear only by a generic ID (for example &quot;Player #234&quot;).</li>
        <li>We do not show a street address or town, only state and county.</li>
        <li>We do not show any Parent or player email or phone number.</li>
        <li>We do not knowingly collect information directly from children under 13.</li>
        <li>We do not sell personal information, rent it out, or use it for advertising.</li>
      </ul>
      <h2>Who can see a player profile</h2>
      <p>
        Profiles are visible <strong>only</strong> to Coaches who are logged in and have been
        manually approved by Player Pool. Profiles are not public and are not indexed by search
        engines.
      </p>
      <h2>How Coaches contact Parents</h2>
      <p>
        Coaches send messages through a relay form. The message goes to the Parent&apos;s email
        without revealing the Parent&apos;s address to the Coach. The Parent decides whether to
        reply. Replying directly will share the Parent&apos;s email with that Coach.
      </p>
      <h2>Highlight videos</h2>
      <p>
        Videos are links to third-party sites (for example YouTube or Hudl), and those sites&apos;
        privacy policies apply. We recommend uploading as &quot;unlisted&quot; and keeping the
        player&apos;s name, jersey name, and school identifiers out of titles and frames where
        practical.
      </p>
      <h2>Parent rights and control</h2>
      <p>Parents can:</p>
      <ul>
        <li>View, edit, or hide their child&apos;s profile at any time.</li>
        <li>See which Coaches viewed the profile.</li>
        <li>
          <strong>Delete the profile and all associated player data with one click.</strong> Deletion
          is permanent and completed within [30] days, including backups.
        </li>
        <li>Request a copy of their data or ask questions at [business email coming soon].</li>
      </ul>
      <p>Profiles are automatically hidden at the end of the paid season unless the Parent renews.</p>
      <h2>Data retention</h2>
      <p>
        We keep player data only while the profile is active or hidden by the Parent. Deleted
        profiles are purged within [30] days. View logs and message records are kept for [12 months]
        for safety investigations and then deleted.
      </p>
      <h2>Security</h2>
      <p>
        We use encrypted connections (HTTPS), access controls, and reputable service providers for
        hosting (Vercel), database, email delivery, and payments (Stripe). No system is perfectly
        secure. We will notify affected Parents of a breach as required by law.
      </p>
      <h2>Service providers</h2>
      <p>
        We share data only with providers needed to run the site (hosting, database, login, email
        delivery, payments), under their own privacy and security terms. We may disclose information
        if required by law or to protect a child&apos;s safety.
      </p>
      <h2>Changes</h2>
      <p>We will email Parents about material changes before they take effect.</p>
      <h2>Contact</h2>
      <p>On Deck Player Pool LLC, [mailing address coming soon], [business email coming soon]</p>
    </main>
  );
}
