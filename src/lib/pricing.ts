/** USD cents so a later Stripe Checkout session can use these amounts directly. */
export const PRICING_CURRENCY = "usd" as const;

export const SEASON_PRICE_CENTS = 2500;
export const YEARLY_PRICE_CENTS = 6000;
export const SEASONS_PER_YEAR = 3;
export const LAUNCH_FREE_SEASON_SPOTS = 25;

export const YEARLY_SAVINGS_CENTS = SEASON_PRICE_CENTS * SEASONS_PER_YEAR - YEARLY_PRICE_CENTS;

export const SEASONS = [
  { id: "spring", name: "Spring", months: "Jan to May" },
  { id: "summer", name: "Summer", months: "Jun to Aug" },
  { id: "fall-winter", name: "Fall/Winter", months: "Sep to Dec" },
] as const;

export const PLAN_FEATURES = [
  "Profile visible only to approved, verified coaches",
  "Player # instead of name, county only",
  "Highlights, stats, availability",
  "Contact through a private relay, never your email or phone",
  "Pause or delete anytime",
] as const;

export const seasonPlan = {
  id: "season",
  name: "Season",
  amountCents: SEASON_PRICE_CENTS,
  currency: PRICING_CURRENCY,
} as const;

export const yearlyPlan = {
  id: "yearly",
  name: "Yearly",
  amountCents: YEARLY_PRICE_CENTS,
  currency: PRICING_CURRENCY,
  savingsCents: YEARLY_SAVINGS_CENTS,
} as const;

export const PLANS = [seasonPlan, yearlyPlan] as const;

export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) return `$${dollars}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dollars);
}
