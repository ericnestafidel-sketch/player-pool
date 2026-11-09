"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AGE_GROUPS, ORGANIZATIONS, REFERENCE_ROLES } from "@/lib/coach-options";
import { US_STATES } from "@/lib/states";
import { submitCoach, type CoachFormState } from "@/app/(private)/coach/signup/actions";

const initial: CoachFormState = { fieldErrors: {} };

export function CoachSignupForm() {
  const [state, action, pending] = useActionState(submitCoach, initial);
  return (
    <form action={action}>
      {state.error ? <p className="field-error">{state.error}</p> : null}
      <label htmlFor="fullName">Full name</label>
      <input id="fullName" name="fullName" required autoComplete="name" />
      <FieldError message={state.fieldErrors.fullName} />
      <p className="meta">
        We use the email on this account for review. It is never shown to parents or on player pages.
      </p>
      <label htmlFor="phone">Phone</label>
      <input id="phone" name="phone" type="tel" required autoComplete="tel" />
      <FieldError message={state.fieldErrors.phone} />
      <label htmlFor="teamName">Team name</label>
      <input id="teamName" name="teamName" required />
      <FieldError message={state.fieldErrors.teamName} />
      <label htmlFor="organization">Organization</label>
      <select id="organization" name="organization" required defaultValue="">
        <option value="">Select…</option>
        {ORGANIZATIONS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <FieldError message={state.fieldErrors.organization} />
      <label htmlFor="agesCoached">Age group coached</label>
      <select id="agesCoached" name="agesCoached" required defaultValue="">
        <option value="">Select…</option>
        {AGE_GROUPS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <FieldError message={state.fieldErrors.agesCoached} />
      <label htmlFor="yearsExperience">Years coaching (optional)</label>
      <input id="yearsExperience" name="yearsExperience" inputMode="numeric" />
      <FieldError message={state.fieldErrors.yearsExperience} />
      <label htmlFor="state">State</label>
      <select id="state" name="state" required defaultValue="">
        <option value="">Select…</option>
        {US_STATES.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <FieldError message={state.fieldErrors.state} />
      <label htmlFor="county">County</label>
      <input id="county" name="county" required />
      <FieldError message={state.fieldErrors.county} />
      <label htmlFor="verifyUrl">
        Team website or USSSA / Perfect Game team page
      </label>
      <input id="verifyUrl" name="verifyUrl" type="url" required placeholder="https://" />
      <FieldError message={state.fieldErrors.verifyUrl} />
      <label htmlFor="useNote">How will you use Player Pool?</label>
      <textarea id="useNote" name="useNote" required rows={4} />
      <FieldError message={state.fieldErrors.useNote} />
      <div className="section-card">
        <h3>Reference</h3>
        <p className="meta" style={{ marginTop: 0 }}>
          At least one. Kept on file. Contact details are not shown to parents.
        </p>
        <label htmlFor="refName">Reference name</label>
        <input id="refName" name="refName" required />
        <FieldError message={state.fieldErrors.refName} />
        <label htmlFor="refRole">Role</label>
        <select id="refRole" name="refRole" required defaultValue="">
          <option value="">Select…</option>
          {REFERENCE_ROLES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <FieldError message={state.fieldErrors.refRole} />
        <label htmlFor="refTeam">Their team / organization</label>
        <input id="refTeam" name="refTeam" required />
        <FieldError message={state.fieldErrors.refTeam} />
        <label htmlFor="refContact">Email or phone</label>
        <input id="refContact" name="refContact" required />
        <FieldError message={state.fieldErrors.refContact} />
      </div>
      <label className="check">
        <input id="eligibility" name="eligibility" type="checkbox" required />
        <span>
          I have no disqualifying criminal record or sanctions. I have not been convicted of, or
          charged and awaiting trial for, a crime involving a child, sexual misconduct, or violence.
          I am not on a sex-offender registry, and I am not suspended or sanctioned by SafeSport or
          any sports organization.
        </span>
      </label>
      <FieldError message={state.fieldErrors.eligibility} />
      <label className="check">
        <input id="safetyRules" name="safetyRules" type="checkbox" required />
        <span>
          I agree to the safety rules in the <Link href="/conduct">Coach Code of Conduct</Link>,
          including contacting parents only and no one-on-one contact with a player, and to the{" "}
          <Link href="/terms">Terms of Use</Link>.
        </span>
      </label>
      <FieldError message={state.fieldErrors.safetyRules} />
      <button className="btn gold" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}
