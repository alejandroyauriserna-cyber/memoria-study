import { z } from "zod";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";
import { prepareTextForGeneration } from "@/lib/pdf/extract";
import {
  isJurisprudenceMateria,
  isJurisprudenceTipo,
} from "@/lib/jurisprudence/build-document-id";
import type {
  JurisprudenceFieldConfidence,
  JurisprudenceSuggestedMetadata,
} from "@/types/jurisprudence-ingest";
import type { JurisprudenceMateria, JurisprudenceTipo } from "@/types/jurisprudence";
import { JURISPRUDENCE_MATERIAS, JURISPRUDENCE_TIPOS } from "@/types/jurisprudence";

const CLASSIFICATION_TAXONOMY = `
Civil → Acto Jurídico, Contratos, Obligaciones, Responsabilidad Civil, Simulación, Prescripción
Penal → Autoría, Tentativa, Legítima Defensa, Concurso de Delitos
Tributario → Compensación, Prescripción, Determinación de la Obligación Tributaria
Laboral → Despido, Beneficios Sociales, Hostilidad Laboral
Constitucional → Amparo, Hábeas Corpus, Control de Constitucionalidad
Administrativo → Procedimiento Administrativo, Silencio Administrativo, Nulidad
Procesal → Nulidad, Apelación, Casación Procesal, Ejecución de Sentencia
`.trim();

const AiExtractSchema = z.object({
  title: z.string().min(5),
  tipo: z.string(),
  numeroDocumento: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100),
  organo: z.string().min(2),
  sala: z.string().optional().nullable(),
  distritoJudicial: z.string().optional().nullable(),
  materia: z.string(),
  submateria: z.string().min(2),
  keywords: z.array(z.string()).default([]),
  asuntoPrincipal: z.string().optional().nullable(),
  summary: z.string().min(40),
  expediente: z.string().optional().nullable(),
  confidence: z.object({
    title: z.number().min(0).max(1).optional(),
    tipo: z.number().min(0).max(1).optional(),
    numeroDocumento: z.number().min(0).max(1).optional(),
    year: z.number().min(0).max(1).optional(),
    organo: z.number().min(0).max(1).optional(),
    sala: z.number().min(0).max(1).optional(),
    distritoJudicial: z.number().min(0).max(1).optional(),
    materia: z.number().min(0).max(1).optional(),
    submateria: z.number().min(0).max(1).optional(),
    keywords: z.number().min(0).max(1).optional(),
    asuntoPrincipal: z.number().min(0).max(1).optional(),
    summary: z.number().min(0).max(1).optional(),
    expediente: z.number().min(0).max(1).optional(),
  }),
});

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function textBlob(...parts: Array<string | undefined | null>): string {
  return stripDiacritics(parts.filter(Boolean).join(" ").toLowerCase());
}

/** Señales de que el documento resuelve un recurso de casación (no una sentencia de mérito ordinaria). */
export function textSuggestsCasacion(...parts: Array<string | undefined | null>): boolean {
  const blob = textBlob(...parts);
  if (!blob) return false;

  if (/\bcasacion(es)?\b/.test(blob)) return true;
  if (/\bcasatorio(s)?\b/.test(blob)) return true;
  if (/\brecurso\s+de\s+casacion\b/.test(blob)) return true;
  if (/\bsentencia\s+de\s+casacion\b/.test(blob)) return true;
  if (/\bauto\s+de\s+casacion\b/.test(blob)) return true;
  if (/\bvista\s+(de\s+)?(la\s+)?casacion\b/.test(blob)) return true;
  if (/\brecurso\s+extraordinario\b/.test(blob) && /\bcorte\s+suprema\b/.test(blob)) {
    return true;
  }

  return false;
}

export function normalizeTipo(raw: string): JurisprudenceTipo {
  const n = stripDiacritics(raw)
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (n.includes("pleno") && n.includes("casatorio")) return "pleno_casatorio";
  if (n.includes("sentencia") && (n.includes("tc") || n.includes("tribunal_constitucional"))) {
    return "sentencia_tc";
  }
  if (n.includes("precedente") && n.includes("vinculante")) return "precedente_vinculante";
  if (n.includes("sentencia") && n.includes("casacion")) return "casacion";
  if (n.includes("casacion")) return "casacion";
  if (n.includes("resolucion")) return "resolucion";
  if (n.includes("expediente")) return "expediente";
  if (n.includes("sentencia")) return "sentencia";

  if (isJurisprudenceTipo(n)) return n;
  return "sentencia";
}

type TipoReconcileInput = Pick<
  JurisprudenceSuggestedMetadata,
  "title" | "tipo" | "summary" | "asuntoPrincipal" | "organo" | "keywords"
>;

/** Corrige sentencia → casación cuando el contenido indica un fallo casatorio. */
export function reconcileSuggestedTipo(input: TipoReconcileInput): JurisprudenceTipo {
  if (input.tipo !== "sentencia") return input.tipo;

  if (
    textSuggestsCasacion(
      input.title,
      input.summary,
      input.asuntoPrincipal,
      input.organo,
      input.keywords.join(" "),
    )
  ) {
    return "casacion";
  }

  return input.tipo;
}

function normalizeMateria(raw: string): JurisprudenceMateria {
  const n = raw.toLowerCase().trim();
  if (isJurisprudenceMateria(n)) return n;
  if (n.includes("civil")) return "civil";
  if (n.includes("penal")) return "penal";
  if (n.includes("constitucional")) return "constitucional";
  if (n.includes("tribut")) return "tributario";
  if (n.includes("labor")) return "laboral";
  if (n.includes("administr")) return "administrativo";
  if (n.includes("procesal")) return "procesal";
  return "civil";
}

function pickHeaderSample(fullText: string, fileName: string): string {
  const prepared = prepareTextForGeneration(fullText, 18_000);
  const head = prepared.text.slice(0, 12_000);
  return `ARCHIVO: ${fileName}\n\nTEXTO (prioriza primeras páginas, encabezados, sumilla, asunto, datos de identificación):\n${head}`;
}

export async function extractJurisprudenceMetadataWithAi(input: {
  extractedText: string;
  fileName: string;
}): Promise<{
  suggested: JurisprudenceSuggestedMetadata;
  confidence: JurisprudenceFieldConfidence;
}> {
  const sample = pickHeaderSample(input.extractedText, input.fileName);

  const prompt = `Eres un bibliotecario jurídico peruano especializado en indexar jurisprudencia de la Corte Suprema, TC, SUNAT y tribunales superiores.

Analiza el documento y extrae metadatos para catalogación. NO inventes datos que no aparezcan en el texto; si no hay certeza, baja la confianza.

TIPOS PERMITIDOS (campo tipo, valor exacto):
${JURISPRUDENCE_TIPOS.join(", ")}

MATERIAS PERMITIDAS (campo materia, valor exacto):
${JURISPRUDENCE_MATERIAS.join(", ")}

TAXONOMÍA DE SUBMATERIAS (sugerir la más específica):
${CLASSIFICATION_TAXONOMY}

INSTRUCCIONES:
- title: título descriptivo del fallo (no copies solo el nombre del archivo)
- summary: resumen breve 2-3 líneas en español jurídico, estilo catálogo universitario
- keywords: 3-8 términos jurídicos relevantes
- asuntoPrincipal: tema central en una frase
- confidence: probabilidad 0-1 de cada campo extraído

REGLAS PARA EL CAMPO tipo (MUY IMPORTANTE):
- sentencia: fallo de primera o segunda instancia que resuelve el fondo del litigio en vía ordinaria (juzgado, sala superior, tribunal de apelaciones).
- casacion: fallo que RESUELVE un recurso de casación (recurso extraordinario ante la Corte Suprema u homólogo), aunque el encabezado del PDF diga solo "SENTENCIA" o "Sentencia de casación".
- Si el documento menciona recurso de casación, casación, tribunal de casación, vista de la casación o sentencia de casación → tipo = casacion (NO sentencia).
- pleno_casatorio: acuerdos plenarios casatorios de la Corte Suprema.
- sentencia_tc: fallos del Tribunal Constitucional.
- resolucion / expediente: solo si no es un fallo jurisdiccional de fondo ni casación.

Responde SOLO JSON válido:
{
  "title": "...",
  "tipo": "casacion|sentencia|...",
  "numeroDocumento": "número de resolución/sentencia si aparece",
  "year": 2020,
  "organo": "ej. Corte Suprema de Justicia de la República",
  "sala": "ej. Sala Civil Permanente",
  "distritoJudicial": "ej. Lima",
  "materia": "civil",
  "submateria": "Acto Jurídico",
  "keywords": ["..."],
  "asuntoPrincipal": "...",
  "summary": "La Corte Suprema analiza...",
  "expediente": "número de expediente si aparece",
  "confidence": {
    "title": 0.95,
    "tipo": 0.9,
    "materia": 0.93,
    "submateria": 0.88,
    "organo": 0.99,
    "summary": 0.85,
    "year": 0.97,
    "expediente": 0.8
  }
}

${sample}`;

  const { text: raw } = await generateTextWithFallback({
    prompt,
    temperature: 0.15,
    json: true,
    timeoutMs: 90_000,
  });

  const parsed = AiExtractSchema.parse(JSON.parse(raw));

  const initialTipo = normalizeTipo(parsed.tipo);
  const keywords = parsed.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 12);

  const suggested: JurisprudenceSuggestedMetadata = {
    title: parsed.title.trim(),
    tipo: initialTipo,
    numeroDocumento: parsed.numeroDocumento?.trim() || undefined,
    year: parsed.year,
    organo: parsed.organo.trim(),
    sala: parsed.sala?.trim() || undefined,
    distritoJudicial: parsed.distritoJudicial?.trim() || undefined,
    materia: normalizeMateria(parsed.materia),
    submateria: parsed.submateria.trim(),
    keywords,
    asuntoPrincipal: parsed.asuntoPrincipal?.trim() || undefined,
    summary: parsed.summary.trim(),
    expediente: parsed.expediente?.trim() || undefined,
  };

  const reconciledTipo = reconcileSuggestedTipo(suggested);
  const confidence = { ...parsed.confidence } as JurisprudenceFieldConfidence;

  if (reconciledTipo !== suggested.tipo) {
    suggested.tipo = reconciledTipo;
    if (typeof confidence.tipo === "number") {
      confidence.tipo = Math.min(confidence.tipo, 0.82);
    }
  }

  if (!suggested.keywords.length) {
    suggested.keywords.push(suggested.submateria.toLowerCase());
  }

  return {
    suggested,
    confidence,
  };
}

export function computeOverallConfidence(confidence?: JurisprudenceFieldConfidence): number {
  if (!confidence) return 0;
  const keys: (keyof JurisprudenceFieldConfidence)[] = [
    "title",
    "materia",
    "submateria",
    "organo",
    "summary",
    "year",
    "tipo",
  ];
  const values = keys
    .map((k) => confidence[k])
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function itemNeedsReview(
  confidence?: JurisprudenceFieldConfidence,
  threshold = 0.7,
): boolean {
  const overall = computeOverallConfidence(confidence);
  if (overall < threshold) return true;
  const critical = [confidence?.materia, confidence?.submateria, confidence?.title];
  return critical.some((v) => v !== undefined && v < threshold);
}
