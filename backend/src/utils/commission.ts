import { SubscriptionPlan } from "@prisma/client";

// returns the platform commission rate (0.3 for 30%, 0.2 for 20%, etc.)
export function getPlatformCommission(plan?: SubscriptionPlan | null): number {
  switch (plan) {
    case SubscriptionPlan.ARTIST_BASIC:
      return 0.20; // 80/20
    case SubscriptionPlan.ARTIST_PRO:
      return 0.10; // 90/10
    case SubscriptionPlan.AGENCY_START:
      return 0.20; // agencies start at 80/20 by default
    case SubscriptionPlan.AGENCY_PRO:
      return 0.10; // agencies pro 90/10
    case SubscriptionPlan.ARTIST_FREE:
    default:
      return 0.30; // free artists 70/30
  }
}

// convenience for artist share
export function getArtistShare(plan?: SubscriptionPlan | null): number {
  const platform = getPlatformCommission(plan);
  return 1 - platform;
}
