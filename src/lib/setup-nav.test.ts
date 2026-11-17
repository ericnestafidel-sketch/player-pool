import assert from "node:assert/strict";
import test from "node:test";
import { unfinishedSetupNav } from "@/lib/setup-nav";
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

test("unfinished setup names the next step", () => {
  assert.deepEqual(unfinishedSetupNav(viewer({ signupIntent: "coach" })), {
    href: "/coach/signup",
    label: "Finish coach application",
  });
  assert.deepEqual(unfinishedSetupNav(viewer({ signupIntent: "parent" })), {
    href: "/parent",
    label: "Finish parent setup",
  });
  assert.equal(unfinishedSetupNav(viewer({}))?.label, "Choose account type");
  assert.equal(unfinishedSetupNav(viewer({ role: "coach", coachStatus: "pending" })), null);
});
