"use client";

import { CheckCircle2, Target } from "lucide-react";
import type { KeyLearningItem } from "@/types/guided-legal-study";

export function KeyLearningPanel({
  items,
  examOnly,
  activeHighlightId,
  onItemClick,
}: {
  items: KeyLearningItem[];
  examOnly?: boolean;
  activeHighlightId?: string | null;
  onItemClick?: (item: KeyLearningItem) => void;
}) {
  const visible = examOnly ? items.filter((i) => i.essential) : items;

  if (!visible.length) return null;

  return (
    <aside className="gs-key-panel">
      <p className="gs-section-label">
        <Target size={12} />
        Lo que debes aprender de esta página
      </p>
      <ul className="mt-2 space-y-1">
        {visible.map((item) => {
          const active = item.highlightId && item.highlightId === activeHighlightId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onItemClick?.(item)}
                className={`gs-key-item ${active ? "gs-key-item--active" : ""}`}
              >
                <CheckCircle2 size={14} className="shrink-0 text-accent" />
                <span>{item.label}</span>
                {item.essential ? (
                  <span className="gs-badge-exam">Examen</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
