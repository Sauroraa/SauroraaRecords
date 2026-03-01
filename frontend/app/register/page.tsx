import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <section className="mx-auto w-full max-w-lg">
      <Card className="space-y-4">
        <h1 className="text-3xl font-bold">Register</h1>
        <p className="text-sm text-white/70">Create a secure account with role-based onboarding.</p>
        <input className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm" placeholder="Email" />
        <input className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm" type="password" placeholder="Password" />
        <select className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm">
          <option>CLIENT</option>
          <option>ARTIST</option>
        </select>
        <Button className="w-full">Create Account</Button>
      </Card>
    </section>
  );
}
