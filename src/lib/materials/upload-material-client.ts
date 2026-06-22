"use client";

import { createClient } from "@/lib/supabase/browser";
import { studyDocumentContentType } from "@/lib/documents/kinds";
import { sanitizeMaterialFileName } from "@/lib/materials/sanitize-file-name";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadMaterialFileToStorage(file: File) {
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

  const contentType = studyDocumentContentType(file.name, file.type);
  const uploadBody =
    file.type === contentType
      ? file
      : new Blob([await file.arrayBuffer()], { type: contentType });

  const { error } = await supabase.storage.from("shared-materials").upload(storagePath, uploadBody, {
    contentType,
    upsert: false,
  });

  if (error) {
    const mimeRejected = /mime type/i.test(error.message) && /not supported/i.test(error.message);
    throw new Error(
      error.message.includes("Bucket not found")
        ? "El bucket shared-materials no está configurado en Supabase Storage."
        : mimeRejected
          ? "PowerPoint no permitido en Storage (.pptm/.pptx). Guarda como .pptx sin macros (Archivo → Guardar como) e inténtalo de nuevo."
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
