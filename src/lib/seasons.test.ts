import assert from "node:assert/strict";
import test from "node:test";
import { paidListingEnforced } from "@/lib/player-access";
import {
  currentSeason,
  indianaStart,
  promoFreeSeason,
  refundEligible,
  yearlyExpiresAt,
} from "@/lib/seasons";

test("Indiana season ends on the last day of the season", () => {
  assert.equal(indianaStart(2026, 6, 1).toISOString(), "2026-06-01T04:00:00.000Z");
  assert.equal(indianaStart(2026, 9, 1).toISOString(), "2026-09-01T04:00:00.000Z");
  assert.equal(indianaStart(2027, 1, 1).toISOString(), "2027-01-01T05:00:00.000Z");

  const spring = currentSeason(new Date("2026-03-15T16:00:00.000Z"));
  assert.equal(spring.seasonCode, "spring-2026");
  assert.equal(spring.expiresAt.toISOString(), "2026-06-01T04:00:00.000Z");

  const summer = currentSeason(new Date("2026-07-04T16:00:00.000Z"));
  assert.equal(summer.seasonCode, "summer-2026");
  assert.equal(summer.expiresAt.toISOString(), "2026-09-01T04:00:00.000Z");

  const fall = currentSeason(new Date("2026-11-09T15:00:00.000Z"));
  assert.equal(fall.seasonCode, "fall-winter-2026");
  assert.equal(fall.expiresAt.toISOString(), "2027-01-01T05:00:00.000Z");
  assert.equal(yearlyExpiresAt(new Date("2026-01-15T15:00:00.000Z")).toISOString(), "2027-01-01T05:00:00.000Z");
});

test("a zero total or a discount is the free-season promo", () => {
  assert.equal(promoFreeSeason(0, 0), true);
  assert.equal(promoFreeSeason(2500, 2500), true);
  assert.equal(promoFreeSeason(2500, 0), false);
});

test("refunds are only inside 15 days with no views and a real charge", () => {
  const paidAt = new Date("2026-11-01T15:00:00.000Z");
  const base = {
    paidAt,
    expiresAt: new Date("2027-01-01T05:00:00.000Z"),
    amountCents: 2500,
    paymentIntent: "pi_test",
    viewsSincePayment: 0,
    now: new Date("2026-11-10T15:00:00.000Z"),
  };
  assert.equal(refundEligible(base), true);
  assert.equal(refundEligible({ ...base, now: new Date("2026-11-17T15:00:00.000Z") }), false);
  assert.equal(refundEligible({ ...base, viewsSincePayment: 1 }), false);
  assert.equal(refundEligible({ ...base, amountCents: 0, paymentIntent: null }), false);
  assert.equal(refundEligible({ ...base, expiresAt: new Date("2026-11-09T00:00:00.000Z") }), false);
});

test("paid listings stay off unless the env flag is set", () => {
  const previous = process.env.REQUIRE_PAID_LISTING;
  delete process.env.REQUIRE_PAID_LISTING;
  assert.equal(paidListingEnforced(), false);
  process.env.REQUIRE_PAID_LISTING = "true";
  assert.equal(paidListingEnforced(), true);
  process.env.REQUIRE_PAID_LISTING = "no";
  assert.equal(paidListingEnforced(), false);
  if (previous === undefined) delete process.env.REQUIRE_PAID_LISTING;
  else process.env.REQUIRE_PAID_LISTING = previous;
});
