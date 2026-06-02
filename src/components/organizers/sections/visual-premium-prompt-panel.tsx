"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  ClipboardCopy,
  FileUp,
  Loader2,
  Paperclip,
  Rocket,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import {
  ATLAS_JURIDICO_MODULE_SUBTITLE,
  ATLAS_JURIDICO_MODULE_TITLE,
  CREATIVITY_LEVELS,
  PERSONALIZATION_QUICK_CHIPS,
  buildFinalPrompt,
} from "@/lib/organizers/visual-prompt-mode-config";
import {
  isSupportedRubricFile,
  type VisualCreativityLevel,
  type VisualPremiumPrompt,
  type VisualPromptMode,
} from "@/lib/organizers/visual-prompt-types";
import {
  GEMINI_APP_URL,
  RUBRIC_ACCEPT,
  VISUAL_PROMPT_MODES,
} from "@/lib/organizers/visual-prompt-types";

const SECTION_IDS = {
  tipo: "vip-section-tipo",
  rubrica: "vip-section-rubrica",
  personalizacion: "vip-section-personalizacion",
  prompt: "vip-section-prompt",
  explicacion: "vip-section-explicacion",
} as const;

type NavItem = {
  id: string;
  label: string;
  requiresResult?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: SECTION_IDS.tipo, label: "Atlas" },
  { id: SECTION_IDS.rubrica, label: "Rúbrica" },
  { id: SECTION_IDS.personalizacion, label: "Personalización" },
  { id: SECTION_IDS.prompt, label: "Prompt", requiresResult: true },
  { id: SECTION_IDS.explicacion, label: "Explicación", requiresResult: true },
];

export function VisualPremiumPromptPanel({
  organizerId,
  visualPremiumPrompt,
  onGenerated,
  onClose,
}: {
  organizerId: string;
  visualPremiumPrompt?: VisualPremiumPrompt | null;
  onGenerated?: (content: unknown) => void;
  onClose?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastGeneratedAt = useRef<string | null>(null);

  const [mode, setMode] = useState<VisualPromptMode>(
    visualPremiumPrompt?.mode ?? "infographic",
  );
  const [creativityLevel, setCreativityLevel] = useState<VisualCreativityLevel>(
    visualPremiumPrompt?.creativityLevel ?? "balanced",
  );
  const [personalization, setPersonalization] = useState(
    visualPremiumPrompt?.studentPersonalization ?? "",
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [local, setLocal] = useState<VisualPremiumPrompt | null>(visualPremiumPrompt ?? null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [activeNav, setActiveNav] = useState<string>(SECTION_IDS.tipo);

  const selectedMode = VISUAL_PROMPT_MODES.find((m) => m.id === mode);

  useEffect(() => {
    if (visualPremiumPrompt) {
      setLocal(visualPremiumPrompt);
      setMode(visualPremiumPrompt.mode);
      setCreativityLevel(visualPremiumPrompt.creativityLevel ?? "balanced");
      setPersonalization(visualPremiumPrompt.studentPersonalization ?? "");
    }
  }, [visualPremiumPrompt]);

  const result = local ?? visualPremiumPrompt;
  const basePrompt = result?.basePrompt ?? result?.prompt ?? "";
  const finalPrompt = useMemo(
    () =>
      basePrompt
        ? buildFinalPrompt(basePrompt, { creativityLevel, studentPersonalization: personalization })
        : "",
    [basePrompt, creativityLevel, personalization],
  );

  useEffect(() => {
    if (!result?.generatedAt || result.generatedAt === lastGeneratedAt.current) return;
    lastGeneratedAt.current = result.generatedAt;
    window.setTimeout(() => {
      scrollToSection(SECTION_IDS.prompt);
    }, 120);
  }, [result?.generatedAt]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    function onScroll() {
      const el = scrollRef.current;
      if (!el) return;

      setShowBackToTop(el.scrollTop > 320);

      const offset = el.scrollTop + 120;
      for (let index = NAV_ITEMS.length - 1; index >= 0; index -= 1) {
        const item = NAV_ITEMS[index];
        if (item.requiresResult && !result) continue;
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= offset) {
          setActiveNav(item.id);
          break;
        }
      }
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [result]);

  function scrollToSection(id: string) {
    const container = scrollRef.current;
    const element = document.getElementById(id);
    if (!container || !element) return;

    const top = element.offsetTop - 16;
    container.scrollTo({ top, behavior: "smooth" });
    setActiveNav(id);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("creativityLevel", creativityLevel);
      if (personalization.trim()) {
        formData.append("personalization", personalization.trim());
      }
      if (rubricFile) {
        formData.append("rubric", rubricFile);
      }

      const response = await fetch(`/api/organizers/${organizerId}/visual-prompt`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el prompt.");
      }

      const next = payload.visualPremiumPrompt as VisualPremiumPrompt;
      setLocal(next);
      setCreativityLevel(next.creativityLevel ?? creativityLevel);
      setPersonalization(next.studentPersonalization ?? personalization);
      onGenerated?.(payload.organizer?.content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al generar la imagen educativa.");
    } finally {
      setGenerating(false);
    }
  }

  function handleRubricPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isSupportedRubricFile(file)) {
      setError("Formato no soportado. Usa PDF, DOCX, JPG o PNG.");
      event.target.value = "";
      return;
    }

    setError(null);
    setRubricFile(file);
    event.target.value = "";
  }

  function appendChip(text: string) {
    setPersonalization((prev) => {
      if (prev.includes(text)) return prev;
      return prev.trim() ? `${prev.trim()}\n${text}` : text;
    });
  }

  const copyPrompt = useCallback(async () => {
    if (!finalPrompt) return;
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  }, [finalPrompt]);

  const openGemini = useCallback(() => {
    window.open(GEMINI_APP_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#060b10]">
      {/* Header fijo */}
      <header className="z-20 shrink-0 border-b border-[#F59E0B]/20 bg-[#060b10]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FBBF24]">
            <Sparkles size={12} />
            {ATLAS_JURIDICO_MODULE_TITLE}
          </p>
          <p className="mt-0.5 truncate text-sm text-[#F5F7FA]/60">
            {ATLAS_JURIDICO_MODULE_SUBTITLE}
          </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#F5F7FA]/70 transition hover:border-[#F59E0B]/40 hover:bg-[#F59E0B]/10 hover:text-[#FBBF24]"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        {/* Nav móvil */}
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 lg:hidden">
          {NAV_ITEMS.map((item) => {
            if (item.requiresResult && !result) return null;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-[#F59E0B]/20 text-[#FBBF24]"
                    : "bg-white/[0.04] text-[#F5F7FA]/55 hover:text-[#F5F7FA]/80"
                }`}
              >
                ● {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Scroll único principal */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:px-8">
          {/* Nav lateral */}
          <nav className="hidden w-40 shrink-0 lg:block xl:w-44">
            <div className="sticky top-6 space-y-1">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#F5F7FA]/40">
                Progreso
              </p>
              {NAV_ITEMS.map((item) => {
                if (item.requiresResult && !result) return null;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                      active
                        ? "bg-[#F59E0B]/15 text-[#FBBF24]"
                        : "text-[#F5F7FA]/55 hover:bg-white/[0.04] hover:text-[#F5F7FA]/85"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        active ? "bg-[#F59E0B]" : "bg-[#F5F7FA]/25"
                      }`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 flex-1 space-y-10 pb-8">
            {/* PASO 1 — Tipo de atlas */}
            <StepSection id={SECTION_IDS.tipo} step={1} title="Tipo de atlas jurídico">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {VISUAL_PROMPT_MODES.map((item) => {
                  const active = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[#F59E0B]/50 bg-[#F59E0B]/12 shadow-[0_0_24px_rgba(245,158,11,0.12)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-[#F5F7FA]/55">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedMode ? (
                <div className="mt-4 rounded-xl border border-[#A855F7]/30 bg-[#A855F7]/10 px-4 py-3">
                  <p className="text-xs font-semibold text-[#C4B5FD]">Resultado esperado:</p>
                  <p className="mt-1 text-sm text-[#F5F7FA]/85">{selectedMode.expectedResult}</p>
                </div>
              ) : null}
            </StepSection>

            {/* PASO 2 — Rúbrica */}
            <StepSection id={SECTION_IDS.rubrica} step={2} title="Adjuntar rúbrica">
              <p className="mb-3 text-sm text-[#F5F7FA]/60">
                Opcional. La IA analizará criterios, puntajes y formato para adaptar el prompt.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={RUBRIC_ACCEPT}
                  className="hidden"
                  onChange={handleRubricPick}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#F59E0B]/40 bg-[#F59E0B]/8 px-4 py-2.5 text-sm font-semibold text-[#FBBF24] transition hover:border-[#F59E0B]/60 hover:bg-[#F59E0B]/12"
                >
                  <FileUp size={16} />
                  Subir rúbrica
                </button>
                <span className="text-xs text-[#F5F7FA]/45">PDF · DOCX · JPG · PNG</span>
                {rubricFile ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#F5F7FA]/80">
                    <Paperclip size={12} />
                    {rubricFile.name}
                    <button
                      type="button"
                      onClick={() => setRubricFile(null)}
                      className="text-[#F5F7FA]/50 hover:text-red-400"
                      aria-label="Quitar rúbrica"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : null}
              </div>
            </StepSection>

            {/* PASO 3 — Personalización */}
            <StepSection
              id={SECTION_IDS.personalizacion}
              step={3}
              title="Personalización adicional"
            >
              <label className="mb-2 block text-sm font-medium text-[#F5F7FA]/80">
                ¿Qué deseas agregar al prompt?
              </label>
              <textarea
                value={personalization}
                onChange={(event) => setPersonalization(event.target.value)}
                placeholder="Ej.: Usa colores rojo petróleo y dorado. Incluye más jurisprudencia. Prioriza artículos del Código Civil…"
                rows={5}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#0a1018] px-4 py-3 text-sm leading-relaxed text-[#F5F7FA] placeholder:text-[#F5F7FA]/30 focus:border-[#F59E0B]/40 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/25"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {PERSONALIZATION_QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => appendChip(chip.text)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-[#F5F7FA]/75 transition hover:border-[#F59E0B]/35 hover:bg-[#F59E0B]/10 hover:text-[#FBBF24]"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#F5F7FA]/50">
                  Nivel de creatividad editorial
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CREATIVITY_LEVELS.map((level) => {
                    const active = creativityLevel === level.id;
                    return (
                      <label
                        key={level.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 transition ${
                          active
                            ? "border-[#A855F7]/50 bg-[#A855F7]/12"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="creativityLevel"
                          value={level.id}
                          checked={active}
                          onChange={() => setCreativityLevel(level.id)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="block text-xs font-bold text-[#F5F7FA]">
                            {level.label}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-snug text-[#F5F7FA]/55">
                            {level.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </StepSection>

            {/* PASO 4 — Generar */}
            <section className="scroll-mt-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-6 text-sm font-bold text-[#1a1005] shadow-[0_0_40px_rgba(245,158,11,0.35)] transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {rubricFile ? "Analizando PDF y rúbrica…" : "Analizando tu PDF…"}
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Generar atlas para Gemini
                  </>
                )}
              </button>
              {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            </section>

            {/* PASO 5 — Prompt generado */}
            {result && finalPrompt ? (
              <StepSection id={SECTION_IDS.prompt} step={5} title="Prompt generado">
                <PremiumPromptCard
                  title={result.title}
                  modeLabel={
                    VISUAL_PROMPT_MODES.find((m) => m.id === result.mode)?.label ?? result.mode
                  }
                  content={finalPrompt}
                  copied={copied}
                  onCopy={copyPrompt}
                  onOpenGemini={openGemini}
                />

                <button
                  type="button"
                  onClick={() => setShowPromptDetails((prev) => !prev)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-xs font-medium text-[#F5F7FA]/70 transition hover:border-white/20"
                >
                  <span>Ver construcción del prompt (base + personalización)</span>
                  <ChevronDown
                    size={16}
                    className={`transition ${showPromptDetails ? "rotate-180" : ""}`}
                  />
                </button>

                {showPromptDetails ? (
                  <div className="mt-3 space-y-3">
                    <DetailBlock
                      title="📄 Prompt base IA"
                      content={basePrompt}
                    />
                    {personalization.trim() ? (
                      <DetailBlock
                        title="✍️ Personalización del estudiante"
                        content={personalization.trim()}
                      />
                    ) : null}
                  </div>
                ) : null}

                {result.rubricAnalysis ? (
                  <div className="mt-4">
                    <RubricPreview analysis={result.rubricAnalysis} />
                  </div>
                ) : null}
              </StepSection>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#F59E0B]/25 bg-[#F59E0B]/5 px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#A855F7] text-white shadow-lg">
                  <Sparkles size={24} />
                </div>
                <p className="mt-4 text-sm font-semibold text-[#F5F7FA]">
                  Completa los pasos y genera tu prompt
                </p>
                <p className="mt-1 text-xs text-[#F5F7FA]/55">
                  El prompt aparecerá aquí, justo después del botón generar.
                </p>
              </div>
            )}

            {/* PASO 6 — Explicación */}
            {result?.explanation?.length ? (
              <StepSection id={SECTION_IDS.explicacion} step={6} title="¿Por qué se generó así?">
                <ExplanationBlock lines={result.explanation} hasRubric={result.hasRubric} />
                {result.analysis ? (
                  <div className="mt-4">
                    <AnalysisSummary analysis={result.analysis} />
                  </div>
                ) : null}
              </StepSection>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer fijo */}
      <footer className="z-20 shrink-0 border-t border-[#F59E0B]/25 bg-[#060b10]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#F5F7FA]/55">
            {copied ? (
              <span className="font-semibold text-[#22C55E]">✓ Prompt copiado correctamente</span>
            ) : finalPrompt ? (
              `${finalPrompt.length.toLocaleString("es-PE")} caracteres · Atlas listo para Gemini`
            ) : (
              "Genera un atlas para habilitar la copia"
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPrompt}
              disabled={!finalPrompt}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-5 py-2.5 text-sm font-bold text-[#1a1005] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
              Copiar atlas
            </button>
            <button
              type="button"
              onClick={openGemini}
              disabled={!finalPrompt}
              className="inline-flex items-center gap-2 rounded-xl border border-[#4285F4]/45 bg-[#4285F4]/15 px-5 py-2.5 text-sm font-semibold text-[#93C5FD] transition hover:bg-[#4285F4]/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Rocket size={16} />
              Abrir Gemini
            </button>
          </div>
        </div>
      </footer>

      {/* Volver arriba */}
      {showBackToTop ? (
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-5 z-30 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0a1018]/95 px-4 py-2.5 text-xs font-semibold text-[#F5F7FA]/85 shadow-xl backdrop-blur-md transition hover:border-[#F59E0B]/40 hover:text-[#FBBF24] sm:right-8"
        >
          <ArrowUp size={14} />
          Volver arriba
        </button>
      ) : null}
    </div>
  );
}

function StepSection({
  id,
  step,
  title,
  children,
}: {
  id: string;
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F97316] text-sm font-bold text-[#1a1005]">
          {step}
        </span>
        <h2 className="text-lg font-bold text-[#F5F7FA]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PremiumPromptCard({
  title,
  modeLabel,
  content,
  copied,
  onCopy,
  onOpenGemini,
}: {
  title: string;
  modeLabel: string;
  content: string;
  copied: boolean;
  onCopy: () => void;
  onOpenGemini: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-[1px] shadow-[0_0_60px_rgba(66,133,244,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B] via-[#A855F7] to-[#4285F4]" />
      <div className="relative rounded-2xl bg-[#080d14]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4285F4] to-[#A855F7] shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#93C5FD]">
                Atlas jurídico final · Gemini Image
              </p>
              <h3 className="text-base font-bold text-[#F5F7FA]">{title}</h3>
              <p className="text-[11px] text-[#F5F7FA]/45">Modo: {modeLabel}</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[#F5F7FA]/60">
            {content.length.toLocaleString("es-PE")} caracteres
          </span>
        </div>

        <pre className="whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed text-[#F5F7FA]/90">
          {content}
        </pre>

        <div className="flex flex-wrap gap-2 border-t border-white/8 px-5 py-4">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-5 py-3 text-sm font-bold text-[#1a1005] shadow-lg transition hover:brightness-110 sm:flex-none"
          >
            {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
            Copiar atlas final
          </button>
          <button
            type="button"
            onClick={onOpenGemini}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#4285F4]/45 bg-[#4285F4]/15 px-5 py-3 text-sm font-semibold text-[#93C5FD] transition hover:bg-[#4285F4]/25 sm:flex-none"
          >
            <Rocket size={16} />
            Abrir Gemini
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#0a1018] px-4 py-3">
      <p className="text-xs font-semibold text-[#F5F7FA]/70">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-[#F5F7FA]/65">
        {content}
      </pre>
    </div>
  );
}

function ExplanationBlock({
  lines,
  hasRubric,
}: {
  lines: string[];
  hasRubric: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#22C55E]/25 bg-[#22C55E]/8 p-5">
      <ul className="space-y-2.5">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-[#F5F7FA]/85">
            <Check size={14} className="mt-0.5 shrink-0 text-[#22C55E]" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {hasRubric ? (
        <p className="mt-3 text-[11px] text-[#86EFAC]/80">
          El prompt incorpora criterios extraídos de la rúbrica adjunta.
        </p>
      ) : null}
    </div>
  );
}

function RubricPreview({
  analysis,
}: {
  analysis: NonNullable<VisualPremiumPrompt["rubricAnalysis"]>;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#F5F7FA]/50">
        Rúbrica analizada
        {analysis.fileName ? ` · ${analysis.fileName}` : ""}
      </p>
      {analysis.requestedFormat ? (
        <p className="text-sm font-semibold text-[#FBBF24]">
          Formato solicitado: {analysis.requestedFormat}
        </p>
      ) : null}
      {analysis.evaluationCriteria.length ? (
        <ul className="mt-2 space-y-1 text-[11px] text-[#F5F7FA]/70">
          {analysis.evaluationCriteria.slice(0, 5).map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AnalysisSummary({
  analysis,
}: {
  analysis: NonNullable<VisualPremiumPrompt["analysis"]>;
}) {
  const items = [
    { label: "Tema principal", value: analysis.centralTopic },
    { label: "Subtemas", value: analysis.subtopics.length },
    { label: "Conceptos", value: analysis.concepts.length },
    { label: "Artículos", value: analysis.articles.length },
    { label: "Jurisprudencia", value: analysis.jurisprudence.length },
    { label: "Comparaciones", value: analysis.comparisons.length },
  ];

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#F5F7FA]/50">
        Análisis del documento
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
          >
            <p className="text-[10px] text-[#F5F7FA]/45">{item.label}</p>
            <p className="text-sm font-semibold text-[#F5F7FA]/85">
              {typeof item.value === "number" ? item.value : item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
