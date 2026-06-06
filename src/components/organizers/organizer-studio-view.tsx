"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ImageIcon } from "lucide-react";
import { OrganizerContentView } from "@/components/organizers/organizer-content-view";
import { AcademicInfographicPanel } from "@/components/organizers/sections/academic-infographic-panel";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import type { OrganizerRecord } from "@/types/organizer";

export type OrganizerStudioTab = "interactive" | "infographic";

export function OrganizerStudioView({
  organizer,
  loading = false,
  readOnly = false,
  onBack,
  onContentUpdate,
}: {
  organizer: OrganizerRecord;
  loading?: boolean;
  readOnly?: boolean;
  onBack: () => void;
  onContentUpdate?: (organizerId: string, content: unknown) => void;
}) {
  const [activeTab, setActiveTab] = useState<OrganizerStudioTab>("interactive");
  const [content, setContent] = useState<unknown>(organizer.content);

  useEffect(() => {
    setContent(organizer.content);
    setActiveTab("interactive");
  }, [organizer.id, organizer.content]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onBack();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack]);

  const parsed = parseOrganizerContent(content);
  const conceptNodes = parsed.conceptMap?.nodes?.filter(Boolean) ?? [];
  const hasConceptMap = Boolean(parsed.conceptMap?.title || conceptNodes.length);
  const showMap = activeTab === "interactive" && hasConceptMap;

  function handleContentUpdate(next: unknown) {
    setContent(next);
    onContentUpdate?.(organizer.id, next);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="organizers-studio-mode flex min-h-[85vh] w-full max-w-none flex-1 flex-col"
    >
      <header className="organizers-studio-mode__header shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="organizers-studio-mode__back inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition"
          aria-label="Volver a la biblioteca"
        >
          <ChevronLeft size={18} />
          Volver
        </button>

        <div className="min-w-0 flex-1 px-2 sm:px-4">
          <h2 className="organizers-studio-mode__title truncate text-sm font-bold tracking-tight sm:text-base">
            {organizer.title}
          </h2>
          <p className="truncate text-[11px] text-muted-foreground">{organizer.course_name}</p>
        </div>

        {hasConceptMap ? (
          <div className="organizers-studio-mode__tabs flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("interactive")}
              className={`organizers-studio-mode__tab rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "interactive" ? "is-active" : ""
              }`}
            >
              Mapa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("infographic")}
              className={`organizers-studio-mode__tab organizers-studio-mode__tab--alt rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "infographic" ? "is-active" : ""
              }`}
              title="Infografía IA"
            >
              <ImageIcon size={14} className="mr-1 inline" />
              Infografía
            </button>
          </div>
        ) : null}
      </header>

      {readOnly ? (
        <p className="organizer-modal-readonly shrink-0 border-b px-4 py-1.5 text-center text-[11px]">
          Vista compartida — solo lectura
        </p>
      ) : null}

      <div className="organizer-canvas-stage flex min-h-0 flex-1 flex-col overflow-hidden">
        {showMap ? (
          <OrganizerContentView
            content={content}
            loading={loading}
            studio
            deckKey={organizer.id}
            organizerId={organizer.id}
            onContentUpdate={readOnly ? undefined : handleContentUpdate}
          />
        ) : (
          <div className="flex min-h-0 flex-1 overflow-auto p-4 sm:p-6">
            <AcademicInfographicPanel
              organizerId={organizer.id}
              organizerTitle={organizer.title}
              academicInfographic={parsed.academicInfographic}
              onGenerated={readOnly ? undefined : handleContentUpdate}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
