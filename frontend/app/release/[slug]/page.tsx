import { CheckoutButton } from "@/components/checkout-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReleasePage({ params }: { params: { slug: string } }) {
  return (
    <section className="space-y-4">
      <Card className="space-y-3">
        <h1 className="text-3xl font-bold">Release: {params.slug}</h1>
        <p className="text-white/70">Interactive audio object with premium visuals and secure monetization.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/catalog">Back To Catalog</Link>
          </Button>
          <CheckoutButton releaseId={params.slug} />
        </div>
      </Card>
    </section>
  );
}
