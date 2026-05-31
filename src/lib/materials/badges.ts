import type { Material } from "@/types/material";

export function getMaterialBadges(material: Pick<Material, "views" | "likes">, recentViews = 0) {
  const badges: string[] = [];

  if ((material.views ?? 0) > 100) {
    badges.push("Popular");
  }

  if (recentViews > 20) {
    badges.push("Tendencia");
  }

  if ((material.likes ?? 0) >= 10 || (material.likes ?? 0) >= Math.max(5, Math.ceil((material.views ?? 0) * 0.15))) {
    badges.push("Destacado");
  }

  return badges;
}
