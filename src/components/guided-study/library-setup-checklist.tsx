"use client";

import Link from "next/link";
import { Check, Circle, Library } from "lucide-react";
import type { LibrarySetupStep } from "@/lib/legal-sources/library-setup";

export function LibrarySetupChecklist({ steps }: { steps: LibrarySetupStep[] }) {
  if (!steps.length) return null;

  return (
    <div className="gs-setup-checklist">
      <p className="flex items-center gap-2 text-xs font-semibold text-[#F5F7FA]">
        <Library size={14} className="text-[#00FFD5]" />
        Configura tu biblioteca para estudiar
      </p>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
        Completa estos pasos para que el profesor cite fuentes verificables.
      </p>
      <ol className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2 text-[11px] text-[#F5F7FA]/90">
            {step.done ? (
              <Check size={14} className="mt-0.5 shrink-0 text-[#86EFAC]" />
            ) : (
              <Circle size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            )}
            <span className={step.done ? "text-muted-foreground line-through" : ""}>{step.label}</span>
          </li>
        ))}
      </ol>
      <Link
        href="/fuentes-juridicas"
        className="mt-3 inline-flex text-[10px] font-semibold text-[#00FFD5] hover:underline"
      >
        Ir a Fuentes Jurídicas →
      </Link>
    </div>
  );
}
