"use client";

import { useEffect, useRef } from "react";
import {
  HIGHLIGHT_COLORS,
  type HighlightCategory,
  type TextHighlight,
} from "@/types/guided-legal-study";
import { buildHighlightedSegments } from "@/lib/guided-study/highlight-text";

export function PageTextHighlighter({
  pageText,
  highlights,
  activeHighlightId,
  examOnly,
  onHighlightClick,
}: {
  pageText: string;
  highlights: TextHighlight[];
  activeHighlightId?: string | null;
  examOnly?: boolean;
  onHighlightClick?: (highlightId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visible = examOnly ? highlights.filter((h) => h.essential) : highlights;
  const segments = buildHighlightedSegments(pageText, visible);

  useEffect(() => {
    if (!activeHighlightId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-highlight-id="${activeHighlightId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeHighlightId]);

  if (!pageText.trim()) {
    return (
      <p className="gs-text-muted px-4 py-3 text-xs">
        No hay texto extraíble en esta página. Revisa el PDF visualmente.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="gs-highlight-scroll px-4 py-3 text-sm leading-7 text-foreground">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>;
        }

        const colors = HIGHLIGHT_COLORS[seg.category as HighlightCategory] ?? HIGHLIGHT_COLORS.concepto;
        const active = activeHighlightId === seg.id;

        return (
          <mark
            key={i}
            data-highlight-id={seg.id}
            role="button"
            tabIndex={0}
            onClick={() => onHighlightClick?.(seg.id)}
            onKeyDown={(e) => e.key === "Enter" && onHighlightClick?.(seg.id)}
            className="gs-highlight-mark cursor-pointer rounded px-0.5 transition"
            style={{
              backgroundColor: colors.bg,
              borderBottom: `2px solid ${colors.border}`,
              boxShadow: active ? `0 0 0 2px ${colors.border}` : undefined,
            }}
            title={colors.label}
          >
            {seg.content}
          </mark>
        );
      })}
    </div>
  );
}

export function HighlightLegend({ compact }: { compact?: boolean }) {
  const items = Object.entries(HIGHLIGHT_COLORS) as Array<
    [HighlightCategory, (typeof HIGHLIGHT_COLORS)[HighlightCategory]]
  >;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "px-4 pb-2"}`}>
      {items.map(([key, val]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: val.bg, color: val.text, border: `1px solid ${val.border}` }}
        >
          {val.label}
        </span>
      ))}
    </div>
  );
}
