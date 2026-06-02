export type ConceptNodeLayout = {
  id: string;
  label: string;
  x: number;
  y: number;
};

const CANVAS_W = 1100;
const CANVAS_H = 640;

function hashLabel(label: string) {
  return label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

/** Posiciones orgánicas estables (layout libre, no grilla). */
export function layoutConceptNodes(title: string | undefined, labels: string[]): ConceptNodeLayout[] {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const baseRadius = Math.min(CANVAS_W, CANVAS_H) * 0.28;

  return labels.map((label, index) => {
    const hash = hashLabel(label);
    const golden = index * 2.399963;
    const angle = golden + (hash % 90) * (Math.PI / 180);
    const radius = baseRadius * (0.72 + (hash % 35) / 100) + (index % 3) * 18;

    return {
      id: `${label}-${index}`,
      label,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
}

export function conceptMapCenter() {
  return { x: CANVAS_W / 2, y: CANVAS_H / 2, w: CANVAS_W, h: CANVAS_H };
}

export function bezierConnector(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const c1x = x1 + dx * 0.35;
  const c1y = y1 + dy * 0.05;
  const c2x = x2 - dx * 0.35;
  const c2y = y2 - dy * 0.05;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}
