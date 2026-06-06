"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ImageIcon, Map, Sparkles, X } from "lucide-react";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { OrganizerContentView } from "@/components/organizers/organizer-content-view";
import { AcademicInfographicPanel } from "@/components/organizers/sections/academic-infographic-panel";
import {
  formatOrganizerDate,
  wasOrganizerRegenerated,
} from "@/lib/organizers/format";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import type { OrganizerRecord } from "@/types/organizer";

export type OrganizerStudioTab = "interactive" | "infographic";

export function OrganizerDetailModal({
  organizer,
  loading,
  readOnly = false,
  onClose,
  onContentUpdate,
}: {
  organizer: OrganizerRecord | null;
  loading?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onContentUpdate?: (organizerId: string, content: unknown) => void;
}) {
  const [activeTab, setActiveTab] = useState<OrganizerStudioTab>("interactive");
  const [content, setContent] = useState<unknown>(organizer?.content);

  useEffect(() => {
    setContent(organizer?.content);
    setActiveTab("interactive");
  }, [organizer?.id, organizer?.content]);

  useEffect(() => {
    if (!organizer) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [organizer, onClose]);

  const regenerated = organizer
    ? wasOrganizerRegenerated(organizer.created_at, organizer.updated_at)
    : false;

  const parsed = parseOrganizerContent(content);
  const conceptNodes = parsed.conceptMap?.nodes?.filter(Boolean) ?? [];
  const hasConceptMap = Boolean(parsed.conceptMap?.title || conceptNodes.length);
  const immersiveStudio = activeTab === "interactive" && hasConceptMap;

  function handleContentUpdate(next: unknown) {
    setContent(next);
    if (organizer) onContentUpdate?.(organizer.id, next);
  }

  return (
    <AnimatePresence>
      {organizer ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="organizers-studio organizer-modal-root fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={organizer.title}
        >
          {immersiveStudio ? (
            <>
              <div className="organizer-immersive-chrome pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center gap-2 px-3 py-2.5 sm:px-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="organizer-immersive-back pointer-events-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-sm font-semibold transition"
                  aria-label="Volver a organizadores"
                >
                  <ChevronLeft size={18} />
                  <span className="hidden sm:inline">Volver</span>
                </button>
                <h2 className="organizer-immersive-title min-w-0 flex-1 truncate text-sm font-bold tracking-tight sm:text-base">
                  {organizer.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("infographic")}
                  className="organizer-immersive-action pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border transition"
                  title="Infografía IA"
                  aria-label="Infografía IA"
                >
                  <ImageIcon size={16} />
                </button>
              </div>

              {readOnly ? (
                <p className="organizer-modal-readonly pointer-events-none absolute inset-x-0 top-12 z-40 shrink-0 border-b px-4 py-1.5 text-center text-[11px] sm:px-6">
                  Vista compartida — solo lectura
                </p>
              ) : null}

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <OrganizerContentView
                  content={content}
                  loading={loading}
                  studio
                  deckKey={organizer.id}
                  organizerId={organizer.id}
                  onContentUpdate={readOnly ? undefined : handleContentUpdate}
                />
              </div>
            </>
          ) : (
            <>
              <div className="organizer-modal-head flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur-xl sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  {hasConceptMap ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("interactive")}
                      className="organizer-immersive-back flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition sm:hidden"
                      aria-label="Volver al mapa"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  ) : (
                    <span className="organizer-modal-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <Sparkles size={18} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="organizer-modal-title truncate text-base font-bold tracking-tight sm:text-lg">
                      {organizer.title}
                    </h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{organizer.course_name}</span>
                      <span>·</span>
                      <span>{organizer.cycle_label}</span>
                      <span>·</span>
                      <span>{formatOrganizerDate(organizer.created_at)}</span>
                      {regenerated ? (
                        <>
                          <span>·</span>
                          <span className="text-accent">
                            Regenerado {formatOrganizerDate(organizer.updated_at)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="organizer-modal-close flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="organizer-modal-tabs flex shrink-0 gap-1 border-b px-4 py-2 sm:px-6">
                <StudioTab
                  active={activeTab === "interactive"}
                  onClick={() => setActiveTab("interactive")}
                  icon={Map}
                  label={hasConceptMap ? "Mapa" : "Estudio"}
                />
                <StudioTab
                  active={activeTab === "infographic"}
                  onClick={() => setActiveTab("infographic")}
                  icon={ImageIcon}
                  label="Infografía IA"
                  accent="#A78BFA"
                  badge={<PremiumBadge />}
                />
              </div>

              {readOnly ? (
                <p className="organizer-modal-readonly shrink-0 border-b px-4 py-2 text-center text-xs sm:px-6">
                  Vista compartida — solo lectura
                </p>
              ) : null}

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {activeTab === "infographic" ? (
                  <AcademicInfographicPanel
                    organizerId={organizer.id}
                    organizerTitle={organizer.title}
                    academicInfographic={parsed.academicInfographic}
                    onGenerated={readOnly ? undefined : handleContentUpdate}
                  />
                ) : (
                  <OrganizerContentView
                    content={content}
                    loading={loading}
                    studio
                    deckKey={organizer.id}
                    organizerId={organizer.id}
                    onContentUpdate={readOnly ? undefined : handleContentUpdate}
                  />
                )}
              </div>
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StudioTab({
  active,
  onClick,
  icon: Icon,
  label,
  accent = "#00FFD5",
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Map;
  label: string;
  accent?: string;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`organizer-modal-tab relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
        active ? "is-active" : "text-muted-foreground hover:bg-foreground/5"
      }`}
      style={active ? { background: `${accent}18`, color: accent } : undefined}
    >
      <Icon size={15} style={active ? { color: accent } : undefined} />
      {label}
      {badge}
      {active ? (
        <motion.span
          layoutId="studio-tab-indicator"
          className="absolute inset-x-3 -bottom-2 h-0.5 rounded-full"
          style={{ background: accent }}
        />
      ) : null}
    </button>
  );
}
