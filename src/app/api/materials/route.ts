import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
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

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes subir un archivo válido." }, { status: 400 });
    }

    const body = createMaterialSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      materialType: formData.get("materialType"),
      courseId: formData.get("courseId"),
      courseName: formData.get("courseName"),
      cycleNumber: formData.get("cycleNumber"),
      cycleLabel: formData.get("cycleLabel"),
    });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión para subir materiales." }, { status: 401 });
    }

    const admin = createAdminClient();
    const bucket = "shared-materials";
    const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

    const bucketInfo = await admin.storage.getBucket(bucket);
    if (!bucketInfo.data) {
      await admin.storage.createBucket(bucket, { public: true });
    }

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

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

    if (profileSelectError) {
      throw profileSelectError;
    }

    if (profileData) {
      const { error: profileUpdateError } = await admin
        .from("user_profiles")
        .update({
          total_shared: (profileData.total_shared ?? 0) + 1,
          reputation_points: (profileData.reputation_points ?? 0) + 10,
        })
        .eq("user_id", user.id);

      if (profileUpdateError) {
        throw profileUpdateError;
      }
    } else {
      const { error: profileInsertError } = await admin.from("user_profiles").insert({
        user_id: user.id,
        email: user.email,
        total_shared: 1,
        reputation_points: 10,
      });

      if (profileInsertError) {
        throw profileInsertError;
      }
    }

    return NextResponse.json({ material: recordToMaterial(data as MaterialRecord) }, { status: 201 });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error creando material." },
      { status: 500 },
    );
  }
}
