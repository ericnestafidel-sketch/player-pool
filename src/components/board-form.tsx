import { createBoardPost, updateBoardPost } from "@/app/(private)/board/actions";
import { AGE_GROUPS, BASEBALL_LEVELS, BASEBALL_POSITIONS } from "@/lib/coach-options";
import type { SeasonOffer } from "@/lib/seasons";
import { US_STATES } from "@/lib/states";

export function BoardForm({
  action,
  offers,
  post,
}: {
  action: "create" | "edit";
  offers: SeasonOffer[];
  post?: {
    id: string;
    teamName: string;
    ageGroup: string;
    positions: string[];
    skillLevels: string[];
    state: string;
    county: string;
    seasonCode: string | null;
    neededThrough: string | null;
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
            <span>{position}</span>
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
      <label htmlFor="seasonCode">Season needed</label>
      <select id="seasonCode" name="seasonCode" defaultValue={post?.seasonCode ?? ""}>
        <option value="">No season selected</option>
        {offers.map((offer) => (
          <option key={offer.seasonCode} value={offer.seasonCode}>
            {offer.rangeLabel}
          </option>
        ))}
      </select>
      <label htmlFor="neededThrough">Last date needed</label>
      <input id="neededThrough" name="neededThrough" type="date" defaultValue={post?.neededThrough ?? ""} />
      <p className="meta">The post closes at season end or after 60 days, whichever comes first.</p>
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" rows={4} maxLength={500} defaultValue={post?.notes ?? ""} />
      <p className="meta">No email, phone number, or link. Parents message you in Player Pool.</p>
      <button className="btn gold" type="submit">
        {action === "create" ? "Post" : "Save"}
      </button>
    </form>
  );
}
