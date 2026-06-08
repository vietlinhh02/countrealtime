"use client";

import { cn } from "@/app/lib/utils";

type DialogProps = {
  children: React.ReactNode;
  isOpen: boolean;
};

type DialogContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function Dialog({ children, isOpen }: DialogProps) {
  if (!isOpen) {
    return null;
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-[2px]">{children}</div>;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={cn("animate-sheet-in w-full max-w-md rounded-2xl bg-[var(--surface-card)] p-5", className)}>
      {children}
    </div>
  );
}
