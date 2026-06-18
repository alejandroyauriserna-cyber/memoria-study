"use client";

import { Sparkles } from "lucide-react";
import { NARRATION_MICRO_ACTION_LABELS, type NarrationMicroAction } from "@/types/tutor-voice";

const ACTIONS: NarrationMicroAction[] = [
  "example",
  "simpler",
  "casacion",
  "exam",
  "repeat_main",
];

export function ProfessorHelpSheet({
  open,
  loading,
  onClose,
  onSelect,
}: {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSelect: (action: NarrationMicroAction) => void;
}) {
  if (!open) return null;

  return (
    <div className="professor-sheet-root" role="presentation">
      <button
        type="button"
        className="professor-sheet-backdrop"
        aria-label="Cerrar ayuda"
        onClick={onClose}
      />
      <div
        className="professor-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Ayúdame a entender"
      >
        <div className="professor-sheet__handle" aria-hidden />

        <header className="professor-sheet__header">
          <div className="professor-sheet__avatar" aria-hidden>
            <Sparkles size={20} strokeWidth={2.25} />
          </div>
          <div className="professor-sheet__header-body">
            <p className="professor-sheet__title">Ayúdame a entender</p>
            <p className="professor-sheet__subtitle">
              Elige cómo quieres que el profesor te apoye en este momento.
            </p>
          </div>
        </header>

        <ul className="professor-sheet__list">
          {ACTIONS.map((action) => {
            const meta = NARRATION_MICRO_ACTION_LABELS[action];
            return (
              <li key={action}>
                <button
                  type="button"
                  className="professor-sheet__option"
                  disabled={loading}
                  onClick={() => {
                    onSelect(action);
                    onClose();
                  }}
                >
                  <span aria-hidden>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
