import {
  getDiagramTheme,
  NODE_TIER_SIZE,
  type DiagramTheme,
  type NodeTier,
} from "@/lib/organizers/visual-ai-diagram/diagram-theme";

const THEME = getDiagramTheme("light");

export const MS2026 = {
  bg: THEME.bg,
  surface: THEME.surface,
  surfaceAlt: THEME.surfaceElevated,
  border: THEME.nodeBorder,
  accent: THEME.accent,
  accentSoft: THEME.ambientGlow,
  violet: THEME.violet,
  title: THEME.foreground,
  body: THEME.foreground,
  muted: THEME.muted,
  gold: THEME.gold,
  font: THEME.font,
} as const;

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wrapText(text: string, maxChars: number, maxLines = 3) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current.slice(0, maxChars));
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    if (last && !last.endsWith("…")) lines[maxLines - 1] = `${last.slice(0, maxChars - 1)}…`;
  }
  return lines;
}

function svgDefs(theme: DiagramTheme) {
  return `
  <defs>
    <linearGradient id="canvasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgGradientStart}"/>
      <stop offset="100%" stop-color="${theme.bgGradientEnd}"/>
    </linearGradient>
    <radialGradient id="ambientGlow" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="${theme.ambientGlow}"/>
      <stop offset="55%" stop-color="transparent"/>
    </radialGradient>
    <pattern id="subtleGrid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="${theme.grid}" stroke-width="1"/>
    </pattern>
    <linearGradient id="nodeGlass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.nodeFillTop}"/>
      <stop offset="100%" stop-color="${theme.nodeFillBottom}"/>
    </linearGradient>
    <linearGradient id="nodeRootGlass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.surfaceElevated}"/>
      <stop offset="100%" stop-color="${theme.nodeFillBottom}"/>
    </linearGradient>
    <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${theme.nodeShadow}" flood-opacity="0.55"/>
      <feDropShadow dx="0" dy="1" stdDeviation="0" flood-color="rgba(255,255,255,0.65)" flood-opacity="0.35"/>
    </filter>
    <filter id="rootHalo" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="22" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="connectorGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <marker id="arrowPremium" markerWidth="11" markerHeight="11" refX="9" refY="3.5" orient="auto">
      <path d="M0,0 L9,3.5 L0,7 Z" fill="${theme.connector}"/>
    </marker>
  </defs>
  <style>
    .diagram-node { transition: transform 0.25s ease, filter 0.25s ease; transform-origin: center; }
    .diagram-node:hover { transform: translateY(-6px); }
    .diagram-connector { transition: stroke-width 0.2s ease, opacity 0.2s ease; }
    .diagram-connector:hover { stroke-width: 3.5; opacity: 1; }
  </style>`;
}

export function svgCanvasBackground(width: number, height: number, theme: DiagramTheme = THEME) {
  return `
  <rect width="${width}" height="${height}" fill="url(#canvasGrad)"/>
  <rect width="${width}" height="${height}" fill="url(#ambientGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#subtleGrid)" opacity="0.65"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="32" ry="32" fill="none" stroke="${theme.accentBorder}" stroke-width="1" opacity="0.35"/>`;
}

export function svgDoc(width: number, height: number, body: string, theme: DiagramTheme = THEME) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="visual-ai-diagram-svg">
  ${svgDefs(theme)}
  ${svgCanvasBackground(width, height, theme)}
  ${body}
</svg>`;
}

export function headerBar(title: string, subtitle: string, width: number, theme: DiagramTheme = THEME) {
  return `
  <text x="56" y="58" fill="${theme.accent}" font-family="${theme.font}" font-size="11" font-weight="700" letter-spacing="0.18em">MEMORIASTUDY · DIAGRAM ENGINE</text>
  <text x="56" y="98" fill="${theme.foreground}" font-family="${theme.font}" font-size="30" font-weight="800" letter-spacing="-0.03em">${escapeXml(title)}</text>
  <text x="56" y="128" fill="${theme.muted}" font-family="${theme.font}" font-size="14">${escapeXml(subtitle)}</text>
  <line x1="56" y1="148" x2="${width - 56}" y2="148" stroke="${theme.nodeBorder}" stroke-width="1" opacity="0.8"/>`;
}

export function footerNote(text: string, height: number, theme: DiagramTheme = THEME) {
  return `<text x="56" y="${height - 32}" fill="${theme.muted}" font-family="${theme.font}" font-size="11">${escapeXml(text)}</text>`;
}

export function premiumNode(
  x: number,
  y: number,
  label: string,
  tier: NodeTier,
  opts: { stroke?: string; icon?: string } = {},
  theme: DiagramTheme = THEME,
) {
  const spec = NODE_TIER_SIZE[tier];
  const w = spec.w;
  const h = spec.h;
  const lines = wrapText(label, spec.maxChars, tier === "tertiary" ? 2 : 3);
  const lineHeight = spec.fontSize + 5;
  const textY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2 + 4;
  const stroke = opts.stroke ?? theme.nodeBorder;
  const icon = opts.icon ?? spec.icon;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const className = tier === "root" ? "diagram-node diagram-node-root" : "diagram-node";

  const halo =
    tier === "root"
      ? `<ellipse cx="${cx}" cy="${cy}" rx="${w * 0.62}" ry="${h * 0.85}" fill="${theme.accentGlow}" opacity="0.45" filter="url(#rootHalo)"/>`
      : "";

  const textNodes = lines
    .map(
      (line, i) =>
        `<text x="${x + 44}" y="${textY + i * lineHeight}" fill="${theme.foreground}" font-family="${theme.font}" font-size="${spec.fontSize}" font-weight="${tier === "root" ? 800 : 600}">${escapeXml(line)}</text>`,
    )
    .join("");

  return `
  <g class="${className}" data-tier="${tier}">
    ${halo}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" ry="24" fill="url(#${tier === "root" ? "nodeRootGlass" : "nodeGlass"})" stroke="${stroke}" stroke-width="${tier === "root" ? 2 : 1.5}" filter="url(#nodeShadow)"/>
    <circle cx="${x + 22}" cy="${y + h / 2}" r="10" fill="${theme.ambientGlow}" stroke="${theme.accentBorder}"/>
    <text x="${x + 22}" y="${y + h / 2 + 4}" text-anchor="middle" fill="${theme.accent}" font-family="${theme.font}" font-size="10" font-weight="700">${icon}</text>
    ${textNodes}
  </g>`;
}

/** @deprecated Use premiumNode */
export function roundedBox(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  opts: { fill?: string; stroke?: string; fontSize?: number; maxChars?: number } = {},
) {
  const tier: NodeTier =
    w >= 260 ? "root" : w >= 220 ? "primary" : w >= 200 ? "secondary" : "tertiary";
  return premiumNode(x, y, label, tier, { stroke: opts.stroke });
}

export function whimsicalConnector(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label?: string,
  opts: { weight?: number; dashed?: boolean } = {},
  theme: DiagramTheme = THEME,
) {
  const dx = Math.abs(x2 - x1);
  const curve = Math.max(48, dx * 0.38);
  const c1x = x1;
  const c1y = y1 + (y2 > y1 ? curve : -curve);
  const c2x = x2;
  const c2y = y2 - (y2 > y1 ? curve : -curve);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const weight = opts.weight ?? 2.5;
  const dash = opts.dashed ? ' stroke-dasharray="7 5"' : "";
  const path = `M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;

  const labelNode = label
    ? `<g>
        <rect x="${midX - 50}" y="${midY - 14}" width="100" height="26" rx="12" fill="${theme.surfaceElevated}" stroke="${theme.nodeBorder}"/>
        <text x="${midX}" y="${midY + 4}" text-anchor="middle" fill="${theme.accent}" font-family="${theme.font}" font-size="10" font-weight="700">${escapeXml(label)}</text>
      </g>`
    : "";

  return `
  <g class="diagram-connector">
    <path d="${path}" fill="none" stroke="${theme.connectorGlow}" stroke-width="${weight + 3}" opacity="0.35" filter="url(#connectorGlow)"/>
    <path d="${path}" fill="none" stroke="${theme.connector}" stroke-width="${weight}"${dash} marker-end="url(#arrowPremium)" opacity="0.9"/>
    ${labelNode}
  </g>`;
}

/** @deprecated Use whimsicalConnector */
export function edgePath(x1: number, y1: number, x2: number, y2: number, label?: string) {
  return whimsicalConnector(x1, y1, x2, y2, label);
}

export function panelCard(
  x: number,
  y: number,
  w: number,
  h: number,
  lines: { text: string; size?: number; weight?: number; color?: string }[],
  theme: DiagramTheme = THEME,
) {
  let cursorY = y + 28;
  const textSvg = lines
    .map((line) => {
      const size = line.size ?? 12;
      const row = `<text x="${x + w / 2}" y="${cursorY}" text-anchor="middle" fill="${line.color ?? theme.foreground}" font-family="${theme.font}" font-size="${size}" font-weight="${line.weight ?? 500}">${escapeXml(line.text)}</text>`;
      cursorY += size + 10;
      return row;
    })
    .join("");

  return `
  <g class="diagram-node">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" ry="24" fill="url(#nodeGlass)" stroke="${theme.nodeBorder}" stroke-width="1.5" filter="url(#nodeShadow)"/>
    ${textSvg}
  </g>`;
}
