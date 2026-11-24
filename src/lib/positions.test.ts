import assert from "node:assert/strict";
import test from "node:test";
import { formatPosition, formatPositionOption, formatPositions } from "@/lib/positions";

test("positions use standard baseball abbreviations", () => {
  const labels = [
    ["Pitcher", "P"],
    ["Catcher", "C"],
    ["First base", "1B"],
    ["Second base", "2B"],
    ["Third base", "3B"],
    ["Shortstop", "SS"],
    ["Left field", "LF"],
    ["Center field", "CF"],
    ["Right field", "RF"],
    ["Outfield", "OF"],
    ["Infield", "IF"],
    ["Utility", "UT"],
    ["Designated hitter", "DH"],
  ];
  for (const [label, abbr] of labels) {
    assert.equal(formatPosition(label), abbr);
  }
});

test("form options show the abbreviation and the full name", () => {
  assert.equal(formatPositionOption("First base"), "1B (First base)");
  assert.equal(formatPositionOption("Pitcher"), "P (Pitcher)");
  assert.equal(formatPositionOption("P"), "P");
  assert.equal(formatPositionOption("Utility"), "UT (Utility)");
});

test("position lists join abbreviations", () => {
  assert.equal(formatPositions(["Pitcher", "Catcher", "First base", "Utility"]), "P, C, 1B, UT");
});
