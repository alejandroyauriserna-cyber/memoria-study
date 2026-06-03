"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ViewportBounds } from "@/hooks/use-cuaderno-viewport";
import { isInViewportBounds, useCuadernoViewport } from "@/hooks/use-cuaderno-viewport";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import {
  duplicateDecoration,
  sortByZIndex,
  type DecorationObject,
} from "@/lib/cuaderno/decoration-objects";
import { isBehindTextWrap } from "@/lib/cuaderno/floating-image";
import {
  applyDragPreview,
  clearDragPreview,
  computeDragPatch,
  type DragMode,
} from "@/lib/cuaderno/decoration-drag-dom";
import { CuadernoDecorationItem } from "@/components/cuaderno/decoration/cuaderno-decoration-item";

export function splitDecorationsByStack(items: DecorationObject[]) {
  const behind: DecorationObject[] = [];
  const front: DecorationObject[] = [];
  for (const d of items) {
    if (isBehindTextWrap(d.textWrap)) behind.push(d);
    else front.push(d);
  }
  return {
    behind: sortByZIndex(behind),
    front: sortByZIndex(front),
  };
}

export const CuadernoDecorationLayer = memo(function CuadernoDecorationLayer({
  decorations,
  onChange,
  active,
  selectedId,
  onSelectId,
  scrollRef,
  layerRootRef,
  viewportBounds: viewportBoundsProp,
  placement = "front",
}: {
  decorations: DecorationObject[];
  onChange: (items: DecorationObject[]) => void;
  active: boolean;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  scrollRef?: React.RefObject<HTMLElement | null>;
  layerRootRef?: React.RefObject<HTMLElement | null>;
  viewportBounds?: ViewportBounds;
  placement?: "behind" | "front";
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const internalBounds = useCuadernoViewport(
    scrollRef ?? { current: null },
    layerRootRef ?? layerRef,
    0.15,
    viewportBoundsProp === undefined,
  );
  const viewportBounds = viewportBoundsProp ?? internalBounds;

  const [liveItems, setLiveItems] = useState(decorations);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [croppingId, setCroppingId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const liveRef = useRef(liveItems);
  liveRef.current = liveItems;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const dragRef = useRef<{
    id: string;
    mode: DragMode;
    startX: number;
    startY: number;
    snapshot: DecorationObject;
    el: HTMLElement;
  } | null>(null);

  const stackItems = useMemo(() => {
    const { behind, front } = splitDecorationsByStack(liveItems);
    return placement === "behind" ? behind : front;
  }, [liveItems, placement]);

  useEffect(() => {
    if (!draggingId) setLiveItems(decorations);
  }, [decorations, draggingId]);

  const commitItems = useCallback((next: DecorationObject[]) => {
    setLiveItems(next);
    onChangeRef.current(next);
  }, []);

  const debouncedTextPatch = useDebouncedCallback((id: string, text: string) => {
    const next = liveRef.current.map((d) => (d.id === id ? { ...d, text } : d));
    commitItems(next);
  }, 280);

  const patchOne = useCallback(
    (id: string, patch: Partial<DecorationObject>) => {
      if ("text" in patch && patch.text !== undefined) {
        setLiveItems((prev) => prev.map((d) => (d.id === id ? { ...d, text: patch.text } : d)));
        debouncedTextPatch(id, patch.text);
        return;
      }
      const next = liveRef.current.map((d) => (d.id === id ? { ...d, ...patch } : d));
      commitItems(next);
    },
    [commitItems, debouncedTextPatch],
  );

  const removeOne = useCallback(
    (id: string) => {
      commitItems(liveRef.current.filter((d) => d.id !== id));
      if (selectedId === id) onSelectId(null);
      if (croppingId === id) setCroppingId(null);
    },
    [commitItems, selectedId, onSelectId, croppingId],
  );

  useEffect(() => {
    if (!active || !selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input, .cn-prosemirror, .cn-postit-text")) return;
      e.preventDefault();
      removeOne(selectedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, selectedId, removeOne]);

  const findEl = (id: string) =>
    layerRef.current?.querySelector(`[data-deco-id="${id}"]`) as HTMLElement | null;

  const startDrag = (e: React.PointerEvent, obj: DecorationObject, mode: DragMode) => {
    if (!active || obj.locked || croppingId === obj.id) return;
    const el = findEl(obj.id);
    if (!el) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectId(obj.id);
    el.classList.add("is-dragging");
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id: obj.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      snapshot: { ...obj },
      el,
    };
    setDraggingId(obj.id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !layerRef.current) return;
    const rect = layerRef.current.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    applyDragPreview(
      drag.el,
      drag.snapshot,
      drag.mode,
      dx,
      dy,
      e.clientX,
      e.clientY,
      drag.startX,
      drag.startY,
      rect,
    );
  };

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !layerRef.current) {
      setDraggingId(null);
      return;
    }
    const rect = layerRef.current.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    const patch = computeDragPatch(
      drag.snapshot,
      drag.mode,
      dx,
      dy,
      e.clientX,
      e.clientY,
      drag.startX,
      drag.startY,
      rect,
    );
    clearDragPreview(drag.el);
    dragRef.current = null;
    setDraggingId(null);
    const next = liveRef.current.map((d) =>
      d.id === drag.id ? { ...d, ...patch } : d,
    );
    commitItems(next);
  };

  const zBump = useCallback((id: string, dir: "up" | "down") => {
    const items = liveRef.current;
    const maxZ = Math.max(...items.map((d) => d.zIndex), 0);
    const minZ = Math.min(...items.map((d) => d.zIndex), 0);
    commitItems(
      items.map((d) =>
        d.id === id ? { ...d, zIndex: dir === "up" ? maxZ + 1 : minZ - 1 } : d,
      ),
    );
  }, [commitItems]);

  const visibleDecorations = useMemo(() => {
    if (!scrollRef?.current) return stackItems;
    return stackItems.filter(
      (d) => d.id === selectedId || d.id === draggingId || isInViewportBounds(d, viewportBounds),
    );
  }, [stackItems, viewportBounds, selectedId, draggingId, scrollRef]);

  const ctxTarget = ctxMenu ? liveItems.find((d) => d.id === ctxMenu.id) : null;
  const closeCtx = () => setCtxMenu(null);

  const layerClass =
    placement === "behind"
      ? "cn-decoration-layer cn-decoration-layer--behind"
      : "cn-decoration-layer cn-decoration-layer--front";

  return (
    <div
      ref={layerRef}
      className={`${layerClass}${active ? " is-active" : ""}`}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {visibleDecorations.map((obj) => (
        <CuadernoDecorationItem
          key={obj.id}
          dataDecoId={obj.id}
          obj={obj}
          selected={selectedId === obj.id}
          active={active}
          isDragging={draggingId === obj.id}
          cropping={croppingId === obj.id}
          onSelect={() => onSelectId(obj.id)}
          onStartDrag={(ev, mode) => startDrag(ev, obj, mode)}
          onContextMenu={(ev) => {
            if (!active) return;
            ev.preventDefault();
            ev.stopPropagation();
            onSelectId(obj.id);
            setCtxMenu({ id: obj.id, x: ev.clientX, y: ev.clientY });
          }}
          onDuplicate={() => commitItems([...liveRef.current, duplicateDecoration(obj)])}
          onRemove={() => removeOne(obj.id)}
          onPatch={(patch) => patchOne(obj.id, patch)}
          onZBump={(dir) => zBump(obj.id, dir)}
          onStartCrop={() => {
            setCroppingId(obj.id);
            if (!obj.crop) patchOne(obj.id, { crop: { x: 0, y: 0, w: 1, h: 1 } });
          }}
        />
      ))}

      {ctxMenu && ctxTarget && active ? (
        <div
          className="cn-decoration-context-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onPointerDown={(ev) => ev.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              commitItems([...liveRef.current, duplicateDecoration(ctxTarget)]);
              closeCtx();
            }}
          >
            Duplicar
          </button>
          {ctxTarget.kind === "image" ? (
            <button
              type="button"
              onClick={() => {
                patchOne(ctxTarget.id, { rotation: ctxTarget.rotation + 90 });
                closeCtx();
              }}
            >
              Rotar 90°
            </button>
          ) : null}
          {ctxTarget.kind === "image" ? (
            <button
              type="button"
              onClick={() => {
                setCroppingId(ctxTarget.id);
                closeCtx();
              }}
            >
              Recortar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              patchOne(ctxTarget.id, { locked: !ctxTarget.locked });
              closeCtx();
            }}
          >
            {ctxTarget.locked ? "Desbloquear" : "Bloquear"}
          </button>
          <button type="button" onClick={() => { zBump(ctxTarget.id, "up"); closeCtx(); }}>
            Traer adelante
          </button>
          <button type="button" onClick={() => { zBump(ctxTarget.id, "down"); closeCtx(); }}>
            Enviar atrás
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={() => {
              removeOne(ctxTarget.id);
              closeCtx();
            }}
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </div>
  );
});
