import { createBoardPost, updateBoardPost } from "@/app/(private)/board/actions";
import { AGE_GROUPS, BASEBALL_LEVELS, BASEBALL_POSITIONS } from "@/lib/coach-options";
import { formatPositionOption } from "@/lib/positions";
import { US_STATES } from "@/lib/states";

export function BoardForm({
  action,
  post,
}: {
  action: "create" | "edit";
  post?: {
    id: string;
    teamName: string;
    ageGroup: string;
    positions: string[];
    skillLevels: string[];
    state: string;
    county: string;
    eventName: string | null;
    startsOn: string;
    endsOn: string;
    playersNeeded: number;
    closesOn: string;
    notes: string | null;
  };
}) {
  return (
    <form action={action === "create" ? createBoardPost : updateBoardPost} className="section-card">
      {post ? <input type="hidden" name="postId" value={post.id} /> : null}
      <label htmlFor="teamName">Team name</label>
      <input id="teamName" name="teamName" required defaultValue={post?.teamName ?? ""} />
      <label htmlFor="ageGroup">Age group</label>
      <select id="ageGroup" name="ageGroup" required defaultValue={post?.ageGroup ?? ""}>
        <option value="">Choose</option>
        {AGE_GROUPS.map((age) => (
          <option key={age}>{age}</option>
        ))}
      </select>
      <fieldset>
        <legend>Positions needed</legend>
        {BASEBALL_POSITIONS.map((position) => (
          <label className="check" key={position}>
            <input
              type="checkbox"
              name="positions"
              value={position}
              defaultChecked={post?.positions.includes(position)}
            />
            <span>{formatPositionOption(position)}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>USSSA skill level (up to two)</legend>
        {BASEBALL_LEVELS.map((level) => (
          <label className="check" key={level}>
            <input
              type="checkbox"
              name="skillLevels"
              value={level}
              defaultChecked={post?.skillLevels.includes(level)}
            />
            <span>{level}</span>
          </label>
        ))}
      </fieldset>
      <p className="meta">Launching in Indiana, Illinois, and Ohio.</p>
      <label htmlFor="state">State</label>
      <select id="state" name="state" required defaultValue={post?.state ?? ""}>
        <option value="">Choose</option>
        {US_STATES.map((code) => (
          <option key={code}>{code}</option>
        ))}
      </select>
      <label htmlFor="county">County</label>
      <input id="county" name="county" required defaultValue={post?.county ?? ""} placeholder="County name" />
      <label htmlFor="eventName">Tournament or tryout name (optional)</label>
      <input id="eventName" name="eventName" maxLength={80} defaultValue={post?.eventName ?? ""} />
      <label htmlFor="startsOn">Event start</label>
      <input id="startsOn" name="startsOn" type="date" required defaultValue={post?.startsOn ?? ""} />
      <label htmlFor="endsOn">Event end</label>
      <input id="endsOn" name="endsOn" type="date" required defaultValue={post?.endsOn ?? ""} />
      <label htmlFor="playersNeeded">Players needed</label>
      <input
        id="playersNeeded"
        name="playersNeeded"
        type="number"
        required
        min={1}
        max={99}
        step={1}
        defaultValue={post?.playersNeeded ?? 1}
      />
      <label htmlFor="closesOn">Close date</label>
      <input id="closesOn" name="closesOn" type="date" defaultValue={post?.closesOn ?? ""} />
      <p className="meta">
        Leave the close date blank to use the day before the event starts. It cannot be after the end date.
        The need drops off the board after the close date or the end date.
      </p>
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" rows={4} maxLength={500} defaultValue={post?.notes ?? ""} />
      <p className="meta">No email, phone number, or link. Parents message you in Player Pool.</p>
      <button className="btn gold" type="submit">
        {action === "create" ? "Post" : "Save"}
      </button>
    </form>
  );
}
