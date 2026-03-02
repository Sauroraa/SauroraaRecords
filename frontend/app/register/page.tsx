"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

type Role = "CLIENT" | "ARTIST";

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await register(email, password, role);
      toast.success("Account created! Welcome to Sauroraa.");
      router.push(role === "ARTIST" ? "/dashboard/artist" : "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <section className="mx-auto w-full max-w-sm pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-cream">Create account</h1>
        <p className="mt-1.5 text-sm text-muted">Join the Sauroraa platform</p>
      </div>

      <Card className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">Password</label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">Account type</label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="CLIENT">Fan / Listener</option>
              <option value="ARTIST">Artist</option>
            </Select>
          </div>

          {role === "ARTIST" && (
            <div className="rounded-sm border border-violet-border bg-violet/8 p-3 text-xs text-cream/60">
              Artist accounts can upload releases, dubpacks, and configure download gates.
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-cream/50">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-light hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </section>
  );
}
