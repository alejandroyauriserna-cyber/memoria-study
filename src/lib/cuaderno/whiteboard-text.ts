import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { createFreeText } from "@/lib/cuaderno/decoration-objects";

/** Auto-grow a contentEditable block height (normalized 0–1) as text wraps. */
export function autoGrowFreeText(
  el: HTMLElement,
  currentH: number,
  onHeight: (h: number) => void,
) {
  const host = el.closest("[data-deco-id]") as HTMLElement | null;
  if (!host) return;
  const paper = host.closest(".cn-paper-layers") as HTMLElement | null;
  if (!paper) return;

  el.style.height = "auto";
  const contentH = el.scrollHeight;
  const paperH = paper.getBoundingClientRect().height;
  if (paperH < 1) return;

  const minPx = 28;
  const nextPx = Math.max(minPx, contentH + 4);
  const nextH = Math.max(currentH, nextPx / paperH);
  el.style.height = "100%";
  if (Math.abs(nextH - currentH) > 0.002) onHeight(nextH);
}

export function spawnFreeTextBelow(items: DecorationObject[], from: DecorationObject): DecorationObject[] {
  const next = createFreeText("", { x: from.x, y: Math.min(0.92, from.y + from.h + 0.02) });
  return [...items, next];
}

export function spawnFreeTextBeside(items: DecorationObject[], from: DecorationObject): DecorationObject[] {
  const next = createFreeText("", { x: Math.min(0.88, from.x + from.w + 0.02), y: from.y });
  return [...items, next];
}
