import { Card } from "@/components/ui/card";
import { CatalogGrid } from "@/components/catalog-grid";

export default function ArtistPage({ params }: { params: { slug: string } }) {
  return (
    <section className="space-y-4">
      <Card>
        <h1 className="text-3xl font-bold">Artist Universe: {params.slug}</h1>
        <p className="text-white/70">Immersive profile, visual identity and full release discography.</p>
      </Card>
      <CatalogGrid />
    </section>
  );
}
