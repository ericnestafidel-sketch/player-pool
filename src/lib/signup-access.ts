import { playerSignupOpen } from "@/lib/launch";
import { freeSeasonSpotsRemaining } from "@/lib/stripe-billing";

export type PlayerSignupStatus = "closed" | "full" | "open";

/** Public parent listing: the env flag must be on, and a FIRST100 spot must remain. */
export async function playerSignupStatus(): Promise<PlayerSignupStatus> {
  if (!playerSignupOpen()) return "closed";
  const remaining = await freeSeasonSpotsRemaining();
  return remaining > 0 ? "open" : "full";
}

export const SIGNUP_FULL_MESSAGE = "Player sign-ups are full for now, check back soon.";
