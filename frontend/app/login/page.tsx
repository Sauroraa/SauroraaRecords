import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <section className="mx-auto w-full max-w-lg">
      <Card className="space-y-4">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-sm text-white/70">Access client, artist, or admin dashboard with JWT authentication.</p>
        <input className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm" placeholder="Email" />
        <input className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm" type="password" placeholder="Password" />
        <Button className="w-full">Sign In</Button>
      </Card>
    </section>
  );
}
