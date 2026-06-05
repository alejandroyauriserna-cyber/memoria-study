import { Crown, Sparkles } from "lucide-react";
import type { PremiumFeature } from "@/lib/billing/premium-features";
import { PremiumBadge } from "@/components/ui/premium-badge";

export function PremiumGateCard({
  feature,
  compact = false,
}: {
  feature: PremiumFeature;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-[rgba(7,19,26,0.6)] to-[rgba(7,19,26,0.85)] ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PremiumBadge label={feature.badge} />
        <p className="text-sm font-semibold text-[#F5F7FA]">{feature.title}</p>
      </div>
      <p className={`mt-2 text-muted-foreground ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
        {feature.description}
      </p>
      <p className={`mt-3 flex items-center gap-2 text-amber-200/90 ${compact ? "text-xs" : "text-sm"}`}>
        <Sparkles size={14} className="shrink-0" />
        Disponible próximamente en la <strong className="font-semibold">versión pagada</strong> para
        compañeros de la UNT.
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Mientras tanto puedes usar el organizador interactivo, resumen pedagógico y mazos de estudio sin costo.
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs font-medium text-amber-100/90">
        <Crown size={14} />
        Lista de espera — te avisaremos cuando abra MemoriaStudy Pro
      </div>
    </div>
  );
}
