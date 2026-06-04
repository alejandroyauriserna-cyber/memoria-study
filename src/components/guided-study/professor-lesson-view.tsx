"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Gavel,
  GraduationCap,
  Lightbulb,
  Scale,
  Sparkles,
} from "lucide-react";
import type {
  LegalCitation,
  PageProfessorAnalysis,
  ProfessorConceptCard,
  SecondaryMention,
} from "@/types/guided-legal-study";
import { SourceCitationCard } from "@/components/legal-sources/source-citation-card";

function SecondaryMentionsBlock({ items }: { items: SecondaryMention[] }) {
  if (!items.length) return null;
  return (
    <div className="gs-secondary-box">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Menciones secundarias (no prioritarias)
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            <span className="text-[#F5F7FA]/70">{item.mention}</span>
            {" — "}
            {item.briefNote}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConceptCard({
  card,
  expanded,
  onToggle,
  active,
}: {
  card: ProfessorConceptCard;
  expanded: boolean;
  onToggle: () => void;
  active?: boolean;
}) {
  return (
    <article className={`gs-concept-card ${active ? "gs-concept-card--active" : ""}`}>
      <button type="button" className="gs-concept-card-head" onClick={onToggle}>
        <div className="flex items-start gap-2">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-[#00FFD5]" />
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
              Concepto
            </p>
            <h3 className="text-sm font-bold text-[#F5F7FA]">{card.concept}</h3>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-[rgba(0,255,213,0.08)] px-4 py-3">
              <Block label="Explicación" icon={Lightbulb} color="#00BFFF">
                {card.explanation}
              </Block>
              <Block label="Ejemplo" icon={GraduationCap} color="#00FFD5">
                {card.example}
              </Block>
              <Block label="Importancia en examen" icon={AlertTriangle} color="#FF8A00">
                {card.examImportance}
              </Block>
              {card.peruLaw ? (
                <Block label="Relación con Derecho peruano" icon={Scale} color="#86EFAC">
                  {card.peruLaw}
                </Block>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

function Block({
  label,
  icon: Icon,
  color,
  children,
}: {
  label: string;
  icon: typeof Lightbulb;
  color: string;
  children: string;
}) {
  return (
    <div className="gs-lesson-block">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        <Icon size={12} />
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-[#F5F7FA]/90">{children}</p>
    </div>
  );
}

function CitationsRow({ citations }: { citations: LegalCitation[] }) {
  if (!citations.length) return null;
  return (
    <div className="gs-citations-row">
      <p className="gs-section-label">
        <Gavel size={12} />
        Citación automática
      </p>
      <div className="mt-2 space-y-3">
        {citations.map((c, i) => (
          <SourceCitationCard key={i} citation={c} />
        ))}
      </div>
    </div>
  );
}

export function ProfessorLessonView({
  analysis,
  examOnly,
  activeHighlightId,
  onConceptClick,
  customReply,
  hideKeyLearning,
}: {
  analysis: PageProfessorAnalysis;
  examOnly?: boolean;
  activeHighlightId?: string | null;
  onConceptClick?: (highlightId: string) => void;
  customReply?: string | null;
  hideKeyLearning?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    analysis.conceptCards[0]?.id ?? null,
  );

  const cards = examOnly
    ? analysis.conceptCards.filter((c) => c.essential)
    : analysis.conceptCards;

  return (
    <div className="space-y-4">
      {customReply ? (
        <div className="gs-custom-reply">
          <p className="gs-section-label">
            <BookOpen size={12} />
            Respuesta del profesor
          </p>
          <p className="mt-2 text-sm leading-7 text-[#F5F7FA]">{customReply}</p>
        </div>
      ) : null}

      <div className="gs-focus-banner">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
          Enfoque de la página
        </p>
        <p className="mt-1 text-sm leading-6 text-[#F5F7FA]">{analysis.pageFocus}</p>
      </div>

      {!examOnly ? <SecondaryMentionsBlock items={analysis.secondaryMentions} /> : null}

      <div className="space-y-2">
        {cards.map((card) => (
          <ConceptCard
            key={card.id}
            card={card}
            expanded={expandedId === card.id}
            active={card.highlightId === activeHighlightId}
            onToggle={() => {
              setExpandedId((id) => (id === card.id ? null : card.id));
              if (card.highlightId) onConceptClick?.(card.highlightId);
            }}
          />
        ))}
      </div>

      <CitationsRow citations={analysis.citations} />

      {analysis.comprehensionQuestion ? (
        <div className="gs-comprehension-box">
          <p className="text-xs font-semibold text-[#FF8A00]">¿Entendiste este concepto?</p>
          <p className="mt-1 text-sm text-[#F5F7FA]">{analysis.comprehensionQuestion}</p>
        </div>
      ) : null}
    </div>
  );
}
