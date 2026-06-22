import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { FeatureGuide } from "@/components/product/feature-guide";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Guía de funciones",
  description: "Para qué sirve cada parte de MemoriaStudy: materiales, estudio guiado, organizadores y más.",
};

export default async function GuiaPage() {
  if (!hasSupabaseEnv()) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <FeatureGuide />
      </div>
    </AppShell>
  );
}
