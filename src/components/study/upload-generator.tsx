"use client";

import { FileUp, Loader2, Save, Sparkles, WandSparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import { GenerationProgress } from "@/components/study/generation-progress";
import { GenerationSettings } from "@/components/study/generation-settings";
import { StudyHub } from "@/components/study/study-hub";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";
import { loadAcademicSelection } from "@/lib/academic/storage";
import { set } from "idb-keyval";
import { DEFAULT_GENERATION_COUNTS } from "@/types/generation";
import type { PdfExtractStreamEvent } from "@/types/pdf-progress";
import type { StudyGenerationCounts } from "@/types/generation";
import type { AcademicSelection } from "@/types/academic";
import type { StudyDeck } from "@/types/study";

type Status = "idle" | "working" | "saving" | "error" | "saved";

type ProgressState = {
  percent: number;
  message: string;
  stageLabel: string;
  currentChunk?: number;
  totalChunks?: number;
};

function isExtractDone(
  event: PdfExtractStreamEvent,
): event is Extract<PdfExtractStreamEvent, { stage: "done" }> {
  return event.stage === "done" && "text" in event;
}

async function readPdfExtractStream(
  response: Response,
  onEvent: (event: PdfExtractStreamEvent) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("El servidor no devolvió progreso de lectura.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      onEvent(JSON.parse(line) as PdfExtractStreamEvent);
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as PdfExtractStreamEvent);
  }
}

export function UploadGenerator() {
  const [deck, setDeck] = useState<StudyDeck | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [forceScanned, setForceScanned] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState("");
  const [textTruncated, setTextTruncated] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [counts, setCounts] = useState<StudyGenerationCounts>(
    DEFAULT_GENERATION_COUNTS,
  );
  const [academic, setAcademic] = useState<AcademicSelection | null>(
    () => loadAcademicSelection(),
  );

  const handleAcademicChange = useCallback((selection: AcademicSelection) => {
    setAcademic(selection);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("working");
    setError("");
    setDeck(null);
    setProgress({
      percent: 2,
      message: "Preparando tu PDF jurídico...",
      stageLabel: "Inicio",
    });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    try {
      if (!(file instanceof File)) {
        throw new Error("Debes subir un PDF.");
      }

      if (!academic) {
        throw new Error("Selecciona año, ciclo, curso y semana antes de generar.");
      }

      const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
      if (total === 0) {
        throw new Error("Selecciona al menos un método con cantidad mayor a 0.");
      }

      const extractData = new FormData();
      extractData.set("file", file);
      extractData.set("forceScanned", String(forceScanned));

      let extractedText = "";
      let method = "";
      let truncated = false;

      const extractResponse = await fetch("/api/pdf/extract", {
        method: "POST",
        body: extractData,
      });

      if (!extractResponse.ok) {
        throw new Error("No se pudo leer el PDF.");
      }

      let extractError = "";

      await readPdfExtractStream(extractResponse, (event) => {
        if (event.stage === "error") {
          extractError = event.message;
          return;
        }

        if (isExtractDone(event)) {
          extractedText = event.text;
          method = event.method;
          truncated = Boolean(event.truncated);
          setProgress({
            percent: 50,
            message: event.message,
            stageLabel: "Lectura del PDF",
          });
          return;
        }

        const stageLabel =
          event.stage === "ocr"
            ? "OCR (documento escaneado)"
            : event.stage === "parse"
              ? "Leyendo PDF"
              : "Subiendo";

        const mappedPercent =
          event.stage === "ocr"
            ? 8 + Math.round(event.percent * 0.42)
            : event.stage === "parse"
              ? 8 + Math.round(event.percent * 0.35)
              : event.percent;

        setProgress({
          percent: mappedPercent,
          message: event.message,
          stageLabel,
          currentChunk: event.currentChunk,
          totalChunks: event.totalChunks,
        });
      });

      if (extractError) {
        throw new Error(extractError);
      }

      if (!extractedText) {
        throw new Error("No se extrajo texto del PDF.");
      }

      setProgress({
        percent: 55,
        message: "Generando flashcards, definiciones, pares y quiz con IA...",
        stageLabel: "Generación con IA",
      });

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceName: file.name,
          text: extractedText,
          audience: UNT_DERECHO_AUDIENCE,
          academic,
          counts,
          ocrUsed: method === "gemini-ocr",
        }),
      });

      setProgress({
        percent: 88,
        message: "Finalizando mazo de estudio...",
        stageLabel: "Generación con IA",
      });

      const payload = await generateResponse.json();

      if (!generateResponse.ok) {
        throw new Error(payload.error ?? "No se pudo generar el mazo.");
      }

      setDeck(payload.deck);
      setExtractionMethod(method);
      setTextTruncated(truncated || Boolean(payload.truncated));
      
      try {
        await set("pdfText", payload.pdfText ?? extractedText);
      } catch (err) {
        console.warn("No se pudo guardar el texto del PDF para el tutor:", err);
      }

      setProgress({
        percent: 100,
        message: "¡Material listo para estudiar!",
        stageLabel: "Completado",
      });

      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Algo salió mal.");
      setStatus("error");
      setProgress(null);
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

  const maxMb = Math.round(MAX_FILE_SIZE / (1024 * 1024));
  const isWorking = status === "working";

  return (
    <div className="space-y-5">
      <AcademicNavigator value={academic} onChange={handleAcademicChange} />

      <GenerationSettings value={counts} onChange={setCounts} />

      <form
        onSubmit={handleSubmit}
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
                Códigos y lecturas pesadas hasta {maxMb} MB
              </span>
              <input
                name="file"
                type="file"
                accept="application/pdf"
                className="sr-only"
                required
                disabled={isWorking}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  if (file.size > MAX_FILE_SIZE) {
                    setError(`El PDF supera el límite de ${maxMb} MB.`);
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

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={forceScanned}
              disabled={isWorking}
              onChange={(event) => setForceScanned(event.target.checked)}
              className="mt-1 size-4 rounded border-border"
            />
            <span>
              <strong>PDF escaneado</strong> — OCR por partes con Gemini (libros,
              fotocopias y códigos escaneados; soporta archivos grandes)
            </span>
          </label>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isWorking || !academic}
          >
            {isWorking ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <WandSparkles size={16} />
            )}
            {isWorking ? "Procesando..." : "Generar material"}
          </Button>
        </div>

        {progress && isWorking ? (
          <div className="mt-4">
            <GenerationProgress
              percent={progress.percent}
              message={progress.message}
              stageLabel={progress.stageLabel}
              currentChunk={progress.currentChunk}
              totalChunks={progress.totalChunks}
            />
          </div>
        ) : null}

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
                    {textTruncated
                      ? " · Se usó la parte inicial del documento por longitud"
                      : null}
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
