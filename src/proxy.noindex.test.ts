import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

async function robots(path: string): Promise<string | null> {
  const response = await proxy(new NextRequest(`https://player-pool.net${path}`), {} as never);
  return response?.headers.get("x-robots-tag") ?? null;
}

test("public pages stay indexable and private /coach routes stay noindex", async () => {
  for (const path of ["/", "/pricing", "/privacy", "/terms", "/conduct", "/coaches", "/coaches/", "/contact"]) {
    assert.equal(await robots(path), null, path);
  }
  for (const path of ["/coach", "/coach/", "/coach/signup", "/coach/search", "/admin", "/parent", "/players/abc", "/api/players", "/sign-in", "/sign-up", "/board"]) {
    assert.equal(await robots(path), "noindex, nofollow", path);
  }
});
