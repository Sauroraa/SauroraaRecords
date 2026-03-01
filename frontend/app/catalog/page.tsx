import { CatalogGrid } from "@/components/catalog-grid";
import { Card } from "@/components/ui/card";

export default function CatalogPage() {
  return (
    <section className="space-y-4">
      <Card>
        <h1 className="text-3xl font-bold">Catalog</h1>
        <p className="text-white/70">Browse exclusive releases by Sauroraa artists.</p>
      </Card>
      <CatalogGrid />
    </section>
  );
}
