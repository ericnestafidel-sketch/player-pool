import assert from "node:assert/strict";
import test from "node:test";
import { safeRedirectPath, withRedirect } from "@/lib/redirects";

test("sign-up redirects stay on known app paths", () => {
  assert.equal(safeRedirectPath("/parent"), "/parent");
  assert.equal(safeRedirectPath("/parent/player/new"), "/parent/player/new");
  assert.equal(safeRedirectPath("/coach/search/"), "/coach/search");
  assert.equal(safeRedirectPath("%2Fparent%2Finbox"), "/parent/inbox");
  assert.equal(safeRedirectPath("https://evil.example/parent"), null);
  assert.equal(safeRedirectPath("//evil.example"), null);
  assert.equal(safeRedirectPath("/parent?next=https://evil.example"), null);
  assert.equal(safeRedirectPath("/coach/messages"), null);
  assert.equal(withRedirect("/sign-up", "/parent"), "/sign-up?redirect_url=%2Fparent");
});
