import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildJurisprudenceDocumentId,
  ensureUniqueJurisprudenceId,
  isJurisprudenceMateria,
  isJurisprudenceTipo,
  parseKeywordsInput,
} from "@/lib/jurisprudence/build-document-id";
import { findJurisprudenceDuplicates } from "@/lib/jurisprudence/find-duplicates";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";
import { isAllowedDocumentWebUrl, normalizeWebUrlInput } from "@/lib/legal-sources/allowed-url-domains";

export const runtime = "nodejs";
export const maxDuration = 120;

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (const line of lines.slice(1)) {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

export async function POST(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get("file");
    const publishImmediately = formData.get("publish") === "1";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Sube un archivo CSV." }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCsv(csvText);

    if (!rows.length) {
      return NextResponse.json(
        { error: "CSV vacío o sin filas de datos. Cabeceras: title,tipo,materia,submateria,year,organo,summary,keywords,expediente,pdfUrl" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const results: Array<{ row: number; ok: boolean; id?: string; error?: string }> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const title = row.title?.trim();
      const tipo = row.tipo?.trim();
      const materia = row.materia?.trim();
      const submateria = row.submateria?.trim();
      const year = Number(row.year);
      const organo = row.organo?.trim();
      const summary = row.summary?.trim();
      const pdfUrlRaw = row.pdfurl?.trim() || row.pdf_url?.trim() || row.pdfUrl?.trim();

      if (!title || !isJurisprudenceTipo(tipo) || !isJurisprudenceMateria(materia) || !submateria || !organo || !summary) {
        results.push({ row: index + 2, ok: false, error: "Campos obligatorios inválidos." });
        continue;
      }

      if (!Number.isFinite(year) || year < 1900 || year > 2100) {
        results.push({ row: index + 2, ok: false, error: "Año inválido." });
        continue;
      }

      let pdfUrl = "";
      if (pdfUrlRaw) {
        const normalized = normalizeWebUrlInput(pdfUrlRaw);
        if (!isAllowedDocumentWebUrl(normalized)) {
          results.push({ row: index + 2, ok: false, error: "URL PDF no permitida." });
          continue;
        }
        pdfUrl = normalized;
      }

      const duplicate = await findJurisprudenceDuplicates(admin, {
        title,
        expediente: row.expediente?.trim() || null,
      });
      if (duplicate) {
        results.push({ row: index + 2, ok: false, error: `Duplicado: ${duplicate.id}` });
        continue;
      }

      const baseId = buildJurisprudenceDocumentId(row.expediente?.trim() || null, title);
      let documentId = baseId;
      const keywords = parseKeywordsInput(row.keywords ?? "");
      if (!keywords.length) keywords.push(submateria.toLowerCase());

      const payload = {
        id: documentId,
        title,
        tipo,
        materia,
        submateria,
        year,
        organo,
        summary,
        keywords,
        pdf_url: pdfUrl,
        expediente: row.expediente?.trim() || null,
        source_url: pdfUrl || null,
        submitted_by: auth.user.id,
        status: publishImmediately ? "published" : "pending",
        is_public: publishImmediately,
      };

      let { data, error } = await admin.from("jurisprudence_documents").insert(payload).select("id").single();

      if (error?.code === "23505") {
        documentId = ensureUniqueJurisprudenceId(baseId, crypto.randomUUID().slice(0, 8));
        const retry = await admin
          .from("jurisprudence_documents")
          .insert({ ...payload, id: documentId })
          .select("id")
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error || !data) {
        results.push({ row: index + 2, ok: false, error: error?.message ?? "Error al insertar." });
      } else {
        results.push({ row: index + 2, ok: true, id: data.id as string });
      }
    }

    const imported = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return NextResponse.json({ imported, failed, results });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error en importación." },
      { status: 500 },
    );
  }
}
