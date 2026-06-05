"use client";

import { parseAiAnswerCards } from "@/lib/cuaderno/page-content-utils";

export function CuadernoAiAnswerCards({
  answer,
  accent = "#00ffd5",
}: {
  answer: string;
  accent?: string;
}) {
  const cards = parseAiAnswerCards(answer);
  if (!cards.length) return null;

  return (
    <div className="cn-ai-answer-cards">
      {cards.map((card, index) => (
        <article key={`${card.title}-${index}`} className="cn-ai-answer-card">
          <p className="cn-ai-answer-card-title" style={{ color: accent }}>
            {card.icon} {card.title.toUpperCase()}
          </p>
          <div className="cn-ai-answer-card-divider" />
          <p className="cn-ai-answer-card-body">{card.body}</p>
        </article>
      ))}
    </div>
  );
}
