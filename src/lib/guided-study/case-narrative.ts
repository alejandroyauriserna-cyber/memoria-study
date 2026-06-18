import type {
  ApplyConceptCase,
  CaseNarrativePhase,
  CaseNarrativeThread,
  GuidedStudySession,
} from "@/types/guided-legal-study";

const PHASES: CaseNarrativePhase[] = [
  "intro",
  "development",
  "complication",
  "resolution",
];

export function narrativePhaseForPage(pageNumber: number): CaseNarrativePhase {
  return PHASES[(pageNumber - 1) % PHASES.length] ?? "intro";
}

export function narrativePhaseLabel(phase: CaseNarrativePhase): string {
  switch (phase) {
    case "intro":
      return "Hechos iniciales";
    case "development":
      return "Nuevos hechos";
    case "complication":
      return "Complicación jurídica";
    case "resolution":
      return "Resolución del expediente";
    default:
      return "Expediente";
  }
}

export function buildCaseNarrativePromptBlock(thread: CaseNarrativeThread | undefined): string {
  if (!thread?.facts.length) return "";

  const factsBlock = thread.facts
    .map((f, i) => `  ${i + 1}. ${f}`)
    .join("\n");

  return `
EXPEDIENTE ACUMULATIVO — "${thread.title}" (continuidad entre páginas):
Hechos acumulados hasta la página ${thread.lastPage}:
${factsBlock}

INSTRUCCIÓN PARA applyConcept:
- El caso práctico DEBE continuar este expediente, NO crear un caso independiente.
- Fase actual: ${narrativePhaseLabel(thread.phase)}.
- Añade hechos nuevos coherentes con los anteriores y aplica el concepto de ESTA página.
- En scenario, menciona brevemente el hilo del expediente antes del nuevo giro.
`.trim();
}

export function advanceCaseNarrative(
  session: GuidedStudySession,
  pageNumber: number,
  applyCase: ApplyConceptCase,
): GuidedStudySession {
  const phase = applyCase.narrativePhase ?? narrativePhaseForPage(pageNumber);
  const newFact = applyCase.scenario.trim().slice(0, 280);
  if (!newFact) return session;

  const existing = session.caseNarrative;
  const title =
    existing?.title ||
    applyCase.studiedConcept ||
    `Expediente — pág. ${pageNumber}`;

  const facts = [...(existing?.facts ?? [])];
  if (!facts.includes(newFact)) {
    facts.push(newFact);
  }
  if (facts.length > 12) {
    facts.splice(0, facts.length - 12);
  }

  return {
    ...session,
    caseNarrative: {
      title,
      facts,
      lastPage: pageNumber,
      phase,
    },
    lastUpdated: new Date().toISOString(),
  };
}
