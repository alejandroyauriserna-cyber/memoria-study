"use client";

import { Crown, Sparkles, X } from "lucide-react";
import type { PremiumFeature } from "@/lib/billing/premium-features";
import { PremiumBadge } from "@/components/ui/premium-badge";

export function PremiumGateCard({
  feature,
  compact = false,
  onDismiss,
}: {
  feature: PremiumFeature;
  compact?: boolean;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-[rgba(7,19,26,0.6)] to-[rgba(7,19,26,0.85)] ${
        compact ? "p-4" : "p-6"
      }`}
      role="status"
      aria-live="polite"
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F5F7FA]"
          aria-label="Cerrar aviso de versión Pro"
        >
          <X size={16} />
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pr-8">
        <PremiumBadge label={feature.badge} />
        <p className="text-sm font-semibold text-[#F5F7FA]">{feature.title}</p>
      </div>
      <p className={`mt-2 text-muted-foreground ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
        {feature.description}
      </p>
      <p className={`mt-3 flex items-center gap-2 text-amber-200/90 ${compact ? "text-xs" : "text-sm"}`}>
        <Sparkles size={14} className="shrink-0" />
        Por ahora no está activo: requiere la <strong className="font-semibold">versión pagada</strong>{" "}
        (generación de imágenes con Gemini).
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Sigue usando gratis el organizador interactivo, el resumen pedagógico, el Atlas (prompt editable)
        y los mazos de estudio.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs font-medium text-amber-100/90">
          <Crown size={14} />
          MemoriaStudy Pro — próximamente
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-[rgba(255,255,255,0.1)] px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-[#F5F7FA]"
          >
            Entendido, cerrar
          </button>
        ) : null}
      </div>
    </div>
  );
}
