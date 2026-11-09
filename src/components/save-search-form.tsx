"use client";

import { useActionState } from "react";
import { saveSearch, type SaveSearchState } from "@/app/(private)/coach/search/actions";
import type { SearchFilters } from "@/lib/player-rules";

const initial: SaveSearchState = { ok: false };

export function SaveSearchForm({ filters }: { filters: SearchFilters }) {
  const [state, action, pending] = useActionState(saveSearch, initial);
  return (
    <form className="saved-bar" action={action}>
      <input type="hidden" name="age" value={filters.ageGroup} />
      <input type="hidden" name="position" value={filters.position} />
      <input type="hidden" name="level" value={filters.skillLevel} />
      <input type="hidden" name="state" value={filters.state} />
      <input type="hidden" name="county" value={filters.county} />
      <input type="hidden" name="weekend" value={filters.weekend} />
      <input type="hidden" name="status" value={filters.status} />
      <label htmlFor="search-name">Save this search</label>
      <input id="search-name" name="name" maxLength={40} placeholder="12U pitchers in Indiana" />
      <button className="btn navy btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save search"}
      </button>
      {state.error ? <p className="field-error">{state.error}</p> : null}
      {state.ok ? <p className="meta">Saved.</p> : null}
    </form>
  );
}
