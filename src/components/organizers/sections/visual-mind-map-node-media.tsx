"use client";

import {
  isValidMindMapImage,
  resolveThematicIcon,
  type ThematicIcon,
} from "@/lib/organizers/visual-mind-map-icons";
import { themeForCategory } from "@/lib/organizers/visual-mind-map-theme";
import type { VisualMindMapNode } from "@/lib/organizers/visual-mind-map-types";

export function NodeThumbnail({
  node,
  height,
  iconSize,
  className = "",
}: {
  node: VisualMindMapNode;
  height: number;
  iconSize: number;
  className?: string;
}) {
  const theme = themeForCategory(node.category);
  const thematic: ThematicIcon = resolveThematicIcon(node.label, node.category, node.icon);
  const emoji = node.emoji?.trim() || thematic.emoji;
  const hasImage = isValidMindMapImage(node.imageUrl);

  if (hasImage) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl ${className}`}
        style={{ height, background: theme.gradient }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.imageUrl!}
          alt={node.label}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: `inset 0 0 0 1px ${theme.color}44` }}
        />
      </div>
    );
  }

  const Icon = thematic.lucide;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{
        height,
        background: theme.gradient,
        boxShadow: `inset 0 0 0 1px ${theme.color}55, 0 4px 16px ${theme.glow.replace(/[\d.]+\)$/, "0.18)")}`,
      }}
    >
      <span
        className="absolute leading-none select-none"
        style={{ fontSize: iconSize }}
        aria-hidden
      >
        {emoji}
      </span>
      <Icon
        size={Math.round(iconSize * 0.55)}
        className="absolute bottom-1.5 right-1.5 opacity-25"
        style={{ color: theme.color }}
        aria-hidden
      />
    </div>
  );
}

export function ImportanceBadge({ importance }: { importance: VisualMindMapNode["importance"] }) {
  const dots =
    importance === "essential" ? 3 : importance === "important" ? 2 : 1;
  const label =
    importance === "essential" ? "Esencial" : importance === "important" ? "Importante" : "Complementario";

  return (
    <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wider text-[#F5F7FA]/55">
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 rounded-sm"
          style={{
            background: index < dots ? "#FBBF24" : "rgba(255,255,255,0.12)",
            boxShadow: index < dots ? "0 0 6px rgba(251,191,36,0.55)" : undefined,
          }}
        />
      ))}
      <span>{label}</span>
    </span>
  );
}
