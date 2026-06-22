"use client";

import { createClient } from "@/lib/supabase/browser";
import { sanitizePdfFileName } from "@/lib/jurisprudence/build-document-id";
import { JURISPRUDENCE_MAX_FILE_SIZE } from "@/lib/jurisprudence/upload-limits";

const BUCKET = "pdf-compress-temp";

export async function uploadPdfToCompressTemp(file: File) {
  if (file.size > JURISPRUDENCE_MAX_FILE_SIZE) {
    throw new Error("El PDF supera el límite permitido.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para comprimir el PDF.");
  }

  const safeName = sanitizePdfFileName(file.name);
  const storagePath = `${user.id}/compress-in/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? "Falta configurar el bucket pdf-compress-temp en Supabase."
        : `No se pudo preparar el PDF: ${error.message}`,
    );
  }

  return { storagePath };
}
