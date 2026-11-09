"use client";

import { useActionState } from "react";
import type { MessageState } from "@/app/(private)/coach/messages/actions";

const initial: MessageState = {};

export function ThreadReplyForm({
  requestId,
  action,
}: {
  requestId: string;
  action: (previous: MessageState, formData: FormData) => Promise<MessageState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction}>
      <label htmlFor={`reply-${requestId}`}>Reply</label>
      <textarea id={`reply-${requestId}`} name="body" required maxLength={2000} rows={4} />
      <input type="hidden" name="requestId" value={requestId} />
      <p className="meta">
        Do not include an email, phone, or street address. The other person never sees yours.
      </p>
      {state.error ? <p className="field-error">{state.error}</p> : null}
      <button className="btn gold" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
