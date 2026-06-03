"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  eraseStrokesNearPath,
  inkStrokeStyle,
  strokeId,
  type InkPoint,
  type InkStroke,
  type InkToolSettings,
} from "@/lib/cuaderno/ink-layer";

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: InkStroke,
  w: number,
  h: number,
) {
  if (stroke.points.length < 2) return;
  const style = inkStrokeStyle(stroke.tool, stroke.width, stroke.color);
  ctx.save();
  ctx.globalCompositeOperation = style.composite;
  ctx.globalAlpha = style.globalAlpha;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.lineCap = style.lineCap;
  ctx.lineJoin = "round";

  ctx.beginPath();
  const first = stroke.points[0];
  ctx.moveTo(first.nx * w, first.ny * h);
  for (let i = 1; i < stroke.points.length; i++) {
    const p = stroke.points[i];
    const prev = stroke.points[i - 1];
    const mx = ((prev.nx + p.nx) / 2) * w;
    const my = ((prev.ny + p.ny) / 2) * h;
    ctx.quadraticCurveTo(prev.nx * w, prev.ny * h, mx, my);
  }
  const last = stroke.points[stroke.points.length - 1];
  ctx.lineTo(last.nx * w, last.ny * h);
  ctx.stroke();
  ctx.restore();
}

export function CuadernoInkCanvas({
  strokes,
  onChange,
  active,
  settings,
}: {
  strokes: InkStroke[];
  onChange: (strokes: InkStroke[]) => void;
  active: boolean;
  settings: InkToolSettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<InkPoint[]>([]);
  const drawingIdRef = useRef<string | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const s of strokes) {
      drawStroke(ctx, s, rect.width, rect.height);
    }
    const cur = drawingRef.current;
    if (cur.length >= 2 && drawingIdRef.current) {
      drawStroke(
        ctx,
        {
          id: drawingIdRef.current,
          tool: settings.tool,
          color: settings.color,
          width: settings.width,
          points: cur,
        },
        rect.width,
        rect.height,
      );
    }
  }, [strokes, settings]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redraw]);

  const toNorm = (clientX: number, clientY: number): InkPoint | null => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    return {
      nx: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      ny: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
      pressure: 0.5,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toNorm(e.clientX, e.clientY);
    if (!p) return;
    p.pressure = e.pressure > 0 ? e.pressure : 0.5;
    drawingRef.current = [p];
    drawingIdRef.current = strokeId();
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!active || !drawingIdRef.current) return;
    const p = toNorm(e.clientX, e.clientY);
    if (!p) return;
    p.pressure = e.pressure > 0 ? e.pressure : 0.5;
    const last = drawingRef.current[drawingRef.current.length - 1];
    if (last && Math.hypot(last.nx - p.nx, last.ny - p.ny) < 0.001) return;
    drawingRef.current.push(p);
    redraw();
  };

  const finishStroke = () => {
    const points = drawingRef.current;
    const id = drawingIdRef.current;
    drawingRef.current = [];
    drawingIdRef.current = null;
    if (!id || points.length < 2) return;

    if (settings.tool === "eraser") {
      onChange(eraseStrokesNearPath(strokes, points));
      return;
    }

    onChange([
      ...strokes,
      {
        id,
        tool: settings.tool,
        color: settings.color,
        width: settings.width,
        points,
      },
    ]);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!active) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    finishStroke();
    redraw();
  };

  return (
    <div
      ref={wrapRef}
      className={`cn-ink-layer${active ? " is-active" : ""}`}
      aria-hidden={!active}
    >
      <canvas
        ref={canvasRef}
        className="cn-ink-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: active ? "none" : "auto" }}
      />
    </div>
  );
}
