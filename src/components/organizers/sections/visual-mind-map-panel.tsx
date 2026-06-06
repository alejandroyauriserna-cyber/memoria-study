"use client";

import { VisualMapLockedPanel } from "@/components/organizers/sections/visual-map-locked-panel";
import type { VisualMindMap } from "@/lib/organizers/visual-mind-map-types";

export function VisualMindMapPanel({
  onOpenAtlas,
}: {
  organizerId?: string;
  visualMindMap?: VisualMindMap | null;
  onGenerated?: (content: unknown) => void;
  onOpenAtlas: () => void;
}) {
  return <VisualMapLockedPanel onOpenAtlas={onOpenAtlas} />;
}

