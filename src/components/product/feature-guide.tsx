"use client";

import Link from "next/link";
import { ArrowRight, Compass, Route } from "lucide-react";
import {
  FEATURE_GUIDE_SECTIONS,
  FEATURE_GUIDE_START_HERE,
} from "@/lib/product/feature-guide";

type Props = {
  /** En home: versión compacta con enlace a la guía completa. */
  compact?: boolean;
};

export function FeatureGuide({ compact = false }: Props) {
  if (compact) {
    return (
      <section className="ms-feature-guide ms-feature-guide--compact" aria-labelledby="feature-guide-compact-title">
        <div className="ms-feature-guide__compact-head">
          <Compass size={18} className="text-accent" aria-hidden />
          <div>
            <h2 id="feature-guide-compact-title" className="ms-feature-guide__compact-title">
              ¿Para qué sirve cada cosa?
            </h2>
            <p className="ms-feature-guide__compact-lead">
              Guía rápida para tus amigos (y para ti): qué usar y cuándo.
            </p>
          </div>
          <Link href="/guia" className="ms-feature-guide__compact-cta">
            Ver guía completa
            <ArrowRight size={14} />
          </Link>
        </div>
        <ol className="ms-feature-guide__start-list ms-feature-guide__start-list--inline">
          {FEATURE_GUIDE_START_HERE.map((step) => (
            <li key={step}>{step.replace(/\*\*(.*?)\*\*/g, "$1")}</li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <div className="ms-feature-guide">
      <header className="ms-feature-guide__hero">
        <p className="ms-feature-guide__kicker">
          <Compass size={14} />
          Guía MemoriaStudy
        </p>
        <h1 className="ms-feature-guide__title">¿Para qué sirve cada función?</h1>
        <p className="ms-feature-guide__lead">
          MemoriaStudy tiene muchas piezas, pero no necesitas usarlas todas el primer día. Esta guía
          te dice qué es cada una y cuándo conviene usarla.
        </p>
      </header>

      <section className="ms-feature-guide__route" aria-labelledby="feature-guide-route">
        <h2 id="feature-guide-route" className="ms-feature-guide__route-title">
          <Route size={16} />
          Ruta recomendada (primer día)
        </h2>
        <ol className="ms-feature-guide__start-list">
          {FEATURE_GUIDE_START_HERE.map((step, index) => (
            <li key={step}>
              <span className="ms-feature-guide__step-num">{index + 1}</span>
              <span>{step.replace(/\*\*(.*?)\*\*/g, "$1")}</span>
            </li>
          ))}
        </ol>
      </section>

      {FEATURE_GUIDE_SECTIONS.map((section) => (
        <section key={section.id} className="ms-feature-guide__section" aria-labelledby={`fg-${section.id}`}>
          <h2 id={`fg-${section.id}`} className="ms-feature-guide__section-title">
            {section.title}
          </h2>
          <p className="ms-feature-guide__section-lead">{section.lead}</p>
          <div className="ms-feature-guide__grid">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.id} className="ms-feature-guide__card">
                  <div className="ms-feature-guide__card-icon">
                    <Icon size={20} aria-hidden />
                  </div>
                  <h3 className="ms-feature-guide__card-title">{item.title}</h3>
                  <p className="ms-feature-guide__card-summary">{item.summary}</p>
                  <p className="ms-feature-guide__card-when">
                    <strong>Cuándo usarlo:</strong> {item.whenToUse}
                  </p>
                  <Link href={item.href} className="ms-feature-guide__card-link">
                    {item.cta}
                    <ArrowRight size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
