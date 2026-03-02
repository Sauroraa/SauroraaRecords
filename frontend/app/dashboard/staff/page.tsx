"use client";

import { useAuthStore } from "@/store/auth-store";

export default function StaffDashboard() {
  const { user } = useAuthStore();

  if (!user || user.role !== "STAFF") {
    return <p className="text-cream">Access denied.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-cream">Staff Dashboard</h1>
      <p className="text-sm text-cream/50">
        This area will be used for content moderation and other staff tools.
      </p>
      <p className="text-cream/60">(Coming soon)</p>
    </div>
  );
}
