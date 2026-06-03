"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isInViewportBounds, useCuadernoViewport } from "@/hooks/use-cuaderno-viewport";
import {
  duplicateDecoration,
  sortByZIndex,
  type DecorationObject,
} from "@/lib/cuaderno/decoration-objects";
import { isBehindTextWrap } from "@/lib/cuaderno/floating-image";
import { CuadernoDecorationItem } from "@/components/cuaderno/decoration/cuaderno-decoration-item";
import {
  applyCornerResize,
  type ResizeCorner,
} from "@/components/cuaderno/decoration/decoration-resize";

type DragMode = "move" | "rotate" | ResizeCorner;

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

export function CuadernoDecorationLayer({
  decorations,
  onChange,
  active,
  selectedId,
  onSelectId,
  scrollRef,
  placement = "front",
  onRequestEditorFocus,
}: {
  decorations: DecorationObject[];
  onChange: (items: DecorationObject[]) => void;
  active: boolean;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  scrollRef?: React.RefObject<HTMLElement | null>;
  placement?: "behind" | "front";
  onRequestEditorFocus?: () => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const viewportBounds = useCuadernoViewport(scrollRef ?? { current: null }, layerRef, 0.15);
  const [liveItems, setLiveItems] = useState(decorations);
  const [croppingId, setCroppingId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragRef = useRef<{
    id: string;
    mode: DragMode;
    startX: number;
    startY: number;
    snapshot: DecorationObject;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<{ id: string; patch: Partial<DecorationObject> } | null>(null);

  const stackItems = useMemo(() => {
    const { behind, front } = splitDecorationsByStack(liveItems);
    return placement === "behind" ? behind : front;
  }, [liveItems, placement]);

  useEffect(() => {
    if (!dragRef.current) setLiveItems(decorations);
  }, [decorations]);

  const commitItems = useCallback(
    (next: DecorationObject[]) => {
      setLiveItems(next);
      onChange(next);
    },
    [onChange],
  );

  const patchOne = useCallback((id: string, patch: Partial<DecorationObject>) => {
    setLiveItems((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const flushDragPatch = useCallback(() => {
    if (!pendingPatchRef.current) return;
    const { id, patch } = pendingPatchRef.current;
    pendingPatchRef.current = null;
    setLiveItems((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
      return next;
    });
  }, []);

  const scheduleDragPatch = useCallback(
    (id: string, patch: Partial<DecorationObject>) => {
      pendingPatchRef.current = { id, patch };
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        flushDragPatch();
      });
    },
    [flushDragPatch],
  );

  const removeOne = useCallback(
    (id: string) => {
      const next = liveItems.filter((d) => d.id !== id);
      commitItems(next);
      if (selectedId === id) onSelectId(null);
      if (croppingId === id) setCroppingId(null);
    },
    [liveItems, commitItems, selectedId, onSelectId, croppingId],
  );

  const closeCtx = () => setCtxMenu(null);

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

  const startDrag = (e: React.PointerEvent, obj: DecorationObject, mode: DragMode) => {
    if (!active || obj.locked || croppingId === obj.id) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectId(obj.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id: obj.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      snapshot: { ...obj },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !layerRef.current) return;
    const rect = layerRef.current.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    const s = drag.snapshot;

    if (drag.mode === "move") {
      scheduleDragPatch(drag.id, {
        x: Math.min(0.95, Math.max(0, s.x + dx)),
        y: Math.min(0.95, Math.max(0, s.y + dy)),
      });
    } else if (drag.mode === "rotate") {
      const cx = rect.left + (s.x + s.w / 2) * rect.width;
      const cy = rect.top + (s.y + s.h / 2) * rect.height;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const start = Math.atan2(drag.startY - cy, drag.startX - cx);
      scheduleDragPatch(drag.id, {
        rotation: s.rotation + ((angle - start) * 180) / Math.PI,
      });
    } else {
      scheduleDragPatch(drag.id, applyCornerResize(s, drag.mode, dx, dy));
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLiveItems((prev) => {
      let next = prev;
      if (pendingPatchRef.current) {
        const { id, patch } = pendingPatchRef.current;
        next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
        pendingPatchRef.current = null;
      }
      onChange(next);
      return next;
    });
  };

  const zBump = (id: string, dir: "up" | "down") => {
    const maxZ = Math.max(...liveItems.map((d) => d.zIndex), 0);
    const minZ = Math.min(...liveItems.map((d) => d.zIndex), 0);
    const next = liveItems.map((d) =>
      d.id === id ? { ...d, zIndex: dir === "up" ? maxZ + 1 : minZ - 1 } : d,
    );
    commitItems(next);
  };

  const visibleDecorations = useMemo(() => {
    if (!scrollRef?.current) return stackItems;
    return stackItems.filter(
      (d) => d.id === selectedId || isInViewportBounds(d, viewportBounds),
    );
  }, [stackItems, viewportBounds, selectedId, scrollRef]);

  const ctxTarget = ctxMenu ? liveItems.find((d) => d.id === ctxMenu.id) : null;

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
          obj={obj}
          selected={selectedId === obj.id}
          active={active}
          cropping={croppingId === obj.id}
          onSelect={() => onSelectId(obj.id)}
          onStartDrag={(e, mode) => startDrag(e, obj, mode)}
          onContextMenu={(e) => {
            if (!active) return;
            e.preventDefault();
            e.stopPropagation();
            onSelectId(obj.id);
            setCtxMenu({ id: obj.id, x: e.clientX, y: e.clientY });
          }}
          onDuplicate={() => commitItems([...liveItems, duplicateDecoration(obj)])}
          onRemove={() => removeOne(obj.id)}
          onPatch={(patch) => {
            const next = liveItems.map((d) => (d.id === obj.id ? { ...d, ...patch } : d));
            commitItems(next);
          }}
          onZBump={(dir) => zBump(obj.id, dir)}
          onStartCrop={() => {
            setCroppingId(obj.id);
            if (!obj.crop) {
              const next = liveItems.map((d) =>
                d.id === obj.id ? { ...d, crop: { x: 0, y: 0, w: 1, h: 1 } } : d,
              );
              commitItems(next);
            }
          }}
        />
      ))}

      {ctxMenu && ctxTarget && active ? (
        <div
          className="cn-decoration-context-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              commitItems([...liveItems, duplicateDecoration(ctxTarget)]);
              closeCtx();
            }}
          >
            Duplicar
          </button>
          {ctxTarget.kind === "image" ? (
            <button
              type="button"
              onClick={() => {
                const next = liveItems.map((d) =>
                  d.id === ctxTarget.id ? { ...d, rotation: d.rotation + 90 } : d,
                );
                commitItems(next);
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
              const next = liveItems.map((d) =>
                d.id === ctxTarget.id ? { ...d, locked: !d.locked } : d,
              );
              commitItems(next);
              closeCtx();
            }}
          >
            {ctxTarget.locked ? "Desbloquear" : "Bloquear"}
          </button>
          <button
            type="button"
            onClick={() => {
              zBump(ctxTarget.id, "up");
              closeCtx();
            }}
          >
            Traer adelante
          </button>
          <button
            type="button"
            onClick={() => {
              zBump(ctxTarget.id, "down");
              closeCtx();
            }}
          >
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
}
