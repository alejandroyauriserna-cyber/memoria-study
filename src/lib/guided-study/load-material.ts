import { createAdminClient } from "@/lib/supabase/admin";
import { extractPdfFromBuffer } from "@/lib/pdf/extract";
import { downloadMaterialPdf } from "@/lib/organizers/download-material-pdf";
import { extractPdfPagesFromBuffer } from "@/lib/guided-study/extract-pages";
import { verifyMaterialAccess } from "@/lib/materials/verify-access";
import type { PdfPageContent } from "@/types/guided-legal-study";

export type LoadedStudyMaterial = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  courseName: string;
  cycleLabel: string;
  pages: PdfPageContent[];
};

const pageCache = new Map<string, { pages: PdfPageContent[]; loadedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

async function loadPagesFromDbCache(materialId: string): Promise<PdfPageContent[] | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("material_pdf_page_cache")
      .select("pages")
      .eq("material_id", materialId)
      .maybeSingle();

    if (error || !data?.pages || !Array.isArray(data.pages)) return null;
    return data.pages as PdfPageContent[];
  } catch {
    return null;
  }
}

async function savePagesToDbCache(materialId: string, pages: PdfPageContent[]) {
  try {
    const admin = createAdminClient();
    await admin.from("material_pdf_page_cache").upsert({
      material_id: materialId,
      pages,
      page_count: pages.length,
      cached_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal: in-memory cache still works
  }
}

export async function loadMaterialForGuidedStudy(
  materialId: string,
  userId?: string | null,
): Promise<LoadedStudyMaterial> {
  const access = await verifyMaterialAccess(materialId, userId);
  if (!access.allowed) {
    throw new Error(access.reason ?? "Sin acceso al material.");
  }

  const admin = createAdminClient();
  const { data: material, error } = await admin
    .schema("public")
    .from("materials")
    .select("id,title,file_name,file_url,course_name,cycle_label")
    .eq("id", materialId)
    .maybeSingle();

  if (error) throw error;
  if (!material?.file_url) {
    throw new Error("Material no encontrado.");
  }

  const cached = pageCache.get(materialId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return {
      id: material.id,
      title: material.title,
      fileName: material.file_name,
      fileUrl: material.file_url,
      courseName: material.course_name,
      cycleLabel: material.cycle_label,
      pages: cached.pages,
    };
  }

  const dbPages = await loadPagesFromDbCache(materialId);
  if (dbPages?.length) {
    pageCache.set(materialId, { pages: dbPages, loadedAt: Date.now() });
    return {
      id: material.id,
      title: material.title,
      fileName: material.file_name,
      fileUrl: material.file_url,
      courseName: material.course_name,
      cycleLabel: material.cycle_label,
      pages: dbPages,
    };
  }

  const { buffer } = await downloadMaterialPdf(material.file_url);
  let fallbackText: string | undefined;

  try {
    const extracted = await extractPdfFromBuffer(
      buffer,
      material.file_name ?? "material.pdf",
    );
    fallbackText = extracted.text;
  } catch {
    fallbackText = undefined;
  }

  const pages = await extractPdfPagesFromBuffer(buffer, fallbackText);
  pageCache.set(materialId, { pages, loadedAt: Date.now() });
  void savePagesToDbCache(materialId, pages);

  return {
    id: material.id,
    title: material.title,
    fileName: material.file_name,
    fileUrl: material.file_url,
    courseName: material.course_name,
    cycleLabel: material.cycle_label,
    pages,
  };
}

export function clearGuidedStudyCache(materialId?: string) {
  if (materialId) {
    pageCache.delete(materialId);
  } else {
    pageCache.clear();
  }
}
