/**
 * Idempotent Stripe catalog setup. Run with STRIPE_SECRET_KEY set:
 *   npm run stripe:setup
 * Creates the season and yearly one-time prices, a 100% coupon limited to the
 * season product, and promotion code FIRST25 (max 25 redemptions).
 */
import Stripe from "stripe";

const SEASON_LOOKUP = "player_pool_season";
const YEARLY_LOOKUP = "player_pool_yearly";
const COUPON_ID = "player_pool_first25";
const PROMO_CODE = "FIRST25";

async function upsertProduct(stripe: Stripe, plan: "season" | "yearly", name: string) {
  const existing = await stripe.products.list({ active: true, limit: 100 });
  const found = existing.data.find((product) => product.metadata.player_pool_plan === plan);
  if (found) {
    console.log(`product ${plan}: ${found.id}`);
    return found;
  }
  const created = await stripe.products.create({
    name,
    metadata: { player_pool_plan: plan },
  });
  console.log(`created product ${plan}: ${created.id}`);
  return created;
}

async function upsertPrice(stripe: Stripe, productId: string, lookup: string, cents: number) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const found = prices.data.find((price) => price.lookup_key === lookup && price.unit_amount === cents);
  if (found) {
    console.log(`price ${lookup}: ${found.id}`);
    return found;
  }
  const created = await stripe.prices.create({
    product: productId,
    unit_amount: cents,
    currency: "usd",
    lookup_key: lookup,
    transfer_lookup_key: true,
  });
  console.log(`created price ${lookup}: ${created.id}`);
  return created;
}

async function upsertCoupon(stripe: Stripe, seasonProductId: string) {
  try {
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    console.log(`coupon: ${existing.id}`);
    return existing;
  } catch {
    const created = await stripe.coupons.create({
      id: COUPON_ID,
      name: "First 25 seasons free",
      percent_off: 100,
      duration: "once",
      max_redemptions: 25,
      applies_to: { products: [seasonProductId] },
    });
    console.log(`created coupon: ${created.id}`);
    return created;
  }
}

async function upsertPromo(stripe: Stripe, couponId: string) {
  const existing = await stripe.promotionCodes.list({ code: PROMO_CODE, limit: 1 });
  const found = existing.data[0];
  if (found) {
    console.log(`promotion code ${PROMO_CODE}: ${found.id}`);
    return found;
  }
  const created = await stripe.promotionCodes.create({
    code: PROMO_CODE,
    max_redemptions: 25,
    promotion: { type: "coupon", coupon: couponId },
    metadata: { player_pool_plan: "season" },
  });
  console.log(`created promotion code ${PROMO_CODE}: ${created.id}`);
  return created;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Set STRIPE_SECRET_KEY, then run npm run stripe:setup.");
    process.exit(1);
  }
  const stripe = new Stripe(key);
  const season = await upsertProduct(stripe, "season", "Player Pool season");
  const yearly = await upsertProduct(stripe, "yearly", "Player Pool yearly");
  await upsertPrice(stripe, season.id, SEASON_LOOKUP, 2500);
  await upsertPrice(stripe, yearly.id, YEARLY_LOOKUP, 6000);
  const coupon = await upsertCoupon(stripe, season.id);
  await upsertPromo(stripe, coupon.id);
  console.log("Stripe catalog is ready. Checkout finds prices by lookup key. No card data is stored.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Stripe setup failed.");
  process.exit(1);
});
