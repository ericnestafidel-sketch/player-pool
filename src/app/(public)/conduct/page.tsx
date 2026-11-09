import type { Metadata } from "next";

export const metadata: Metadata = { title: "Coach Code of Conduct" };

export default function ConductPage() {
  return (
    <main className="legal">
      <h1>Coach Code of Conduct</h1>
      <p className="draft">Draft, last updated November 2026.</p>
      <p>Every Coach must agree to this before access is approved. Breaking it means immediate removal.</p>
      <ol>
        <li>
          <strong>I am who I say I am.</strong> My name, team, and organization are accurate, and
          I&apos;ll keep them current.
        </li>
        <li>
          <strong>I contact parents only.</strong> All contact goes through the Player Pool relay
          form to the parent. I will never try to contact a player directly, in person or online.
        </li>
        <li>
          <strong>I won&apos;t try to identify or locate a player</strong> beyond what the parent
          chooses to share with me.
        </li>
        <li>
          <strong>I keep profiles private.</strong> I won&apos;t screenshot, copy, download, or share
          player information with anyone outside my coaching staff, and never publicly.
        </li>
        <li>
          <strong>I&apos;m honest in my outreach.</strong> I&apos;ll be clear about my team, fees,
          travel commitment, and tryout details.
        </li>
        <li>
          <strong>I respect &quot;no.&quot;</strong> If a parent doesn&apos;t reply or declines, I
          won&apos;t contact them again about that player.
        </li>
        <li>
          <strong>I keep messages appropriate.</strong> They&apos;re professional and about baseball
          only. No pressure tactics, no gifts, no requests for photos.
        </li>
        <li>
          <strong>I follow my organization&apos;s safety rules</strong>, including any
          background-check and SafeSport-style requirements that apply to me.
        </li>
        <li>
          <strong>I&apos;ll report concerns.</strong> If I see anything that looks unsafe for a
          child, I&apos;ll report it to Player Pool right away.
        </li>
        <li>
          <strong>I understand access can be revoked</strong> at any time, and Player Pool may share
          information with law enforcement if a child&apos;s safety is at risk.
        </li>
      </ol>
      <p>Coach name: ____________ Team / Organization: ____________ Date: ________</p>
    </main>
  );
}
