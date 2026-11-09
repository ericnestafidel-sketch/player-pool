import { blockThisCoach, unblockThisCoach } from "@/app/(private)/parent/inbox/actions";
import { ReportCoachForm } from "@/components/report-coach-form";

/** Parent controls for one coach. The coach id is not shown as text. */
export function ParentCoachActions({
  coachId,
  blocked,
  returnTo,
}: {
  coachId: string;
  blocked: boolean;
  returnTo: string;
}) {
  return (
    <div className="coach-actions">
      {blocked ? (
        <form action={unblockThisCoach}>
          <input type="hidden" name="coachId" value={coachId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="btn btn-outline btn-sm" type="submit">
            Unblock
          </button>
        </form>
      ) : (
        <form action={blockThisCoach}>
          <input type="hidden" name="coachId" value={coachId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="btn btn-outline btn-sm" type="submit">
            Block
          </button>
        </form>
      )}
      <ReportCoachForm coachId={coachId} returnTo={returnTo} />
    </div>
  );
}
