"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronRight,
  GitBranch,
  HelpCircle,
  Layers,
  Lightbulb,
  Map,
  RotateCcw,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hasOrganizerSections,
  parseOrganizerContent,
  type OrganizerContent,
} from "@/lib/organizers/parse-content";

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-muted/40 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          {icon}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <Section title="Resumen" icon={<BookOpen size={16} />}>
      <p className="text-sm leading-7 text-foreground">{summary}</p>
    </Section>
  );
}

function ConceptMapSection({ conceptMap }: { conceptMap: NonNullable<OrganizerContent["conceptMap"]> }) {
  const nodes = conceptMap.nodes?.filter(Boolean) ?? [];

  return (
    <Section title="Mapa conceptual" icon={<Map size={16} />}>
      <div className="flex flex-col items-center gap-6">
        {conceptMap.title ? (
          <div className="rounded-3xl border-2 border-accent/40 bg-accent-soft px-6 py-4 text-center shadow-sm">
            <p className="text-base font-semibold text-foreground">{conceptMap.title}</p>
          </div>
        ) : null}

        {nodes.length ? (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nodes.map((node, index) => (
              <div key={`${node}-${index}`} className="relative rounded-3xl border border-border bg-card p-4 text-center shadow-sm">
                {conceptMap.title ? (
                  <span className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent" aria-hidden />
                ) : null}
                <p className="text-sm font-medium leading-6 text-foreground">{node}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function HierarchySection({ hierarchy }: { hierarchy: NonNullable<OrganizerContent["hierarchy"]> }) {
  const branches = hierarchy.branches?.filter(Boolean) ?? [];

  return (
    <Section title="Jerarquía" icon={<GitBranch size={16} />}>
      <div className="flex flex-col items-center gap-4">
        {hierarchy.root ? (
          <div className="w-full max-w-md rounded-3xl border border-accent/30 bg-accent-soft px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Raíz</p>
            <p className="mt-2 text-base font-semibold text-foreground">{hierarchy.root}</p>
          </div>
        ) : null}

        {branches.length ? (
          <>
            <div className="h-6 w-px bg-border" aria-hidden />
            <div className="grid w-full gap-3 sm:grid-cols-2">
              {branches.map((branch, index) => (
                <div key={`${branch}-${index}`} className="rounded-3xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
                  {branch}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Section>
  );
}

function TimelineSection({ timeline }: { timeline: NonNullable<OrganizerContent["timeline"]> }) {
  const events = timeline.events?.filter((event) => event.date || event.label) ?? [];

  if (!events.length) return null;

  return (
    <Section title="Línea de tiempo" icon={<Layers size={16} />}>
      <ol className="space-y-0">
        {events.map((event, index) => (
          <li key={`${event.label}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
            {index < events.length - 1 ? (
              <span className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border" aria-hidden />
            ) : null}
            <span className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-accent bg-card" aria-hidden />
            <div className="min-w-0 flex-1 rounded-3xl border border-border bg-card px-4 py-3">
              {event.date ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{event.date}</p>
              ) : null}
              {event.label ? <p className="mt-1 text-sm leading-6 text-foreground">{event.label}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function FlowChartSection({ flowChart }: { flowChart: NonNullable<OrganizerContent["flowChart"]> }) {
  const steps = [
    ...(flowChart.start ? [flowChart.start] : []),
    ...(flowChart.steps?.filter(Boolean) ?? []),
    ...(flowChart.end ? [flowChart.end] : []),
  ];

  if (!steps.length) return null;

  return (
    <Section title="Flujo de estudio" icon={<Workflow size={16} />}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {steps.map((step, index) => (
          <div key={`${step}-${index}`} className="flex items-center gap-3">
            <div
              className={`rounded-3xl border px-4 py-3 text-sm font-medium ${
                index === 0
                  ? "border-accent/30 bg-accent-soft text-foreground"
                  : index === steps.length - 1
                    ? "border-foreground/20 bg-foreground text-background"
                    : "border-border bg-card text-foreground"
              }`}
            >
              {step}
            </div>
            {index < steps.length - 1 ? (
              <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}

function FlashcardsSection({ flashcards }: { flashcards: NonNullable<OrganizerContent["flashcards"]> }) {
  const cards = flashcards.filter((card) => card.question || card.answer);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) return null;

  const card = cards[index];

  return (
    <Section title="Flashcards" icon={<Sparkles size={16} />}>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-[28px] border border-border bg-card px-6 py-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {flipped ? "Respuesta" : "Pregunta"}
          </p>
          <p className="mt-4 text-base font-semibold leading-7 text-foreground">
            {flipped ? card.answer : card.question}
          </p>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Tarjeta {index + 1} de {cards.length}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFlipped(false);
                setIndex((value) => (value - 1 + cards.length) % cards.length);
              }}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFlipped(false);
                setIndex((value) => (value + 1) % cards.length);
              }}
            >
              Siguiente
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFlipped(false)}>
              <RotateCcw size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ReviewQuestionsSection({ questions }: { questions: string[] }) {
  const items = questions.filter(Boolean);
  if (!items.length) return null;

  return (
    <Section title="Preguntas de repaso" icon={<HelpCircle size={16} />}>
      <ol className="space-y-3">
        {items.map((question, index) => (
          <li
            key={`${question}-${index}`}
            className="flex gap-3 rounded-3xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
              {index + 1}
            </span>
            <span>{question}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function SimplifiedExplanationSection({ explanation }: { explanation: string }) {
  return (
    <Section title="Explicación sencilla" icon={<Lightbulb size={16} />}>
      <p className="rounded-3xl border border-accent/20 bg-accent-soft/60 px-5 py-4 text-sm leading-7 text-foreground">
        {explanation}
      </p>
    </Section>
  );
}

export function OrganizerContentView({ content }: { content: unknown }) {
  const parsed = parseOrganizerContent(content);

  if (!hasOrganizerSections(parsed)) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-muted/40 px-5 py-8 text-center text-sm text-muted-foreground">
        Este organizador aún no tiene secciones visuales disponibles.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {parsed.summary ? <SummarySection summary={parsed.summary} /> : null}
      {parsed.simplifiedExplanation ? (
        <SimplifiedExplanationSection explanation={parsed.simplifiedExplanation} />
      ) : null}
      {parsed.conceptMap?.title || parsed.conceptMap?.nodes?.length ? (
        <ConceptMapSection conceptMap={parsed.conceptMap} />
      ) : null}
      {parsed.hierarchy?.root || parsed.hierarchy?.branches?.length ? (
        <HierarchySection hierarchy={parsed.hierarchy} />
      ) : null}
      {parsed.timeline?.events?.length ? <TimelineSection timeline={parsed.timeline} /> : null}
      {parsed.flowChart?.start || parsed.flowChart?.end || parsed.flowChart?.steps?.length ? (
        <FlowChartSection flowChart={parsed.flowChart} />
      ) : null}
      {parsed.flashcards?.length ? <FlashcardsSection flashcards={parsed.flashcards} /> : null}
      {parsed.reviewQuestions?.length ? (
        <ReviewQuestionsSection questions={parsed.reviewQuestions} />
      ) : null}
    </div>
  );
}
