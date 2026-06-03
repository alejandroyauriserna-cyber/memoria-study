import { extractPdfFromBuffer } from "@/lib/pdf/extract";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CuadernoClass } from "@/types/cuaderno";

export async function loadCuadernoPdfContext(materialId: string | null): Promise<string | null> {
  if (!materialId) return null;

  const admin = createAdminClient();
  const { data: material } = await admin
    .from("materials")
    .select("file_url,file_name")
    .eq("id", materialId)
    .maybeSingle();

  if (!material?.file_url) return null;

  try {
    const response = await fetch(material.file_url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const extracted = await extractPdfFromBuffer(
      buffer,
      material.file_name ?? "material.pdf",
    );
    return extracted.text.slice(0, 12000);
  } catch {
    return null;
  }
}

export function buildCuadernoStudyContext(
  cuadernoClass: CuadernoClass,
  pdfText?: string | null,
): string {
  const parts = [
    `CURSO: ${cuadernoClass.courseName} (${cuadernoClass.cycleLabel})`,
    `CLASE: ${cuadernoClass.title}${cuadernoClass.topic ? ` — ${cuadernoClass.topic}` : ""}`,
  ];

  if (cuadernoClass.classDate) {
    parts.push(`FECHA: ${cuadernoClass.classDate}`);
  }

  if (cuadernoClass.notes.trim()) {
    parts.push(`APUNTES DEL ESTUDIANTE:\n${cuadernoClass.notes.trim()}`);
  }

  if (cuadernoClass.extractedConcepts.length) {
    parts.push(
      `CONCEPTOS DETECTADOS EN APUNTES:\n${cuadernoClass.extractedConcepts.map((c) => `- ${c}`).join("\n")}`,
    );
  }

  if (pdfText?.trim()) {
    parts.push(`CONTENIDO DEL PDF VINCULADO:\n${pdfText.trim()}`);
  }

  return parts.join("\n\n");
}
