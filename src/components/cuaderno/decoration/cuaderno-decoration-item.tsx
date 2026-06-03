"use client";

import { memo } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Crop,
  Lock,
  RotateCw,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  duplicateDecoration,
  POSTIT_COLORS,
  type DecorationObject,
  type ImageTextWrap,
  type PostItColor,
} from "@/lib/cuaderno/decoration-objects";
import { getStickerById } from "@/lib/cuaderno/sticker-catalog";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";
import type { ResizeCorner } from "@/components/cuaderno/decoration/decoration-resize";

const CORNERS: ResizeCorner[] = ["nw", "ne", "sw", "se"];

const WRAP_LABELS: Record<ImageTextWrap, string> = {
  inline: "En línea con texto",
  square: "Cuadrado",
  tight: "Estrecho",
  inFront: "Delante del texto",
  behind: "Detrás del texto",
};

export const CuadernoDecorationItem = memo(function CuadernoDecorationItem({
  obj,
  selected,
  active,
  cropping,
  onSelect,
  onStartDrag,
  onContextMenu,
  onDuplicate,
  onRemove,
  onPatch,
  onZBump,
  onStartCrop,
}: {
  obj: DecorationObject;
  selected: boolean;
  active: boolean;
  cropping: boolean;
  onSelect: () => void;
  onStartDrag: (e: React.PointerEvent, mode: "move" | "rotate" | ResizeCorner) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onPatch: (patch: Partial<DecorationObject>) => void;
  onZBump: (dir: "up" | "down") => void;
  onStartCrop: () => void;
}) {
  const wrap = obj.textWrap ?? "inFront";

  return (
    <div
      className={`cn-decoration-item cn-decoration-${obj.kind}${selected ? " is-selected" : ""}${obj.locked ? " is-locked" : ""}${cropping ? " is-cropping" : ""}${wrap !== "inFront" ? ` is-wrap-${wrap}` : ""}`}
      style={{
        left: `${obj.x * 100}%`,
        top: `${obj.y * 100}%`,
        width: `${obj.w * 100}%`,
        height: `${obj.h * 100}%`,
        transform: `rotate(${obj.rotation}deg)`,
        zIndex: obj.zIndex,
      }}
      onPointerDown={(e) => {
        if (!active) return;
        e.stopPropagation();
        onSelect();
        if (!obj.locked) onStartDrag(e, "move");
      }}
      onContextMenu={onContextMenu}
    >
      <DecorationBody obj={obj} active={active} onTextChange={(text) => onPatch({ text })} />

      {selected && active ? (
        <>
          <div className="cn-decoration-toolbar" onPointerDown={(e) => e.stopPropagation()}>
            <button type="button" title="Duplicar" onClick={onDuplicate}>
              <Copy size={12} />
            </button>
            {obj.kind === "image" ? (
              <button
                type="button"
                title="Rotar 90°"
                onClick={() => onPatch({ rotation: obj.rotation + 90 })}
              >
                <RotateCw size={12} />
              </button>
            ) : null}
            {obj.kind === "image" ? (
              <button type="button" title="Recortar" onClick={onStartCrop}>
                <Crop size={12} />
              </button>
            ) : null}
            <button type="button" title="Adelante" onClick={() => onZBump("up")}>
              <ArrowUp size={12} />
            </button>
            <button type="button" title="Atrás" onClick={() => onZBump("down")}>
              <ArrowDown size={12} />
            </button>
            <button
              type="button"
              title={obj.locked ? "Desbloquear" : "Bloquear"}
              onClick={() => onPatch({ locked: !obj.locked })}
            >
              {obj.locked ? <Unlock size={12} /> : <Lock size={12} />}
            </button>
            <button type="button" title="Eliminar" className="is-danger" onClick={onRemove}>
              <Trash2 size={12} />
            </button>
          </div>

          {obj.kind === "image" ? (
            <div className="cn-image-wrap-bar" onPointerDown={(e) => e.stopPropagation()}>
              {(Object.keys(WRAP_LABELS) as ImageTextWrap[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={wrap === mode ? "is-on" : ""}
                  title={WRAP_LABELS[mode]}
                  onClick={() => onPatch({ textWrap: mode })}
                >
                  {mode === "inline" ? "≡" : mode === "square" ? "▢" : mode === "tight" ? "▪" : mode === "inFront" ? "▲" : "▼"}
                </button>
              ))}
            </div>
          ) : null}

          {!obj.locked ? (
            <>
              {CORNERS.map((corner) => (
                <span
                  key={corner}
                  className={`cn-decoration-handle cn-decoration-handle--${corner}`}
                  onPointerDown={(e) => onStartDrag(e, corner)}
                />
              ))}
              {obj.kind !== "image" ? (
                <span
                  className="cn-decoration-handle cn-decoration-handle--rotate"
                  onPointerDown={(e) => onStartDrag(e, "rotate")}
                >
                  <RotateCw size={10} />
                </span>
              ) : null}
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
                  onClick={() => onPatch({ postitColor: c })}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
});

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

  if (obj.kind === "image" && obj.src) {
    const crop = obj.crop;
    const clip = crop
      ? `inset(${crop.y * 100}% ${(1 - crop.x - crop.w) * 100}% ${(1 - crop.y - crop.h) * 100}% ${crop.x * 100}%)`
      : undefined;
    return (
      <div className="cn-floating-image-frame">
        <img
          src={obj.src}
          alt=""
          className="cn-floating-image"
          draggable={false}
          loading="lazy"
          decoding="async"
          style={clip ? { clipPath: clip } : undefined}
        />
      </div>
    );
  }

  if (obj.kind === "sticker") {
    const catalog = obj.stickerId ? getStickerById(obj.stickerId) : undefined;
    const src = obj.src ?? (catalog ? getStickerSvgDataUrl(catalog) : undefined);
    if (src) {
      return (
        <img
          src={src}
          alt={obj.label ?? catalog?.label ?? ""}
          className="cn-sticker-img"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
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
