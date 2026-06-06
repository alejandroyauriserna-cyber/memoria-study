"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Map, Sparkles, X } from "lucide-react";
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
          className="organizers-studio fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={organizer.title}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.85)] px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFD5] to-[#00BFFF] text-[#07131A] shadow-[0_0_20px_rgba(0,255,213,0.35)]">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold tracking-tight text-[#F5F7FA] sm:text-lg">
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
                      <span className="text-[#00FFD5]">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.6)] text-[#F5F7FA] transition hover:border-[rgba(0,255,213,0.4)] hover:bg-[rgba(0,255,213,0.08)]"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex shrink-0 gap-1 border-b border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.6)] px-4 py-2 sm:px-6">
            <StudioTab
              active={activeTab === "interactive"}
              onClick={() => setActiveTab("interactive")}
              icon={Map}
              label="Organizador Interactivo"
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
            <p className="shrink-0 border-b border-[rgba(0,255,213,0.1)] bg-[rgba(0,255,213,0.06)] px-4 py-2 text-center text-xs text-[#00FFD5] sm:px-6">
              Vista compartida — solo lectura
            </p>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeTab === "interactive" ? (
              <OrganizerContentView
                content={content}
                loading={loading}
                studio
                deckKey={organizer.id}
                organizerId={organizer.id}
                onContentUpdate={readOnly ? undefined : handleContentUpdate}
              />
            ) : (
              <AcademicInfographicPanel
                organizerId={organizer.id}
                organizerTitle={organizer.title}
                academicInfographic={parsed.academicInfographic}
                onGenerated={readOnly ? undefined : handleContentUpdate}
              />
            )}
          </div>
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
      className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
        active
          ? "text-[#F5F7FA]"
          : "text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F5F7FA]/80"
      }`}
      style={active ? { background: `${accent}18`, color: active ? accent : undefined } : undefined}
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
