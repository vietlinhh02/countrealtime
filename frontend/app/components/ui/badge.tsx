import { cn } from "@/app/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full bg-[var(--surface-bone)] px-3 text-xs font-semibold text-[var(--charcoal)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
