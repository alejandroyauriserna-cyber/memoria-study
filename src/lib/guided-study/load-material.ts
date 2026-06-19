import { createAdminClient } from "@/lib/supabase/admin";
import { extractPdfFromBuffer } from "@/lib/pdf/extract";
import { downloadMaterialPdf } from "@/lib/organizers/download-material-pdf";
import { extractPdfPagesFromBuffer } from "@/lib/guided-study/extract-pages";
import { extractPdfPagesWithPerPageOcr } from "@/lib/guided-study/extract-pages-ocr";
import { hasSubstantiveStudyText, cleanPageTextForStudy } from "@/lib/guided-study/prepare-study-page-text";
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
  if (!isGuidedStudyPageCacheUsable(pages)) return;

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

async function buildStudyPages(buffer: Buffer, fileName: string): Promise<PdfPageContent[]> {
  let fallbackText: string | undefined;

  try {
    const extracted = await extractPdfFromBuffer(buffer, fileName);
    fallbackText = extracted.text;
  } catch (error) {
    console.warn("[guided-study] PDF text extraction failed:", error);
    fallbackText = undefined;
  }

  let pages = await extractPdfPagesFromBuffer(buffer, fallbackText);
  if (isGuidedStudyPageCacheUsable(pages)) {
    return pages;
  }

  try {
    pages = await extractPdfPagesWithPerPageOcr(buffer, fileName);
    if (isGuidedStudyPageCacheUsable(pages)) {
      return pages;
    }
  } catch (error) {
    console.warn("[guided-study] per-page slide OCR failed:", error);
  }

  try {
    const forced = await extractPdfFromBuffer(buffer, fileName, { forceScanned: true });
    pages = await extractPdfPagesFromBuffer(buffer, forced.text);
  } catch (error) {
    console.warn("[guided-study] forced OCR fallback failed:", error);
  }

  return pages;
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
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS && isGuidedStudyPageCacheUsable(cached.pages)) {
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
  if (dbPages?.length && isGuidedStudyPageCacheUsable(dbPages)) {
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
  const pages = await buildStudyPages(buffer, material.file_name ?? "material.pdf");

  if (!isGuidedStudyPageCacheUsable(pages)) {
    throw new Error(
      "No se pudo leer el texto de este PDF de diapositivas. Espera unos minutos y vuelve a abrir el estudio guiado.",
    );
  }

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

function isGuidedStudyPageCacheUsable(pages: PdfPageContent[]): boolean {
  const joined = pages
    .map((page) => page.text.trim())
    .filter(Boolean)
    .join(" ");

  if (joined.length >= 400) {
    return true;
  }

  const sample = pages.find((page) => page.text.trim().length >= 40)?.text ?? pages[0]?.text ?? "";
  if (!sample.trim()) return false;
  return hasSubstantiveStudyText(cleanPageTextForStudy(sample)) || sample.length >= 120;
}
