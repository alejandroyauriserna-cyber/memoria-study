import { generateGeminiText } from "@/lib/ai/gemini-text";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import type { CourseVisualPrefs } from "@/lib/cuaderno/preferences";
import { env } from "@/lib/env";

const VALID_COVERS = new Set<CourseVisualPrefs["cover"]>([
  "slate",
  "indigo",
  "amber",
  "rose",
  "teal",
  "violet",
]);

function parseCoverJson(raw: string, fallbackAccent: string): CourseCoverArt {
  const parsed = JSON.parse(raw) as Partial<CourseCoverArt>;
  const cover = parsed.cover && VALID_COVERS.has(parsed.cover) ? parsed.cover : "indigo";
  const motifs = Array.isArray(parsed.motifs)
    ? parsed.motifs.map(String).filter(Boolean).slice(0, 6)
    : ["Apuntes", "UNT", "Derecho"];

  return {
    icon: typeof parsed.icon === "string" && parsed.icon.length <= 4 ? parsed.icon : "📘",
    accent: typeof parsed.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.accent)
      ? parsed.accent
      : fallbackAccent,
    cover,
    motifs: motifs.length ? motifs : ["Apuntes", "Clases"],
    subtitle: typeof parsed.subtitle === "string" ? parsed.subtitle.slice(0, 48) : undefined,
  };
}

export async function generateCourseCoverArt(input: {
  courseId: string;
  courseName: string;
  cycleLabel?: string;
  classTitles?: string[];
}): Promise<CourseCoverArt> {
  const titles = (input.classTitles ?? []).slice(0, 8).join("; ") || "sin apuntes aún";

  const prompt = `Diseña la portada visual de un cuaderno universitario de derecho peruano para ${UNT_DERECHO_AUDIENCE}.

Curso: ${input.courseName} (id: ${input.courseId})
Ciclo: ${input.cycleLabel ?? "UNT"}
Temas en apuntes del alumno: ${titles}

Responde SOLO JSON:
{
  "icon": "un solo emoji representativo",
  "accent": "#hex color vibrante para acentos",
  "cover": "slate|indigo|amber|rose|teal|violet",
  "motifs": ["4-6 palabras cortas en español jurídico para decorar la portada, ej. Constitución, Amparo"],
  "subtitle": "frase corta opcional del área (máx 40 caracteres)"
}

Reglas:
- Motivos concretos del curso peruano, no genéricos.
- cover debe combinar con el área (penal=rose, constitucional=indigo, civil=teal, laboral=teal, etc.).`;

  if (!env.geminiApiKey) {
    return {
      icon: "📘",
      accent: "#00FFD5",
      cover: "indigo",
      motifs: ["Apuntes", input.courseName.split(" ").slice(0, 2).join(" "), "UNT"],
      subtitle: "Cuaderno jurídico",
    };
  }

  const raw = await generateGeminiText({ prompt, json: true, temperature: 0.5 });
  return parseCoverJson(raw, "#00FFD5");
}

export async function generateSheetCoverArt(input: {
  courseName: string;
  classTitle: string;
  topic?: string | null;
  notesPreview?: string;
}): Promise<{ icon: string; keyword: string; tint: string }> {
  const preview = (input.notesPreview ?? "").replace(/<!--[\s\S]*?-->/, "").trim().slice(0, 400);

  const prompt = `Mini portada de una hoja de apuntes de derecho (UNT Perú).
Curso: ${input.courseName}
Clase: ${input.classTitle}
Tema: ${input.topic ?? "—"}
Extracto: ${preview || "vacío"}

JSON únicamente:
{
  "icon": "un emoji",
  "keyword": "1-3 palabras clave del contenido",
  "tint": "#hex suave para fondo de mini portada"
}`;

  if (!env.geminiApiKey) {
    return { icon: "📄", keyword: input.classTitle.split(" ").slice(0, 2).join(" "), tint: "#1e293b" };
  }

  const raw = await generateGeminiText({ prompt, json: true, temperature: 0.4 });
  const parsed = JSON.parse(raw) as { icon?: string; keyword?: string; tint?: string };
  return {
    icon: typeof parsed.icon === "string" ? parsed.icon.slice(0, 4) : "📄",
    keyword: typeof parsed.keyword === "string" ? parsed.keyword.slice(0, 24) : input.classTitle,
    tint:
      typeof parsed.tint === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.tint)
        ? parsed.tint
        : "#1e293b",
  };
}
