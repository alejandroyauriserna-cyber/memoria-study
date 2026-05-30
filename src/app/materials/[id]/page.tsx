import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { Button } from "@/components/ui/button";
import { ArrowDown, BookOpen, CalendarDays, Heart, User } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function MaterialDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const admin = createAdminClient();
  const result = await admin.from("materials").select("*").eq("id", id).single();
  const { data, error } = result;

  return (
    <pre>
      {JSON.stringify({ id, data, error }, null, 2)}
    </pre>
  );
}
