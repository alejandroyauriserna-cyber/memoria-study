import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api/require-auth";
import { hasSupabaseEnv } from "@/lib/env";
import {
  buildJurisprudenceDocumentId,
  ensureUniqueJurisprudenceId,
  isJurisprudenceMateria,
  isJurisprudenceTipo,
  parseKeywordsInput,
  sanitizePdfFileName,
} from "@/lib/jurisprudence/build-document-id";
import { jurisprudenceRowToRecord, type JurisprudenceDocumentRow } from "@/lib/jurisprudence/mapper";
import { isAllowedDocumentWebUrl, normalizeWebUrlInput } from "@/lib/legal-sources/allowed-url-domains";
import {
  getUntAccessDenialMessage,
  isUntInstitutionalEmail,
} from "@/lib/jurisprudence/unt-access";
import { findJurisprudenceDuplicates } from "@/lib/jurisprudence/find-duplicates";
import {
  getEmailConfirmationMessage,
  isEmailConfirmed,
} from "@/lib/jurisprudence/require-confirmed-email";
import { isTrustedJurisprudenceContributor } from "@/lib/jurisprudence/trusted-contributor";
import { notifyJurisprudenceModerators } from "@/lib/jurisprudence/notify-moderators";
import { extractAndStoreJurisprudenceText } from "@/lib/jurisprudence/extract-document-text";
import {
  JURISPRUDENCE_MAX_FILE_SIZE,
  jurisprudenceMaxFileSizeLabel,
} from "@/lib/jurisprudence/upload-limits";

export const runtime = "nodejs";
export const maxDuration = 120;

const BUCKET = "jurisprudence-pdfs";

const submitJsonSchema = z.object({
  title: z.string().min(1),
  tipo: z.string(),
  materia: z.string(),
  submateria: z.string().min(1),
  year: z.coerce.number().int(),
  organo: z.string().min(1),
  summary: z.string().min(40),
  keywords: z.string().optional().default(""),
  expediente: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  storagePath: z.string().min(1).optional(),
  fileName: z.string().optional(),
});

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const bucketInfo = await admin.storage.getBucket(BUCKET);
  if (bucketInfo.error?.message?.toLowerCase().includes("not found") || !bucketInfo.data) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: JURISPRUDENCE_MAX_FILE_SIZE,
      allowedMimeTypes: ["application/pdf"],
    });
    return;
  }

  await admin.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: JURISPRUDENCE_MAX_FILE_SIZE,
    allowedMimeTypes: ["application/pdf"],
  });
}

type SubmitFields = {
  title: string;
  tipo: string;
  materia: string;
  submateria: string;
  year: number;
  organo: string;
  summary: string;
  keywordsRaw: string;
  expediente: string | null;
  pdfUrlExternal: string | null;
  storagePath?: string;
  uploadedFileName?: string;
};

async function processContribution(
  user: { id: string; email?: string | null },
  fields: SubmitFields,
) {
  const {
    title,
    tipo,
    materia,
    submateria,
    year,
    organo,
    summary,
    keywordsRaw,
    expediente,
    pdfUrlExternal,
    storagePath,
    uploadedFileName,
  } = fields;

  if (!isJurisprudenceTipo(tipo)) {
    return NextResponse.json({ error: "Tipo de resolución inválido." }, { status: 400 });
  }
  if (!isJurisprudenceMateria(materia)) {
    return NextResponse.json({ error: "Materia inválida." }, { status: 400 });
  }

  const hasStorage = Boolean(storagePath);
  if (!hasStorage && !pdfUrlExternal) {
    return NextResponse.json(
      { error: "Sube un PDF o pega el enlace oficial al documento." },
      { status: 400 },
    );
  }

  if (storagePath && !storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Ruta de archivo inválida." }, { status: 400 });
  }

  if (pdfUrlExternal) {
    const normalizedUrl = normalizeWebUrlInput(pdfUrlExternal);
    if (!isAllowedDocumentWebUrl(normalizedUrl)) {
      return NextResponse.json(
        {
          error:
            "Solo se admiten enlaces oficiales (PJ, TC, SUNAT, SPIJ o LP Pasión por el Derecho).",
        },
        { status: 400 },
      );
    }
  }

  const admin = createAdminClient();

  const duplicate = await findJurisprudenceDuplicates(admin, { title, expediente });
  if (duplicate) {
    const detail =
      duplicate.reason === "expediente"
        ? `Ya existe una resolución con expediente ${duplicate.expediente ?? duplicate.id}.`
        : `Ya existe una resolución con título muy similar: «${duplicate.title}».`;
    return NextResponse.json({ error: detail, duplicateId: duplicate.id }, { status: 409 });
  }

  const trusted = await isTrustedJurisprudenceContributor(admin, user.id);
  const initialStatus = trusted ? "published" : "pending";
  const initialPublic = trusted;

  let pdfUrl = pdfUrlExternal ?? "";
  let fileName: string | null = uploadedFileName ?? null;

  if (storagePath) {
    const { error: downloadError } = await admin.storage.from(BUCKET).download(storagePath);
    if (downloadError) {
      return NextResponse.json(
        { error: "No se encontró el PDF subido. Vuelve a seleccionar el archivo." },
        { status: 400 },
      );
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
    pdfUrl = urlData.publicUrl;
    fileName = fileName ?? storagePath.split("/").pop() ?? null;
  }

  const baseId = buildJurisprudenceDocumentId(expediente, title);
  let documentId = baseId;

  const keywords = parseKeywordsInput(keywordsRaw);
  if (!keywords.length) {
    keywords.push(submateria.toLowerCase());
  }

  const insertPayload = {
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
    expediente,
    source_url: pdfUrlExternal,
    file_name: fileName,
    submitted_by: user.id,
    status: initialStatus,
    is_public: initialPublic,
  };

  let { data: row, error: insertError } = await admin
    .from("jurisprudence_documents")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError?.code === "23505") {
    documentId = ensureUniqueJurisprudenceId(baseId, crypto.randomUUID().slice(0, 8));
    const retry = await admin
      .from("jurisprudence_documents")
      .insert({ ...insertPayload, id: documentId })
      .select("*")
      .single();
    row = retry.data;
    insertError = retry.error;
  }

  if (insertError || !row) {
    return NextResponse.json(
      { error: insertError?.message ?? "No se pudo registrar la resolución." },
      { status: 500 },
    );
  }

  const record = jurisprudenceRowToRecord(row);

  if (trusted) {
    void extractAndStoreJurisprudenceText(admin, row as JurisprudenceDocumentRow);
  }

  void notifyJurisprudenceModerators({
    documentId: record.id,
    title: record.title,
    submitterEmail: user.email,
    autoPublished: trusted,
  });

  return NextResponse.json({
    ok: true,
    pending: !trusted,
    autoPublished: trusted,
    document: {
      ...record,
      isCommunityContribution: true,
      status: row.status as string,
    },
  });
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const auth = await requireAuth(request, { rateLimit: { limit: 5, windowMs: 86_400_000 } });
    if (auth instanceof NextResponse) return auth;
    const user = auth.user;

    if (!isUntInstitutionalEmail(user.email)) {
      return NextResponse.json({ error: getUntAccessDenialMessage() }, { status: 403 });
    }

    if (!isEmailConfirmed(user)) {
      return NextResponse.json({ error: getEmailConfirmationMessage() }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const parsed = submitJsonSchema.parse(await request.json());
      return processContribution(user, {
        title: parsed.title.trim(),
        tipo: parsed.tipo.trim(),
        materia: parsed.materia.trim(),
        submateria: parsed.submateria.trim(),
        year: parsed.year,
        organo: parsed.organo.trim(),
        summary: parsed.summary.trim(),
        keywordsRaw: parsed.keywords?.trim() ?? "",
        expediente: parsed.expediente?.trim() || null,
        pdfUrlExternal: parsed.pdfUrl?.trim() || null,
        storagePath: parsed.storagePath,
        uploadedFileName: parsed.fileName,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const tipo = String(formData.get("tipo") ?? "").trim();
    const materia = String(formData.get("materia") ?? "").trim();
    const submateria = String(formData.get("submateria") ?? "").trim();
    const yearRaw = String(formData.get("year") ?? "").trim();
    const organo = String(formData.get("organo") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const keywordsRaw = String(formData.get("keywords") ?? "").trim();
    const expediente = String(formData.get("expediente") ?? "").trim() || null;
    const pdfUrlExternal = String(formData.get("pdfUrl") ?? "").trim() || null;

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
    }
    if (!isJurisprudenceTipo(tipo)) {
      return NextResponse.json({ error: "Tipo de resolución inválido." }, { status: 400 });
    }
    if (!isJurisprudenceMateria(materia)) {
      return NextResponse.json({ error: "Materia inválida." }, { status: 400 });
    }
    if (!submateria) {
      return NextResponse.json({ error: "Indica el tema o submateria." }, { status: 400 });
    }
    if (!organo) {
      return NextResponse.json({ error: "Indica el órgano emisor." }, { status: 400 });
    }
    if (!summary || summary.length < 40) {
      return NextResponse.json(
        { error: "Escribe un resumen de al menos 40 caracteres." },
        { status: 400 },
      );
    }

    const year = Number(yearRaw);
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "Año inválido." }, { status: 400 });
    }

    const hasFile = file instanceof File;
    if (!hasFile && !pdfUrlExternal) {
      return NextResponse.json(
        { error: "Sube un PDF o pega el enlace oficial al documento." },
        { status: 400 },
      );
    }

    if (hasFile) {
      const pdfFile = file as File;
      if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Solo se admiten archivos PDF." }, { status: 400 });
      }
      if (pdfFile.size > JURISPRUDENCE_MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `El PDF no puede superar ${jurisprudenceMaxFileSizeLabel()}.` },
          { status: 400 },
        );
      }

      await ensureBucket(createAdminClient());
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const sanitizedName = sanitizePdfFileName(pdfFile.name);
      const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizedName}`;

      const admin = createAdminClient();
      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

      if (uploadError) {
        return NextResponse.json({ error: "No se pudo subir el PDF." }, { status: 500 });
      }

      return processContribution(user, {
        title,
        tipo,
        materia,
        submateria,
        year,
        organo,
        summary,
        keywordsRaw,
        expediente,
        pdfUrlExternal: null,
        storagePath,
        uploadedFileName: sanitizedName,
      });
    }

    return processContribution(user, {
      title,
      tipo,
      materia,
      submateria,
      year,
      organo,
      summary,
      keywordsRaw,
      expediente,
      pdfUrlExternal,
    });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos del aporte inválidos." }, { status: 400 });
    }

    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al aportar resolución." },
      { status: 500 },
    );
  }
}
