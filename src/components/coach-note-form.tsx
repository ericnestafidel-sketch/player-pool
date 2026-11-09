"use client";

import { useActionState } from "react";
import { saveNote, type NoteState } from "@/app/(private)/coach/search/actions";

const initial: NoteState = { ok: false };

export function CoachNoteForm({ playerId, note }: { playerId: string; note: string }) {
  const [state, action, pending] = useActionState(saveNote, initial);
  return (
    <form className="notes-box" action={action}>
      <label htmlFor={`note-${playerId}`}>Private note</label>
      <textarea id={`note-${playerId}`} name="body" defaultValue={note} maxLength={2000} />
      <p className="n-hint">Only you can see this. It is not shown to the parent or other coaches.</p>
      {state.error ? <p className="field-error">{state.error}</p> : null}
      {state.ok ? <p className="meta">Note saved.</p> : null}
      <input type="hidden" name="playerId" value={playerId} />
      <button className="btn navy btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
