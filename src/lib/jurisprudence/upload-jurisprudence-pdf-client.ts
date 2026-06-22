"use client";

import { createClient } from "@/lib/supabase/browser";
import { sanitizePdfFileName } from "@/lib/jurisprudence/build-document-id";
import { JURISPRUDENCE_MAX_FILE_SIZE } from "@/lib/jurisprudence/upload-limits";

const BUCKET = "jurisprudence-pdfs";

export async function uploadJurisprudencePdfToStorage(file: File) {
  if (file.size > JURISPRUDENCE_MAX_FILE_SIZE) {
    throw new Error("El PDF supera el límite permitido.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para subir el PDF.");
  }

  const fileName = sanitizePdfFileName(file.name);
  const storagePath = `${user.id}/${crypto.randomUUID()}-${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? "El almacenamiento de jurisprudencia no está configurado en Supabase."
        : `No se pudo subir el PDF: ${error.message}`,
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  if (!data.publicUrl) {
    throw new Error("No se pudo obtener la URL pública del PDF.");
  }

  return {
    storagePath,
    publicUrl: data.publicUrl,
    fileName,
  };
}
