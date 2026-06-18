import type { GuidedStudySession, NarrationSessionMemory } from "@/types/guided-legal-study";
import type { NarrationInterruptAction, NarrationStyle } from "@/types/tutor-voice";

export function emptyNarrationMemory(): NarrationSessionMemory {
  return {
    simplerRequestCount: 0,
    conceptFocusCounts: {},
    microActionCounts: {},
    freeQuestions: [],
  };
}

export function getNarrationMemory(session: GuidedStudySession | null): NarrationSessionMemory {
  return session?.narrationMemory ?? emptyNarrationMemory();
}

export function recordNarrationInterrupt(
  session: GuidedStudySession,
  input: {
    action: NarrationInterruptAction;
    primaryConcept?: string;
    pageNumber: number;
    studentMessage?: string;
  },
): GuidedStudySession {
  const memory = { ...getNarrationMemory(session) };
  memory.microActionCounts = {
    ...memory.microActionCounts,
    [input.action]: (memory.microActionCounts[input.action] ?? 0) + 1,
  };

  if (input.action === "simpler") {
    memory.simplerRequestCount += 1;
  }

  const concept =
    input.primaryConcept?.trim() ||
    (input.studentMessage?.slice(0, 80).trim() ?? "");

  if (concept) {
    const key = concept.toLowerCase();
    memory.conceptFocusCounts = {
      ...memory.conceptFocusCounts,
      [key]: (memory.conceptFocusCounts[key] ?? 0) + 1,
    };
    memory.lastFocusedConcept = input.primaryConcept?.trim() || concept;
  }

  if (input.action === "free" && input.studentMessage?.trim()) {
    const freeQuestions = [...(memory.freeQuestions ?? [])];
    freeQuestions.push({
      text: input.studentMessage.trim().slice(0, 280),
      pageNumber: input.pageNumber,
      askedAt: new Date().toISOString(),
    });
    memory.freeQuestions = freeQuestions.slice(-8);

    const lower = input.studentMessage.toLowerCase();
    if (/no entiendo|no me queda|más fácil|más simple|explícame mejor/.test(lower)) {
      memory.simplerRequestCount += 1;
    }
  }

  return {
    ...session,
    narrationMemory: memory,
    lastUpdated: new Date().toISOString(),
  };
}

/** @deprecated use recordNarrationInterrupt */
export function recordNarrationMicroAction(
  session: GuidedStudySession,
  action: NarrationInterruptAction,
  primaryConcept?: string,
): GuidedStudySession {
  return recordNarrationInterrupt(session, {
    action,
    primaryConcept,
    pageNumber: session.currentPage,
  });
}

export function buildNarrationMemoryPrompt(memory: NarrationSessionMemory): string {
  const parts: string[] = [];

  if (memory.simplerRequestCount >= 2) {
    parts.push(
      "El estudiante ha pedido varias veces explicaciones más fáciles: usa lenguaje más simple, analogías cotidianas y frases más cortas.",
    );
  } else if (memory.simplerRequestCount === 1) {
    parts.push("El estudiante prefiere explicaciones accesibles: evita tecnicismos innecesarios.");
  }

  const focused = Object.entries(memory.conceptFocusCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (focused.length) {
    const list = focused.map(([concept, count]) => `«${concept}» (${count} veces)`).join(", ");
    parts.push(
      `Conceptos que el estudiante repite o le cuestan: ${list}. Priorízalos en esta clase si aparecen en la página.`,
    );
  }

  if (memory.lastFocusedConcept) {
    parts.push(`Último concepto que pidió profundizar: «${memory.lastFocusedConcept}».`);
  }

  const recentFree = (memory.freeQuestions ?? []).slice(-3);
  if (recentFree.length) {
    const list = recentFree.map((q) => `«${q.text}» (pág. ${q.pageNumber})`).join("; ");
    parts.push(`Preguntas recientes del estudiante durante la clase: ${list}.`);
  }

  return parts.join("\n");
}

export function suggestNarrationStyle(memory: NarrationSessionMemory): NarrationStyle | null {
  if (memory.simplerRequestCount >= 3) return "quick";
  return null;
}
