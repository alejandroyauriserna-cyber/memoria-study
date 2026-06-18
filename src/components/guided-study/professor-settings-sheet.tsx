"use client";

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
      <div className="professor-sheet" role="dialog" aria-modal="true" aria-label="Ajustes de audio">
        <div className="professor-sheet__handle" aria-hidden />
        <p className="professor-sheet__title">Ajustes de la clase</p>

        <p className="professor-sheet__section-label">Profundidad</p>
        <div className="professor-sheet__pills">
          {NARRATION_STYLES.map((s) => {
            const meta = NARRATION_STYLE_META[s];
            return (
              <button
                key={s}
                type="button"
                className={`professor-sheet__pill${style === s ? " is-active" : ""}`}
                onClick={() => onStyleChange(s)}
              >
                {meta.emoji} {meta.label.replace("Explicación ", "").replace("Clase ", "")}
              </button>
            );
          })}
        </div>

        <p className="professor-sheet__section-label">Velocidad</p>
        <div className="professor-sheet__pills">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              className={`professor-sheet__pill${rate === r ? " is-active" : ""}`}
              onClick={() => onRateChange(r)}
            >
              {r}x
            </button>
          ))}
        </div>

        <button type="button" className="professor-sheet__danger" onClick={onStop}>
          Detener clase
        </button>
      </div>
    </div>
  );
}
