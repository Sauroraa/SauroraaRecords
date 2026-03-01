import { RevenueChart } from "@/components/revenue-chart";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <Card>
        <h1 className="text-3xl font-bold">Client Dashboard</h1>
        <p className="text-white/70">Purchases, subscriptions, secure downloads and profile settings.</p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <RevenueChart />
        <Card>
          <p className="mb-2 text-sm font-semibold text-white/70">Recent Orders</p>
          <ul className="space-y-2 text-sm text-white/75">
            <li>Neon Pulse EP - Paid - 2026-02-20</li>
            <li>Abyss Drift - Free - 2026-02-18</li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
