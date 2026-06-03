"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ViewportBounds } from "@/hooks/use-cuaderno-viewport";
import { useCuadernoViewport } from "@/hooks/use-cuaderno-viewport";
import {
  filterVisibleDecorations,
  shouldVirtualizeDecorations,
} from "@/lib/cuaderno/decoration-performance";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cnDebug } from "@/lib/cuaderno/cn-debug";
import {
  duplicateDecoration,
  sortByZIndex,
  type DecorationObject,
  type ImageTextWrap,
} from "@/lib/cuaderno/decoration-objects";

const IMAGE_WRAP_LABELS: Record<ImageTextWrap, string> = {
  inline: "En línea con texto",
  square: "Cuadrado",
  tight: "Estrecho",
  inFront: "Delante del texto",
  behind: "Detrás del texto",
};
import { isBehindTextWrap } from "@/lib/cuaderno/floating-image";

function decorationIdsMatch(a: DecorationObject[], b: DecorationObject[]): boolean {
  if (a.length !== b.length) return false;
  const bIds = new Set(b.map((d) => d.id));
  return a.every((d) => bIds.has(d.id));
}
import {
  applyDragPreview,
  applyDragPreviewMove,
  applyGroupDragPreviewMove,
  bakeDecorationGeometry,
  bakeDecorationPosition,
  clearDragPreview,
  computeDragPatch,
  DRAG_MOVE_THRESHOLD_PX,
  getLayerMetrics,
  grabOffsetPxFromPointer,
  type DragMode,
  type GrabOffsetPx,
  type LayerMetrics,
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
  selectedIds,
  onSelectIds,
  scrollRef,
  layerRootRef,
  viewportBounds: viewportBoundsProp,
  placement = "front",
}: {
  decorations: DecorationObject[];
  onChange: (items: DecorationObject[]) => void;
  active: boolean;
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
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
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const [liveItems, setLiveItems] = useState(decorations);
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const [croppingId, setCroppingId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const liveRef = useRef(liveItems);
  liveRef.current = liveItems;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const skipPropsSyncRef = useRef(false);
  const lastCommittedRef = useRef<DecorationObject[] | null>(null);

  const decorationPositionsMatch = useCallback((a: DecorationObject[], b: DecorationObject[]) => {
    if (a.length !== b.length) return false;
    const map = new Map(b.map((d) => [d.id, d]));
    return a.every((d) => {
      const o = map.get(d.id);
      if (!o) return false;
      return o.x === d.x && o.y === d.y && o.w === d.w && o.h === d.h;
    });
  }, []);

  const pendingMoveRef = useRef<{
    obj: DecorationObject;
    el: HTMLElement;
    startX: number;
    startY: number;
    pointerId: number;
    cleanup: () => void;
  } | null>(null);

  const dragRef = useRef<{
    ids: string[];
    mode: DragMode;
    startX: number;
    startY: number;
    snapshots: Map<string, DecorationObject>;
    elements: Map<string, HTMLElement>;
    metrics: LayerMetrics;
    grab: GrabOffsetPx;
    leadId: string;
    proportional: boolean;
    cleanup: () => void;
    raf: number | null;
    pending: PointerEvent | null;
  } | null>(null);

  const stackItems = useMemo(() => {
    const { behind, front } = splitDecorationsByStack(liveItems);
    return placement === "behind" ? behind : front;
  }, [liveItems, placement]);

  useEffect(() => {
    if (draggingIds.length > 0) return;
    if (skipPropsSyncRef.current) {
      skipPropsSyncRef.current = false;
      return;
    }
    setLiveItems((prev) => {
      const committed = lastCommittedRef.current;
      if (
        committed &&
        decorationIdsMatch(committed, decorations) &&
        decorationIdsMatch(prev, decorations) &&
        decorationPositionsMatch(committed, prev) &&
        !decorationPositionsMatch(prev, decorations)
      ) {
        return prev;
      }
      return decorations;
    });
  }, [decorations, draggingIds, decorationPositionsMatch]);

  const commitItems = useCallback((next: DecorationObject[]) => {
    lastCommittedRef.current = next;
    skipPropsSyncRef.current = true;
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

  const removeMany = useCallback(
    (ids: string[]) => {
      const drop = new Set(ids);
      commitItems(liveRef.current.filter((d) => !drop.has(d.id)));
      onSelectIds(selectedIdsRef.current.filter((id) => !drop.has(id)));
      if (croppingId && drop.has(croppingId)) setCroppingId(null);
    },
    [commitItems, onSelectIds, croppingId],
  );

  const toggleSelect = useCallback(
    (id: string, additive: boolean) => {
      if (additive) {
        const set = new Set(selectedIdsRef.current);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        onSelectIds([...set]);
      } else {
        onSelectIds([id]);
      }
    },
    [onSelectIds],
  );

  const endDrag = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        setDraggingIds([]);
        return;
      }

      const lead = drag.snapshots.get(drag.leadId);
      if (!lead) {
        drag.cleanup();
        dragRef.current = null;
        setDraggingIds([]);
        return;
      }

      const layer = layerRef.current;
      if (layer) drag.metrics = getLayerMetrics(layer);

      const dx = (e.clientX - drag.startX) / drag.metrics.width;
      const dy = (e.clientY - drag.startY) / drag.metrics.height;

      const leadPatch = computeDragPatch(
        lead,
        drag.mode,
        dx,
        dy,
        e.clientX,
        e.clientY,
        drag.startX,
        drag.startY,
        drag.metrics,
        drag.grab,
        drag.proportional,
      );

      let ddx = 0;
      let ddy = 0;
      if (drag.mode === "move") {
        ddx = (leadPatch.x ?? lead.x) - lead.x;
        ddy = (leadPatch.y ?? lead.y) - lead.y;
      }

      const moved =
        drag.mode === "move"
          ? Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) >= DRAG_MOVE_THRESHOLD_PX
          : true;

      const next = moved
        ? liveRef.current.map((d) => {
            if (!drag.ids.includes(d.id)) return d;
            const snap = drag.snapshots.get(d.id);
            if (!snap) return d;
            if (drag.mode === "move") {
              return {
                ...snap,
                x: Math.min(0.95, Math.max(0, snap.x + ddx)),
                y: Math.min(0.95, Math.max(0, snap.y + ddy)),
              };
            }
            if (d.id === drag.leadId) return { ...snap, ...leadPatch };
            return d;
          })
        : null;

      if (next) {
        for (const [id, el] of drag.elements) {
          const item = next.find((d) => d.id === id);
          if (item) {
            if (drag.mode === "move") bakeDecorationPosition(el, item);
            else bakeDecorationGeometry(el, item);
          } else {
            clearDragPreview(el, drag.mode);
          }
          el.classList.remove("is-dragging");
        }
      } else {
        for (const [, el] of drag.elements) clearDragPreview(el, drag.mode);
      }

      drag.cleanup();
      dragRef.current = null;
      setDraggingIds([]);

      if (!next) return;

      commitItems(next);
    },
    [commitItems],
  );

  const flushDragPreview = useCallback(() => {
    const drag = dragRef.current;
    if (!drag?.pending) return;
    const e = drag.pending;
    drag.pending = null;
    drag.raf = null;

    const layer = layerRef.current;
    if (layer) drag.metrics = getLayerMetrics(layer);

    const lead = drag.snapshots.get(drag.leadId);
    const leadEl = drag.elements.get(drag.leadId);
    if (!lead || !leadEl) return;

    if (drag.mode === "move") {
      if (drag.ids.length > 1) {
        const group = [...drag.elements.entries()].map(([id, el]) => ({
          el,
          snapshot: drag.snapshots.get(id)!,
        }));
        applyGroupDragPreviewMove(group, e.clientX, e.clientY, drag.metrics, drag.grab, lead);
      } else {
        applyDragPreviewMove(leadEl, lead, e.clientX, e.clientY, drag.metrics, drag.grab);
      }
      return;
    }

    const dx = (e.clientX - drag.startX) / drag.metrics.width;
    const dy = (e.clientY - drag.startY) / drag.metrics.height;
    for (const [id, el] of drag.elements) {
      const snap = drag.snapshots.get(id)!;
      applyDragPreview(
        el,
        snap,
        drag.mode,
        dx,
        dy,
        e.clientX,
        e.clientY,
        drag.startX,
        drag.startY,
        drag.metrics,
        undefined,
        drag.proportional,
      );
    }
  }, []);

  const onWinPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      drag.pending = e;
      if (drag.raf != null) return;
      drag.raf = requestAnimationFrame(flushDragPreview);
    },
    [flushDragPreview],
  );

  const cancelPendingMove = useCallback(() => {
    const p = pendingMoveRef.current;
    if (!p) return;
    p.cleanup();
    pendingMoveRef.current = null;
  }, []);

  const beginDrag = useCallback(
    (
      clientX: number,
      clientY: number,
      obj: DecorationObject,
      mode: DragMode,
      el: HTMLElement,
      shiftKey: boolean,
      pointerId?: number,
    ) => {
      if (!active || obj.locked || croppingId === obj.id) return;
      const layer = layerRef.current;
      if (!layer) return;

      const ids =
        mode === "move" && selectedSet.has(obj.id) && selectedIds.length > 1
          ? selectedIds.filter((id) => {
              const item = liveRef.current.find((d) => d.id === id);
              return item && !item.locked;
            })
          : [obj.id];

      const metrics = getLayerMetrics(layer);
      const grab = grabOffsetPxFromPointer(clientX, clientY, el);
      const snapshots = new Map<string, DecorationObject>();
      const elements = new Map<string, HTMLElement>();

      for (const id of ids) {
        const item = liveRef.current.find((d) => d.id === id);
        const node = layer.querySelector(`[data-deco-id="${id}"]`) as HTMLElement | null;
        if (!item || !node) continue;
        snapshots.set(id, { ...item });
        elements.set(id, node);
        node.classList.add("is-dragging");
      }

      if (!snapshots.has(obj.id)) return;

      if (pointerId != null) {
        try {
          el.setPointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }

      const onWinUp = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (d?.raf != null) cancelAnimationFrame(d.raf);
        endDrag(ev);
      };
      window.addEventListener("pointermove", onWinPointerMove);
      window.addEventListener("pointerup", onWinUp);
      window.addEventListener("pointercancel", onWinUp);

      const cleanup = () => {
        window.removeEventListener("pointermove", onWinPointerMove);
        window.removeEventListener("pointerup", onWinUp);
        window.removeEventListener("pointercancel", onWinUp);
        if (pointerId != null) {
          try {
            el.releasePointerCapture(pointerId);
          } catch {
            /* ignore */
          }
        }
      };

      dragRef.current = {
        ids: [...snapshots.keys()],
        mode,
        startX: clientX,
        startY: clientY,
        snapshots,
        elements,
        metrics,
        grab,
        leadId: obj.id,
        proportional: shiftKey,
        cleanup,
        raf: null,
        pending: null,
      };
      setDraggingIds([...snapshots.keys()]);
    },
    [active, croppingId, selectedSet, selectedIds, endDrag, onWinPointerMove],
  );

  const prepareMove = useCallback(
    (e: React.PointerEvent, obj: DecorationObject, el: HTMLElement) => {
      if (!active || obj.locked || croppingId === obj.id) return;
      e.stopPropagation();
      cancelPendingMove();

      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;

      const onMove = (ev: PointerEvent) => {
        const p = pendingMoveRef.current;
        if (!p || ev.pointerId !== p.pointerId) return;
        if (Math.hypot(ev.clientX - p.startX, ev.clientY - p.startY) < DRAG_MOVE_THRESHOLD_PX) return;
        cancelPendingMove();
        beginDrag(ev.clientX, ev.clientY, p.obj, "move", p.el, ev.shiftKey, ev.pointerId);
      };

      const onUp = () => cancelPendingMove();

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);

      pendingMoveRef.current = { obj, el, startX, startY, pointerId, cleanup };
    },
    [active, croppingId, cancelPendingMove, beginDrag],
  );

  const startDrag = (e: React.PointerEvent, obj: DecorationObject, mode: DragMode, el: HTMLElement) => {
    if (mode === "move") {
      prepareMove(e, obj, el);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    beginDrag(e.clientX, e.clientY, obj, mode, el, e.shiftKey, e.pointerId);
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

  const virtualize = shouldVirtualizeDecorations(stackItems.length);

  const visibleDecorations = useMemo(
    () =>
      filterVisibleDecorations(
        stackItems,
        viewportBounds,
        selectedIds,
        draggingIds,
        virtualize && !!scrollRef?.current,
      ),
    [stackItems, viewportBounds, selectedIds, draggingIds, scrollRef, virtualize],
  );

  const ctxTarget = ctxMenu ? liveItems.find((d) => d.id === ctxMenu.id) : null;
  const closeCtx = () => setCtxMenu(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(".cn-decoration-context-menu")) return;
      closeCtx();
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [ctxMenu]);

  const layerClass =
    placement === "behind"
      ? "cn-decoration-layer cn-decoration-layer--behind"
      : "cn-decoration-layer cn-decoration-layer--front";

  return (
    <div ref={layerRef} className={`${layerClass}${active ? " is-active" : ""}`}>
      {visibleDecorations.map((obj) => (
        <CuadernoDecorationItem
          key={obj.id}
          dataDecoId={obj.id}
          obj={obj}
          selected={selectedSet.has(obj.id)}
          active={active}
          isDragging={draggingIds.includes(obj.id)}
          cropping={croppingId === obj.id}
          onSelect={(additive) => toggleSelect(obj.id, additive)}
          onStartDrag={(ev, mode, el) => startDrag(ev, obj, mode, el)}
          onContextMenu={(ev) => {
            if (!active) return;
            ev.preventDefault();
            ev.stopPropagation();
            if (!selectedSet.has(obj.id)) onSelectIds([obj.id]);
            setCtxMenu({ id: obj.id, x: ev.clientX, y: ev.clientY });
          }}
          onPatch={(patch) => patchOne(obj.id, patch)}
        />
      ))}

      {ctxMenu && ctxTarget && active && typeof document !== "undefined"
        ? createPortal(
            <div
              className="cn-decoration-context-menu"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
              role="menu"
              onPointerDown={(ev) => ev.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={() => {
                  commitItems([...liveRef.current, duplicateDecoration(ctxTarget)]);
                  closeCtx();
                }}
              >
                Duplicar
              </button>
              {ctxTarget.kind === "image" || ctxTarget.kind === "sticker" ? (
                <button
                  type="button"
                  role="menuitem"
                  onPointerDown={(ev) => ev.stopPropagation()}
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
                  role="menuitem"
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={() => {
                    setCroppingId(ctxTarget.id);
                    if (!ctxTarget.crop) {
                      patchOne(ctxTarget.id, { crop: { x: 0, y: 0, w: 1, h: 1 } });
                    }
                    closeCtx();
                  }}
                >
                  Recortar
                </button>
              ) : null}
              {ctxTarget.kind === "image" ? (
                <>
                  <div className="cn-decoration-context-menu-sep" role="separator" />
                  <span className="cn-decoration-context-menu-label">Texto alrededor</span>
                  {(Object.keys(IMAGE_WRAP_LABELS) as ImageTextWrap[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="menuitem"
                      className={(ctxTarget.textWrap ?? "inFront") === mode ? "is-on" : ""}
                      onPointerDown={(ev) => ev.stopPropagation()}
                      onClick={() => {
                        patchOne(ctxTarget.id, { textWrap: mode });
                        closeCtx();
                      }}
                    >
                      {IMAGE_WRAP_LABELS[mode]}
                    </button>
                  ))}
                </>
              ) : null}
              <div className="cn-decoration-context-menu-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={() => {
                  patchOne(ctxTarget.id, { locked: !ctxTarget.locked });
                  closeCtx();
                }}
              >
                {ctxTarget.locked ? "Desbloquear" : "Bloquear"}
              </button>
              <button
                type="button"
                role="menuitem"
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={() => {
                  zBump(ctxTarget.id, "up");
                  closeCtx();
                }}
              >
                Traer adelante
              </button>
              <button
                type="button"
                role="menuitem"
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={() => {
                  zBump(ctxTarget.id, "down");
                  closeCtx();
                }}
              >
                Enviar atrás
              </button>
              <button
                type="button"
                role="menuitem"
                className="is-danger"
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={() => {
                  removeMany(
                    selectedIdsRef.current.length > 1 && selectedSet.has(ctxTarget.id)
                      ? selectedIdsRef.current
                      : [ctxTarget.id],
                  );
                  closeCtx();
                }}
              >
                Eliminar
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
});
