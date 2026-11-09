import { CoachCard } from "@/components/coach-card";
import { ParentCoachActions } from "@/components/parent-coach-actions";
import { formatViewedDate } from "@/lib/player-rules";
import type { ProfileViewer } from "@/lib/player-store";

export function ViewerList({ viewers, returnTo }: { viewers: ProfileViewer[]; returnTo: string }) {
  if (viewers.length === 0) {
    return <p className="meta">No coach has opened this profile yet. Email and phone are never shown.</p>;
  }
  return (
    <>
      <p className="meta">
        Team card only. Block hides your players from that coach. Report suspends them until Eric
        reviews.
      </p>
      <div className="contact-list">
        {viewers.map((view) => (
          <div key={view.coachId}>
            <p className="meta">
              Viewed {formatViewedDate(view.viewedAt)}
              {view.blocked ? " · Blocked" : ""}
            </p>
            <CoachCard coach={view.coach} />
            <ParentCoachActions coachId={view.coachId} blocked={view.blocked} returnTo={returnTo} />
          </div>
        ))}
      </div>
    </>
  );
}
