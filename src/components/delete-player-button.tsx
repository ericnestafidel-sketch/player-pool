"use client";

import { deletePlayer } from "@/app/(private)/parent/player/actions";

export function DeletePlayerButton({ playerId }: { playerId: string }) {
  return (
    <form
      action={deletePlayer}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Delete this profile? It leaves coach search immediately and is purged within 30 days.",
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="playerId" value={playerId} />
      <button className="btn btn-danger" type="submit">
        Delete profile
      </button>
    </form>
  );
}
