import { PLAYER_STATUS_LABEL, type PublicPlayer } from "@/lib/safety";

export function PlayerCard({ player }: { player: PublicPlayer }) {
  const badge =
    player.status === "pickup" ? "status-pickup" : player.status === "full" ? "status-full" : "status-not";
  return (
    <article className="card">
      <h3>{player.label}</h3>
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
      {player.paused ? <p className="meta">Paused. Hidden from coach search.</p> : null}
    </article>
  );
}
