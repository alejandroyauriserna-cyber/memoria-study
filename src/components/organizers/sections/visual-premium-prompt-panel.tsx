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
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import {
  ATLAS_JURIDICO_MODULE_SUBTITLE,
  ATLAS_JURIDICO_MODULE_TITLE,
  CREATIVITY_LEVELS,
  PERSONALIZATION_PLACEHOLDER,
  PERSONALIZATION_QUICK_CHIPS,
  WHAT_MEMORIASTUDY_DOES,
  academicLevelLabel,
  buildFinalPrompt,
} from "@/lib/organizers/visual-prompt-mode-config";
import {
  isSupportedRubricFile,
  type VisualAcademicLevel,
  type VisualCreativityLevel,
  type VisualPremiumPrompt,
  type VisualPromptMode,
} from "@/lib/organizers/visual-prompt-types";
import {
  GEMINI_APP_URL,
  RUBRIC_ACCEPT,
  VISUAL_ACADEMIC_LEVELS,
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
  { id: SECTION_IDS.tipo, label: "Nivel" },
  { id: "vip-section-atlas", label: "Atlas" },
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
  const [academicLevel, setAcademicLevel] = useState<VisualAcademicLevel>(
    visualPremiumPrompt?.academicLevel ?? "undergraduate",
  );
  const [creativityLevel, setCreativityLevel] = useState<VisualCreativityLevel>(
    visualPremiumPrompt?.creativityLevel ?? "balanced",
  );
  const [personalization, setPersonalization] = useState(
    visualPremiumPrompt?.studentPersonalization ?? "",
  );
  const [imageTitle, setImageTitle] = useState(visualPremiumPrompt?.studentTitle ?? "");
  const [generating, setGenerating] = useState(false);
  const genProgress = useLoadingProgress(generating, "aiGenerate");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptResult, setPromptResult] = useState<VisualPremiumPrompt | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [activeNav, setActiveNav] = useState<string>(SECTION_IDS.tipo);

  const selectedMode = VISUAL_PROMPT_MODES.find((m) => m.id === mode);
  const selectedAcademicLevel = VISUAL_ACADEMIC_LEVELS.find((l) => l.id === academicLevel);

  useEffect(() => {
    if (visualPremiumPrompt) {
      setMode(visualPremiumPrompt.mode);
      setAcademicLevel(visualPremiumPrompt.academicLevel ?? "undergraduate");
      setCreativityLevel(visualPremiumPrompt.creativityLevel ?? "balanced");
      setPersonalization(visualPremiumPrompt.studentPersonalization ?? "");
      setImageTitle(visualPremiumPrompt.studentTitle ?? "");
    }
  }, [visualPremiumPrompt]);

  const hasPrompt = Boolean(promptResult);
  const basePrompt = promptResult?.basePrompt ?? promptResult?.prompt ?? "";
  const finalPrompt = useMemo(
    () =>
      basePrompt
        ? buildFinalPrompt(basePrompt, {
            creativityLevel,
            academicLevel,
            studentPersonalization: personalization,
          })
        : "",
    [basePrompt, creativityLevel, academicLevel, personalization],
  );

  const generationStatus: "idle" | "generating" | "ready" = generating
    ? "generating"
    : hasPrompt && finalPrompt
      ? "ready"
      : "idle";

  useEffect(() => {
    if (!promptResult?.generatedAt || promptResult.generatedAt === lastGeneratedAt.current) return;
    lastGeneratedAt.current = promptResult.generatedAt;
    window.setTimeout(() => {
      scrollToSection(SECTION_IDS.prompt);
    }, 120);
  }, [promptResult?.generatedAt]);

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
        if (item.requiresResult && !hasPrompt) continue;
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= offset) {
          setActiveNav(item.id);
          break;
        }
      }
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasPrompt]);

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
      formData.append("academicLevel", academicLevel);
      formData.append("creativityLevel", creativityLevel);
      if (personalization.trim()) {
        formData.append("personalization", personalization.trim());
      }
      if (imageTitle.trim()) {
        formData.append("imageTitle", imageTitle.trim());
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
      setPromptResult(next);
      setAcademicLevel(next.academicLevel ?? academicLevel);
      setCreativityLevel(next.creativityLevel ?? creativityLevel);
      setPersonalization(next.studentPersonalization ?? personalization);
      setImageTitle(next.studentTitle ?? imageTitle);
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

  function clearPersonalization() {
    setPersonalization("");
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
    <div className="atlas-ia-panel flex h-full min-h-0 flex-col">
      {/* Header fijo */}
      <header className="atlas-ia-panel__header z-20 shrink-0 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
          <p className="atlas-ia-kicker flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
            <Sparkles size={12} />
            {ATLAS_JURIDICO_MODULE_TITLE}
          </p>
          <p className="atlas-ia-text-muted mt-0.5 truncate text-sm">
            {ATLAS_JURIDICO_MODULE_SUBTITLE}
          </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <GenerationStatusBadge status={generationStatus} />
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="atlas-ia-close-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Nav móvil */}
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 lg:hidden">
          {NAV_ITEMS.map((item) => {
            if (item.requiresResult && !hasPrompt) return null;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`atlas-ia-nav-chip shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition${
                  active ? " is-active" : ""
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
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider atlas-ia-text-faint">
                Progreso
              </p>
              {NAV_ITEMS.map((item) => {
                if (item.requiresResult && !hasPrompt) return null;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`atlas-ia-side-nav flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition${
                      active ? " is-active" : ""
                    }`}
                  >
                    <span
                      className={`atlas-ia-dot h-2 w-2 shrink-0 rounded-full${
                        active ? " is-active" : ""
                      }`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 flex-1 space-y-10 pb-8">
            <InfoCard />

            {/* PASO 1 — Nivel académico */}
            <StepSection id={SECTION_IDS.tipo} step={1} title="Nivel académico de la imagen">
              <p className="mb-3 text-sm atlas-ia-text-muted">
                Este parámetro modifica radicalmente densidad, estructura y profundidad del prompt.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {VISUAL_ACADEMIC_LEVELS.map((item) => {
                  const active = academicLevel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAcademicLevel(item.id)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[#4285F4]/50 bg-[#4285F4]/12 shadow-[0_0_24px_rgba(66,133,244,0.12)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <span className="block text-sm font-bold atlas-ia-text">{item.label}</span>
                      <span className="mt-1 block text-[11px] leading-snug atlas-ia-text-soft">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedAcademicLevel ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-[#4285F4]/30 bg-[#4285F4]/10 px-4 py-3">
                    <p className="text-xs font-semibold text-[#93C5FD]">Ideal para:</p>
                    <p className="mt-1 text-sm atlas-ia-text">{selectedAcademicLevel.idealFor}</p>
                  </div>
                  <div className="rounded-xl border border-[#A855F7]/30 bg-[#A855F7]/10 px-4 py-3">
                    <p className="text-xs font-semibold text-[#C4B5FD]">Resultado esperado:</p>
                    <p className="mt-1 text-sm atlas-ia-text">
                      {selectedAcademicLevel.expectedResult}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider atlas-ia-text-faint">
                      Incluye
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {selectedAcademicLevel.expectedHighlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs atlas-ia-text-muted"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4285F4]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </StepSection>

            {/* PASO 2 — Tipo de atlas */}
            <StepSection id="vip-section-atlas" step={2} title="Tipo de atlas jurídico">
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
                      <span className="flex items-center gap-2 text-sm font-bold atlas-ia-text">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug atlas-ia-text-soft">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedMode ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-[#A855F7]/30 bg-[#A855F7]/10 px-4 py-3">
                    <p className="text-xs font-semibold text-[#C4B5FD]">Resultado esperado:</p>
                    <p className="mt-1 text-sm atlas-ia-text">{selectedMode.expectedResult}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider atlas-ia-text-faint">
                      Incluye
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {selectedMode.expectedHighlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs atlas-ia-text-muted"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#F59E0B]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </StepSection>

            {/* PASO 3 — Rúbrica */}
            <StepSection id={SECTION_IDS.rubrica} step={3} title="Adjuntar rúbrica">
              <p className="mb-3 text-sm atlas-ia-text-muted">
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
                <span className="text-xs atlas-ia-text-faint">PDF · DOCX · JPG · PNG</span>
                {rubricFile ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs atlas-ia-text-muted">
                    <Paperclip size={12} />
                    {rubricFile.name}
                    <button
                      type="button"
                      onClick={() => setRubricFile(null)}
                      className="atlas-ia-text-faint hover:text-red-400"
                      aria-label="Quitar rúbrica"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : null}
              </div>
            </StepSection>

            {/* PASO 4 — Personalización */}
            <StepSection
              id={SECTION_IDS.personalizacion}
              step={4}
              title="Personalización adicional"
            >
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium atlas-ia-text-muted">
                  Título de la imagen (opcional)
                </label>
                <input
                  type="text"
                  value={imageTitle}
                  onChange={(event) => setImageTitle(event.target.value)}
                  placeholder="Ej.: Acto Jurídico, Nulidad del Acto Jurídico, Obligaciones Civiles…"
                  className="atlas-ia-input w-full rounded-xl px-4 py-3 text-sm focus:border-[#F59E0B]/40 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/25"
                />
                <p className="mt-1.5 text-[11px] atlas-ia-text-faint">
                  Si lo dejas vacío, la IA genera un título automático a partir del PDF.
                </p>
              </div>

              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium atlas-ia-text-muted">
                  ¿Qué deseas agregar al prompt?
                </label>
                <button
                  type="button"
                  onClick={clearPersonalization}
                  disabled={!personalization.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium atlas-ia-text-muted transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={12} />
                  Limpiar
                </button>
              </div>
              <textarea
                value={personalization}
                onChange={(event) => setPersonalization(event.target.value)}
                placeholder={PERSONALIZATION_PLACEHOLDER}
                rows={5}
                className="atlas-ia-input w-full resize-y rounded-xl px-4 py-3 text-sm leading-relaxed focus:border-[#F59E0B]/40 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]/25"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {PERSONALIZATION_QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => appendChip(chip.text)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium atlas-ia-text-muted transition hover:border-[#F59E0B]/35 hover:bg-[#F59E0B]/10 hover:text-[#FBBF24]"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider atlas-ia-text-faint">
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
                          <span className="block text-xs font-bold atlas-ia-text">
                            {level.label}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-snug atlas-ia-text-soft">
                            {level.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </StepSection>

            {/* PASO 5 — Generar */}
            <section className="scroll-mt-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-6 text-sm font-bold text-[#1a1005] shadow-[0_0_40px_rgba(245,158,11,0.35)] transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                {generating ? (
                  <>
                    {rubricFile ? "Analizando PDF y rúbrica…" : "Analizando tu PDF…"}{" "}
                    {genProgress.percent}%
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Generar atlas para Gemini
                  </>
                )}
              </button>
              {generating ? (
                <LoadingState
                  active
                  preset="aiGenerate"
                  percent={genProgress.percent}
                  message={genProgress.message}
                  stageLabel={genProgress.stageLabel}
                  className="mt-3"
                />
              ) : null}
              {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            </section>

            {/* PASO 6 — Prompt generado */}
            {hasPrompt && finalPrompt && promptResult ? (
              <StepSection id={SECTION_IDS.prompt} step={6} title="Prompt generado">
                <PremiumPromptCard
                  title={promptResult.title}
                  modeLabel={
                    VISUAL_PROMPT_MODES.find((m) => m.id === promptResult.mode)?.label ??
                    promptResult.mode
                  }
                  academicLevelLabel={academicLevelLabel(
                    promptResult.academicLevel ?? academicLevel,
                  )}
                  content={finalPrompt}
                  copied={copied}
                  onCopy={copyPrompt}
                  onOpenGemini={openGemini}
                />

                <button
                  type="button"
                  onClick={() => setShowPromptDetails((prev) => !prev)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-xs font-medium atlas-ia-text-muted transition hover:border-white/20"
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

                {promptResult.rubricAnalysis ? (
                  <div className="mt-4">
                    <RubricPreview analysis={promptResult.rubricAnalysis} />
                  </div>
                ) : null}
              </StepSection>
            ) : (
              <div
                id={SECTION_IDS.prompt}
                className="scroll-mt-4 rounded-2xl border border-dashed border-[#F59E0B]/25 bg-[#F59E0B]/5 px-6 py-10 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B]/20 to-[#A855F7]/20 text-[#FBBF24]">
                  <Sparkles size={24} />
                </div>
                <p className="mt-4 text-sm font-semibold atlas-ia-text">
                  Tu prompt aparecerá aquí cuando lo generes
                </p>
                <p className="mt-1 text-xs atlas-ia-text-soft">
                  Configura el atlas, pulsa «Generar atlas para Gemini» y el prompt completo
                  aparecerá en esta sección.
                </p>
              </div>
            )}

            {/* PASO 7 — Explicación */}
            {hasPrompt && promptResult?.explanation?.length ? (
              <StepSection id={SECTION_IDS.explicacion} step={7} title="¿Por qué se generó así?">
                <ExplanationBlock
                  lines={promptResult.explanation}
                  hasRubric={promptResult.hasRubric}
                />
                {promptResult.analysis ? (
                  <div className="mt-4">
                    <AnalysisSummary analysis={promptResult.analysis} />
                  </div>
                ) : null}
              </StepSection>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer fijo */}
      <footer className="atlas-ia-panel__footer z-20 shrink-0 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs atlas-ia-text-soft">
            {copied ? (
              <span className="font-semibold text-[#22C55E]">✓ Prompt copiado correctamente</span>
            ) : generationStatus === "ready" ? (
              <span className="font-semibold text-[#22C55E]">
                Prompt listo para copiar · {finalPrompt.length.toLocaleString("es-PE")} caracteres
              </span>
            ) : generationStatus === "generating" ? (
              <span className="font-semibold text-[#FBBF24]">Generando prompt…</span>
            ) : (
              "Sin generar — configura y pulsa generar"
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPrompt}
              disabled={!hasPrompt || !finalPrompt}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-5 py-2.5 text-sm font-bold text-[#1a1005] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
              Copiar atlas
            </button>
            <button
              type="button"
              onClick={openGemini}
              disabled={!hasPrompt || !finalPrompt}
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
          className="atlas-ia-back-top fixed bottom-24 right-5 z-30 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold shadow-xl transition sm:right-8"
        >
          <ArrowUp size={14} />
          Volver arriba
        </button>
      ) : null}
    </div>
  );
}

function GenerationStatusBadge({
  status,
}: {
  status: "idle" | "generating" | "ready";
}) {
  const config = {
    idle: {
      label: "Sin generar",
      text: "atlas-ia-text-soft",
    },
    generating: {
      label: "Generando prompt…",
      text: "text-[#FBBF24]",
    },
    ready: {
      label: "Prompt listo",
      text: "text-[#22C55E]",
    },
  }[status];

  return (
    <span
      className={`atlas-ia-status-badge inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${config.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${status === "generating" ? "animate-pulse bg-[#FBBF24]" : status === "ready" ? "bg-[#22C55E]" : "bg-[var(--atlas-text-faint)]"}`} />
      {config.label}
    </span>
  );
}

function InfoCard() {
  return (
    <div className="rounded-2xl border border-[#4285F4]/25 bg-gradient-to-br from-[#4285F4]/10 to-transparent p-5">
      <p className="text-sm font-bold atlas-ia-text">{WHAT_MEMORIASTUDY_DOES.title}</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">
        {WHAT_MEMORIASTUDY_DOES.steps.map((step, index) => (
          <li
            key={step}
            className="flex items-start gap-2 text-xs atlas-ia-text-muted"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4285F4]/20 text-[10px] font-bold text-[#93C5FD]">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/8 px-3 py-2 text-xs leading-relaxed text-[#FBBF24]/90">
        {WHAT_MEMORIASTUDY_DOES.note}
      </p>
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
        <h2 className="text-lg font-bold atlas-ia-text">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PremiumPromptCard({
  title,
  modeLabel,
  academicLevelLabel: levelLabel,
  content,
  copied,
  onCopy,
  onOpenGemini,
}: {
  title: string;
  modeLabel: string;
  academicLevelLabel: string;
  content: string;
  copied: boolean;
  onCopy: () => void;
  onOpenGemini: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-[1px] shadow-[0_0_60px_rgba(66,133,244,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B] via-[#A855F7] to-[#4285F4]" />
      <div className="atlas-ia-card-inner relative rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4285F4] to-[#A855F7] shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#93C5FD]">
                Atlas jurídico final · Gemini Image
              </p>
              <h3 className="text-base font-bold atlas-ia-text">{title}</h3>
              <p className="text-[11px] atlas-ia-text-faint">
                Modo: {modeLabel} · Nivel: {levelLabel}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium atlas-ia-text-muted">
            {content.length.toLocaleString("es-PE")} caracteres
          </span>
        </div>

        <pre className="whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed atlas-ia-text-muted">
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
    <div className="atlas-ia-input rounded-xl px-4 py-3">
      <p className="text-xs font-semibold atlas-ia-text-muted">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed atlas-ia-text-muted">
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
          <li key={line} className="flex items-start gap-2 text-sm atlas-ia-text">
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
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider atlas-ia-text-faint">
        Rúbrica analizada
        {analysis.fileName ? ` · ${analysis.fileName}` : ""}
      </p>
      {analysis.requestedFormat ? (
        <p className="text-sm font-semibold text-[#FBBF24]">
          Formato solicitado: {analysis.requestedFormat}
        </p>
      ) : null}
      {analysis.evaluationCriteria.length ? (
        <ul className="mt-2 space-y-1 text-[11px] atlas-ia-text-muted">
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
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider atlas-ia-text-faint">
        Análisis del documento
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
          >
            <p className="text-[10px] atlas-ia-text-faint">{item.label}</p>
            <p className="text-sm font-semibold atlas-ia-text">
              {typeof item.value === "number" ? item.value : item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
