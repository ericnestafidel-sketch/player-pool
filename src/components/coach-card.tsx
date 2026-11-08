import { ageTags, yearsLabel, type PublicCoach } from "@/lib/coach-profile";

/** Parent-facing team card. Do not add email, phone, address, or account fields. */
export function CoachCard({ coach }: { coach: PublicCoach }) {
  const ages = ageTags(coach.agesCoached);
  const years = yearsLabel(coach.yearsExperience);
  return (
    <article className="card coach-card">
      <h3>{coach.teamName}</h3>
      {coach.approved ? (
        <span className="status-badge badge-ok">Approved by Player Pool</span>
      ) : null}
      <p className="meta">{coach.organization}</p>
      {ages.length ? (
        <div className="tags">
          {ages.map((age) => (
            <span className="tag" key={age}>
              {age}
            </span>
          ))}
        </div>
      ) : (
        <p className="meta">Ages not listed</p>
      )}
      {years ? <p className="meta">{years}</p> : null}
    </article>
  );
}
