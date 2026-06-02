"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Gavel,
  HelpCircle,
  Lightbulb,
  Link2,
  ScrollText,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  ImportanceBadge,
  NodeThumbnail,
} from "@/components/organizers/sections/visual-mind-map-node-media";
import { IMPORTANCE_LABELS, themeForCategory } from "@/lib/organizers/visual-mind-map-theme";
import type { VisualMindMapNode } from "@/lib/organizers/visual-mind-map-types";

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

  return (
    <motion.aside
      data-visual-panel
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-y-0 right-0 z-40 flex w-[min(100%,440px)] flex-col border-l border-white/10 bg-[rgba(2,6,10,0.96)] shadow-[-20px_0_72px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
    >
      <div
        className="relative overflow-hidden border-b border-white/8 px-5 py-4"
        style={{ background: theme.gradient }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-2xl blur-3xl"
          style={{ background: theme.glow }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: theme.chip, color: theme.color }}
            >
              <Sparkles size={10} /> Tutor IA · {theme.label}
            </span>
            <h4 className="mt-2 text-lg font-bold leading-tight text-[#F5F7FA]">{node.label}</h4>
            <p className="mt-1 text-sm leading-snug text-[#F5F7FA]/75">{node.summary}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ImportanceBadge importance={node.importance} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]/90">
                <Star size={10} className="mr-1 inline" />
                {IMPORTANCE_LABELS[node.importance]}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/30 text-[#F5F7FA]/80 hover:text-white"
            aria-label="Cerrar panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 shadow-lg">
          <NodeThumbnail node={node} height={140} iconSize={48} className="w-full rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#02060a] via-transparent to-transparent" />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <StudyBlock
          icon={Brain}
          title="Definición"
          accent={theme.color}
          content={node.explanation || node.summary}
        />

        {node.example ? (
          <StudyBlock
            icon={Lightbulb}
            title="Ejemplo práctico"
            accent={theme.color}
            content={node.example}
          />
        ) : null}

        {node.legalReferences?.length ? (
          <ReferenceBlock
            icon={ScrollText}
            title="Artículos relacionados"
            accent={theme.color}
            items={node.legalReferences}
          />
        ) : null}

        {node.jurisprudence?.length ? (
          <ReferenceBlock
            icon={Gavel}
            title="Jurisprudencia relacionada"
            accent={theme.color}
            items={node.jurisprudence}
          />
        ) : null}

        {node.reviewQuestion ? (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: theme.soft, background: "rgba(255,255,255,0.02)" }}
          >
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]/70">
              <HelpCircle size={14} style={{ color: theme.color }} />
              Pregunta IA
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
                  {node.explanation?.slice(0, 220) ?? node.summary}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {relatedNodes.length ? (
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]/70">
              <Link2 size={14} style={{ color: theme.color }} />
              Conceptos conectados
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
                    className="max-w-full rounded-xl border px-3 py-2 text-left transition hover:scale-[1.01]"
                    style={{
                      borderColor: relTheme.soft,
                      background: relTheme.soft,
                    }}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: relTheme.color }}>
                      {relTheme.label}
                    </span>
                    <span className="block text-[11px] font-semibold text-[#F5F7FA]">{rel.label}</span>
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
            className="w-full rounded-2xl border border-[#3B82F6]/30 py-3 text-xs font-semibold text-[#60A5FA] transition hover:bg-[#3B82F6]/10"
          >
            ← Volver al tema central · {centerNode.label}
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
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]/70">
        <Icon size={14} style={{ color: accent }} />
        {title}
      </p>
      <p className="text-sm leading-relaxed text-[#F5F7FA]/90">{content}</p>
    </div>
  );
}

function ReferenceBlock({
  icon: Icon,
  title,
  accent,
  items,
}: {
  icon: LucideIcon;
  title: string;
  accent: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]/70">
        <Icon size={14} style={{ color: accent }} />
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg px-3 py-2 text-xs font-medium leading-snug text-[#F5F7FA]/90"
            style={{ background: `${accent}18` }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
