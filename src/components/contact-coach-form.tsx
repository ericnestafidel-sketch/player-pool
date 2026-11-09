"use client";

import { useActionState } from "react";
import { sendContact, type MessageState } from "@/app/(private)/coach/messages/actions";

const initial: MessageState = {};

export function ContactCoachForm({
  playerId,
  weekends,
}: {
  playerId: string;
  weekends: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(sendContact, initial);
  return (
    <form className="section-card" action={action}>
      <h3>Message the parent</h3>
      <p className="meta">
        They see your team card only. Leave your email, phone, and street address out of the
        message. A new message counts toward 10 a day. Replies on the thread do not.
      </p>
      <input type="hidden" name="playerId" value={playerId} />
      <label htmlFor="weekend">Weekend</label>
      <select id="weekend" name="weekend" required defaultValue="">
        <option value="">Choose a Saturday</option>
        {weekends.map((weekend) => (
          <option key={weekend.value} value={weekend.value}>
            {weekend.label}
          </option>
        ))}
      </select>
      <label htmlFor="contact-body">Message</label>
      <textarea id="contact-body" name="body" required maxLength={2000} rows={4} />
      {state.error ? <p className="field-error">{state.error}</p> : null}
      <button className="btn gold" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
