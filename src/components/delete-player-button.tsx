"use client";

import { deletePlayer } from "@/app/(private)/parent/player/actions";

export function DeletePlayerButton({ playerId }: { playerId: string }) {
  return (
    <>
      <p className="meta">
        Refund eligibility depends on whether a coach has viewed the profile. Ask for a refund before
        deleting, because deleting also deletes that view record.
      </p>
      <form
        action={deletePlayer}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            "Delete this profile? It leaves coach search immediately and is purged within 30 days. If you may want a refund, ask for it first. Deleting also deletes the view log used to check eligibility.",
          );
          if (!confirmed) event.preventDefault();
        }}
      >
        <input type="hidden" name="playerId" value={playerId} />
        <button className="btn btn-danger" type="submit">
          Delete profile
        </button>
      </form>
    </>
  );
}
