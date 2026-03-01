import { CheckoutButton } from "@/components/checkout-button";
import { Card } from "@/components/ui/card";

export default function ShopPage() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card>
        <h1 className="mb-2 text-3xl font-bold">Shop</h1>
        <p className="mb-4 text-white/70">Secure Stripe checkout for premium releases and bundles.</p>
        <CheckoutButton releaseId="premium-bundle-2026" />
      </Card>
      <Card>
        <p className="mb-2 text-sm font-semibold text-white/70">Business Rules</p>
        <ul className="space-y-2 text-sm text-white/75">
          <li>Artist revenue: 90%</li>
          <li>Label commission: 10%</li>
          <li>Automatic monthly invoice generation</li>
          <li>Secure download unlocked after payment validation</li>
        </ul>
      </Card>
    </section>
  );
}
