"use client";

import type {
  HighlightCategory,
  KeyLearningItem,
  TextHighlight,
} from "@/types/guided-legal-study";
import { HIGHLIGHT_COLORS } from "@/types/guided-legal-study";

export function CompactConceptChips({
  keyLearning,
  highlights,
  examOnly,
  activeHighlightId,
  onSelect,
}: {
  keyLearning: KeyLearningItem[];
  highlights: TextHighlight[];
  examOnly?: boolean;
  activeHighlightId?: string | null;
  onSelect?: (highlightId: string) => void;
}) {
  const visibleKeys = examOnly ? keyLearning.filter((k) => k.essential) : keyLearning;
  const highlightMap = new Map(highlights.map((h) => [h.id, h]));

  if (!visibleKeys.length && !highlights.length) return null;

  return (
    <div className="gs-compact-concepts">
      <p className="gs-section-label">Conceptos de esta página</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visibleKeys.map((item) => {
          const hl = item.highlightId ? highlightMap.get(item.highlightId) : undefined;
          const colors = hl ? HIGHLIGHT_COLORS[hl.category as HighlightCategory] : HIGHLIGHT_COLORS.concepto;
          const active = item.highlightId === activeHighlightId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.highlightId && onSelect?.(item.highlightId)}
              className={`gs-concept-chip ${active ? "gs-concept-chip--active" : ""}`}
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
                color: colors.text,
              }}
            >
              <span
                className="gs-concept-chip-dot"
                style={{ backgroundColor: colors.text }}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
