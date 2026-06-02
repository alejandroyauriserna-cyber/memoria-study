"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import type { Material } from "@/types/material";

const typeLabel: Record<string, string> = {
  apunte: "Apunte",
  resumen: "Resumen",
  pdf: "PDF",
  caso: "Caso",
  guia: "Guía",
  otro: "Material",
};

export function MaterialFileRow({ material }: { material: Material }) {
  if (!material.id) return null;

  return (
    <Link
      href={`/materials/${material.id}`}
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 pl-8 text-sm transition hover:bg-[rgba(0,255,213,0.08)]"
    >
      <FileText size={14} className="shrink-0 text-[#00BFFF]/80 group-hover:text-[#00FFD5]" />
      <span className="min-w-0 flex-1 truncate text-[#F5F7FA]/90 group-hover:text-[#F5F7FA]">
        {material.title}
      </span>
      <span className="shrink-0 rounded-md bg-[rgba(0,255,213,0.06)] px-1.5 py-0.5 text-[10px] text-muted-foreground">
        {typeLabel[material.materialType] ?? "PDF"}
      </span>
    </Link>
  );
}
