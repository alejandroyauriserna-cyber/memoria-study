import type { DailyConcept } from "@/types/micro-study";

export const LEGAL_CONCEPTS_SEED: Omit<DailyConcept, "id">[] = [
  {
    title: "Interpretación del Acto Jurídico",
    definition:
      "Proceso mediante el cual se determina el sentido y alcance de una declaración de voluntad expresada en un acto jurídico.",
    example:
      "En un contrato de compraventa ambiguo sobre la entrega, el juez interpreta si la obligación es de resultado o de medios según la intención de las partes.",
    explanation:
      "La interpretación busca descubrir la voluntad real de las partes. Se aplican reglas del Código Civil: sentido literal, contexto, comportamiento posterior y buena fe. En Perú, la interpretación restrictiva rige para cláusulas limitativas de derechos.",
    courseName: "Derecho Civil II: Acto Jurídico",
    estimatedMinutes: 1,
  },
  {
    title: "Principio de Legalidad Penal",
    definition:
      "Nadie puede ser sancionado por un hecho que no esté expresamente tipificado como delito en una ley anterior a su comisión.",
    example:
      "Una conducta novedosa no puede ser castigada retroactivamente aunque la sociedad la considere reprochable.",
    explanation:
      "Art. 2° CP y art. 2° CN. Garantiza nullum crimen sine lege. La analogía in malam partem está prohibida. El juez no crea tipos penales.",
    courseName: "Derecho Penal I",
    estimatedMinutes: 1,
  },
  {
    title: "Control de Constitucionalidad",
    definition:
      "Mecanismo para verificar que las normas y actos del Estado se ajusten a la Constitución Política.",
    example:
      "El TC declara inaplicable una norma en un caso concreto cuando vulnera un derecho fundamental.",
    explanation:
      "En Perú: control difuso (jueces) y concentrado (TC). Acciones: acción de inconstitucionalidad, hábeas corpus, amparo, cumplimiento. Protege la supremacía constitucional.",
    courseName: "Derecho Constitucional I",
    estimatedMinutes: 1,
  },
  {
    title: "Fuerza Obligatoria del Contrato",
    definition:
      "Los contratos válidamente celebrados son ley para las partes y deben cumplirse de buena fe.",
    example:
      "Si A vendió un bien a B, no puede revocar unilateralmente salvo causales legales de resolución o nulidad.",
    explanation:
      "Pacta sunt servanda. El contrato vincula desde su perfección. La autonomía de la voluntad encuentra límite en la ley, el orden público y la buena fe contractual (art. 1362 CC).",
    courseName: "Derecho de Contratos",
    estimatedMinutes: 1,
  },
  {
    title: "Presunción de Inocencia",
    definition:
      "Toda persona es inocente mientras no se declare judicialmente su responsabilidad penal mediante sentencia firme.",
    example:
      "La detención preventiva no equivale a condena; la carga de la prueba recae en el Ministerio Público.",
    explanation:
      "Principio constitucional (art. 2° CN). El acusado no debe probar su inocencia. Las dudas se resuelven a favor del imputado (in dubio pro reo).",
    courseName: "Derecho Procesal Penal",
    estimatedMinutes: 1,
  },
  {
    title: "Obligación de Dar",
    definition:
      "Vínculo jurídico en que el deudor debe transferir la propiedad o entregar una cosa determinada al acreedor.",
    example:
      "En la compraventa, el vendedor tiene la obligación de dar el bien y el comprador, de pagar el precio.",
    explanation:
      "Es una de las modalidades de las obligaciones (dar, hacer, no hacer). Puede recaer sobre cosa específica o genérica. El incumplimiento genera mora y responsabilidad civil.",
    courseName: "Derecho de Obligaciones",
    estimatedMinutes: 1,
  },
  {
    title: "Derecho Real de Propiedad",
    definition:
      "Facultad jurídica de usar, disponer y reivindicar una cosa corporal, con carácter absoluto erga omnes.",
    example:
      "El propietario puede excluir a terceros de su inmueble y recuperarlo mediante acción reivindicatoria.",
    explanation:
      "La propiedad es el derecho real por excelencia. En Perú se reconoce la función social de la propiedad. Se adquiere por tradición, accesión, sucesión, etc.",
    courseName: "Derecho de Derechos Reales",
    estimatedMinutes: 1,
  },
  {
    title: "Nulidad de Pleno Derecho",
    definition:
      "Sanción legal que priva de efectos a un acto jurídico por vicio grave, insanable sin necesidad de declaración judicial.",
    example:
      "Un contrato sobre cosa fuera del comercio humano es nulo de pleno derecho.",
    explanation:
      "Se distingue de la nulidad relativa (anulable). Puede ser alegada por cualquier interesado. El juez puede declararla de oficio en ciertos casos.",
    courseName: "Derecho Civil II: Acto Jurídico",
    estimatedMinutes: 1,
  },
  {
    title: "Habeas Corpus",
    definition:
      "Garantía constitucional que protege la libertad personal frente a detenciones arbitrarias o ilegales.",
    example:
      "Un familiar interpone habeas corpus cuando la policía retiene a alguien sin mandato judicial válido.",
    explanation:
      "Acción de tutela inmediata. El juez ordena la libertad o la legalización de la detención. Es irrenunciable y procede contra cualquier autoridad.",
    courseName: "Derecho Constitucional I",
    estimatedMinutes: 1,
  },
  {
    title: "Responsabilidad Contractual",
    definition:
      "Deber de reparar los daños causados por el incumplimiento de una obligación nacida de un contrato válido.",
    example:
      "El arrendador que no entrega el local en la fecha pactada responde por lucro cesante y daño emergente.",
    explanation:
      "Requiere contrato válido, incumplimiento imputable, daño y nexo causal. Se presume la culpa del deudor salvo obligaciones de resultado.",
    courseName: "Derecho de Contratos",
    estimatedMinutes: 1,
  },
];

export function pickDailyConcept(seed: number): DailyConcept {
  const index = Math.abs(seed) % LEGAL_CONCEPTS_SEED.length;
  const concept = LEGAL_CONCEPTS_SEED[index]!;
  return { id: `concept-${index}`, ...concept };
}
