"use client";

import { useState } from "react";
import { Brain, Loader2, Shield, Sparkles, Target, X } from "lucide-react";
import {
  activateAcademicTrustSources,
  dismissAcademicTrustBanner,
} from "@/lib/legal-sources/academic-trust";

const BENEFITS = [
  { icon: Target, label: "Explicaciones más precisas" },
  { icon: Shield, label: "Mejor respaldo académico" },
  { icon: Brain, label: "Mayor profundidad conceptual" },
  { icon: Sparkles, label: "Más confianza al estudiar temas complejos" },
] as const;

export function AcademicTrustBanner({ onChange }: { onChange?: () => void }) {
  const [activating, setActivating] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  function handleDismiss() {
    dismissAcademicTrustBanner();
    setVisible(false);
    onChange?.();
  }

  async function handleActivate() {
    setActivating(true);
    try {
      await activateAcademicTrustSources();
      setVisible(false);
      onChange?.();
    } finally {
      setActivating(false);
    }
  }

  return (
    <section
      className="ms-academic-banner mb-5"
      aria-label="Recomendación académica: fuentes verificadas"
    >
      <button
        type="button"
        className="ms-academic-banner__close"
        onClick={handleDismiss}
        aria-label="Cerrar recomendación"
      >
        <X size={16} />
      </button>

      <span className="ms-academic-badge">
        <Brain size={14} />
        Tutor IA · Fuentes verificadas
      </span>

      <h2 className="ms-academic-title">
        <span className="ms-academic-title-gradient">Potencia tus explicaciones</span>
      </h2>

      <p className="ms-academic-description">
        Activa las fuentes para que el Tutor IA complemente sus análisis con información
        actualizada y referencias verificadas.
      </p>

      <ul className="ms-academic-benefits">
        {BENEFITS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="ms-academic-benefit">
              <span className="ms-academic-benefit-icon" aria-hidden>
                <Icon size={16} />
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>

      <div className="ms-academic-actions">
        <button
          type="button"
          className="ms-academic-btn-primary inline-flex items-center justify-center gap-2"
          onClick={() => void handleActivate()}
          disabled={activating}
        >
          {activating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Activando…
            </>
          ) : (
            "Activar fuentes"
          )}
        </button>
        <button
          type="button"
          className="ms-academic-btn-secondary"
          onClick={handleDismiss}
          disabled={activating}
        >
          Ahora no
        </button>
      </div>

      <p className="ms-academic-footnote">
        Las fuentes permiten complementar el material de estudio con información actualizada
        cuando sea necesario.
        <br />
        <strong>No reemplazan tu PDF. Lo fortalecen.</strong>
      </p>
    </section>
  );
}
