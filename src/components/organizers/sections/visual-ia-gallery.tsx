"use client";

import { motion } from "framer-motion";
import { VISUAL_AI_FORMATS } from "@/lib/organizers/visual-ai-formats";
import type { VisualAiFormatId, VisualAiOutput } from "@/lib/organizers/visual-ai-types";

const CARD_VARIANT: Record<VisualAiFormatId, string> = {
  infographic: "visual-ai-card--infographic",
  mindMap: "visual-ai-card--mindmap",
  conceptMap: "visual-ai-card--conceptmap",
  comparisonTable: "visual-ai-card--comparison",
  timeline: "visual-ai-card--timeline",
  legalAtlas: "visual-ai-card--atlas",
  academicPoster: "visual-ai-card--poster",
  presentation: "visual-ai-card--presentation",
};

export function VisualIaGallery({
  cacheByFormat,
  onSelect,
}: {
  cacheByFormat: Map<VisualAiFormatId, VisualAiOutput | null | undefined>;
  selectedFormat?: VisualAiFormatId | null;
  onSelect: (id: VisualAiFormatId) => void;
}) {
  return (
    <div className="visual-ai-grid">
      {VISUAL_AI_FORMATS.map((format, index) => {
        const cached = cacheByFormat.get(format.id);
        const hasCache = Boolean(cached?.imageUrl);
        const hero = format.bento === "2x2" ? " visual-ai-card--hero" : "";

        return (
          <motion.button
            key={format.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSelect(format.id)}
            className={`visual-ai-card ${CARD_VARIANT[format.id]}${hero}`}
          >
            {hasCache && cached?.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cached.imageUrl} alt="" className="visual-ai-card__thumb" aria-hidden />
                <span className="visual-ai-card__shade" aria-hidden />
              </>
            ) : null}

            {hasCache ? (
              <span className="visual-ai-generated">✓ Generado</span>
            ) : null}

            <div className="visual-ai-card__body">
              <div className="visual-ai-card-icon" aria-hidden>
                {format.emoji}
              </div>
              <p className="visual-ai-card-title">{format.label}</p>
              <p className="visual-ai-card-description">{format.tagline}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
