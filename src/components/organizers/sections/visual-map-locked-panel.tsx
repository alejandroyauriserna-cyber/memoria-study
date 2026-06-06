"use client";

import { Crown, Lock, Palette, Sparkles } from "lucide-react";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { getPremiumFeature } from "@/lib/billing/premium-features";

const VISUAL_MAP_FEATURE = getPremiumFeature("gemini-visual-map");

export function VisualMapLockedPanel({
  onOpenAtlas,
}: {
  onOpenAtlas: () => void;
}) {
  return (
    <div className="visual-map-locked-panel organizer-studio-panel">
      <div className="visual-map-locked-panel__icon" aria-hidden>
        <Lock size={28} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <PremiumBadge label={VISUAL_MAP_FEATURE.badge} />
        <span className="org-panel-kicker text-xs font-bold uppercase tracking-wider">
          Prestación Gemini Image
        </span>
      </div>

      <div className="visual-map-locked-panel__card space-y-3 text-left">
        <h3 className="org-panel-title text-lg font-bold">{VISUAL_MAP_FEATURE.title}</h3>
        <p className="org-panel-text-muted text-sm leading-relaxed">
          Generar mapas visuales con imágenes IA directamente dentro de MemoriaStudy es una
          prestación <strong>premium de Gemini</strong> (de pago). Por eso no está disponible
          aquí como generación automática en la web.
        </p>
        <p className="org-panel-text text-sm leading-relaxed">
          La alternativa incluida es <strong>Atlas IA</strong>: prompts jurídicos optimizados para
          que copies el atlas en Gemini y obtengas un resultado profesional (infografía, mapa
          mental, línea del tiempo, etc.).
        </p>
        <ul className="org-panel-text-muted space-y-2 text-sm leading-relaxed">
          <li className="flex gap-2">
            <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-400" />
            Prompts listos según nivel académico y tipo de atlas
          </li>
          <li className="flex gap-2">
            <Palette size={15} className="mt-0.5 shrink-0 text-amber-400" />
            Personalización, rúbrica y botón directo a Gemini
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenAtlas}
          className="tron-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
        >
          <Palette size={16} />
          Abrir Atlas IA
        </button>
        <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-100/90">
          <Crown size={14} />
          Mapa visual directo — MemoriaStudy Pro
        </div>
      </div>
    </div>
  );
}
