"use client";

import { useMemo, useState } from "react";
import { PremiumGateCard } from "@/components/ui/premium-gate-card";
import { PremiumGateDismissed } from "@/components/ui/premium-gate-dismissed";
import { VisualIaFormatView } from "@/components/organizers/sections/visual-ia-format-view";
import { VisualIaGallery } from "@/components/organizers/sections/visual-ia-gallery";
import { VisualIaHistory } from "@/components/organizers/sections/visual-ia-history";
import {
  getPremiumFeature,
  isPremiumFeatureAvailable,
} from "@/lib/billing/premium-features";
import { getVisualAiOutput, listRecentVisualAiOutputs } from "@/lib/organizers/visual-ai-cache";
import { VISUAL_AI_FORMATS } from "@/lib/organizers/visual-ai-formats";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";
import type { OrganizerContent } from "@/lib/organizers/parse-content";

const VISUAL_IA_FEATURE = getPremiumFeature("gemini-infographic");

export function VisualIaPanel({
  organizerId,
  organizerTitle,
  content,
  onGenerated,
}: {
  organizerId: string;
  organizerTitle: string;
  content: OrganizerContent;
  onGenerated?: (content: unknown) => void;
}) {
  const [gateDismissed, setGateDismissed] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<VisualAiFormatId | null>(null);

  const cacheByFormat = useMemo(() => {
    const map = new Map<VisualAiFormatId, ReturnType<typeof getVisualAiOutput>>();
    for (const format of VISUAL_AI_FORMATS) {
      map.set(format.id, getVisualAiOutput(content, format.id));
    }
    return map;
  }, [content]);

  const recentItems = useMemo(() => listRecentVisualAiOutputs(content), [content]);

  if (!isPremiumFeatureAvailable("gemini-infographic")) {
    if (gateDismissed) {
      return (
        <PremiumGateDismissed
          featureTitle={VISUAL_IA_FEATURE.title}
          onShowAgain={() => setGateDismissed(false)}
        />
      );
    }

    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <PremiumGateCard feature={VISUAL_IA_FEATURE} onDismiss={() => setGateDismissed(true)} />
        </div>
      </div>
    );
  }

  if (selectedFormat) {
    return (
      <div className="visual-ai-hub flex h-full min-h-0 flex-col">
        <div className="visual-ai-detail-bar shrink-0">
          <button type="button" className="visual-ai-back" onClick={() => setSelectedFormat(null)}>
            ← Galería Visual IA
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <VisualIaFormatView
            key={selectedFormat}
            organizerId={organizerId}
            organizerTitle={organizerTitle}
            formatId={selectedFormat}
            content={content}
            cachedOutput={cacheByFormat.get(selectedFormat)}
            onGenerated={onGenerated}
            autoGenerate
          />
        </div>
      </div>
    );
  }

  return (
    <div className="visual-ai-hub h-full min-h-0 overflow-auto">
      <header className="visual-ai-hub__intro">
        <p className="visual-ai-hub__kicker">🎨 Visual IA</p>
        <h2 className="visual-ai-hub__title">Estudio visual para entregar</h2>
        <p className="visual-ai-hub__subtitle">
          Genera láminas académicas listas para tu profesor — infografías, mapas, atlas y más.
          Cada formato se guarda automáticamente para{" "}
          <span style={{ color: "var(--via-accent)" }}>{organizerTitle}</span>.
        </p>
      </header>

      <VisualIaGallery cacheByFormat={cacheByFormat} onSelect={setSelectedFormat} />
      <VisualIaHistory items={recentItems} onOpen={setSelectedFormat} />
    </div>
  );
}
