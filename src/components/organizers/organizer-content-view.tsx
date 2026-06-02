"use client";

import {
  hasOrganizerSections,
  parseOrganizerContent,
} from "@/lib/organizers/parse-content";
import { ConceptMapCanvas } from "@/components/organizers/sections/concept-map-canvas";
import { FlashcardCarousel } from "@/components/organizers/sections/flashcard-carousel";
import { FlowChartModern } from "@/components/organizers/sections/flow-chart-modern";
import { HierarchyTree } from "@/components/organizers/sections/hierarchy-tree";
import {
  EasyExplanationBlock,
  ExecutiveSummaryCard,
} from "@/components/organizers/sections/organizer-section-shell";
import { ReviewQuestionsAccordion } from "@/components/organizers/sections/review-questions-accordion";
import { TimelineModern } from "@/components/organizers/sections/timeline-modern";
import { OrganizerContentSkeleton } from "@/components/organizers/organizer-skeleton";

export function OrganizerContentView({
  content,
  loading = false,
  studio = false,
}: {
  content: unknown;
  loading?: boolean;
  studio?: boolean;
}) {
  if (loading) {
    return <OrganizerContentSkeleton studio={studio} />;
  }

  const parsed = parseOrganizerContent(content);

  if (!hasOrganizerSections(parsed)) {
    return (
      <div className="organizer-glass flex min-h-[200px] items-center justify-center rounded-[24px] px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Este organizador aún no tiene secciones visuales disponibles.
        </p>
      </div>
    );
  }

  const conceptNodes = parsed.conceptMap?.nodes?.filter(Boolean) ?? [];
  const hasConceptMap = Boolean(parsed.conceptMap?.title || conceptNodes.length);
  const timelineEvents =
    parsed.timeline?.events
      ?.filter((event): event is { date?: string; label: string } => Boolean(event.label))
      ?? [];
  const hierarchyBranches = parsed.hierarchy?.branches?.filter(Boolean) ?? [];

  return (
    <div className="space-y-4">
      {hasConceptMap ? (
        <ConceptMapCanvas
          title={parsed.conceptMap?.title}
          nodes={conceptNodes}
          hero={studio}
        />
      ) : null}

      <div className="organizer-bento">
        {parsed.summary ? <ExecutiveSummaryCard summary={parsed.summary} /> : null}
        {parsed.simplifiedExplanation ? (
          <EasyExplanationBlock explanation={parsed.simplifiedExplanation} />
        ) : null}
        {parsed.hierarchy?.root && hierarchyBranches.length ? (
          <HierarchyTree root={parsed.hierarchy.root} branches={hierarchyBranches} />
        ) : null}
        {timelineEvents.length ? <TimelineModern events={timelineEvents} /> : null}
        {parsed.flowChart?.start && parsed.flowChart?.end ? (
          <FlowChartModern
            start={parsed.flowChart.start}
            end={parsed.flowChart.end}
            steps={parsed.flowChart.steps}
          />
        ) : null}
        {parsed.flashcards?.length ? <FlashcardCarousel flashcards={parsed.flashcards} /> : null}
        {parsed.reviewQuestions?.length ? (
          <ReviewQuestionsAccordion questions={parsed.reviewQuestions} />
        ) : null}
      </div>
    </div>
  );
}
