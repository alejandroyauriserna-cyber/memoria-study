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
          ? "border-[#00FFD5] bg-[rgba(0,255,213,0.12)] text-[#F5F7FA] shadow-[0_0_16px_rgba(0,255,213,0.15)]"
          : "border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] text-muted-foreground hover:border-[rgba(0,255,213,0.28)] hover:text-[#F5F7FA]",
        className,
      )}
    >
      {children}
    </button>
  );
}
