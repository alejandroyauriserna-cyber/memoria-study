import { Crown } from "lucide-react";

export function PremiumBadge({ label = "Pro" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:bg-amber-400/12 dark:text-amber-200">
      <Crown size={10} />
      {label}
    </span>
  );
}
