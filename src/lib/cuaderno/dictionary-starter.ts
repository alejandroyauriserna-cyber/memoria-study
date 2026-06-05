import type { CuadernoDictionaryResponse } from "@/types/cuaderno";

export const DICTIONARY_EXAMPLES = [
  "Exhorto",
  "Acto jurídico",
  "Negocio jurídico",
  "Antijuridicidad",
  "Compensación",
  "Casación",
] as const;

export const DICTIONARY_STARTER_HINTS: Record<string, string> = {
  Exhorto: "Resolución que ordena cumplir lo ya decidido en el proceso.",
  "Acto jurídico": "Manifestación de voluntad con efectos jurídicos.",
  "Negocio jurídico": "Acuerdo de voluntades orientado a efectos jurídicos.",
  Antijuridicidad: "Contrariedad del hecho con el ordenamiento jurídico.",
  Compensación: "Extinción recíproca de obligaciones exigibles.",
  Casación: "Recurso extraordinario ante la Corte Suprema.",
};

export const DICTIONARY_FEATURED_PREVIEW: CuadernoDictionaryResponse = {
  term: "Acto jurídico",
  sections: [
    {
      id: "definicion_simple",
      title: "Definición simple",
      content:
        "Es la manifestación de voluntad, consentimiento, declaración de voluntad o conducta humana a la que la ley atribuye efectos jurídicos.",
    },
    {
      id: "definicion_juridica",
      title: "Definición jurídica",
      content:
        "En el Código Civil peruano, el acto jurídico se vincula con la existencia de sujetos capaces, objeto lícito, causa lícita y solemnidades cuando la ley las exige.",
    },
    {
      id: "ejemplo_practico",
      title: "Ejemplo práctico",
      content:
        "La firma de un contrato de compraventa, la aceptación de una herencia o la renuncia a un derecho son actos jurídicos típicos en Derecho Civil.",
    },
    {
      id: "relacion_curso",
      title: "Relación con el curso",
      content:
        "Es uno de los conceptos base de Personas, bienes y acto jurídico. Aparece en casi todos los cursos de la carrera.",
    },
  ],
};
