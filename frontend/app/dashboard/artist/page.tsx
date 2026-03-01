import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevenueChart } from "@/components/revenue-chart";

export default function ArtistDashboardPage() {
  return (
    <section className="space-y-4">
      <Card>
        <h1 className="text-3xl font-bold">Artist Dashboard</h1>
        <p className="text-white/70">Upload releases, monitor sales, and download monthly invoices.</p>
      </Card>
      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white/70">Upload New Release</p>
        <input className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm" placeholder="Release title" />
        <div className="rounded-xl border border-dashed border-white/30 p-6 text-sm text-white/60">Drag and drop audio file here (MP3/WAV)</div>
        <Button>Publish Release</Button>
      </Card>
      <RevenueChart />
    </section>
  );
}
