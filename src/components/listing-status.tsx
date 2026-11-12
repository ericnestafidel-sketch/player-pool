import Link from "next/link";
import { requestRefund } from "@/app/(private)/parent/checkout/actions";
import { PlayerSignupClosedButton } from "@/components/player-signup-gate";
import { paidListingEnforced } from "@/lib/player-access";
import { formatViewedDate } from "@/lib/player-rules";
import type { PlayerListing } from "@/lib/stripe-billing";

function endLabel(expiresAt: Date): string {
  return formatViewedDate(new Date(expiresAt.getTime() - 60_000));
}

export function ListingStatus({
  playerId,
  listing,
  canPay = true,
}: {
  playerId: string;
  listing: PlayerListing | null;
  canPay?: boolean;
}) {
  const enforced = paidListingEnforced();
  const active = Boolean(listing?.active);
  const renew = canPay ? (
    <Link className="btn navy btn-sm" href={`/parent/checkout?player=${playerId}`}>
      {active ? "Renew" : "Pay to list"}
    </Link>
  ) : (
    <PlayerSignupClosedButton />
  );
  return (
    <div className="roster-actions">
      {active && listing?.expiresAt ? (
        <p className="meta">
          {listing.promoFreeSeason ? "Free first season. " : ""}
          {listing.seasonLabel ? `${listing.seasonLabel}. ` : ""}
          Listed through {endLabel(listing.expiresAt)}
          {listing.plan === "yearly" ? " (yearly)" : ""}.
        </p>
      ) : listing?.expiresAt ? (
        <p className="meta">
          Listing ended {endLabel(listing.expiresAt)}.
          {enforced ? " Coaches cannot see this player until you renew." : ""}
        </p>
      ) : (
        <p className="meta">
          {enforced
            ? "Hidden from coach search until this listing is paid."
            : "No payment yet. Coach search is not requiring payment until launch."}
        </p>
      )}
      {renew}
      {listing?.refundable && listing.subscriptionId ? (
        <form action={requestRefund}>
          <input type="hidden" name="subscriptionId" value={listing.subscriptionId} />
          <button className="btn btn-outline btn-sm" type="submit">
            Request refund
          </button>
        </form>
      ) : null}
    </div>
  );
}
