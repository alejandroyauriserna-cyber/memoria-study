"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Lock,
  RotateCw,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  duplicateDecoration,
  POSTIT_COLORS,
  sortByZIndex,
  type DecorationObject,
  type PostItColor,
} from "@/lib/cuaderno/decoration-objects";
import { getStickerById } from "@/lib/cuaderno/sticker-catalog";

type DragMode = "move" | "resize" | "rotate" | null;

export function CuadernoDecorationLayer({
  decorations,
  onChange,
  active,
  selectedId,
  onSelectId,
}: {
  decorations: DecorationObject[];
  onChange: (items: DecorationObject[]) => void;
  active: boolean;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    mode: DragMode;
    startX: number;
    startY: number;
    snapshot: DecorationObject;
  } | null>(null);

  const updateOne = useCallback(
    (id: string, patch: Partial<DecorationObject>) => {
      onChange(decorations.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    },
    [decorations, onChange],
  );

  const removeOne = (id: string) => {
    onChange(decorations.filter((d) => d.id !== id));
    if (selectedId === id) onSelectId(null);
  };

  const toNorm = (clientX: number, clientY: number) => {
    const el = layerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      nx: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      ny: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    };
  };

  const onLayerPointerDown = (e: React.PointerEvent) => {
    if (e.target === layerRef.current) onSelectId(null);
  };

  const startDrag = (
    e: React.PointerEvent,
    obj: DecorationObject,
    mode: DragMode,
  ) => {
    if (!active || obj.locked || mode === null) return;
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
      updateOne(drag.id, {
        x: Math.min(0.95, Math.max(0, s.x + dx)),
        y: Math.min(0.95, Math.max(0, s.y + dy)),
      });
    } else if (drag.mode === "resize") {
      updateOne(drag.id, {
        w: Math.min(0.9, Math.max(0.06, s.w + dx)),
        h: Math.min(0.9, Math.max(0.04, s.h + dy)),
      });
    } else if (drag.mode === "rotate") {
      const cx = rect.left + (s.x + s.w / 2) * rect.width;
      const cy = rect.top + (s.y + s.h / 2) * rect.height;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const start = Math.atan2(drag.startY - cy, drag.startX - cx);
      updateOne(drag.id, { rotation: s.rotation + ((angle - start) * 180) / Math.PI });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const zBump = (id: string, dir: "up" | "down") => {
    const maxZ = Math.max(...decorations.map((d) => d.zIndex), 0);
    const minZ = Math.min(...decorations.map((d) => d.zIndex), 0);
    updateOne(id, { zIndex: dir === "up" ? maxZ + 1 : minZ - 1 });
  };

  const sorted = sortByZIndex(decorations);

  return (
    <div
      ref={layerRef}
      className={`cn-decoration-layer${active ? " is-active" : ""}`}
      onPointerDown={onLayerPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {sorted.map((obj) => {
        const selected = selectedId === obj.id;
        const style: React.CSSProperties = {
          left: `${obj.x * 100}%`,
          top: `${obj.y * 100}%`,
          width: `${obj.w * 100}%`,
          height: `${obj.h * 100}%`,
          transform: `rotate(${obj.rotation}deg)`,
          zIndex: obj.zIndex,
        };

        return (
          <div
            key={obj.id}
            className={`cn-decoration-item cn-decoration-${obj.kind}${selected ? " is-selected" : ""}${obj.locked ? " is-locked" : ""}`}
            style={style}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelectId(obj.id);
              if (!obj.locked) startDrag(e, obj, "move");
            }}
          >
            <DecorationBody obj={obj} active={active} onTextChange={(text) => updateOne(obj.id, { text })} />

            {selected && active ? (
              <>
                <div className="cn-decoration-toolbar" onPointerDown={(e) => e.stopPropagation()}>
                  <button type="button" title="Duplicar" onClick={() => onChange([...decorations, duplicateDecoration(obj)])}>
                    <Copy size={12} />
                  </button>
                  <button type="button" title="Adelante" onClick={() => zBump(obj.id, "up")}>
                    <ArrowUp size={12} />
                  </button>
                  <button type="button" title="Atrás" onClick={() => zBump(obj.id, "down")}>
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    title={obj.locked ? "Desbloquear" : "Bloquear"}
                    onClick={() => updateOne(obj.id, { locked: !obj.locked })}
                  >
                    {obj.locked ? <Unlock size={12} /> : <Lock size={12} />}
                  </button>
                  <button type="button" title="Eliminar" className="is-danger" onClick={() => removeOne(obj.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
                {!obj.locked ? (
                  <>
                    <span
                      className="cn-decoration-handle cn-decoration-handle--resize"
                      onPointerDown={(e) => startDrag(e, obj, "resize")}
                    />
                    <span
                      className="cn-decoration-handle cn-decoration-handle--rotate"
                      onPointerDown={(e) => startDrag(e, obj, "rotate")}
                    >
                      <RotateCw size={10} />
                    </span>
                  </>
                ) : null}
                {obj.kind === "postit" ? (
                  <div className="cn-postit-colors" onPointerDown={(e) => e.stopPropagation()}>
                    {(Object.keys(POSTIT_COLORS) as PostItColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={obj.postitColor === c ? "is-on" : ""}
                        style={{ background: POSTIT_COLORS[c].bg }}
                        title={POSTIT_COLORS[c].label}
                        onClick={() => updateOne(obj.id, { postitColor: c })}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DecorationBody({
  obj,
  active,
  onTextChange,
}: {
  obj: DecorationObject;
  active: boolean;
  onTextChange: (text: string) => void;
}) {
  if (obj.kind === "postit") {
    const c = POSTIT_COLORS[obj.postitColor ?? "yellow"];
    return (
      <div className="cn-postit" style={{ background: c.bg, borderColor: c.border }}>
        <textarea
          className="cn-postit-text"
          value={obj.text ?? ""}
          onChange={(e) => onTextChange(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          readOnly={!active}
          placeholder="Escribe aquí…"
        />
      </div>
    );
  }

  if (obj.kind === "sticker") {
    const catalog = obj.stickerId ? getStickerById(obj.stickerId) : undefined;
    if (obj.src) {
      return (
        <img src={obj.src} alt={obj.label ?? ""} className="cn-sticker-img" draggable={false} />
      );
    }
    return (
      <span className="cn-sticker-glyph" title={obj.label ?? catalog?.label}>
        {catalog?.glyph ?? "✨"}
      </span>
    );
  }

  if (obj.kind === "washi") {
    return <div className="cn-deco-washi" style={{ background: obj.color }} />;
  }
  if (obj.kind === "tape") {
    return <div className="cn-deco-tape" style={{ background: obj.color }} />;
  }
  if (obj.kind === "divider") {
    return <div className="cn-deco-divider" style={{ background: obj.color }} />;
  }
  if (obj.kind === "frame") {
    return <div className="cn-deco-frame" style={{ borderColor: obj.color }} />;
  }
  if (obj.kind === "arrow") {
    return <div className="cn-deco-arrow" style={{ color: obj.color }}>→</div>;
  }
  if (obj.kind === "highlight-deco") {
    return <div className="cn-deco-highlight" style={{ background: obj.color }} />;
  }

  return null;
}
