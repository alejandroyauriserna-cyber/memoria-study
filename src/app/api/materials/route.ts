import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { normalizeAcademicForWrite } from "@/lib/academic/helpers";
import { materialInsertPayload, recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

const createMaterialSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  materialType: z.enum(["apunte", "resumen", "pdf", "caso", "guia", "otro"]),
  courseId: z.string().min(1),
  courseName: z.string().min(1),
  cycleNumber: z.coerce.number().int().positive(),
  cycleLabel: z.string().min(1),
});

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lastDotIndex = normalized.lastIndexOf(".");
  const nameWithoutExt = lastDotIndex > 0 ? normalized.substring(0, lastDotIndex) : normalized;
  const extension = lastDotIndex > 0 ? normalized.substring(lastDotIndex + 1) : "pdf";

  const sanitizedName = nameWithoutExt
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const sanitizedExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  const finalName = sanitizedName || "archivo";
  const finalExtension = sanitizedExtension ? `.${sanitizedExtension}` : ".pdf";

  return `${finalName}${finalExtension}`;
}

function formatValidationErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0] as string | undefined;

    if (field === "title") {
      fieldErrors.title = "El título debe tener al menos 3 caracteres.";
    } else if (field === "description") {
      fieldErrors.description = "La descripción debe tener al menos 10 caracteres.";
    } else if (field === "courseId" || field === "courseName" || field === "cycleLabel") {
      fieldErrors.course = "Debes seleccionar un curso.";
    } else if (field === "materialType") {
      fieldErrors.course = "Debes seleccionar un tipo de material válido.";
    } else {
      fieldErrors[field ?? "form"] = "El campo no es válido.";
    }
  }

  return fieldErrors;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { fieldErrors: { file: "Debes seleccionar un archivo PDF." } },
        { status: 400 },
      );
    }

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      return NextResponse.json(
        { fieldErrors: { file: "Debes seleccionar un archivo PDF." } },
        { status: 400 },
      );
    }

    const parsed = createMaterialSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      materialType: formData.get("materialType"),
      courseId: formData.get("courseId"),
      courseName: formData.get("courseName"),
      cycleNumber: formData.get("cycleNumber"),
      cycleLabel: formData.get("cycleLabel"),
    });

    const academic = normalizeAcademicForWrite({
      courseId: parsed.courseId,
      courseName: parsed.courseName,
      cycleNumber: parsed.cycleNumber,
      cycleLabel: parsed.cycleLabel,
    });

    if (!academic) {
      return NextResponse.json(
        {
          fieldErrors: {
            course:
              "El curso no pertenece a la malla oficial UNT 2021 o usa un identificador obsoleto.",
          },
        },
        { status: 400 },
      );
    }

    const body = { ...parsed, ...academic };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión para subir materiales." }, { status: 401 });
    }

    const admin = createAdminClient();
    const bucket = "shared-materials";

    const originalFileName = file.name;
    const sanitizedFileName = sanitizeFileName(originalFileName);
    const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizedFileName}`;

    console.log("Storage upload debug:", {
      originalFileName,
      sanitizedFileName,
      storagePath,
      bucket,
    });

    const bucketInfo = await admin.storage.getBucket(bucket);
    if (bucketInfo.error) {
      console.error("Storage bucket lookup failed:", bucketInfo.error);
      if (bucketInfo.error.message?.toLowerCase().includes("not found")) {
        const createBucketResponse = await admin.storage.createBucket(bucket, { public: true });
        if (createBucketResponse.error) {
          console.error("Storage bucket creation failed:", createBucketResponse.error);
          return NextResponse.json(
            {
              error:
                "El bucket de Storage no existe o no tiene permisos. Verifica la configuración del bucket shared-materials en Supabase Storage.",
            },
            { status: 500 },
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              "No se puede acceder al bucket de Storage. Verifica la configuración del proyecto y la clave de servicio en Supabase.",
          },
          { status: 500 },
        );
      }
    }

    if (!bucketInfo.data) {
      const createBucketResponse = await admin.storage.createBucket(bucket, { public: true });
      if (createBucketResponse.error) {
        console.error("Storage bucket creation failed:", createBucketResponse.error);
        return NextResponse.json(
          {
            error:
              "El bucket de Storage no existe o no tiene permisos. Verifica la configuración del bucket shared-materials en Supabase Storage.",
          },
          { status: 500 },
        );
      }
    }

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      return NextResponse.json(
        {
          error:
            "Ocurrió un error al subir el archivo. Verifica la configuración de Supabase Storage y que el nombre del archivo sea válido.",
        },
        { status: 500 },
      );
    }

    const urlResult = admin.storage.from(bucket).getPublicUrl(storagePath);
    if (!urlResult?.data?.publicUrl) {
      console.error("Storage public URL generation failed:", urlResult);
      return NextResponse.json(
        {
          error:
            "Ocurrió un error al obtener la URL pública del archivo. Verifica la configuración de Supabase Storage.",
        },
        { status: 500 },
      );
    }
    const fileUrl = urlResult.data.publicUrl;

    const materialPayload = materialInsertPayload(
      {
        authorName: user.user_metadata?.full_name ?? user.email ?? "Estudiante UNT",
        title: body.title,
        description: body.description,
        courseId: body.courseId,
        courseName: body.courseName,
        cycleNumber: body.cycleNumber,
        cycleLabel: body.cycleLabel,
        materialType: body.materialType,
        fileName: file.name,
        fileUrl,
        views: 0,
        downloads: 0,
        likes: 0,
      },
      user.id,
    );

    const { data, error } = await admin
      .from("materials")
      .insert(materialPayload)
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error("No se pudo guardar el material.");
    }

    const { data: profileData, error: profileSelectError } = await admin
      .from("user_profiles")
      .select("total_shared, reputation_points")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profileSelectError) {
      if (profileData) {
        await admin
          .from("user_profiles")
          .update({
            total_shared: (profileData.total_shared ?? 0) + 1,
            reputation_points: (profileData.reputation_points ?? 0) + 10,
          })
          .eq("user_id", user.id);
      } else {
        await admin.from("user_profiles").insert({
          user_id: user.id,
          email: user.email,
          academic_context: {},
          total_shared: 1,
          reputation_points: 10,
        });
      }
    }

    return NextResponse.json({ material: recordToMaterial(data as MaterialRecord) }, { status: 201 });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json(
        {
          fieldErrors: formatValidationErrors(caught),
          error: "Corrige los campos marcados.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error creando material." },
      { status: 500 },
    );
  }
}
