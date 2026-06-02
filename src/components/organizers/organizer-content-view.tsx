"use client";

import {
  hasOrganizerSections,
  parseOrganizerContent,
} from "@/lib/organizers/parse-content";
import { convertLegacyFlowChart } from "@/lib/organizers/flow-map-layout";
import { AiAnalysisBanner } from "@/components/study/ai-analysis-banner";
import { ConceptMapCanvas } from "@/components/organizers/sections/concept-map-canvas";
import { FlashcardPremium } from "@/components/organizers/sections/flashcard-premium";
import { FlowProcessMap } from "@/components/organizers/sections/flow-process-map";
import { HierarchyTree } from "@/components/organizers/sections/hierarchy-tree";
import { EasyExplanationBlock } from "@/components/organizers/sections/organizer-section-shell";
import { ReviewPremiumModule } from "@/components/organizers/sections/review-premium-module";
import { TimelineModern } from "@/components/organizers/sections/timeline-modern";
import { VisualSummaryCard } from "@/components/organizers/sections/visual-summary-card";
import { OrganizerContentSkeleton } from "@/components/organizers/organizer-skeleton";

export function OrganizerContentView({
  content,
  loading = false,
  studio = false,
  deckKey,
}: {
  content: unknown;
  loading?: boolean;
  studio?: boolean;
  deckKey?: string;
}) {
  if (loading) {
    return <OrganizerContentSkeleton studio={studio} />;
  }

  const parsed = parseOrganizerContent(content);

  if (!hasOrganizerSections(parsed)) {
    return (
      <div className="organizer-glass flex min-h-[200px] items-center justify-center rounded-2xl px-6 py-12 text-center">
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

  const flowProcess =
    parsed.flowProcess?.nodes?.length && parsed.flowProcess.edges?.length
      ? parsed.flowProcess
      : parsed.flowChart?.start && parsed.flowChart.end
        ? convertLegacyFlowChart({
            start: parsed.flowChart.start,
            end: parsed.flowChart.end,
            steps: parsed.flowChart.steps,
          })
        : null;

  const studyContext = {
    summary: parsed.summary,
    simplifiedExplanation: parsed.simplifiedExplanation,
    flashcards: parsed.flashcards,
    reviewQuestions: parsed.reviewQuestions,
  };

  const secondarySections = (
    <div className="organizer-bento space-y-4 p-4 sm:p-6">
      {parsed.aiAnalysis || parsed.summary ? (
        <AiAnalysisBanner
          analysis={{
            conceptsDetected: parsed.aiAnalysis?.conceptsDetected,
            relationsFound: parsed.aiAnalysis?.relationsFound,
            difficulty: parsed.aiAnalysis?.difficulty,
            recommendations: parsed.aiAnalysis?.recommendations,
            summary: parsed.aiAnalysis?.studyFocus ?? parsed.summary,
          }}
        />
      ) : null}

      {parsed.summary ? (
        <VisualSummaryCard summary={parsed.summary} visualSummary={parsed.visualSummary} />
      ) : null}

      {parsed.simplifiedExplanation ? (
        <EasyExplanationBlock explanation={parsed.simplifiedExplanation} />
      ) : null}

      {flowProcess?.nodes?.length && flowProcess.edges?.length ? (
        <FlowProcessMap
          title={flowProcess.title ?? "Flujo jurídico"}
          nodes={flowProcess.nodes}
          edges={flowProcess.edges}
        />
      ) : null}

      {parsed.hierarchy?.root && hierarchyBranches.length ? (
        <HierarchyTree root={parsed.hierarchy.root} branches={hierarchyBranches} />
      ) : null}

      {timelineEvents.length ? <TimelineModern events={timelineEvents} /> : null}

      {parsed.flashcards?.length ? (
        <FlashcardPremium flashcards={parsed.flashcards} deckKey={deckKey ?? "organizer"} />
      ) : null}

      {parsed.reviewBundle || parsed.reviewQuestions?.length ? (
        <ReviewPremiumModule
          reviewBundle={parsed.reviewBundle}
          legacyQuestions={parsed.reviewQuestions}
        />
      ) : null}
    </div>
  );

  if (studio && hasConceptMap) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
          <ConceptMapCanvas
            title={parsed.conceptMap?.title}
            nodes={conceptNodes}
            fullscreen
            studyContext={studyContext}
          />
        </div>
        <div className="max-h-[38vh] shrink-0 overflow-y-auto border-t border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.6)]">
          {secondarySections}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
      {hasConceptMap ? (
        <ConceptMapCanvas
          title={parsed.conceptMap?.title}
          nodes={conceptNodes}
          hero={studio}
          studyContext={studyContext}
        />
      ) : null}
      {secondarySections}
    </div>
  );
}
