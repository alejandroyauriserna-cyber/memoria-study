"use client";

import { useState } from "react";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { COURSE_SOURCE_PRESETS } from "@/lib/legal-sources/course-presets";
import {
  DEFAULT_STUDY_CATEGORIES,
  STUDY_CATEGORY_OPTIONS,
} from "@/lib/legal-sources/study-categories";
import {
  LEGAL_SOURCE_CATEGORY_LABELS,
  type LegalSourceCategory,
  type LegalSourcesSettings,
} from "@/types/legal-sources";

type LegalSourcesWizardProps = {
  settings: LegalSourcesSettings;
  onComplete: (next: LegalSourcesSettings) => void;
  onDismiss?: () => void;
};

export function LegalSourcesWizard({ settings, onComplete, onDismiss }: LegalSourcesWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Set<LegalSourceCategory>>(
    () => new Set(settings.studyCategories?.length ? settings.studyCategories : DEFAULT_STUDY_CATEGORIES),
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  function applyPreset(presetId: string) {
    const preset = COURSE_SOURCE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setSelected(new Set(preset.studyCategories));
  }

  function toggleCategory(id: LegalSourceCategory) {
    setActivePresetId(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function finish() {
    const studyCategories = [...selected];
    onComplete({
      ...settings,
      studyCategories,
      wizardCompleted: true,
    });
  }

  const selectedOptions = STUDY_CATEGORY_OPTIONS.filter((o) => selected.has(o.id));

  return (
    <section className="fuentes-wizard-panel">
      <p className="fuentes-panel-title">
        <Sparkles size={16} className="text-[#00FFD5]" />
        Configura tu biblioteca juridica
        <span className="ml-2 text-[10px] font-normal text-muted-foreground">Paso {step} de 2</span>
      </p>

      {step === 1 ? (
        <>
          <p className="fuentes-panel-copy">
            Elige un curso UNT o personaliza las categorias de fuentes que veras.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COURSE_SOURCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`fuentes-wizard-option${activePresetId === preset.id ? " is-active" : ""}`}
              >
                <span className="block text-sm font-semibold text-[#F5F7FA]">{preset.label}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {preset.description}
                </span>
              </button>
            ))}
          </div>
          <p className="fuentes-section-label mt-4">
            O elige categorias manualmente
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {STUDY_CATEGORY_OPTIONS.map((option) => {
              const active = selected.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleCategory(option.id)}
                  className={`fuentes-wizard-option flex items-start gap-3${active ? " is-active" : ""}`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      active
                        ? "border-[#00FFD5] bg-[rgba(0,255,213,0.2)] text-[#00FFD5]"
                        : "border-[rgba(255,255,255,0.15)]"
                    }`}
                  >
                    {active ? <Check size={12} /> : null}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#F5F7FA]">
                      {LEGAL_SOURCE_CATEGORY_LABELS[option.id]}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!selected.size}
              onClick={() => setStep(2)}
              className="tron-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
            >
              Siguiente
              <ChevronRight size={14} />
            </button>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="tron-btn-secondary h-10 rounded-xl px-4 text-sm font-semibold"
              >
                Omitir por ahora
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <p className="fuentes-panel-copy">
            Recomendaciones segun tu seleccion. Luego podras subir PDF, sincronizar URLs LP u
            oficiales en cada seccion.
          </p>
          <ul className="mt-4 space-y-2">
            {selectedOptions.map((option) => (
              <li
                key={option.id}
                className="fuentes-source-row"
              >
                <span className="font-semibold text-[#00FFD5]">
                  {LEGAL_SOURCE_CATEGORY_LABELS[option.id]}
                </span>
                <span className="mt-1 block text-muted-foreground">{option.recommendation}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="tron-btn-secondary h-10 rounded-xl px-4 text-sm font-semibold"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={finish}
              className="tron-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Check size={14} />
              Comenzar con mi biblioteca
            </button>
          </div>
        </>
      )}
    </section>
  );
}
