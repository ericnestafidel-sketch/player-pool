"use client";

import { useActionState } from "react";
import {
  updateCoachProfile,
  type CoachProfileState,
} from "@/app/(private)/coach/profile/actions";
import { BASEBALL_AGES, ORGANIZATIONS } from "@/lib/coach-options";

const initial: CoachProfileState = { fieldErrors: {} };

export function CoachProfileForm({
  teamName,
  organization,
  ages,
  yearsExperience,
  savedAges,
}: {
  teamName: string;
  organization: string;
  ages: string[];
  yearsExperience: number | null;
  savedAges: string;
}) {
  const [state, action, pending] = useActionState(updateCoachProfile, initial);
  const picked = new Set(ages);
  return (
    <form action={action}>
      {state.error ? <p className="field-error">{state.error}</p> : null}
      {state.ok ? <p className="meta">Saved. Parents see this card in an in-app message.</p> : null}
      <label htmlFor="teamName">Team name</label>
      <input id="teamName" name="teamName" required defaultValue={teamName} maxLength={80} />
      <FieldError message={state.fieldErrors.teamName} />
      <label htmlFor="organization">Organization</label>
      <select id="organization" name="organization" required defaultValue={organization}>
        {ORGANIZATIONS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <FieldError message={state.fieldErrors.organization} />
      <p id="ages-label" className="meta">
        <strong>Ages coached</strong>
      </p>
      {picked.size === 0 && savedAges ? (
        <p className="meta">Saved ages: {savedAges}. Select the groups to replace that.</p>
      ) : null}
      <div className="age-picks" role="group" aria-labelledby="ages-label">
        {BASEBALL_AGES.map((age) => (
          <label className="check" key={age}>
            <input type="checkbox" name="ages" value={age} defaultChecked={picked.has(age)} />
            <span>{age}</span>
          </label>
        ))}
      </div>
      <FieldError message={state.fieldErrors.ages} />
      <label htmlFor="yearsExperience">Years coaching (optional)</label>
      <input
        id="yearsExperience"
        name="yearsExperience"
        inputMode="numeric"
        defaultValue={yearsExperience ?? ""}
      />
      <FieldError message={state.fieldErrors.yearsExperience} />
      <button className="btn gold" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save team card"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}
