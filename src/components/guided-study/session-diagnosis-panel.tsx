"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import { computeSessionDiagnosis } from "@/lib/guided-study/session-diagnosis";
import type { GuidedStudySession } from "@/types/guided-legal-study";

export function SessionDiagnosisPanel({
  session,
  onClose,
  onEndSession,
}: {
  session: GuidedStudySession | null;
  onClose: () => void;
  onEndSession?: () => void;
}) {
  const diagnosis = computeSessionDiagnosis(session);
  if (!diagnosis) return null;

  return (
    <div className="gs-diagnosis-overlay" role="dialog" aria-label="Diagnóstico de comprensión">
      <div className="gs-diagnosis-panel">
        <header className="gs-diagnosis-head">
          <h3>Diagnóstico de la sesión</h3>
          <button type="button" className="gs-diagnosis-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <p className="gs-diagnosis-summary">{diagnosis.summary}</p>

        {diagnosis.strengths.length ? (
          <section className="gs-diagnosis-section is-ok">
            <p className="gs-diagnosis-label">
              <Check size={14} /> Fortalezas
            </p>
            <ul>
              {diagnosis.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {diagnosis.weaknesses.length ? (
          <section className="gs-diagnosis-section is-warn">
            <p className="gs-diagnosis-label">
              <X size={14} /> Debilidades
            </p>
            <ul>
              {diagnosis.weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {diagnosis.forgetRisk.length ? (
          <section className="gs-diagnosis-section is-risk">
            <p className="gs-diagnosis-label">
              <AlertTriangle size={14} /> Riesgo de olvido
            </p>
            <ul>
              {diagnosis.forgetRisk.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="gs-diagnosis-actions">
          {onEndSession ? (
            <button type="button" className="gs-diagnosis-btn" onClick={onEndSession}>
              Finalizar sesión
            </button>
          ) : null}
          <button type="button" className="gs-diagnosis-btn gs-diagnosis-btn--ghost" onClick={onClose}>
            Seguir estudiando
          </button>
        </div>
      </div>
    </div>
  );
}
