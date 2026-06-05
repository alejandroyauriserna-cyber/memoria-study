"use client";

import { Sparkles } from "lucide-react";

export function PremiumGateDismissed({
  featureTitle,
  onShowAgain,
}: {
  featureTitle: string;
  onShowAgain?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <Sparkles size={28} className="text-amber-300/70" />
      <p className="max-w-sm text-sm text-muted-foreground">
        <span className="font-semibold text-[#F5F7FA]">{featureTitle}</span> forma parte de
        MemoriaStudy Pro (imágenes con Gemini). Por ahora puedes seguir con el resto del organizador.
      </p>
      {onShowAgain ? (
        <button
          type="button"
          onClick={onShowAgain}
          className="text-xs font-semibold text-[#00FFD5] hover:underline"
        >
          Ver aviso de versión Pro de nuevo
        </button>
      ) : null}
    </div>
  );
}
