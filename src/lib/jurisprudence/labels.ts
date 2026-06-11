import type { JurisprudenceMateria, JurisprudenceTipo } from "@/types/jurisprudence";

export const JURISPRUDENCE_MATERIA_LABELS: Record<JurisprudenceMateria, string> = {
  civil: "Civil",
  penal: "Penal",
  constitucional: "Constitucional",
  tributario: "Tributario",
  laboral: "Laboral",
  administrativo: "Administrativo",
  procesal: "Procesal",
};

export const JURISPRUDENCE_TIPO_LABELS: Record<JurisprudenceTipo, string> = {
  casacion: "Casación",
  sentencia: "Sentencia",
  expediente: "Expediente",
  resolucion: "Resolución",
  precedente_vinculante: "Precedente Vinculante",
};

export const JURISPRUDENCE_SEARCH_EXAMPLES = [
  "simulación absoluta",
  "simulación relativa",
  "acto jurídico",
  "interpretación del acto jurídico",
  "compensación tributaria",
  "responsabilidad civil",
  "despido fraudulento",
  "buena fe contractual",
] as const;

export const JURISPRUDENCE_SEARCH_PLACEHOLDER =
  "Buscar casaciones, sentencias, expedientes o temas jurídicos...";
