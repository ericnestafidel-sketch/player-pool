import assert from "node:assert/strict";
import test from "node:test";
import { paidListingEnforced } from "@/lib/player-access";
import {
  assertNoContactFields,
  calendarYear,
  filtersFromParams,
  highlightUrlError,
  isSaturdayDate,
  normalizeCounty,
  parsePlayerForm,
  privateTextError,
  upcomingWeekends,
  weekendInRange,
  type SportConfig,
} from "@/lib/player-rules";

const baseball: SportConfig = {
  slug: "baseball",
  label: "Baseball",
  ageLabels: ["10U", "12U"],
  levelLabels: ["Major", "AA"],
  positionLabels: ["Pitcher", "Catcher"],
};

const now = new Date("2026-11-09T15:00:00Z");

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) data.append(key, item);
    } else {
      data.set(key, value);
    }
  }
  return data;
}

test("paid listings stay off until the launch flag is set", () => {
  const previous = process.env.REQUIRE_PAID_LISTING;
  delete process.env.REQUIRE_PAID_LISTING;
  assert.equal(paidListingEnforced(), false);
  if (previous === undefined) delete process.env.REQUIRE_PAID_LISTING;
  else process.env.REQUIRE_PAID_LISTING = previous;
});

test("weekends start on the coming Saturday in Indiana", () => {
  assert.deepEqual(upcomingWeekends(2, now), ["2026-11-14", "2026-11-21"]);
  assert.equal(calendarYear(now), 2026);
  assert.equal(isSaturdayDate("2026-11-14"), true);
  assert.equal(isSaturdayDate("2026-11-15"), false);
  assert.equal(isSaturdayDate("2026-02-31"), false);
  assert.equal(weekendInRange("2026-11-14", now), true);
  assert.equal(weekendInRange("2020-01-04", now), false);
});

test("highlight links are YouTube or Hudl only", () => {
  assert.equal(highlightUrlError("https://youtu.be/abc123"), null);
  assert.equal(highlightUrlError("https://www.youtube.com/watch?v=abc"), null);
  assert.equal(highlightUrlError("https://www.hudl.com/video/1"), null);
  assert.equal(highlightUrlError("https://vimeo.com/1"), "Use a YouTube or Hudl link. Other sites are not accepted.");
  assert.equal(highlightUrlError("https://notyoutube.com/watch"), "Use a YouTube or Hudl link. Other sites are not accepted.");
  assert.equal(highlightUrlError("javascript:alert(1)"), "Enter a YouTube or Hudl link.");
});

test("free text rejects email, phone, and street address", () => {
  assert.equal(privateTextError("Loves to pitch and will drive", "The note"), null);
  assert.match(privateTextError("me@example.com", "The note") ?? "", /email/);
  assert.match(privateTextError("Call 317-555-1212", "The note") ?? "", /phone/);
  assert.match(privateTextError("123 Main Street", "The note") ?? "", /address/);
  assert.equal(normalizeCounty("St. Joseph County"), "St. Joseph");
  assert.equal(privateTextError("St. Joseph", "The note"), null);
});

test("contact fields cannot ride along on a public payload", () => {
  assert.doesNotThrow(() => assertNoContactFields({ label: "Player #100", state: "IN" }));
  assert.throws(() => assertNoContactFields({ email: "a@b.com" }));
  assert.throws(() => assertNoContactFields({ coach: { phone: "317" } }));
});

test("a player form accepts state and county and rejects a name-shaped stat", () => {
  const goodData = form({
    sport: "baseball",
    birthYear: "2015",
    ageGroup: "12U",
    positions: ["Pitcher"],
    skillLevel: "AA",
    state: "IN",
    county: "Montgomery County",
    status: "pickup",
    note: "Right-handed pitcher",
    "weekend:2026-11-14": "avail",
  });
  goodData.append("statName", "Batting average");
  goodData.append("statValue", "");
  goodData.append("statName", "ERA");
  goodData.append("statValue", "3.20");
  const good = parsePlayerForm(goodData, [baseball], now);
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.equal(good.value.county, "Montgomery");
    assert.deepEqual(good.value.weekends, [{ weekendStart: "2026-11-14", state: "avail" }]);
    assert.deepEqual(good.value.stats, [{ name: "ERA", value: "3.20" }]);
  }

  const leaked = parsePlayerForm(
    form({
      sport: "baseball",
      birthYear: "2015",
      ageGroup: "12U",
      positions: ["Pitcher"],
      skillLevel: "AA",
      state: "IN",
      county: "123 Main Street",
      status: "full",
      statName: "email",
      statValue: "parent@example.com",
    }),
    [baseball],
    now,
  );
  assert.equal(leaked.ok, false);
  if (!leaked.ok) {
    assert.ok(leaked.fieldErrors.county);
    assert.ok(leaked.fieldErrors.stats);
  }
});

test("search filters keep only known labels", () => {
  const filters = filtersFromParams(
    {
      age: "12U",
      position: "Shortstop",
      level: "AA",
      state: "in",
      county: "Marion",
      weekend: "2026-11-14",
      status: "pickup",
      email: "hidden@example.com",
    },
    baseball,
    now,
  );
  assert.equal(filters.ageGroup, "12U");
  assert.equal(filters.position, "");
  assert.equal(filters.state, "IN");
  assert.equal(filters.status, "pickup");
  assert.equal("email" in filters, false);
});
