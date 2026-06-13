"use client";

import { cn } from "@/lib/utils";

export function SelectionGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function SelectionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ms-selection-card border rounded-lg px-3.5 py-2 text-left text-sm font-medium transition-all duration-200",
        selected
          ? "border-accent bg-accent/12 text-foreground shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
          : "border-border bg-muted/35 text-muted-foreground hover:border-accent/30 hover:bg-muted/50 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
