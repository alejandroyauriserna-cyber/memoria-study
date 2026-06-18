"use client";

import { Settings2, Square } from "lucide-react";
import { NARRATION_STYLE_META, NARRATION_STYLES } from "@/lib/guided-study/tutor-voice/narration-style";
import type { NarrationStyle, TutorSpeechRate } from "@/types/tutor-voice";

const RATES: TutorSpeechRate[] = [1, 1.5, 2];

export function ProfessorSettingsSheet({
  open,
  style,
  rate,
  onClose,
  onStyleChange,
  onRateChange,
  onStop,
}: {
  open: boolean;
  style: NarrationStyle;
  rate: TutorSpeechRate;
  onClose: () => void;
  onStyleChange: (style: NarrationStyle) => void;
  onRateChange: (rate: TutorSpeechRate) => void;
  onStop: () => void;
}) {
  if (!open) return null;

  return (
    <div className="professor-sheet-root" role="presentation">
      <button
        type="button"
        className="professor-sheet-backdrop"
        aria-label="Cerrar ajustes"
        onClick={onClose}
      />
      <div
        className="professor-sheet professor-sheet--settings"
        role="dialog"
        aria-modal="true"
        aria-label="Ajustes de la clase"
      >
        <div className="professor-sheet__handle" aria-hidden />

        <header className="professor-sheet__header">
          <div className="professor-sheet__avatar" aria-hidden>
            <Settings2 size={20} strokeWidth={2.25} />
          </div>
          <div className="professor-sheet__header-body">
            <p className="professor-sheet__title">Ajustes de la clase</p>
            <p className="professor-sheet__subtitle">
              Profundidad y velocidad sin salir de la explicación.
            </p>
          </div>
        </header>

        <section className="professor-sheet__section" aria-labelledby="professor-depth-label">
          <p id="professor-depth-label" className="professor-sheet__kicker">
            Profundidad
          </p>
          <div className="professor-sheet__styles" role="radiogroup" aria-label="Profundidad">
            {NARRATION_STYLES.map((s) => {
              const meta = NARRATION_STYLE_META[s];
              const active = style === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`professor-ai-style-chip${active ? " is-active" : ""}`}
                  onClick={() => onStyleChange(s)}
                >
                  <strong>
                    {meta.emoji}{" "}
                    {meta.label.replace("Explicación ", "").replace("Clase ", "")}
                  </strong>
                  <small>{meta.duration}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="professor-sheet__section" aria-labelledby="professor-rate-label">
          <p id="professor-rate-label" className="professor-sheet__kicker">
            Velocidad
          </p>
          <div className="professor-sheet__rates" role="radiogroup" aria-label="Velocidad">
            {RATES.map((r) => {
              const active = rate === r;
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`professor-sheet__rate${active ? " is-active" : ""}`}
                  onClick={() => onRateChange(r)}
                >
                  {r}x
                </button>
              );
            })}
          </div>
        </section>

        <div className="professor-sheet__divider" aria-hidden />

        <button
          type="button"
          className="professor-sheet__stop"
          onClick={() => {
            onStop();
            onClose();
          }}
        >
          <Square size={14} fill="currentColor" strokeWidth={0} />
          Detener clase
        </button>
      </div>
    </div>
  );
}
