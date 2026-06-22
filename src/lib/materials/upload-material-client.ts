"use client";

import { createClient } from "@/lib/supabase/browser";
import { studyDocumentContentType } from "@/lib/documents/kinds";
import { sanitizeMaterialFileName } from "@/lib/materials/sanitize-file-name";
import { preparePdfForUpload } from "@/lib/pdf/prepare-pdf-upload";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadMaterialFileToStorage(
  file: File,
  options?: { onProgress?: (message: string) => void },
) {
  const isPdf =
    file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
  const prepared = isPdf
    ? await preparePdfForUpload(file, options)
    : { file, optimized: false, originalBytes: file.size, finalBytes: file.size };

  file = prepared.file;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("El archivo supera el límite permitido.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para subir materiales.");
  }

  const fileHash = await sha256Hex(file);
  const sanitizedFileName = sanitizeMaterialFileName(file.name);
  const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizedFileName}`;

  const { error } = await supabase.storage.from("shared-materials").upload(storagePath, file, {
    contentType: studyDocumentContentType(file.name, file.type),
    upsert: false,
  });

  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? "El bucket shared-materials no está configurado en Supabase Storage."
        : `No se pudo subir el archivo: ${error.message}`,
    );
  }

  const { data } = supabase.storage.from("shared-materials").getPublicUrl(storagePath);
  if (!data.publicUrl) {
    throw new Error("No se pudo obtener la URL pública del archivo subido.");
  }

  return {
    fileUrl: data.publicUrl,
    fileHash,
    storagePath,
    fileName: file.name,
  };
}
