import assert from "node:assert/strict";
import test from "node:test";
import { planAdminClaim } from "@/lib/admin-record";

test("an allowlisted admin replaces a stale user id with the same email", () => {
  assert.equal(
    planAdminClaim({
      userId: "user_new",
      byIdRole: null,
      emailOwnerId: "user_old_dev",
    }),
    "relink",
  );
  assert.equal(
    planAdminClaim({
      userId: "user_new",
      byIdRole: null,
      emailOwnerId: null,
    }),
    "insert",
  );
  assert.equal(
    planAdminClaim({
      userId: "user_new",
      byIdRole: "parent",
      emailOwnerId: "user_new",
    }),
    "promote",
  );
  assert.equal(
    planAdminClaim({
      userId: "user_new",
      byIdRole: "admin",
      emailOwnerId: "user_new",
    }),
    "ready",
  );
});
