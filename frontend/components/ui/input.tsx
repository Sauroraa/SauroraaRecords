import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-sm border border-[rgba(255,255,255,0.1)] bg-surface2 px-4 py-2 text-sm text-cream placeholder:text-muted",
        "transition-colors focus:border-violet-border focus:outline-none focus:ring-1 focus:ring-violet/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
