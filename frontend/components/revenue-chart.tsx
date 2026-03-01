"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenueSeries } from "@/lib/types";
import { Card } from "./ui/card";

const data: RevenueSeries[] = [
  { month: "Oct", gross: 2800, label: 280, net: 2520 },
  { month: "Nov", gross: 3400, label: 340, net: 3060 },
  { month: "Dec", gross: 4100, label: 410, net: 3690 },
  { month: "Jan", gross: 3900, label: 390, net: 3510 },
  { month: "Feb", gross: 4600, label: 460, net: 4140 }
];

export function RevenueChart() {
  return (
    <Card className="h-[320px]">
      <p className="mb-4 text-sm font-semibold text-white/75">Monthly Revenue Split</p>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5de4ff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#5de4ff" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="net" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c2ff2a" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#c2ff2a" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
          <YAxis stroke="rgba(255,255,255,0.6)" />
          <Tooltip />
          <Area type="monotone" dataKey="gross" stroke="#5de4ff" fillOpacity={1} fill="url(#gross)" />
          <Area type="monotone" dataKey="net" stroke="#c2ff2a" fillOpacity={1} fill="url(#net)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
