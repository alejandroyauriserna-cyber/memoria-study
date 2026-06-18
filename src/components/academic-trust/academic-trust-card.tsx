"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpenCheck,
  Check,
  Loader2,
  Scale,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import {
  ACADEMIC_TRUST_CHANGE_EVENT,
  activateAcademicTrustSources,
  hasAcademicSourcesActivated,
} from "@/lib/legal-sources/academic-trust";
import { loadLegalSourcesSettings } from "@/lib/legal-sources/storage";

const BENEFITS = [
  { icon: Target, label: "Mayor precisión conceptual" },
  { icon: Shield, label: "Mejor fundamentación académica" },
  { icon: BookOpenCheck, label: "Más profundidad en temas complejos" },
  { icon: Sparkles, label: "Más confianza al estudiar" },
] as const;

export function AcademicTrustCard() {
  const [sourcesActive, setSourcesActive] = useState(false);
  const [activating, setActivating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setSourcesActive(hasAcademicSourcesActivated(loadLegalSourcesSettings()));
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);

    function onChange() {
      refresh();
    }

    window.addEventListener(ACADEMIC_TRUST_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(ACADEMIC_TRUST_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  async function handleActivate() {
    setActivating(true);
    try {
      await activateAcademicTrustSources();
      refresh();
    } finally {
      setActivating(false);
    }
  }

  if (!hydrated) return null;

  return (
    <section
      className={`ms-academic-card${sourcesActive ? " ms-academic-card--active" : ""}`}
      aria-label="Fuentes verificadas del Tutor IA"
    >
      {sourcesActive ? (
        <div className="ms-academic-card__active">
          <div className="ms-academic-card__active-head">
            <span className="ms-academic-card__status-icon" aria-hidden>
              <Check size={18} strokeWidth={2.75} />
            </span>
            <div>
              <p className="ms-academic-card__status-title">Fuentes académicas activas</p>
              <p className="ms-academic-card__status-copy">
                Tus explicaciones pueden complementarse con información actualizada y referencias
                verificadas cuando sea necesario.
              </p>
            </div>
          </div>
          <Link href="/fuentes-juridicas" className="ms-academic-btn-secondary ms-academic-card__link-btn">
            Configurar fuentes
          </Link>
        </div>
      ) : (
        <>
          <span className="ms-academic-badge">
            <Scale size={13} strokeWidth={2.25} />
            Academic Intelligence
          </span>

          <h2 className="ms-academic-title">Explicaciones respaldadas por fuentes verificadas</h2>

          <p className="ms-academic-description">
            Cuando el contexto lo requiere, el Tutor IA puede complementar sus respuestas con
            información actualizada y referencias verificadas para fortalecer el análisis académico.
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
              className="ms-academic-btn-primary"
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
            <Link href="/fuentes-juridicas" className="ms-academic-btn-secondary">
              Más información
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
