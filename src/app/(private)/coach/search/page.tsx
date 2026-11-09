import { connection } from "next/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachNoteForm } from "@/components/coach-note-form";
import { PlayerCard } from "@/components/player-card";
import { SaveSearchForm } from "@/components/save-search-form";
import { removeSavedSearch } from "@/app/(private)/coach/search/actions";
import {
  filtersFromParams,
  filtersToQuery,
  formatWeekend,
  skillLevelLabel,
  upcomingWeekends,
  WEEKENDS_SHOWN,
} from "@/lib/player-rules";
import { coaches } from "@/db/schema";
import { getDb } from "@/db";
import { listSavedSearches, searchPlayers } from "@/lib/player-store";
import { listSports, preferredSport } from "@/lib/sport";
import { PLAYER_STATUS_LABEL } from "@/lib/safety";
import { US_STATES } from "@/lib/states";
import { AdminNav } from "@/components/admin-nav";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach search",
  robots: { index: false, follow: false },
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<main className="form-wrap">Checking access…</main>}>
      <Search searchParams={searchParams} />
    </Suspense>
  );
}

async function Search({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const preview = viewer.role === "admin";
  if (!preview && (viewer.role !== "coach" || viewer.coachStatus !== "approved")) {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  const now = new Date();
  const [raw, sports] = await Promise.all([searchParams, listSports()]);
  const sport = preferredSport(sports);
  const filters = filtersFromParams(raw, sport, now);
  const db = getDb();
  const [saved, results, badgeRows] = await Promise.all([
    preview ? Promise.resolve([]) : listSavedSearches(viewer.userId, sport, now),
    searchPlayers(viewer.userId, filters, now, { includeAdminTests: preview }),
    db
      ? db
          .select({
            foundingCoach: coaches.foundingCoach,
            foundingNumber: coaches.foundingNumber,
          })
          .from(coaches)
          .where(eq(coaches.userId, viewer.userId))
          .limit(1)
      : Promise.resolve([]),
  ]);
  const badge = badgeRows[0];
  const weekendOptions = upcomingWeekends(WEEKENDS_SHOWN, now);
  if (filters.weekend && !weekendOptions.includes(filters.weekend)) {
    weekendOptions.unshift(filters.weekend);
  }
  return (
    <main className="search">
      <aside>
        <p className="filter-heading">Filters</p>
        <form method="get" key={filtersToQuery(filters) || "all"}>
          {sport ? (
            <>
              <p className="meta">{sport.label}</p>
              <FilterSelect label="Age group" name="age" value={filters.ageGroup} options={sport.ageLabels} />
              <FilterSelect
                label="Position"
                name="position"
                value={filters.position}
                options={sport.positionLabels}
              />
              <FilterSelect
                label={skillLevelLabel(sport)}
                name="level"
                value={filters.skillLevel}
                options={sport.levelLabels}
              />
            </>
          ) : (
            <p className="meta">Sport labels are not loaded yet.</p>
          )}
          <label htmlFor="state">State</label>
          <select id="state" name="state" defaultValue={filters.state}>
            <option value="">Any</option>
            {US_STATES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <label htmlFor="county">County</label>
          <input id="county" name="county" defaultValue={filters.county} autoComplete="off" />
          <label htmlFor="weekend">Available this weekend</label>
          <select id="weekend" name="weekend" defaultValue={filters.weekend}>
            <option value="">Any</option>
            {weekendOptions.map((iso) => (
              <option key={iso} value={iso}>
                {formatWeekend(iso)}
              </option>
            ))}
          </select>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={filters.status}>
            <option value="">Any</option>
            <option value="full">{PLAYER_STATUS_LABEL.full}</option>
            <option value="pickup">{PLAYER_STATUS_LABEL.pickup}</option>
            <option value="not">{PLAYER_STATUS_LABEL.not}</option>
          </select>
          <div className="filter-actions">
            <button className="btn navy" type="submit">
              Search
            </button>
            <Link className="btn btn-outline" href="/coach/search">
              Clear
            </Link>
          </div>
        </form>
      </aside>
      <section>
        {preview ? (
          <>
            <AdminNav />
            <p className="hint">
              Admin preview. You are still an admin. Admin test players are marked and hidden from
              real coaches. Notes and saved searches stay off in this view.
            </p>
          </>
        ) : null}
        {badge?.foundingCoach ? (
          <p className="status-badge badge-founding">
            Founding Coach{badge.foundingNumber ? ` #${badge.foundingNumber}` : ""}
          </p>
        ) : null}
        <h1>Coach search</h1>
        <p className="lead">
          Players are listed as Player #NNN, with state and county. Parent and coach email and phone
          are not on this page.
        </p>
        {preview ? null : (
          <>
            <SaveSearchForm filters={filters} />
            <div className="saved-list">
              {saved.length === 0 ? (
                <p className="saved-empty">No saved searches yet.</p>
              ) : (
                saved.map((item) => (
                  <span className="saved-chip" key={item.id}>
                    <Link href={item.href}>{item.name}</Link>
                    <form action={removeSavedSearch}>
                      <input type="hidden" name="searchId" value={item.id} />
                      <button className="x" type="submit" aria-label={`Delete saved search ${item.name}`}>
                        ×
                      </button>
                    </form>
                  </span>
                ))
              )}
            </div>
          </>
        )}
        <p className="count">
          {results.truncated
            ? `Showing the first ${results.hits.length}. Narrow the filters to see fewer.`
            : `${results.hits.length} player${results.hits.length === 1 ? "" : "s"}`}
        </p>
        {results.hits.length === 0 ? (
          <div className="hint">
            No players match. Paused and deleted profiles stay hidden.
          </div>
        ) : (
          <div className="grid">
            {results.hits.map((hit) => (
              <div key={hit.player.id}>
                <PlayerCard
                  player={hit.player}
                  href={`/players/${hit.player.id}`}
                  highlightFresh={hit.highlightFresh}
                  weekends={hit.weekends}
                />
                <p className="card-more">
                  <Link href={`/players/${hit.player.id}`} prefetch={false}>
                    Open profile
                  </Link>
                </p>
                {preview ? null : <CoachNoteForm playerId={hit.player.id} note={hit.note ?? ""} />}
              </div>
            ))}
          </div>
        )}
        {preview ? null : (
          <p>
            <Link href="/coach/profile">Your team card</Link>
          </p>
        )}
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={value}>
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </>
  );
}
