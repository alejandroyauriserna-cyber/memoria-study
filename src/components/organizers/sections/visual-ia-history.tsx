"use client";

import type { RecentVisualAiItem } from "@/lib/organizers/visual-ai-cache";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return "Hace un momento";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return date.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function VisualIaHistory({
  items,
  onOpen,
}: {
  items: RecentVisualAiItem[];
  onOpen: (formatId: VisualAiFormatId) => void;
}) {
  if (!items.length) return null;

  return (
    <section className="visual-ai-history" aria-label="Visuales generados recientemente">
      <p className="visual-ai-history__title">Visuales generados recientemente</p>
      <div className="visual-ai-history__list">
        {items.map((item) => (
          <button
            key={`${item.formatId}-${item.generatedAt}`}
            type="button"
            className="visual-ai-history__item"
            onClick={() => onOpen(item.formatId)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt="" className="visual-ai-history__thumb" />
            <span className="visual-ai-history__meta">
              {item.formatEmoji} {item.formatLabel}
            </span>
            <span className="visual-ai-history__date">{formatRelativeDate(item.generatedAt)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
