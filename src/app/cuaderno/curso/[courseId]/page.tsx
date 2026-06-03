import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { CuadernoCourseView } from "@/components/cuaderno/cuaderno-course-view";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { findCourseById } from "@/lib/academic/helpers";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import { hasSupabaseEnv } from "@/lib/env";
import type { CuadernoClassRecord } from "@/types/cuaderno";

export const dynamic = "force-dynamic";

export default async function CuadernoCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  if (!hasSupabaseEnv()) notFound();

  const { courseId } = await params;
  const located = findCourseById(courseId);
  if (!located) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("cuaderno_classes")
    .select("*")
    .eq("user_id", user.id)
    .order("class_number", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const classes = (data ?? []).map((row) => recordToCuadernoClass(row as CuadernoClassRecord));

  return (
    <AppShell>
      <CuadernoCourseView
        courseId={located.course.id}
        courseName={located.course.name}
        cycleLabel={located.cycle.cycleLabel}
        initialClasses={classes}
      />
    </AppShell>
  );
}
