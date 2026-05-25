"use client";

import { FileUp, Loader2, Save, Sparkles, WandSparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import { GenerationSettings } from "@/components/study/generation-settings";
import { StudyHub } from "@/components/study/study-hub";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { loadAcademicSelection } from "@/lib/academic/storage";
import { DEFAULT_GENERATION_COUNTS } from "@/types/generation";
import type { StudyGenerationCounts } from "@/types/generation";
import type { AcademicSelection } from "@/types/academic";
import type { StudyDeck } from "@/types/study";

type Status = "idle" | "generating" | "saving" | "error" | "saved";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export function UploadGenerator() {
  const [deck, setDeck] = useState<StudyDeck | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [forceScanned, setForceScanned] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState("");
  const [counts, setCounts] = useState<StudyGenerationCounts>(
    DEFAULT_GENERATION_COUNTS,
  );
  const [academic, setAcademic] = useState<AcademicSelection | null>(
    () => loadAcademicSelection(),
  );

  const handleAcademicChange = useCallback((selection: AcademicSelection) => {
    setAcademic(selection);
  }, []);

  async function generate(formData: FormData) {
    setStatus("generating");
    setError("");

    try {
      const file = formData.get("file");

      if (!(file instanceof File)) {
        throw new Error("Debes subir un PDF.");
      }

      if (!academic) {
        throw new Error("Selecciona año, ciclo, curso y semana antes de generar.");
      }

      const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
      if (total === 0) {
        throw new Error("Selecciona al menos un método de estudio con cantidad mayor a 0.");
      }

      formData.set("audience", UNT_DERECHO_AUDIENCE);
      formData.set("academic", JSON.stringify(academic));
      formData.set("counts", JSON.stringify(counts));
      formData.set("forceScanned", String(forceScanned));

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el mazo.");
      }

      setDeck(payload.deck);
      setExtractionMethod(payload.extractionMethod ?? "");
      localStorage.setItem("pdfText", payload.pdfText ?? "");
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Algo salió mal.");
      setStatus("error");
    }
  }

  async function saveDeck() {
    if (!deck) return;

    setStatus("saving");
    setError("");

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck: {
            ...deck,
            academic: deck.academic ?? academic ?? undefined,
            isPublic: true,
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar el mazo.");
      }

      setDeck({
        ...payload.deck,
        generatedWith: deck.generatedWith,
      });
      setStatus("saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Algo salió mal.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-5">
      <AcademicNavigator value={academic} onChange={handleAcademicChange} />

      <GenerationSettings value={counts} onChange={setCounts} />

      <form
        action={generate}
        className="rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <span className="text-sm font-semibold">PDF de estudio</span>
            <label className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted px-4 text-center hover:border-accent">
              <FileUp className="mb-2 text-accent" size={22} />
              <span className="text-sm font-semibold">
                {fileName || "Elegir archivo PDF"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                Texto seleccionable o documento escaneado
              </span>
              <input
                name="file"
                type="file"
                accept="application/pdf"
                className="sr-only"
                required
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  if (file.size > MAX_FILE_SIZE) {
                    setError("El PDF supera el límite de 100 MB.");
                    event.target.value = "";
                    setFileName("");
                    return;
                  }

                  setError("");
                  setFileName(file.name);
                }}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={forceScanned}
              onChange={(event) => setForceScanned(event.target.checked)}
              className="size-4 rounded border-border"
            />
            <span>
              <strong>PDF escaneado</strong> — forzar lectura OCR con Gemini (recomendado
              para fotocopias o escaneos)
            </span>
          </label>

          <Button
            className="w-full sm:w-auto"
            disabled={status === "generating" || !academic}
          >
            {status === "generating" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <WandSparkles size={16} />
            )}
            {status === "generating" ? "Generando material..." : "Generar material"}
          </Button>
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-500">{error}</p>
        ) : null}
      </form>

      {deck ? (
        <>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold text-accent">{deck.sourceName}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">{deck.title}</h1>

                {deck.academic ? (
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {deck.academic.yearLabel} · {deck.academic.cycleLabel} ·{" "}
                    {deck.academic.courseName} · {deck.academic.weekTitle}
                  </p>
                ) : null}

                {deck.generatedWith ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                    <Sparkles size={14} className="text-accent" />
                    {deck.generatedWith.label}. {deck.generatedWith.note}
                    {extractionMethod === "gemini-ocr" ? " · PDF escaneado (OCR)" : null}
                  </p>
                ) : null}

                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {deck.summary}
                </p>
              </div>

              <Button variant="secondary" onClick={saveDeck} disabled={status === "saving"}>
                {status === "saving" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                {status === "saved" ? "Guardado" : "Guardar en la semana"}
              </Button>
            </div>
          </div>

          <StudyHub deck={deck} />
        </>
      ) : null}
    </div>
  );
}
