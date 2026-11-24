import assert from "node:assert/strict";
import test from "node:test";
import { formatLocation } from "@/lib/location";

test("locations use Co. instead of County", () => {
  assert.equal(formatLocation("Montgomery", "IN"), "Montgomery Co., IN");
  assert.equal(formatLocation("Montgomery County", "IN"), "Montgomery Co., IN");
  assert.equal(formatLocation("Marion Co.", "IN"), "Marion Co., IN");
  assert.equal(formatLocation("St. Joseph", "IN"), "St. Joseph Co., IN");
});
