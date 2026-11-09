"use client";

import { useActionState, useState, type Dispatch, type SetStateAction } from "react";
import { savePlayer, type PlayerFormState } from "@/app/(private)/parent/player/actions";
import {
  formatWeekend,
  skillLevelLabel,
  type PlayerDraft,
  type SportConfig,
} from "@/lib/player-rules";
import { PLAYER_STATUS_LABEL } from "@/lib/safety";
import { US_STATES } from "@/lib/states";

const initialState: PlayerFormState = { fieldErrors: {} };

export function PlayerForm({
  sports,
  weekends,
  draft,
  label,
}: {
  sports: SportConfig[];
  weekends: string[];
  draft: PlayerDraft;
  label?: string;
}) {
  const [state, action, pending] = useActionState(savePlayer, initialState);
  const [sportSlug, setSportSlug] = useState(draft.sport);
  const [ageGroup, setAgeGroup] = useState(draft.ageGroup);
  const [skillLevel, setSkillLevel] = useState(draft.skillLevel);
  const [positions, setPositions] = useState(draft.positions);
  const [stats, setStats] = useState(draft.stats);
  const [highlights, setHighlights] = useState(draft.highlights);
  const sport = sports.find((item) => item.slug === sportSlug) ?? sports[0];
  const ageValue = sport?.ageLabels.includes(ageGroup) ? ageGroup : "";
  const levelValue = sport?.levelLabels.includes(skillLevel) ? skillLevel : "";
  if (!sport) return <p className="field-error">Sport list is not available.</p>;

  function chooseSport(next: string) {
    setSportSlug(next);
    setAgeGroup("");
    setSkillLevel("");
    setPositions([]);
  }

  return (
    <form action={action} autoComplete="off">
      {draft.playerId ? <input type="hidden" name="playerId" value={draft.playerId} /> : null}
      {state.error ? <p className="field-error">{state.error}</p> : null}
      {state.ok ? (
        <p className="meta">
          Saved. Approved coaches see {label ?? "this player"} with state and county only.
        </p>
      ) : null}

      <section className="section-card">
        <h3>Player</h3>
        <label htmlFor="sport">Sport</label>
        <select
          id="sport"
          name="sport"
          value={sport.slug}
          onChange={(event) => chooseSport(event.target.value)}
        >
          {sports.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.label}
            </option>
          ))}
        </select>
        <FieldError id="sport-error" message={state.fieldErrors.sport} />

        <label htmlFor="birthYear">Birth year</label>
        <input
          id="birthYear"
          name="birthYear"
          inputMode="numeric"
          autoComplete="off"
          required
          defaultValue={draft.birthYear}
          aria-describedby={state.fieldErrors.birthYear ? "birthYear-error" : undefined}
        />
        <FieldError id="birthYear-error" message={state.fieldErrors.birthYear} />

        <label htmlFor="ageGroup">Age group</label>
        <select
          id="ageGroup"
          name="ageGroup"
          required
          value={ageValue}
          onChange={(event) => setAgeGroup(event.target.value)}
        >
          <option value="">Choose an age group</option>
          {sport.ageLabels.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </select>
        <FieldError id="ageGroup-error" message={state.fieldErrors.ageGroup} />

        <fieldset className="field">
          <legend>Positions</legend>
          <div className="check-grid">
            {sport.positionLabels.map((position) => (
              <label key={position}>
                <input
                  type="checkbox"
                  name="positions"
                  value={position}
                  checked={positions.includes(position)}
                  onChange={(event) => {
                    setPositions((current) =>
                      event.target.checked
                        ? [...current, position]
                        : current.filter((item) => item !== position),
                    );
                  }}
                />
                <span>{position}</span>
              </label>
            ))}
          </div>
          <FieldError id="positions-error" message={state.fieldErrors.positions} />
        </fieldset>

        <label htmlFor="skillLevel">{skillLevelLabel(sport)}</label>
        <select
          id="skillLevel"
          name="skillLevel"
          required
          value={levelValue}
          onChange={(event) => setSkillLevel(event.target.value)}
        >
          <option value="">Choose a level</option>
          {sport.levelLabels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <FieldError id="skillLevel-error" message={state.fieldErrors.skillLevel} />

        <label htmlFor="status">Looking for a team</label>
        <select id="status" name="status" required defaultValue={draft.status}>
          <option value="">Choose one</option>
          <option value="full">{PLAYER_STATUS_LABEL.full}</option>
          <option value="pickup">{PLAYER_STATUS_LABEL.pickup}</option>
          <option value="not">{PLAYER_STATUS_LABEL.not}</option>
        </select>
        <FieldError id="status-error" message={state.fieldErrors.status} />

        <label htmlFor="travelMiles">Travel miles for a weekend (optional)</label>
        <input
          id="travelMiles"
          name="travelMiles"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={draft.travelMiles}
        />
        <FieldError id="travelMiles-error" message={state.fieldErrors.travelMiles} />

        <label htmlFor="note">Short note for coaches</label>
        <textarea
          id="note"
          name="note"
          maxLength={280}
          rows={3}
          defaultValue={draft.note}
          placeholder="Pitching and infield. No name, school, town, or contact info."
        />
        <p className="meta">No name, jersey, school, town, address, email, or phone.</p>
        <FieldError id="note-error" message={state.fieldErrors.note} />
      </section>

      <section className="section-card">
        <h3>Location</h3>
        <p className="meta">State and county only. Town and street address are not collected.</p>
        <label htmlFor="state">State</label>
        <select id="state" name="state" required defaultValue={draft.state}>
          <option value="">Choose a state</option>
          {US_STATES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <FieldError id="state-error" message={state.fieldErrors.state} />
        <label htmlFor="county">County</label>
        <input
          id="county"
          name="county"
          required
          autoComplete="off"
          maxLength={60}
          defaultValue={draft.county}
          placeholder="Montgomery"
        />
        <FieldError id="county-error" message={state.fieldErrors.county} />
      </section>

      <section className="section-card">
        <h3>Stats</h3>
        <p className="meta">Optional. Add the numbers you want coaches to see. Names stay generic.</p>
        {stats.map((stat, index) => (
          <div className="stat-row" key={stat.lockedName ? stat.name : `custom-${index}`}>
            {stat.lockedName ? (
              <>
                <input type="hidden" name="statName" value={stat.name} />
                <span className="stat-label">{stat.name}</span>
              </>
            ) : (
              <input
                name="statName"
                value={stat.name}
                maxLength={40}
                autoComplete="off"
                aria-label="Stat name"
                placeholder="Stat name"
                onChange={(event) => updateStat(setStats, index, "name", event.target.value)}
              />
            )}
            <input
              name="statValue"
              value={stat.value}
              maxLength={40}
              autoComplete="off"
              aria-label={stat.lockedName ? stat.name : "Stat value"}
              placeholder="Value"
              onChange={(event) => updateStat(setStats, index, "value", event.target.value)}
            />
          </div>
        ))}
        <FieldError id="stats-error" message={state.fieldErrors.stats} />
        {stats.length < 12 ? (
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() =>
              setStats((current) => [...current, { name: "", value: "", lockedName: false }])
            }
          >
            Add a stat
          </button>
        ) : null}
      </section>

      <section className="section-card">
        <h3>Highlights</h3>
        <div className="hint">
          Paste an unlisted YouTube or Hudl link. Leave the player&apos;s name, jersey number, and
          school out of the title and out of the video. A link added in the last 90 days shows coaches
          a 90-day highlight badge.
        </div>
        {highlights.map((highlight, index) => (
          <div className="highlight-row" key={`highlight-${index}`}>
            <input
              name="highlightUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://youtu.be/…"
              aria-label={`Highlight link ${index + 1}`}
              value={highlight.url}
              onChange={(event) => updateHighlight(setHighlights, index, "url", event.target.value)}
            />
            <input
              name="highlightTitle"
              autoComplete="off"
              maxLength={80}
              placeholder="Title without a name"
              aria-label={`Highlight title ${index + 1}`}
              value={highlight.title}
              onChange={(event) => updateHighlight(setHighlights, index, "title", event.target.value)}
            />
            {highlights.length > 1 ? (
              <button
                className="btn btn-muted btn-sm"
                type="button"
                onClick={() =>
                  setHighlights((current) => current.filter((_, item) => item !== index))
                }
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        <FieldError id="highlights-error" message={state.fieldErrors.highlights} />
        {highlights.length < 5 ? (
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setHighlights((current) => [...current, { url: "", title: "" }])}
          >
            Add a highlight link
          </button>
        ) : null}
      </section>

      <section className="section-card">
        <h3>Weekend availability</h3>
        <p className="wk-legend">
          <span>
            <i className="ga" /> Available
          </span>
          <span>
            <i className="gb" /> Busy
          </span>
        </p>
        <p className="meta">
          Available weekends show up when a coach filters by that Saturday. Busy weekends do not. Not
          set leaves the weekend off the filter.
        </p>
        {weekends.map((iso) => {
          const current = draft.availability[iso] ?? "";
          return (
            <fieldset className="weekend-row" key={iso}>
              <legend>{formatWeekend(iso)}</legend>
              <div className="picks">
                <label>
                  <input
                    type="radio"
                    name={`weekend:${iso}`}
                    value=""
                    defaultChecked={current === ""}
                  />
                  Not set
                </label>
                <label>
                  <input
                    type="radio"
                    name={`weekend:${iso}`}
                    value="avail"
                    defaultChecked={current === "avail"}
                  />
                  Available
                </label>
                <label>
                  <input
                    type="radio"
                    name={`weekend:${iso}`}
                    value="busy"
                    defaultChecked={current === "busy"}
                  />
                  Busy
                </label>
              </div>
            </fieldset>
          );
        })}
        <FieldError id="weekends-error" message={state.fieldErrors.weekends} />
      </section>

      <button className="btn gold save" type="submit" disabled={pending}>
        {pending ? "Saving…" : draft.playerId ? "Save profile" : "Create profile"}
      </button>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" id={id}>
      {message}
    </p>
  );
}

function updateStat(
  setStats: Dispatch<SetStateAction<PlayerDraft["stats"]>>,
  index: number,
  key: "name" | "value",
  value: string,
) {
  setStats((current) =>
    current.map((stat, item) => (item === index ? { ...stat, [key]: value } : stat)),
  );
}

function updateHighlight(
  setHighlights: Dispatch<SetStateAction<PlayerDraft["highlights"]>>,
  index: number,
  key: "url" | "title",
  value: string,
) {
  setHighlights((current) =>
    current.map((highlight, item) => (item === index ? { ...highlight, [key]: value } : highlight)),
  );
}
