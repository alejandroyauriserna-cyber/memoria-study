"use client";

import { memo, useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import {
  POSTIT_COLORS,
  type DecorationObject,
  type PostItColor,
} from "@/lib/cuaderno/decoration-objects";
import { resolveStickerLabel, resolveStickerSrc } from "@/lib/cuaderno/sticker-resolve-src";
import { normalizedHeightForWidth } from "@/lib/cuaderno/floating-image";
import type { ResizeHandle } from "@/lib/cuaderno/decoration-resize";

const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const DECO_CHROME_SELECTOR =
  ".cn-decoration-handle, .cn-postit-colors";

function decoPropsEqual(
  prev: {
    obj: DecorationObject;
    selected: boolean;
    active: boolean;
    isDragging: boolean;
    cropping: boolean;
  },
  next: typeof prev,
) {
  if (
    prev.selected !== next.selected ||
    prev.active !== next.active ||
    prev.isDragging !== next.isDragging ||
    prev.cropping !== next.cropping ||
    prev.obj.id !== next.obj.id
  ) {
    return false;
  }
  if (prev.isDragging || next.isDragging) return true;
  const a = prev.obj;
  const b = next.obj;
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.w === b.w &&
    a.h === b.h &&
    a.rotation === b.rotation &&
    a.zIndex === b.zIndex &&
    a.locked === b.locked &&
    a.text === b.text &&
    a.textWrap === b.textWrap &&
    a.postitColor === b.postitColor &&
    a.src === b.src &&
    a.kind === b.kind
  );
}

export const CuadernoDecorationItem = memo(function CuadernoDecorationItem({
  dataDecoId,
  obj,
  selected,
  active,
  isDragging,
  cropping,
  onSelect,
  onStartDrag,
  onContextMenu,
  onPatch,
}: {
  dataDecoId: string;
  obj: DecorationObject;
  selected: boolean;
  active: boolean;
  isDragging: boolean;
  cropping: boolean;
  onSelect: (additive: boolean) => void;
  onStartDrag: (e: React.PointerEvent, mode: "move" | "rotate" | ResizeHandle, el: HTMLElement) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onPatch: (patch: Partial<DecorationObject>) => void;
}) {
  const wrap = obj.textWrap ?? "inFront";
  const isRaster = obj.kind === "image" || obj.kind === "sticker";
  const [rasterReady, setRasterReady] = useState(!isRaster);

  useEffect(() => {
    setRasterReady(!isRaster);
  }, [obj.id, obj.src, isRaster]);

  const syncImageAspect = (aspectRatio: number) => {
    if (obj.kind !== "image" && obj.kind !== "sticker") return;
    const w = obj.w || (obj.kind === "image" ? 0.32 : 0.14);
    const h = normalizedHeightForWidth(w, aspectRatio);
    if (
      Math.abs((obj.aspectRatio ?? 0) - aspectRatio) > 0.02 ||
      Math.abs(obj.h - h) > 0.008
    ) {
      onPatch({ aspectRatio, h });
    }
    setRasterReady(true);
  };

  return (
    <div
      data-deco-id={dataDecoId}
      className={`cn-decoration-item cn-decoration-${obj.kind}${selected ? " is-selected" : ""}${obj.locked ? " is-locked" : ""}${cropping ? " is-cropping" : ""}${isDragging ? " is-dragging" : ""}${wrap !== "inFront" ? ` is-wrap-${wrap}` : ""}`}
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
        if (e.button !== 0) return;
        const chrome = (e.target as HTMLElement).closest(DECO_CHROME_SELECTOR);
        if (chrome) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        const additive = e.shiftKey || e.metaKey || e.ctrlKey;
        onSelect(additive);
        if (!obj.locked) onStartDrag(e, "move", e.currentTarget);
      }}
      onContextMenu={onContextMenu}
    >
      <DecorationBody
        obj={obj}
        active={active}
        onTextChange={(text) => onPatch({ text })}
        onImageLoad={(aspectRatio) => syncImageAspect(aspectRatio)}
      />

      {selected && active && rasterReady ? (
        <>
          {!obj.locked ? (
            <>
              {RESIZE_HANDLES.map((handle) => (
                <span
                  key={handle}
                  className={`cn-decoration-handle cn-decoration-handle--${handle}`}
                  onPointerDown={(e) => {
                    const host = (e.currentTarget as HTMLElement).closest("[data-deco-id]") as HTMLElement;
                    if (host) onStartDrag(e, handle, host);
                  }}
                />
              ))}
              <span
                className="cn-decoration-handle cn-decoration-handle--rotate"
                onPointerDown={(e) => {
                  const host = (e.currentTarget as HTMLElement).closest("[data-deco-id]") as HTMLElement;
                  if (host) onStartDrag(e, "rotate", host);
                }}
                title="Rotar"
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
                  onClick={() => onPatch({ postitColor: c })}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}, decoPropsEqual);

function DecorationBody({
  obj,
  active,
  onTextChange,
  onImageLoad,
}: {
  obj: DecorationObject;
  active: boolean;
  onTextChange: (text: string) => void;
  onImageLoad?: (aspectRatio: number) => void;
}) {
  const handleImgLoad = (el: HTMLImageElement) => {
    const nw = el.naturalWidth;
    const nh = el.naturalHeight;
    if (nw > 0 && nh > 0) onImageLoad?.(nw / nh);
  };

  const imgRef = (el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) handleImgLoad(el);
  };
  if (obj.kind === "postit") {
    const c = POSTIT_COLORS[obj.postitColor ?? "yellow"];
    const cat = obj.postitCategory ? ` cn-postit--${obj.postitCategory}` : "";
    return (
      <div
        className={`cn-postit${cat}`}
        style={{ background: c.bg, borderColor: c.border }}
      >
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
      <div className="cn-floating-image-frame cn-floating-image-frame--fit">
        <img
          src={obj.src}
          alt=""
          className="cn-floating-image"
          draggable={false}
          loading="lazy"
          decoding="async"
          style={clip ? { clipPath: clip } : undefined}
          ref={imgRef}
          onLoad={(e) => handleImgLoad(e.currentTarget)}
        />
      </div>
    );
  }

  if (obj.kind === "sticker") {
    const src = resolveStickerSrc(obj);
    const alt = resolveStickerLabel(obj);
    if (src) {
      return (
        <div className="cn-sticker-img-frame">
        <img
          src={src}
          alt={alt}
          className="cn-sticker-img"
          draggable={false}
          loading="lazy"
          decoding="async"
          ref={imgRef}
          onLoad={(e) => handleImgLoad(e.currentTarget)}
        />
        </div>
      );
    }
    return <span className="cn-sticker-glyph" title={alt}>?</span>;
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
