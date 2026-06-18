const CONFUSION_PATTERNS = [
  /no\s+entiendo/i,
  /no\s+comprendo/i,
  /no\s+lo\s+entiendo/i,
  /no\s+me\s+queda\s+claro/i,
  /estoy\s+perdid[oa]/i,
  /no\s+sé\s+qué\s+significa/i,
  /expl[ií]came\s+de\s+nuevo/i,
  /muy\s+complicado/i,
  /no\s+capto/i,
];

export function isSocraticTrigger(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return CONFUSION_PATTERNS.some((p) => p.test(q));
}

export const SOCRATIC_CUSTOM_DIRECTIVE = `
MODO SOCRÁTICO ACTIVO — el estudiante expresó confusión o dependencia pasiva.

REGLAS OBLIGATORIAS:
- NO des la respuesta completa de inmediato.
- Primero guía con UNA pregunta reflexiva que active su razonamiento.
  Ejemplos: "¿Qué parte entiendes hasta ahora?", "¿Qué crees que significa este concepto?", "¿Con qué otro instituto lo relacionarías?"
- Solo después de esa guía, ofrece una pista breve (máximo 2 oraciones).
- Cierra invitando a que intente explicar con sus palabras.
- Tono de profesor universitario, no de chatbot servicial.
- Responde en customReply (texto plano, 3-5 oraciones).`.trim();
