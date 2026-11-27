import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { DEFAULT_SUPPORT_EMAIL, supportEmail } from "@/lib/legal";

const original = process.env.SUPPORT_EMAIL;

afterEach(() => {
  if (original === undefined) delete process.env.SUPPORT_EMAIL;
  else process.env.SUPPORT_EMAIL = original;
});

test("support email uses the env value when set", () => {
  process.env.SUPPORT_EMAIL = "  staff@player-pool.net ";
  assert.equal(supportEmail(), "staff@player-pool.net");
});

test("support email falls back to the public Coach Eric LLC address", () => {
  delete process.env.SUPPORT_EMAIL;
  assert.equal(supportEmail(), DEFAULT_SUPPORT_EMAIL);
  process.env.SUPPORT_EMAIL = "not-an-email";
  assert.equal(supportEmail(), DEFAULT_SUPPORT_EMAIL);
});
