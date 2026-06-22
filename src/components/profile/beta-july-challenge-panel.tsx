"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Gift, Sparkles, Trophy } from "lucide-react";
import type { BetaJulyChallengeStatus } from "@/lib/beta/july-challenge";
import { formatBetaChallengeDate, BETA_JULY_END, BETA_JULY_START } from "@/lib/beta/july-challenge";
import { formatRankingHours } from "@/lib/ranking/study-league";
import { AiCredentialsPanel } from "@/components/profile/ai-credentials-panel";

function formatBonusHours(ms: number) {
  return formatRankingHours(ms);
}

export function BetaJulyChallengePanel() {
  const [status, setStatus] = useState<BetaJulyChallengeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/beta/july-challenge");
      const json = (await res.json()) as BetaJulyChallengeStatus & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "No se pudo cargar el reto.");
      setStatus(json);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al cargar el reto.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section id="reto-julio" className="beta-july-panel">
        <p className="beta-july-panel__empty">Cargando reto beta…</p>
      </section>
    );
  }

  if (error || !status) {
    return (
      <section id="reto-julio" className="beta-july-panel">
        <p className="beta-july-panel__error">{error ?? "Reto no disponible."}</p>
      </section>
    );
  }

  const statusLabel = status.active
    ? "En curso"
    : status.upcoming
      ? "Próximamente"
      : "Finalizado";

  return (
    <section id="reto-julio" className="beta-july-panel">
      <header className="beta-july-panel__head">
        <div>
          <p className="beta-july-panel__kicker">
            <Trophy size={14} />
            Reto Beta Julio
          </p>
          <h2 className="beta-july-panel__title">S/ {status.prizeAmountPen} al campeón de estudio</h2>
          <p className="beta-july-panel__subtitle">
            Del {formatBetaChallengeDate(BETA_JULY_START)} al{" "}
            {formatBetaChallengeDate(new Date(BETA_JULY_END.getTime() - 1))}. El premio en soles va por{" "}
            <strong>horas reales</strong> (mín. {status.prizeMinHours} h). Conectar tu IA suma hasta{" "}
            {status.bonusMaxHours} h bonus en el ranking.
          </p>
        </div>
        <span className={`beta-july-panel__badge beta-july-panel__badge--${status.active ? "live" : status.upcoming ? "soon" : "done"}`}>
          {statusLabel}
        </span>
      </header>

      <div className="beta-july-panel__stats">
        <div className="beta-july-panel__stat">
          <span className="beta-july-panel__stat-label">Horas reales (premio)</span>
          <strong>{formatRankingHours(status.realStudyMs)}</strong>
          {status.prizeEligible ? (
            <span className="beta-july-panel__eligible">Elegible para S/ {status.prizeAmountPen}</span>
          ) : (
            <span className="beta-july-panel__hint">
              Faltan {formatRankingHours(Math.max(0, status.prizeMinHours * 60 * 60 * 1000 - status.realStudyMs))} reales
            </span>
          )}
        </div>
        <div className="beta-july-panel__stat">
          <span className="beta-july-panel__stat-label">Bonus IA</span>
          <strong>{formatRankingHours(status.bonusStudyMs)}</strong>
        </div>
        <div className="beta-july-panel__stat beta-july-panel__stat--accent">
          <span className="beta-july-panel__stat-label">Total ranking</span>
          <strong>{formatRankingHours(status.displayStudyMs)}</strong>
        </div>
      </div>

      <div className="beta-july-panel__steps">
        <p className="beta-july-panel__steps-title">
          <Gift size={14} />
          Horas bonus por conectar tu IA
        </p>
        <ol className="beta-july-panel__steps-list">
          {status.steps.map((step) => (
            <li key={step.id} className={step.completed ? "is-done" : ""}>
              {step.completed ? (
                <CheckCircle2 size={18} className="beta-july-panel__step-icon is-done" />
              ) : (
                <Circle size={18} className="beta-july-panel__step-icon" />
              )}
              <div>
                <p className="beta-july-panel__step-label">
                  {step.label}{" "}
                  <span className="beta-july-panel__step-bonus">+{formatBonusHours(step.bonusMs)}</span>
                </p>
                <p className="beta-july-panel__step-desc">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <AiCredentialsPanel
        geminiConnected={status.geminiConnected}
        hfConnected={status.hfConnected}
        onUpdated={() => void load()}
      />

      <p className="beta-july-panel__footnote">
        <Sparkles size={12} />
        Tu ChatGPT Plus no se conecta aquí: usa API keys gratis (Gemini AI Studio, Hugging Face). Las claves se
        guardan cifradas y solo las usas tú.
      </p>
    </section>
  );
}
