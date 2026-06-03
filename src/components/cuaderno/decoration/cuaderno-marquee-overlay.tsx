"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import {
  clientToNormalized,
  decorationIntersectsRect,
  domRectIntersectsNormRect,
  groupBounds,
  normRectFromPoints,
  type NormRect,
} from "@/lib/cuaderno/canvas-selection";
import { selectTableNode } from "@/lib/cuaderno/cuaderno-table-utils";

const MARQUEE_THRESHOLD_PX = 4;

export function CuadernoMarqueeOverlay({
  active,
  paperRef,
  decorations,
  editor,
  onSelectDecorations,
  onSelectTable,
  onClearTableSelection,
  onEmptyClick,
}: {
  active: boolean;
  paperRef: React.RefObject<HTMLElement | null>;
  decorations: DecorationObject[];
  editor: Editor | null;
  onSelectDecorations: (ids: string[]) => void;
  onSelectTable: (pos: number) => void;
  onClearTableSelection: () => void;
  onEmptyClick?: () => void;
}) {
  const [marquee, setMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    paperRect: DOMRect;
    moved: boolean;
  } | null>(null);

  const finishMarquee = useCallback(
    (norm: NormRect) => {
      const ids = decorations.filter((d) => decorationIntersectsRect(d, norm)).map((d) => d.id);
      onSelectDecorations(ids);
      onClearTableSelection();

      if (editor) {
        const paper = paperRef.current?.getBoundingClientRect();
        if (paper) {
          const tables = editor.view.dom.querySelectorAll("table");
          for (const table of tables) {
            const rect = table.getBoundingClientRect();
            if (domRectIntersectsNormRect(rect, paper, norm)) {
              const pos = editor.view.posAtDOM(table, 0);
              const $pos = editor.state.doc.resolve(pos);
              for (let d = $pos.depth; d > 0; d--) {
                if ($pos.node(d).type.name === "table") {
                  selectTableNode(editor, $pos.before(d));
                  onSelectTable($pos.before(d));
                  break;
                }
              }
              break;
            }
          }
        }
      }
    },
    [decorations, editor, onSelectDecorations, onSelectTable, onClearTableSelection, paperRef],
  );

  useEffect(() => {
    if (!active) return;
    const paper = paperRef.current;
    if (!paper) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.closest(
          ".cn-decoration-item, .cn-table-chrome-layer, .cn-table-grip-layer, .cn-table-toolbar, .cn-decoration-toolbar, .cn-decoration-handle, .cn-image-wrap-bar, .cn-postit-colors, .cn-decoration-context-menu",
        )
      ) {
        return;
      }
      if (!paper.contains(t)) return;
      if (t.closest("textarea, input, .cn-postit-text")) return;

      const paperRect = paper.getBoundingClientRect();
      dragRef.current = { startX: e.clientX, startY: e.clientY, paperRect, moved: false };
      setMarquee(null);
    };

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = Math.abs(e.clientX - drag.startX);
      const dy = Math.abs(e.clientY - drag.startY);
      if (!drag.moved && dx < MARQUEE_THRESHOLD_PX && dy < MARQUEE_THRESHOLD_PX) return;
      drag.moved = true;

      const a = clientToNormalized(drag.startX, drag.startY, drag.paperRect);
      const b = clientToNormalized(e.clientX, e.clientY, drag.paperRect);
      setMarquee({
        x1: Math.min(a.x, b.x) * 100,
        y1: Math.min(a.y, b.y) * 100,
        x2: Math.max(a.x, b.x) * 100,
        y2: Math.max(a.y, b.y) * 100,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;

      if (!drag.moved) {
        setMarquee(null);
        onEmptyClick?.();
        return;
      }

      const a = clientToNormalized(drag.startX, drag.startY, drag.paperRect);
      const b = clientToNormalized(e.clientX, e.clientY, drag.paperRect);
      finishMarquee(normRectFromPoints(a.x, a.y, b.x, b.y));
      setMarquee(null);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [active, paperRef, finishMarquee, onEmptyClick]);

  if (!marquee) return null;

  return (
    <div
      className="cn-marquee-selection"
      style={{
        left: `${marquee.x1}%`,
        top: `${marquee.y1}%`,
        width: `${marquee.x2 - marquee.x1}%`,
        height: `${marquee.y2 - marquee.y1}%`,
      }}
      aria-hidden
    />
  );
}

export function CuadernoGroupSelectionBox({
  decorations,
  selectedIds,
}: {
  decorations: DecorationObject[];
  selectedIds: string[];
}) {
  if (selectedIds.length < 2) return null;
  const selected = decorations.filter((d) => selectedIds.includes(d.id));
  const bounds = groupBounds(selected);
  if (!bounds) return null;

  return (
    <div
      className="cn-group-selection-box"
      style={{
        left: `${bounds.x1 * 100}%`,
        top: `${bounds.y1 * 100}%`,
        width: `${(bounds.x2 - bounds.x1) * 100}%`,
        height: `${(bounds.y2 - bounds.y1) * 100}%`,
      }}
      aria-hidden
    />
  );
}
