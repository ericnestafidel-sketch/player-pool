import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { playerSignupOpen } from "@/lib/launch";
import { freeSpotsLeft, LAUNCH_FREE_SEASON_SPOTS, playerSignupCap } from "@/lib/pricing";
import { playerSignupStatus } from "@/lib/signup-access";

const openOriginal = process.env.PLAYER_SIGNUP_OPEN;
const capOriginal = process.env.PLAYER_SIGNUP_CAP;

afterEach(() => {
  if (openOriginal === undefined) delete process.env.PLAYER_SIGNUP_OPEN;
  else process.env.PLAYER_SIGNUP_OPEN = openOriginal;
  if (capOriginal === undefined) delete process.env.PLAYER_SIGNUP_CAP;
  else process.env.PLAYER_SIGNUP_CAP = capOriginal;
});

test("the free-season cap defaults to 100 and can be raised with PLAYER_SIGNUP_CAP", () => {
  delete process.env.PLAYER_SIGNUP_CAP;
  assert.equal(playerSignupCap(), LAUNCH_FREE_SEASON_SPOTS);
  assert.equal(freeSpotsLeft(0), 100);
  process.env.PLAYER_SIGNUP_CAP = "150";
  assert.equal(playerSignupCap(), 150);
  assert.equal(freeSpotsLeft(100), 50);
});

test("parent sign-up stays closed when the env flag is unset", async () => {
  delete process.env.PLAYER_SIGNUP_OPEN;
  assert.equal(playerSignupOpen(), false);
  assert.equal(await playerSignupStatus(), "closed");
});
