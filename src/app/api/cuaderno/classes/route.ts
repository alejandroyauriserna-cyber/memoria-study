import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { normalizeCuadernoAcademicInput } from "@/lib/cuaderno/academic";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import type { CuadernoClassRecord } from "@/types/cuaderno";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cuaderno_classes")
      .select("*")
      .eq("user_id", user.id)
      .order("cycle_number", { ascending: true })
      .order("course_name", { ascending: true })
      .order("class_number", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const classes = (data ?? []).map((row) =>
      recordToCuadernoClass(row as CuadernoClassRecord),
    );

    return NextResponse.json({ classes });
  } catch (caught) {
    console.error("[cuaderno/classes GET]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar clases." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = (await request.json()) as {
      courseId?: string;
      courseName?: string;
      cycleNumber?: number;
      cycleLabel?: string;
      title?: string;
      topic?: string;
      classNumber?: number;
      classDate?: string;
      materialId?: string | null;
      notes?: string;
      isGroupNotebook?: boolean;
      sharePermission?: "view" | "edit";
    };

    if (!body.courseId || !body.courseName || !body.cycleNumber || !body.cycleLabel || !body.title) {
      return NextResponse.json({ error: "Faltan datos del curso o título de clase." }, { status: 400 });
    }

    const academic = normalizeCuadernoAcademicInput({
      courseId: body.courseId,
      courseName: body.courseName,
      cycleNumber: body.cycleNumber,
      cycleLabel: body.cycleLabel,
    });

    if (!academic) {
      return NextResponse.json(
        { error: "El curso no pertenece a la malla oficial UNT 2021 o usa un identificador obsoleto." },
        { status: 400 },
      );
    }

    const isGroupNotebook = body.isGroupNotebook === true;
    const sharePermission = body.sharePermission === "view" ? "view" : "edit";

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cuaderno_classes")
      .insert({
        user_id: user.id,
        course_id: academic.courseId,
        course_name: academic.courseName,
        cycle_number: academic.cycleNumber,
        cycle_label: academic.cycleLabel,
        title: body.title.trim(),
        topic: body.topic?.trim() || null,
        class_number: body.classNumber ?? null,
        class_date: body.classDate || null,
        notes: typeof body.notes === "string" ? body.notes : "",
        extracted_concepts: [],
        material_id: body.materialId ?? null,
        is_group_notebook: isGroupNotebook,
        is_shared: isGroupNotebook,
        share_permission: isGroupNotebook ? sharePermission : "view",
        share_token: isGroupNotebook ? randomBytes(16).toString("hex") : null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      cuadernoClass: recordToCuadernoClass(data as CuadernoClassRecord),
    });
  } catch (caught) {
    console.error("[cuaderno/classes POST]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al crear clase." },
      { status: 500 },
    );
  }
}
