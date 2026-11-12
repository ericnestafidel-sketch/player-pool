import assert from "node:assert/strict";
import test from "node:test";
import { boardExpiresAt, boardNoteError } from "@/lib/board-rules";

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
