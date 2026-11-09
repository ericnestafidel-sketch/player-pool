import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { isAllowlistedAdminEmail, verifiedPrimaryIsAllowlisted } from "@/lib/admin-allowlist";

const original = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = original;
});

test("admin allowlist matches verified primary emails only", () => {
  process.env.ADMIN_EMAILS = " Eric@Example.com, other@playerpool.test ";
  assert.equal(isAllowlistedAdminEmail("eric@example.com"), true);
  assert.equal(isAllowlistedAdminEmail("OTHER@playerpool.test"), true);
  assert.equal(isAllowlistedAdminEmail("noteric@example.com"), false);
  assert.equal(isAllowlistedAdminEmail(""), false);
  assert.equal(
    verifiedPrimaryIsAllowlisted({
      emailAddress: "eric@example.com",
      verification: { status: "verified" },
    }),
    true,
  );
  assert.equal(
    verifiedPrimaryIsAllowlisted({
      emailAddress: "eric@example.com",
      verification: { status: "unverified" },
    }),
    false,
  );
  assert.equal(
    verifiedPrimaryIsAllowlisted({
      emailAddress: "eric@example.com",
      verification: null,
    }),
    false,
  );
  assert.equal(verifiedPrimaryIsAllowlisted(null), false);
});

test("an empty allowlist matches nobody", () => {
  delete process.env.ADMIN_EMAILS;
  assert.equal(isAllowlistedAdminEmail("eric@example.com"), false);
});
