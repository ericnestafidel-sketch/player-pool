import assert from "node:assert/strict";
import test from "node:test";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { PUBLIC_PATHS, siteJsonLd } from "@/lib/seo";

test("public SEO routes stay off private player and account paths", () => {
  const previous = process.env.APP_URL;
  delete process.env.APP_URL;
  const rules = robots();
  const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
  assert.deepEqual(rule?.allow, [...PUBLIC_PATHS]);
  const blocked = rule?.disallow;
  assert.ok(Array.isArray(blocked));
  for (const path of ["/admin", "/parent", "/coach", "/api", "/sign-in", "/players"]) {
    assert.ok(blocked.includes(path));
  }
  assert.equal(rules.sitemap, "https://player-pool.net/sitemap.xml");

  const urls = sitemap().map((entry) => entry.url);
  assert.deepEqual(urls, [
    "https://player-pool.net",
    "https://player-pool.net/pricing",
    "https://player-pool.net/coaches",
    "https://player-pool.net/privacy",
    "https://player-pool.net/terms",
    "https://player-pool.net/conduct",
  ]);
  assert.equal(urls.some((url) => url.includes("/players") || url.includes("/parent")), false);
  if (previous === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = previous;
});

test("organization JSON-LD has no address or phone", () => {
  const encoded = JSON.stringify(siteJsonLd("https://player-pool.net"));
  assert.match(encoded, /Coach Eric LLC/);
  assert.match(encoded, /Player Pool/);
  for (const key of ["address", "streetAddress", "telephone", "phone", "email", "postalCode"]) {
    assert.equal(encoded.toLowerCase().includes(`"${key.toLowerCase()}"`), false);
  }
});
