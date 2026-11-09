import assert from "node:assert/strict";
import test from "node:test";
import { absoluteUrl, fallbackOrigin, playerSignupOpen } from "@/lib/launch";

function withEnv(name: string, value: string | undefined, run: () => void) {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}

test("player sign-up stays closed until the flag is set", () => {
  withEnv("PLAYER_SIGNUP_OPEN", undefined, () => {
    assert.equal(playerSignupOpen(), false);
  });
  withEnv("PLAYER_SIGNUP_OPEN", "", () => {
    assert.equal(playerSignupOpen(), false);
  });
  withEnv("PLAYER_SIGNUP_OPEN", "false", () => {
    assert.equal(playerSignupOpen(), false);
  });
  withEnv("PLAYER_SIGNUP_OPEN", "true", () => {
    assert.equal(playerSignupOpen(), true);
  });
  withEnv("PLAYER_SIGNUP_OPEN", "1", () => {
    assert.equal(playerSignupOpen(), true);
  });
});

test("APP_URL is used for absolute links when it is set", () => {
  withEnv("APP_URL", "https://player-pool.net/", () => {
    withEnv("VERCEL_URL", "player-pool-preview.vercel.app", () => {
      assert.equal(
        absoluteUrl("/parent/inbox/abc", fallbackOrigin()),
        "https://player-pool.net/parent/inbox/abc",
      );
      assert.equal(
        absoluteUrl("/coach/messages/abc", "https://ignored.example"),
        "https://player-pool.net/coach/messages/abc",
      );
    });
  });
  withEnv("APP_URL", undefined, () => {
    withEnv("VERCEL_URL", "player-pool-preview.vercel.app", () => {
      assert.equal(
        absoluteUrl("/coach/messages/abc", fallbackOrigin()),
        "https://player-pool-preview.vercel.app/coach/messages/abc",
      );
    });
    assert.equal(absoluteUrl("/parent/inbox/abc", ""), null);
  });
});
