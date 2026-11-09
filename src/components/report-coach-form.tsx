"use client";

import { useActionState } from "react";
import { reportThisCoach, type MessageState } from "@/app/(private)/parent/inbox/actions";

const initial: MessageState = {};

export function ReportCoachForm({ coachId, returnTo }: { coachId: string; returnTo: string }) {
  const [state, action, pending] = useActionState(reportThisCoach, initial);
  return (
    <form action={action}>
      <input type="hidden" name="coachId" value={coachId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input
        className="reason-input"
        name="reason"
        required
        maxLength={500}
        placeholder="What happened?"
        aria-label="Report reason"
      />
      <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>
        {pending ? "Reporting…" : "Report"}
      </button>
      {state.error ? <p className="field-error">{state.error}</p> : null}
    </form>
  );
}
