"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { Material } from "@/types/material";

const typeLabel: Record<string, string> = {
  apunte: "Apunte",
  resumen: "Resumen",
  pdf: "PDF",
  caso: "Caso",
  guia: "Guía",
  otro: "Material",
};

export function MaterialFileRow({
  material,
  selected = false,
  isFavorite = false,
  onSelect,
  onToggleFavorite,
}: {
  material: Material;
  selected?: boolean;
  isFavorite?: boolean;
  onSelect?: (material: Material) => void;
  onToggleFavorite?: (material: Material) => void;
}) {
  if (!material.id) return null;

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg pr-1 transition ${
        selected
          ? "bg-[rgba(0,255,213,0.12)] ring-1 ring-[rgba(0,255,213,0.25)]"
          : "hover:bg-[rgba(0,255,213,0.06)]"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(material)}
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-6 pr-1 text-left text-sm"
      >
        <span className="shrink-0 text-[#00FFD5]/70 group-hover:text-[#00FFD5]">•</span>
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "font-semibold text-[#F5F7FA]" : "text-[#F5F7FA]/85 group-hover:text-[#F5F7FA]"
          }`}
        >
          {material.title}
        </span>
        <span className="shrink-0 rounded-md bg-[rgba(0,255,213,0.06)] px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {typeLabel[material.materialType] ?? "PDF"}
        </span>
      </button>

      {onToggleFavorite ? (
        <button
          type="button"
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(material);
          }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
            isFavorite
              ? "text-[#00FFD5]"
              : "text-muted-foreground opacity-0 hover:bg-[rgba(0,255,213,0.08)] group-hover:opacity-100"
          }`}
        >
          <Star size={13} className={isFavorite ? "fill-current" : undefined} />
        </button>
      ) : null}

      <Link
        href={`/materials/${material.id}`}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      >
        {material.title}
      </Link>
    </div>
  );
}
