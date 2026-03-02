"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-sm text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-light/60 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default: "bg-violet text-white hover:bg-violet-hover shadow-violet/20 shadow-sm",
        ghost: "bg-transparent text-cream/70 hover:text-cream hover:bg-white/5",
        outline: "border border-[rgba(255,255,255,0.12)] bg-white/4 text-cream/80 hover:bg-white/8 hover:text-cream hover:border-violet-border",
        destructive: "bg-red-600/80 text-white hover:bg-red-600",
        link: "text-violet-light underline-offset-4 hover:underline p-0 h-auto"
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs rounded-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
