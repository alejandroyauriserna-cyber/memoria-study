"use client";

import { useEffect, useState } from "react";
import {
  PROFESSOR_STYLE_LABELS,
  loadProfessorStyle,
  saveProfessorStyle,
} from "@/lib/guided-study/professor-style";
import type { ProfessorTeachingStyle } from "@/types/guided-legal-study";

const STYLES: ProfessorTeachingStyle[] = [
  "friendly",
  "university",
  "demanding",
  "defense_simulation",
];

export function ProfessorStylePicker({
  onChange,
}: {
  onChange?: (style: ProfessorTeachingStyle) => void;
}) {
  const [style, setStyle] = useState<ProfessorTeachingStyle>("university");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setStyle(loadProfessorStyle());
  }, []);

  function pick(next: ProfessorTeachingStyle) {
    setStyle(next);
    saveProfessorStyle(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div className="gs-prof-style">
      <button
        type="button"
        className="gs-prof-style-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {PROFESSOR_STYLE_LABELS[style].label}
      </button>
      {open ? (
        <ul className="gs-prof-style-menu" role="listbox">
          {STYLES.map((s) => (
            <li key={s}>
              <button
                type="button"
                role="option"
                aria-selected={s === style}
                className={s === style ? "is-active" : ""}
                onClick={() => pick(s)}
              >
                <strong>{PROFESSOR_STYLE_LABELS[s].label}</strong>
                <span>{PROFESSOR_STYLE_LABELS[s].description}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
