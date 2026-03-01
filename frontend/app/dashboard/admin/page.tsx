import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <section className="space-y-4">
      <Card>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-white/70">Users management, releases moderation, commissions and manual invoicing.</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs text-white/60">Pending Releases</p>
          <p className="text-2xl font-semibold text-[#c2ff2a]">6</p>
        </Card>
        <Card>
          <p className="text-xs text-white/60">Total Users</p>
          <p className="text-2xl font-semibold text-[#5de4ff]">342</p>
        </Card>
        <Card>
          <p className="text-xs text-white/60">Label Revenue</p>
          <p className="text-2xl font-semibold">€12,940</p>
        </Card>
      </div>
      <Card className="flex gap-3">
        <Button>Generate Invoice Batch</Button>
        <Button variant="outline">Adjust Commission</Button>
      </Card>
    </section>
  );
}
