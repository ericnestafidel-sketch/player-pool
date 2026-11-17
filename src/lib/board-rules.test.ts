import assert from "node:assert/strict";
import test from "node:test";
import { canReadBoard } from "@/lib/board";
import {
  boardExpiresAt,
  boardNeedLine,
  boardNoteError,
  boardSchedule,
  needStillOpen,
  openNeedsCopy,
} from "@/lib/board-rules";
import type { Viewer } from "@/lib/viewer";

function viewer(partial: Partial<Viewer>): Viewer {
  return {
    userId: "user",
    role: null,
    coachStatus: null,
    signupIntent: null,
    emailVerified: false,
    ...partial,
  };
}

test("the public need count has no post details", () => {
  assert.equal(openNeedsCopy(0, ["IN", "IL", "OH"]), "No open needs right now — check back soon.");
  assert.equal(openNeedsCopy(3, ["IN", "IL", "OH"]), "3 open needs in IN/IL/OH right now.");
  assert.equal(openNeedsCopy(1, ["IN", "IL", "OH"]), "1 open need in IN/IL/OH right now.");
});

test("only approved coaches and verified parents can read needs", () => {
  assert.equal(canReadBoard(viewer({ role: "parent", emailVerified: true })), true);
  assert.equal(canReadBoard(viewer({ role: "parent", emailVerified: false })), false);
  assert.equal(canReadBoard(viewer({ role: "coach", coachStatus: "approved" })), true);
  assert.equal(canReadBoard(viewer({ role: "coach", coachStatus: "pending" })), false);
  assert.equal(canReadBoard(viewer({ role: "admin" })), true);
});

test("board notes reject contact details and links", () => {
  assert.equal(boardNoteError(""), null);
  assert.equal(boardNoteError("Need a catcher for two weekends."), null);
  assert.match(boardNoteError("Email me at coach@example.com") ?? "", /email/);
  assert.match(boardNoteError("Call 317-555-1212") ?? "", /phone/);
  assert.match(boardNoteError("See https://example.com/team") ?? "", /link/);
});

test("a board post expires at season end or 60 days, whichever is sooner", () => {
  const now = new Date("2026-11-22T17:00:00.000Z");
  const soon = new Date("2026-12-01T00:00:00.000Z");
  const later = new Date("2027-08-01T00:00:00.000Z");
  assert.equal(boardExpiresAt(now, soon, null).toISOString(), soon.toISOString());
  assert.equal(boardExpiresAt(now, later, null).toISOString(), new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString());
  assert.equal(boardExpiresAt(now, later, soon).toISOString(), soon.toISOString());
});

test("a need requires event dates, a player count, and a close date", () => {
  const blank = boardSchedule({
    startsOn: "2026-11-21",
    endsOn: "2026-11-22",
    closesOn: "",
    playersNeeded: "1",
    eventName: "",
  });
  assert.deepEqual(blank.errors, {});
  assert.equal(blank.closesOn, "2026-11-20");
  assert.equal(blank.playersNeeded, 1);
  const late = boardSchedule({
    startsOn: "2026-11-21",
    endsOn: "2026-11-22",
    closesOn: "2026-11-23",
    playersNeeded: "0",
    eventName: "Email coach@example.com",
  });
  assert.match(late.errors.closesOn ?? "", /after the end/);
  assert.match(late.errors.playersNeeded ?? "", /1/);
  assert.match(late.errors.eventName ?? "", /email/i);
});

test("open needs stay listed through the close date and the end date", () => {
  const during = new Date("2026-11-20T17:00:00.000Z");
  const after = new Date("2026-11-21T17:00:00.000Z");
  assert.equal(needStillOpen("2026-11-20", "2026-11-22", during), true);
  assert.equal(needStillOpen("2026-11-20", "2026-11-22", after), false);
  assert.equal(needStillOpen("2026-11-22", "2026-11-20", after), false);
});

test("the board list line has no team name", () => {
  const line = boardNeedLine({
    ageGroup: "12U",
    positions: ["P"],
    skillLevels: ["AA"],
    county: "Marion",
    state: "IN",
    eventName: null,
    startsOn: "2026-11-21",
    endsOn: "2026-11-22",
    playersNeeded: 1,
    closesOn: "2026-11-20",
  });
  assert.equal(line, "12U · P · USSSA AA · Marion County, IN · Nov 21–22 · 1 needed · closes Nov 20");
  assert.equal(line.includes("Storm"), false);
});
