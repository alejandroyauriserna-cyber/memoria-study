"use client";

import { NARRATION_STYLE_META, NARRATION_STYLES } from "@/lib/guided-study/tutor-voice/narration-style";
import type { NarrationStyle } from "@/types/tutor-voice";

export function NarrationStylePicker({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: NarrationStyle;
  onChange: (style: NarrationStyle) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`gs-narration-styles ${compact ? "gs-narration-styles--compact" : ""}`}
      role="radiogroup"
      aria-label="Estilo de explicación narrada"
    >
      {NARRATION_STYLES.map((style) => {
        const meta = NARRATION_STYLE_META[style];
        const active = value === style;
        return (
          <button
            key={style}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            className={`gs-narration-style ${active ? "is-active" : ""}`}
            onClick={() => onChange(style)}
          >
            <span className="gs-narration-style-emoji" aria-hidden>
              {meta.emoji}
            </span>
            <span className="gs-narration-style-body">
              <span className="gs-narration-style-label">{meta.label}</span>
              {!compact ? (
                <>
                  <span className="gs-narration-style-duration">{meta.duration}</span>
                  <span className="gs-narration-style-objective">{meta.objective}</span>
                </>
              ) : (
                <span className="gs-narration-style-duration">{meta.duration}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
