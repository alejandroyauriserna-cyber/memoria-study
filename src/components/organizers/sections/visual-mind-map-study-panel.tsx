"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Gavel,
  HelpCircle,
  Landmark,
  Lightbulb,
  Link2,
  Scale,
  Sparkles,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { themeForCategory } from "@/lib/organizers/visual-mind-map-theme";
import type { VisualMindMapNode } from "@/lib/organizers/visual-mind-map-types";

const ICON_MAP: Record<string, LucideIcon> = {
  scale: Scale,
  book: BookOpen,
  gavel: Gavel,
  users: Users,
  landmark: Landmark,
  lightbulb: Lightbulb,
  target: Target,
  brain: Brain,
};

export function VisualMindMapStudyPanel({
  node,
  relatedNodes,
  centerNode,
  onSelectNode,
  onClose,
}: {
  node: VisualMindMapNode;
  relatedNodes: VisualMindMapNode[];
  centerNode?: VisualMindMapNode;
  onSelectNode: (node: VisualMindMapNode) => void;
  onClose: () => void;
}) {
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const theme = themeForCategory(node.category);
  const Icon = ICON_MAP[node.icon] ?? Brain;

  return (
    <motion.aside
      data-visual-panel
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-y-0 right-0 z-40 flex w-[min(100%,420px)] flex-col border-l border-[rgba(0,255,213,0.12)] bg-[rgba(5,14,20,0.94)] shadow-[-16px_0_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
    >
      <div
        className="relative overflow-hidden border-b border-[rgba(255,255,255,0.06)] px-5 py-4"
        style={{ background: theme.gradient }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
          style={{ background: theme.glow }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: theme.soft, color: theme.color }}
            >
              <Sparkles size={10} /> Tutor IA · {theme.label}
            </span>
            <h4 className="mt-2 text-lg font-bold leading-tight text-[#F5F7FA]">{node.label}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(0,0,0,0.25)] text-[#F5F7FA]/80 hover:text-white"
            aria-label="Cerrar panel"
          >
            <X size={16} />
          </button>
        </div>

        {node.imageUrl ? (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={node.imageUrl} alt={node.label} className="h-36 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051018] via-transparent to-transparent" />
          </div>
        ) : (
          <div
            className="mt-4 flex h-28 items-center justify-center rounded-2xl border border-white/10"
            style={{ background: theme.soft }}
          >
            <Icon size={40} style={{ color: theme.color }} />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <StudyBlock
          icon={Brain}
          title="Explicación"
          accent={theme.color}
          content={node.explanation || `Concepto: ${node.label}`}
        />

        {node.example ? (
          <StudyBlock
            icon={Lightbulb}
            title="Ejemplo jurídico"
            accent={theme.color}
            content={node.example}
          />
        ) : null}

        {node.reviewQuestion ? (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: theme.soft, background: "rgba(255,255,255,0.02)" }}
          >
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]/70">
              <HelpCircle size={14} style={{ color: theme.color }} />
              Repaso rápido
            </p>
            <p className="text-sm font-medium leading-relaxed text-[#F5F7FA]">{node.reviewQuestion}</p>
            <button
              type="button"
              onClick={() => setRevealedAnswer((v) => !v)}
              className="mt-3 text-xs font-semibold transition hover:underline"
              style={{ color: theme.color }}
            >
              {revealedAnswer ? "Ocultar pista" : "Ver pista de respuesta"}
            </button>
            <AnimatePresence>
              {revealedAnswer ? (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 overflow-hidden text-xs leading-relaxed text-muted-foreground"
                >
                  {node.explanation?.slice(0, 200) ?? node.label}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {relatedNodes.length ? (
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]/70">
              <Link2 size={14} style={{ color: theme.color }} />
              Relacionado con
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedNodes.map((rel) => {
                const relTheme = themeForCategory(rel.category);
                return (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => {
                      setRevealedAnswer(false);
                      onSelectNode(rel);
                    }}
                    className="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition hover:scale-[1.02]"
                    style={{
                      borderColor: relTheme.soft,
                      background: relTheme.soft,
                      color: relTheme.color,
                    }}
                  >
                    {rel.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {centerNode && node.id !== "center" ? (
          <button
            type="button"
            onClick={() => onSelectNode(centerNode)}
            className="w-full rounded-2xl border border-[rgba(0,255,213,0.2)] py-3 text-xs font-semibold text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.08)]"
          >
            ← Volver al centro · {centerNode.label}
          </button>
        ) : null}
      </div>
    </motion.aside>
  );
}

function StudyBlock({
  icon: Icon,
  title,
  content,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  content: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]/70">
        <Icon size={14} style={{ color: accent }} />
        {title}
      </p>
      <p className="text-sm leading-relaxed text-[#F5F7FA]/90">{content}</p>
    </div>
  );
}
