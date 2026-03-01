import { HomeHero } from "@/components/home-hero";
import { RevenueChart } from "@/components/revenue-chart";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <RevenueChart />
        <Card>
          <p className="mb-2 text-sm font-semibold text-white/70">Unique Platform Concept</p>
          <p className="text-sm text-white/75">
            Each artist owns a dynamic visual universe. Each release is an interactive object. The experience is built as a premium AAA-like music platform with secure commerce and automated accounting.
          </p>
        </Card>
      </section>
    </>
  );
}
