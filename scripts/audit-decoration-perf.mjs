#!/usr/bin/env node
/**
 * Simula culling de viewport para N decoraciones.
 * node scripts/audit-decoration-perf.mjs
 */
import { performance } from "perf_hooks";

function isInViewportBounds(obj, bounds) {
  const objRight = obj.x + obj.w;
  const objBottom = obj.y + obj.h;
  return (
    objBottom >= bounds.top &&
    obj.y <= bounds.bottom &&
    objRight >= bounds.left &&
    obj.x <= bounds.right
  );
}

function filterVisible(items, bounds, selectedId, draggingId) {
  return items.filter(
    (d) => d.id === selectedId || d.id === draggingId || isInViewportBounds(d, bounds),
  );
}

const bounds = { top: 0.2, bottom: 0.55, left: 0, right: 1 };

for (const count of [100, 200, 300]) {
  const items = Array.from({ length: count }, (_, i) => ({
    id: `d${i}`,
    x: Math.random() * 0.9,
    y: Math.random() * 0.9,
    w: 0.08,
    h: 0.08,
  }));

  const t0 = performance.now();
  let visible = 0;
  for (let i = 0; i < 500; i++) {
    visible = filterVisible(items, bounds, null, null).length;
  }
  const ms = performance.now() - t0;
  console.log(
    `  ${count} items × 500 frames: ${ms.toFixed(1)}ms total, ~${(visible / count * 100).toFixed(0)}% visible in viewport`,
  );
  if (ms > 200) {
    console.warn(`    WARN: culling slow for ${count} items`);
  }
}

console.log("\nPerf simulation done (target: <200ms for 200 items × 500 iter).\n");
