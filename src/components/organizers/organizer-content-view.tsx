"use client";

import { useCallback, useState } from "react";
import {
  hasOrganizerSections,
  parseOrganizerContent,
} from "@/lib/organizers/parse-content";
import { convertLegacyFlowChart } from "@/lib/organizers/flow-map-layout";
import { mergeReviewContent } from "@/lib/organizers/review-fallback";
import { getBranchForNode } from "@/components/organizers/sections/study-assistant-panel";
import { ConceptMapCanvas } from "@/components/organizers/sections/concept-map-canvas";
import { FlashcardPremium } from "@/components/organizers/sections/flashcard-premium";
import { FlowProcessMap } from "@/components/organizers/sections/flow-process-map";
import { KnowledgeTreeInteractive } from "@/components/organizers/sections/knowledge-tree-interactive";
import {
  LearningAnalyticsPanel,
  useLearningAnalytics,
} from "@/components/organizers/sections/learning-analytics-panel";
import { EasyExplanationBlock } from "@/components/organizers/sections/organizer-section-shell";
import { ReviewPremiumModule } from "@/components/organizers/sections/review-premium-module";
import { StudyAssistantPanel } from "@/components/organizers/sections/study-assistant-panel";
import { TimelineModern } from "@/components/organizers/sections/timeline-modern";
import { VisualSummaryCard } from "@/components/organizers/sections/visual-summary-card";
import { OrganizerContentSkeleton } from "@/components/organizers/organizer-skeleton";
import type { NodeStudyDetail, StudyMapNode } from "@/lib/organizers/concept-map-study";

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
  const [selectedNode, setSelectedNode] = useState<StudyMapNode | null>(null);
  const [nodeDetail, setNodeDetail] = useState<NodeStudyDetail | null>(null);
  const [focusBranchId, setFocusBranchId] = useState<number | null>(null);

  const analyticsKey = deckKey ?? "organizer";
  const { state, readingMinutes, mastery, recordConcept, recordAnswer } = useLearningAnalytics(analyticsKey);

  const handleNodeSelect = useCallback(
    (node: StudyMapNode | null, detail: NodeStudyDetail | null) => {
      setSelectedNode(node);
      setNodeDetail(detail);
      if (node) recordConcept(node.label);
    },
    [recordConcept],
  );

  const parsed = parseOrganizerContent(content);
  const reviewBundle = mergeReviewContent(parsed);

  if (loading) {
    return <OrganizerContentSkeleton studio={studio} />;
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
  };

  const selectedBranch = selectedNode ? getBranchForNode(selectedNode) : null;

  const secondarySections = (
    <div className="organizer-bento space-y-4 p-4 sm:p-6">
      {parsed.summary ? (
        <VisualSummaryCard summary={parsed.summary} visualSummary={parsed.visualSummary} />
      ) : null}

      {parsed.simplifiedExplanation ? (
        <EasyExplanationBlock explanation={parsed.simplifiedExplanation} />
      ) : null}

      {flowProcess?.nodes?.length && flowProcess.edges?.length ? (
        <FlowProcessMap
          title={flowProcess.title ?? "Proceso jurídico"}
          nodes={flowProcess.nodes}
          edges={flowProcess.edges}
        />
      ) : null}

      {parsed.hierarchy?.root && hierarchyBranches.length ? (
        <KnowledgeTreeInteractive root={parsed.hierarchy.root} branches={hierarchyBranches} />
      ) : null}

      {timelineEvents.length ? <TimelineModern events={timelineEvents} /> : null}

      {parsed.flashcards?.length ? (
        <FlashcardPremium flashcards={parsed.flashcards} deckKey={analyticsKey} />
      ) : null}

      <ReviewPremiumModule reviewBundle={reviewBundle} onAnswerRecorded={recordAnswer} />
    </div>
  );

  if (studio && hasConceptMap) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
          <ConceptMapCanvas
            title={parsed.conceptMap?.title}
            nodes={conceptNodes}
            fullscreen
            externalPanel
            studyContext={studyContext}
            onNodeSelect={handleNodeSelect}
            onConceptStudied={recordConcept}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.55)] lg:w-[min(100%,380px)] lg:border-l lg:border-t-0">
          <div className="flex min-h-[280px] flex-1 flex-col p-3 sm:p-4">
            {selectedNode && selectedBranch && nodeDetail ? (
              <StudyAssistantPanel
                embedded
                node={selectedNode}
                branch={selectedBranch}
                detail={nodeDetail}
                focusMode={focusBranchId === selectedNode.branchId}
                onClose={() => {
                  setSelectedNode(null);
                  setNodeDetail(null);
                }}
                onFocusBranch={() =>
                  setFocusBranchId((c) => (c === selectedNode.branchId ? null : selectedNode.branchId))
                }
                onStudyBranch={() => undefined}
              />
            ) : (
              <LearningAnalyticsPanel
                mastery={mastery}
                conceptsStudied={state.conceptsStudied.length}
                readingMinutes={readingMinutes}
                questionsCorrect={state.questionsCorrect}
                questionsWrong={state.questionsWrong}
                organizerProgress={state.organizerProgress}
              />
            )}
          </div>

          <div className="max-h-[34vh] shrink-0 overflow-y-auto border-t border-[rgba(0,255,213,0.08)]">
            {secondarySections}
          </div>
        </aside>
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
          onConceptStudied={recordConcept}
        />
      ) : null}
      {secondarySections}
    </div>
  );
}
