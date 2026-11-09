import Link from "next/link";
import { formatWeekend, type WeekendMark } from "@/lib/player-rules";
import { PLAYER_STATUS_LABEL, type PublicPlayer } from "@/lib/safety";

export function PlayerCard({
  player,
  href,
  highlightFresh = false,
  weekends = [],
}: {
  player: PublicPlayer;
  href?: string;
  highlightFresh?: boolean;
  weekends?: WeekendMark[];
}) {
  const badge =
    player.status === "pickup" ? "status-pickup" : player.status === "full" ? "status-full" : "status-not";
  const marked = weekends.filter((weekend) => weekend.state === "avail" || weekend.state === "busy");
  return (
    <article className="card">
      <h3>
        {href ? (
          <Link className="player-link" href={href} prefetch={false}>
            {player.label}
          </Link>
        ) : (
          player.label
        )}
      </h3>
      {player.adminTest ? <span className="status-badge badge-test">Admin test</span> : null}
      {highlightFresh ? <span className="badge-hl">90-day highlight</span> : null}
      <span className={`status-badge ${badge}`}>{PLAYER_STATUS_LABEL[player.status]}</span>
      <p className="meta">
        {player.ageGroup} · {player.skillLevel} · {player.sport}
      </p>
      <p className="meta">
        {player.state} · {player.county} County
        {player.birthYear ? ` · born ${player.birthYear}` : ""}
      </p>
      <div className="tags">
        {player.positions.map((position) => (
          <span className="tag" key={position}>
            {position}
          </span>
        ))}
      </div>
      {player.travelMiles != null ? <p className="travel">Travels about {player.travelMiles} miles</p> : null}
      {player.note ? <p>{player.note}</p> : null}
      {marked.length > 0 ? (
        <div className="weekends">
          {marked.map((weekend) => (
            <span className={`chip ${weekend.state}`} key={weekend.weekendStart}>
              {formatWeekend(weekend.weekendStart)}
              {weekend.state === "avail" ? " open" : " busy"}
            </span>
          ))}
        </div>
      ) : null}
      {player.paused ? <p className="meta">Paused. Hidden from coach search.</p> : null}
    </article>
  );
}
