import type { GuidedStudySession, NarrationSessionMemory } from "@/types/guided-legal-study";
import type { NarrationMicroAction, NarrationStyle } from "@/types/tutor-voice";

export function emptyNarrationMemory(): NarrationSessionMemory {
  return {
    simplerRequestCount: 0,
    conceptFocusCounts: {},
    microActionCounts: {},
  };
}

export function getNarrationMemory(session: GuidedStudySession | null): NarrationSessionMemory {
  return session?.narrationMemory ?? emptyNarrationMemory();
}

export function recordNarrationMicroAction(
  session: GuidedStudySession,
  action: NarrationMicroAction,
  primaryConcept?: string,
): GuidedStudySession {
  const memory = { ...getNarrationMemory(session) };
  memory.microActionCounts = {
    ...memory.microActionCounts,
    [action]: (memory.microActionCounts[action] ?? 0) + 1,
  };

  if (action === "simpler") {
    memory.simplerRequestCount += 1;
  }

  if (primaryConcept?.trim()) {
    const key = primaryConcept.trim().toLowerCase();
    memory.conceptFocusCounts = {
      ...memory.conceptFocusCounts,
      [key]: (memory.conceptFocusCounts[key] ?? 0) + 1,
    };
    memory.lastFocusedConcept = primaryConcept.trim();
  }

  return {
    ...session,
    narrationMemory: memory,
    lastUpdated: new Date().toISOString(),
  };
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

  return parts.join("\n");
}

export function suggestNarrationStyle(memory: NarrationSessionMemory): NarrationStyle | null {
  if (memory.simplerRequestCount >= 3) return "quick";
  return null;
}
