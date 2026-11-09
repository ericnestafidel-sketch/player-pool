"use client";

import { useState } from "react";
import { startCheckout } from "@/app/(private)/parent/checkout/actions";
import { formatUsd, LAUNCH_FREE_SEASON_SPOTS, PROMO_CODE, seasonPlan, yearlyPlan } from "@/lib/pricing";
import type { SeasonOffer } from "@/lib/seasons";

export function CheckoutForm({
  players,
  offers,
  defaultPlayer,
}: {
  players: { id: string; label: string }[];
  offers: SeasonOffer[];
  defaultPlayer: string;
}) {
  const [start, setStart] = useState(offers[0]?.seasonCode ?? "");
  const [plan, setPlan] = useState<"season" | "yearly">("season");
  const offer = offers.find((item) => item.seasonCode === start) ?? offers[0];
  if (!offer) return null;
  const summary =
    plan === "season"
      ? `${offer.label} only (${offer.startsOn} – ${offer.endsOn}). ${formatUsd(seasonPlan.amountCents)}, one time.`
      : `12 months: ${offer.yearlyLabels}, through ${offer.yearlyEndsOn}. ${formatUsd(yearlyPlan.amountCents)}, one time (save ${formatUsd(yearlyPlan.savingsCents)} versus three season payments).`;
  return (
    <form action={startCheckout} className="section-card">
      <label htmlFor="playerId">Player</label>
      <select id="playerId" name="playerId" required defaultValue={defaultPlayer}>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.label}
          </option>
        ))}
      </select>
      <fieldset className="field">
        <legend>Start season</legend>
        {offers.map((item, index) => (
          <label className="check" key={item.seasonCode}>
            <input
              type="radio"
              name="startSeason"
              value={item.seasonCode}
              checked={start === item.seasonCode}
              onChange={() => setStart(item.seasonCode)}
              required
            />
            <span>
              {index === 0 ? "Current" : "Next"}: {item.label} ({item.startsOn} – {item.endsOn})
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset className="field">
        <legend>Plan</legend>
        <label className="check">
          <input
            type="radio"
            name="plan"
            value="season"
            checked={plan === "season"}
            onChange={() => setPlan("season")}
          />
          <span>This season · {formatUsd(seasonPlan.amountCents)}</span>
        </label>
        <label className="check">
          <input
            type="radio"
            name="plan"
            value="yearly"
            checked={plan === "yearly"}
            onChange={() => setPlan("yearly")}
          />
          <span>Three seasons · {formatUsd(yearlyPlan.amountCents)}</span>
        </label>
      </fieldset>
      <p className="meta">
        <b>You are paying for:</b> {summary}
      </p>
      <p className="meta">
        Season only: code {PROMO_CODE} on the Stripe page covers the first {LAUNCH_FREE_SEASON_SPOTS}{" "}
        free seasons, including the next season. A $0 checkout still turns the listing on. Yearly is
        not included. Card numbers are entered on Stripe, not here.
      </p>
      <button className="btn gold" type="submit">
        Continue to Stripe
      </button>
    </form>
  );
}
