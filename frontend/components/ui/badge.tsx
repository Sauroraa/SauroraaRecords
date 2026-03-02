import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "violet" | "gray" | "green" | "orange" | "exclusive";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  violet: "bg-violet/15 text-violet-light border border-violet-border",
  gray: "bg-white/8 text-cream/60 border border-[rgba(255,255,255,0.08)]",
  green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  orange: "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  exclusive: "bg-violet text-white border border-violet-hover shadow-violet/30 shadow-sm"
};

export function Badge({ variant = "gray", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
