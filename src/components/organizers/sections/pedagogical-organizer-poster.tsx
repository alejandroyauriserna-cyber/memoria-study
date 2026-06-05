"use client";

import { BookOpen, GitCompare, Lightbulb, Scale, Table2 } from "lucide-react";
import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";
import "@/components/organizers/sections/pedagogical-organizer.css";

type VisualSummary = NonNullable<StoredOrganizerContent["visualSummary"]>;

const CARD_PALETTES = [
  { bg: "#E8F4FC", border: "#5B9BD5", text: "#1a365d" },
  { bg: "#E8F8F0", border: "#6BBF8A", text: "#1a4731" },
  { bg: "#FFF4E5", border: "#E8A54B", text: "#5c3d1e" },
  { bg: "#F3E8FF", border: "#9B7BD4", text: "#3d2a66" },
  { bg: "#FFE8EC", border: "#E87A8F", text: "#5c1a2a" },
  { bg: "#E8FCF8", border: "#4ECDC4", text: "#1a4a47" },
];

export function PedagogicalOrganizerPoster({
  title,
  summary,
  visualSummary,
  centralConcept,
  axiomLabels,
}: {
  title: string;
  summary: string;
  visualSummary?: VisualSummary;
  centralConcept?: string;
  axiomLabels?: string[];
}) {
  const conceptCards = visualSummary?.conceptCards ?? [];
  const comparisons = visualSummary?.comparisons ?? [];
  const legalTables = visualSummary?.legalTables ?? [];
  const chainItems =
    axiomLabels?.length
      ? axiomLabels
      : conceptCards.slice(0, 8).map((card) => card.title);

  return (
    <article className="pedagogical-poster">
      <header className="pedagogical-poster__hero">
        <div className="pedagogical-poster__hero-side pedagogical-poster__hero-side--left">
          <div className="pedagogical-poster__ideas-box">
            <p className="pedagogical-poster__box-title">
              <Lightbulb size={14} />
              Ideas clave
            </p>
            <ul>
              {conceptCards.slice(0, 4).map((card) => (
                <li key={card.title}>{card.title}</li>
              ))}
              {!conceptCards.length ? <li>{summary.slice(0, 120)}…</li> : null}
            </ul>
          </div>
        </div>

        <div className="pedagogical-poster__hero-center">
          <p className="pedagogical-poster__kicker">Organizador visual · Derecho UNT</p>
          <h2 className="pedagogical-poster__title">{title}</h2>
          <div className="pedagogical-poster__emblem" aria-hidden>
            <Scale size={36} />
          </div>
          <p className="pedagogical-poster__subtitle">{centralConcept ?? "Síntesis pedagógica"}</p>
        </div>

        <div className="pedagogical-poster__hero-side pedagogical-poster__hero-side--right">
          {comparisons.slice(0, 2).map((item, index) => (
            <div
              key={item.title}
              className={`pedagogical-poster__compare-box pedagogical-poster__compare-box--${index === 0 ? "blue" : "coral"}`}
            >
              <p className="pedagogical-poster__box-title">{item.title}</p>
              <p className="pedagogical-poster__compare-snippet">{item.left.slice(0, 80)}…</p>
            </div>
          ))}
        </div>
      </header>

      {chainItems.length ? (
        <section className="pedagogical-poster__chain">
          <p className="pedagogical-poster__section-label">
            <span className="pedagogical-poster__section-num">1</span>
            Cadena conceptual
          </p>
          <div className="pedagogical-poster__chain-track">
            {chainItems.map((label, index) => (
              <div key={`${label}-${index}`} className="pedagogical-poster__chain-link">
                <span className="pedagogical-poster__chain-icon">{index + 1}</span>
                <span className="pedagogical-poster__chain-text">{label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {conceptCards.length ? (
        <section className="pedagogical-poster__cards">
          <p className="pedagogical-poster__section-label">
            <span className="pedagogical-poster__section-num">2</span>
            Conceptos esenciales
          </p>
          <div className="pedagogical-poster__card-grid">
            {conceptCards.map((card, index) => {
              const palette = CARD_PALETTES[index % CARD_PALETTES.length]!;
              return (
                <div
                  key={card.title}
                  className="pedagogical-poster__concept-card"
                  style={{
                    background: palette.bg,
                    borderColor: palette.border,
                    color: palette.text,
                  }}
                >
                  <p className="pedagogical-poster__concept-title">{card.title}</p>
                  <p className="pedagogical-poster__concept-desc">{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {comparisons.length ? (
        <section className="pedagogical-poster__comparisons">
          <p className="pedagogical-poster__section-label">
            <GitCompare size={14} />
            Comparaciones
          </p>
          {comparisons.map((item) => (
            <div key={item.title} className="pedagogical-poster__vs-row">
              <div className="pedagogical-poster__vs-col pedagogical-poster__vs-col--left">
                {item.left}
              </div>
              <div className="pedagogical-poster__vs-badge">VS</div>
              <div className="pedagogical-poster__vs-col pedagogical-poster__vs-col--right">
                {item.right}
              </div>
              <p className="pedagogical-poster__vs-title">{item.title}</p>
            </div>
          ))}
        </section>
      ) : null}

      {legalTables.length ? (
        <section className="pedagogical-poster__tables">
          <p className="pedagogical-poster__section-label">
            <Table2 size={14} />
            Cuadros jurídicos
          </p>
          {legalTables.map((table) => (
            <div key={table.title} className="pedagogical-poster__table-wrap">
              <p className="pedagogical-poster__table-title">{table.title}</p>
              <table>
                <thead>
                  <tr>
                    {table.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ) : null}

      <footer className="pedagogical-poster__footer">
        <BookOpen size={16} />
        <p>{summary}</p>
      </footer>
    </article>
  );
}
