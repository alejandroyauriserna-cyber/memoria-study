"use client";

import type { CuadernoAskAction } from "@/types/cuaderno";

const ACTIONS: Array<{
  id: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence" | "simplify";
  label: string;
  emoji: string;
}> = [
  { id: "explain", label: "Explicar", emoji: "💡" },
  { id: "legislation", label: "Relacionar CC", emoji: "⚖️" },
  { id: "flashcards", label: "Flashcard", emoji: "📚" },
  { id: "exam_questions", label: "Posible examen", emoji: "🎓" },
  { id: "simplify", label: "Simplificar", emoji: "🧠" },
];

export function CuadernoSelectionMenu({
  x,
  y,
  onAction,
}: {
  x: number;
  y: number;
  onAction: (
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence" | "simplify",
    selectedText: string,
  ) => void;
}) {
  const selectedText = typeof window !== "undefined" ? window.getSelection()?.toString().trim() ?? "" : "";

  return (
    <div
      className="cn-selection-menu cn-selection-menu--perplexity"
      style={{ left: x, top: y, transform: "translate(-50%, calc(-100% - 8px))" }}
      onMouseDown={(e) => e.preventDefault()}
      role="toolbar"
      aria-label="Acciones IA sobre selección"
    >
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="cn-selection-menu-btn"
          disabled={!selectedText}
          onClick={() => {
            if (!selectedText) return;
            if (action.id === "simplify") {
              onAction("explain", `Explica de forma simple y breve: «${selectedText}»`);
              return;
            }
            onAction(action.id, selectedText);
          }}
        >
          <span aria-hidden>{action.emoji}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
