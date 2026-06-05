"use client";

import { useCallback, useState } from "react";
import {
  hasOrganizerSections,
  parseOrganizerContent,
} from "@/lib/organizers/parse-content";
import { convertLegacyFlowChart } from "@/lib/organizers/flow-map-layout";
import { mergeReviewContent } from "@/lib/organizers/review-fallback";
import { ConceptMapCanvas } from "@/components/organizers/sections/concept-map-canvas";
import { FlashcardPremium } from "@/components/organizers/sections/flashcard-premium";
import { FlowProcessMap } from "@/components/organizers/sections/flow-process-map";
import { StudyPathInteractive } from "@/components/organizers/sections/study-path-interactive";
import { OrganizerFloatSheet } from "@/components/organizers/sections/organizer-float-sheet";
import {
  OrganizerStudioDock,
  type StudioPanelId,
} from "@/components/organizers/sections/organizer-studio-dock";
import { EasyExplanationBlock } from "@/components/organizers/sections/organizer-section-shell";
import { ReviewPremiumModule } from "@/components/organizers/sections/review-premium-module";
import { TimelineModern } from "@/components/organizers/sections/timeline-modern";
import { PedagogicalOrganizerPoster } from "@/components/organizers/sections/pedagogical-organizer-poster";
import { VisualMindMapPanel } from "@/components/organizers/sections/visual-mind-map-panel";
import { VisualPremiumPromptPanel } from "@/components/organizers/sections/visual-premium-prompt-panel";
import { OrganizerContentSkeleton } from "@/components/organizers/organizer-skeleton";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { useLearningAnalytics } from "@/components/organizers/sections/learning-analytics-panel";

export function OrganizerContentView({
  content,
  loading = false,
  studio = false,
  deckKey,
  organizerId,
  onContentUpdate,
}: {
  content: unknown;
  loading?: boolean;
  studio?: boolean;
  deckKey?: string;
  organizerId?: string;
  onContentUpdate?: (content: unknown) => void;
}) {
  const [activePanel, setActivePanel] = useState<StudioPanelId>(null);
  const loadProgress = useLoadingProgress(loading, "generic");
  const analyticsKey = deckKey ?? "organizer";
  const { recordConcept, recordAnswer } = useLearningAnalytics(analyticsKey);

  const handleConceptStudied = useCallback(
    (label: string) => recordConcept(label),
    [recordConcept],
  );

  const handlePanelSelect = useCallback((id: StudioPanelId) => {
    setActivePanel(id);
  }, []);

  const parsed = parseOrganizerContent(content);
  const reviewBundle = mergeReviewContent(parsed);

  if (loading) {
    return (
      <div className="relative min-h-[200px]">
        <OrganizerContentSkeleton studio={studio} />
        <LoadingState
          active
          preset="generic"
          percent={loadProgress.percent}
          message={loadProgress.message}
          stageLabel={loadProgress.stageLabel}
          variant="overlay"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        />
      </div>
    );
  }

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
    reviewBundle,
    visualSummary: parsed.visualSummary,
    aiAnalysis: parsed.aiAnalysis,
    centerTitle: parsed.conceptMap?.title ?? parsed.hierarchy?.root,
  };

  const mapKey = `${analyticsKey}-concept-map`;

  if (studio && hasConceptMap) {
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        <ConceptMapCanvas
          title={parsed.conceptMap?.title}
          nodes={conceptNodes}
          fullscreen
          mapKey={mapKey}
          studyContext={studyContext}
          onConceptStudied={handleConceptStudied}
        />

        <OrganizerStudioDock active={activePanel} onSelect={handlePanelSelect} />

        <OrganizerFloatSheet
          open={activePanel === "summary"}
          title="Resumen visual"
          wide
          onClose={() => setActivePanel(null)}
        >
          {parsed.summary ? (
            <PedagogicalOrganizerPoster
              title={parsed.conceptMap?.title ?? parsed.hierarchy?.root ?? "Organizador visual"}
              summary={parsed.summary}
              visualSummary={parsed.visualSummary}
              centralConcept={parsed.hierarchy?.root ?? parsed.conceptMap?.title}
              axiomLabels={parsed.hierarchy?.branches}
            />
          ) : null}
          {parsed.simplifiedExplanation ? (
            <div className="mt-4">
              <EasyExplanationBlock explanation={parsed.simplifiedExplanation} />
            </div>
          ) : null}
          {timelineEvents.length ? (
            <div className="mt-4">
              <TimelineModern events={timelineEvents} />
            </div>
          ) : null}
        </OrganizerFloatSheet>

        <OrganizerFloatSheet
          open={activePanel === "flow"}
          title="Proceso jurídico"
          wide
          onClose={() => setActivePanel(null)}
        >
          {flowProcess?.nodes?.length && flowProcess.edges?.length ? (
            <FlowProcessMap
              title={flowProcess.title ?? "Flujo jurídico"}
              nodes={flowProcess.nodes}
              edges={flowProcess.edges}
              studyContext={studyContext}
              bare
            />
          ) : null}
        </OrganizerFloatSheet>

        <OrganizerFloatSheet
          open={activePanel === "tree"}
          title="Ruta de estudio"
          onClose={() => setActivePanel(null)}
        >
          {parsed.hierarchy?.root && hierarchyBranches.length ? (
            <StudyPathInteractive
              root={parsed.hierarchy.root}
              branches={hierarchyBranches}
              pathKey={analyticsKey}
              studyContext={studyContext}
              bare
            />
          ) : null}
        </OrganizerFloatSheet>

        <OrganizerFloatSheet
          open={activePanel === "visualMap"}
          title="Mapa mental visual IA"
          wide
          onClose={() => setActivePanel(null)}
        >
          <div className="-m-4 h-[min(78vh,720px)] sm:-m-5">
            {organizerId ? (
              <VisualMindMapPanel
                organizerId={organizerId}
                visualMindMap={parsed.visualMindMap}
                onGenerated={onContentUpdate}
              />
            ) : null}
          </div>
        </OrganizerFloatSheet>

        <OrganizerFloatSheet
          open={activePanel === "visualPrompt"}
          title="Atlas Jurídico IA"
          fullscreen
          onClose={() => setActivePanel(null)}
        >
          {organizerId ? (
            <VisualPremiumPromptPanel
              organizerId={organizerId}
              visualPremiumPrompt={parsed.visualPremiumPrompt}
              onGenerated={onContentUpdate}
              onClose={() => setActivePanel(null)}
            />
          ) : null}
        </OrganizerFloatSheet>

        <OrganizerFloatSheet
          open={activePanel === "flashcards"}
          title="Modo estudio"
          wide
          onClose={() => setActivePanel(null)}
        >
          {parsed.flashcards?.length ? (
            <FlashcardPremium flashcards={parsed.flashcards} deckKey={analyticsKey} quizlet />
          ) : null}
        </OrganizerFloatSheet>

        <OrganizerFloatSheet
          open={activePanel === "review"}
          title="Repaso inteligente"
          wide
          onClose={() => setActivePanel(null)}
        >
          <ReviewPremiumModule reviewBundle={reviewBundle} deckKey={analyticsKey} onAnswerRecorded={recordAnswer} />
        </OrganizerFloatSheet>
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
          mapKey={mapKey}
          studyContext={studyContext}
          onConceptStudied={handleConceptStudied}
        />
      ) : null}

      {parsed.summary ? (
        <PedagogicalOrganizerPoster
          title={parsed.conceptMap?.title ?? parsed.hierarchy?.root ?? "Organizador visual"}
          summary={parsed.summary}
          visualSummary={parsed.visualSummary}
          centralConcept={parsed.hierarchy?.root ?? parsed.conceptMap?.title}
          axiomLabels={parsed.hierarchy?.branches}
        />
      ) : null}
      {parsed.simplifiedExplanation ? (
        <EasyExplanationBlock explanation={parsed.simplifiedExplanation} />
      ) : null}
      {flowProcess?.nodes?.length && flowProcess.edges?.length ? (
        <FlowProcessMap
          title={flowProcess.title ?? "Proceso jurídico"}
          nodes={flowProcess.nodes}
          edges={flowProcess.edges}
          studyContext={studyContext}
        />
      ) : null}
      {parsed.hierarchy?.root && hierarchyBranches.length ? (
        <StudyPathInteractive
          root={parsed.hierarchy.root}
          branches={hierarchyBranches}
          pathKey={analyticsKey}
          studyContext={studyContext}
        />
      ) : null}
      {timelineEvents.length ? <TimelineModern events={timelineEvents} /> : null}
      {parsed.flashcards?.length ? (
        <FlashcardPremium flashcards={parsed.flashcards} deckKey={analyticsKey} quizlet />
      ) : null}
      <ReviewPremiumModule reviewBundle={reviewBundle} onAnswerRecorded={recordAnswer} />
    </div>
  );
}
