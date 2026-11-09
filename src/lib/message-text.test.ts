import assert from "node:assert/strict";
import test from "node:test";
import { DAILY_CONTACT_CAP, messageError, notificationCopy } from "@/lib/message-text";

test("notification email is only a notice and a link", () => {
  const note = notificationCopy("https://playerpool.example/parent/inbox/abc");
  assert.equal(note.subject, "You have a new message on Player Pool");
  assert.equal(note.text.includes("parent@example.com"), false);
  assert.equal(note.text.includes("317-555"), false);
  assert.equal(note.text.includes("Can you pitch Saturday"), false);
  assert.match(note.text, /https:\/\/playerpool\.example\/parent\/inbox\/abc/);
  assert.equal(notificationCopy(null).text, "You have a new message on Player Pool");
});

test("thread messages cannot carry contact details", () => {
  assert.equal(messageError("Can you play the weekend of the 14th?"), null);
  assert.match(messageError("Email me at coach@example.com") ?? "", /email/);
  assert.match(messageError("Call 317-555-1212") ?? "", /phone/);
  assert.equal(messageError("Hi"), "Write a short message.");
  assert.equal(DAILY_CONTACT_CAP, 10);
});
