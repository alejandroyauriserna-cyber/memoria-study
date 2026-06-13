import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { preparePublicMaterialCatalog } from "@/lib/materials/prepare-public-material-catalog";
import {
  materialToSuggestion,
  organizerToSuggestion,
  scoreMaterial,
  scoreOrganizer,
  type SearchSuggestion,
} from "@/lib/search/score";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ materials: [], suggestions: [] });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";
    const favoritesOnly = url.searchParams.get("favorites") === "1";
    const suggest = url.searchParams.get("suggest") === "1";
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? (suggest ? 10 : 50))));

    if (!query) {
      return NextResponse.json({ materials: [], suggestions: [] });
    }

    const admin = createAdminClient();
    const term = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [{ data: materialsData, error: materialsError }, { data: organizersData }] = await Promise.all([
      admin
        .from("materials")
        .select("*")
        .eq("is_public", true)
        .or(
          `title.ilike.${term},description.ilike.${term},file_name.ilike.${term},course_name.ilike.${term},material_type.ilike.${term},author_name.ilike.${term}`,
        )
        .order("created_at", { ascending: false })
        .limit(80),
      user
        ? admin
            .from("organizers")
            .select("id, title, description, course_name, cycle_label, material_id, created_at")
            .eq("user_id", user.id)
            .or(`title.ilike.${term},description.ilike.${term}`)
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] }),
    ]);

    if (materialsError) {
      throw materialsError;
    }

    let favoriteIds = new Set<string>();

    if (user) {
      const { data: favorites, error: favoritesError } = await admin
        .schema("public")
        .from("favorites")
        .select("material_id")
        .eq("user_id", user.id);

      if (favoritesError) {
        throw favoritesError;
      }

      favoriteIds = new Set((favorites ?? []).map((favorite) => favorite.material_id as string));
    }

    const organizerByMaterial = new Map<string, { id: string }>();
    (organizersData ?? []).forEach((org) => {
      if (org.material_id) {
        organizerByMaterial.set(org.material_id, { id: org.id });
      }
    });

    const { catalog: dedupedMaterials, redirects } = preparePublicMaterialCatalog(
      (materialsData ?? []) as Parameters<typeof preparePublicMaterialCatalog>[0],
    );

    const materials = dedupedMaterials
      .map((material) => ({
        ...material,
        isFavorite: material.id
          ? favoriteIds.has(material.id) ||
            Array.from(redirects.entries()).some(
              ([duplicateId, winnerId]) =>
                winnerId === material.id && favoriteIds.has(duplicateId),
            )
          : false,
      }))
      .filter((material) => !favoritesOnly || material.isFavorite);

    const suggestions: SearchSuggestion[] = [];

    materials.forEach((material) => {
      const score = scoreMaterial(material, query);
      if (score <= 0) return;
      const linked = organizerByMaterial.get(material.id ?? "");
      suggestions.push(materialToSuggestion(material, score, linked?.id));
    });

    (organizersData ?? []).forEach((organizer) => {
      const score = scoreOrganizer(organizer, query);
      if (score <= 0) return;
      const duplicate = suggestions.some(
        (s) => s.kind === "organizer" && s.organizerId === organizer.id,
      );
      if (!duplicate) {
        suggestions.push(organizerToSuggestion(organizer, score));
      }
    });

    suggestions.sort((a, b) => b.score - a.score);

    const topSuggestions = suggestions.slice(0, limit);

    if (suggest) {
      return NextResponse.json({ suggestions: topSuggestions });
    }

    return NextResponse.json({
      materials,
      suggestions: topSuggestions,
    });
  } catch (caught) {
    return NextResponse.json(
      {
        error: caught instanceof Error ? caught.message : "Error buscando materiales.",
        materials: [],
        suggestions: [],
      },
      { status: 500 },
    );
  }
}
