import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--on-primary)]",
        dark: "bg-[var(--surface-dark)] text-[var(--on-dark)]",
        outline:
          "bg-[var(--surface-card)] text-[var(--ink)] ring-1 ring-inset ring-[var(--hairline-strong)]",
        ghost: "bg-transparent text-[var(--ink)]",
        surface: "bg-[var(--surface-card)] text-[var(--ink)]",
        muted: "bg-[var(--surface-bone)] text-[var(--ink)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4",
        icon: "h-10 w-10",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
