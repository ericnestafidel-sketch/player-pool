import assert from "node:assert/strict";
import test from "node:test";
import { DAILY_CONTACT_CAP, MATCHING_NEED_SUBJECT, messageError, notificationCopy } from "@/lib/message-text";
import { freeSpotsLeft, LAUNCH_FREE_SEASON_SPOTS, PROMO_CODE } from "@/lib/pricing";

test("notification email is only a notice and a link", () => {
  const note = notificationCopy("https://playerpool.example/parent/inbox/abc");
  assert.equal(note.subject, "You have a new message on Player Pool");
  assert.equal(note.text.includes("parent@example.com"), false);
  assert.equal(note.text.includes("317-555"), false);
  assert.equal(note.text.includes("Can you pitch Saturday"), false);
  assert.match(note.text, /https:\/\/playerpool\.example\/parent\/inbox\/abc/);
  assert.equal(notificationCopy(null).text, "You have a new message on Player Pool");
  const match = notificationCopy("https://player-pool.net/board", MATCHING_NEED_SUBJECT);
  assert.equal(match.subject, MATCHING_NEED_SUBJECT);
  assert.equal(match.text.includes("Storm"), false);
  assert.match(match.text, /https:\/\/player-pool\.net\/board/);
});

test("free season spots never go below zero", () => {
  assert.equal(freeSpotsLeft(0), LAUNCH_FREE_SEASON_SPOTS);
  assert.equal(freeSpotsLeft(3), 97);
  assert.equal(freeSpotsLeft(100), 0);
  assert.equal(freeSpotsLeft(140), 0);
  assert.equal(PROMO_CODE, "FIRST100");
});

test("thread messages cannot carry contact details", () => {
  assert.equal(messageError("Can you play the weekend of the 14th?"), null);
  assert.match(messageError("Email me at coach@example.com") ?? "", /email/);
  assert.match(messageError("Call 317-555-1212") ?? "", /phone/);
  assert.equal(messageError("Hi"), "Write a short message.");
  assert.equal(DAILY_CONTACT_CAP, 10);
});
