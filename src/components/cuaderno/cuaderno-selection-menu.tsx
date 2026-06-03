"use client";

import type { CuadernoAskAction } from "@/types/cuaderno";

const ACTIONS: Array<{ id: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence"; label: string }> = [
  { id: "explain", label: "Explicar" },
  { id: "summarize", label: "Resumir" },
  { id: "mind_map", label: "Mapa mental" },
  { id: "flashcards", label: "Flashcards" },
  { id: "exam_questions", label: "Preguntas" },
  { id: "relate", label: "Relacionar" },
  { id: "legislation", label: "Legislación" },
  { id: "jurisprudence", label: "Jurisprudencia" },
];

export function CuadernoSelectionMenu({
  x,
  y,
  onAction,
}: {
  x: number;
  y: number;
  onAction: (
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence",
    selectedText: string,
  ) => void;
}) {
  return (
    <div
      className="cn-selection-menu"
      style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#F5F7FA]/90 hover:bg-[#00FFD5]/15 hover:text-[#00FFD5]"
          onClick={() => {
            const text = window.getSelection()?.toString().trim() ?? "";
            if (!text) return;
            onAction(action.id, text);
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
