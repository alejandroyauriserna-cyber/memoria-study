"use client";

import { FileUp, Loader2, Save, Sparkles, WandSparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import { AiAnalysisBanner } from "@/components/study/ai-analysis-banner";
import { GenerationProgress } from "@/components/study/generation-progress";
import { LoadingState } from "@/components/ui/loading-state";
import { GenerationSettings } from "@/components/study/generation-settings";
import { StudyHub } from "@/components/study/study-hub";
import { detectionToSelection } from "@/lib/academic/detect-course";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { STUDY_DOCUMENT_ACCEPT } from "@/lib/documents/kinds";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";
import { loadAcademicSelection } from "@/lib/academic/storage";
import { set } from "idb-keyval";
import { DEFAULT_GENERATION_COUNTS } from "@/types/generation";
import type { PdfExtractStreamEvent } from "@/types/pdf-progress";
import type { StudyGenerationCounts } from "@/types/generation";
import type { AcademicSelection } from "@/types/academic";
import type { CourseDetectionResult } from "@/types/course-detection";
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

function mapExtractEvent(event: PdfExtractStreamEvent): ProgressState | null {
  if (event.stage === "error" || isExtractDone(event)) return null;

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

  return {
    percent: mappedPercent,
    message: event.message,
    stageLabel,
    currentChunk: event.currentChunk,
    totalChunks: event.totalChunks,
  };
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
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      onEvent(JSON.parse(line) as PdfExtractStreamEvent);
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as PdfExtractStreamEvent);
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPptxFile(file: File) {
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".pptx") ||
    lower.endsWith(".pptm") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  );
}

export function UploadGenerator() {
  const [deck, setDeck] = useState<StudyDeck | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [forceScanned, setForceScanned] = useState(false);
  const [isPptxUpload, setIsPptxUpload] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState("");
  const [textTruncated, setTextTruncated] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [counts, setCounts] = useState<StudyGenerationCounts>(DEFAULT_GENERATION_COUNTS);
  const [academic, setAcademic] = useState<AcademicSelection | null>(() => loadAcademicSelection());
  const [detection, setDetection] = useState<CourseDetectionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<ProgressState | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleAcademicChange = useCallback((selection: AcademicSelection) => {
    setAcademic(selection);
  }, []);

  const applyDetection = useCallback(() => {
    if (!detection) return;
    const selection = detectionToSelection(detection);
    if (selection) setAcademic(selection);
  }, [detection]);

  async function analyzePdfFile(file: File) {
    setAnalyzing(true);
    setError("");
    setDetection(null);
    setAnalyzeProgress({
      percent: 2,
      message: "Analizando archivo...",
      stageLabel: "Leyendo documento",
    });

    try {
      const extractData = new FormData();
      extractData.set("file", file);
      extractData.set("forceScanned", String(forceScanned));

      const extractResponse = await fetch("/api/pdf/extract", {
        method: "POST",
        body: extractData,
      });

      if (!extractResponse.ok) {
        throw new Error("No se pudo leer el archivo para detectar el curso.");
      }

      let extractedText = "";
      let extractError = "";

      await readPdfExtractStream(extractResponse, (event) => {
        if (event.stage === "error") {
          extractError = event.message;
          return;
        }
        if (isExtractDone(event)) {
          extractedText = event.text;
          setAnalyzeProgress({
            percent: 100,
            message: "Detectando curso académico...",
            stageLabel: "Finalizando",
          });
          return;
        }
        const mapped = mapExtractEvent(event);
        if (mapped) setAnalyzeProgress(mapped);
      });

      if (extractError) throw new Error(extractError);
      if (!extractedText) throw new Error("No se extrajo texto del archivo.");

      await set("pdfText", extractedText);

      const detectResponse = await fetch("/api/academic/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      const detectPayload = await detectResponse.json();
      if (!detectResponse.ok) {
        throw new Error(detectPayload.error ?? "No se pudo detectar el curso.");
      }

      const nextDetection = detectPayload.detection as CourseDetectionResult;
      setDetection(nextDetection);

      const selection = detectionToSelection(nextDetection);
      if (selection) setAcademic(selection);

      setStep(2);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al analizar el archivo.");
    } finally {
      setAnalyzing(false);
      setAnalyzeProgress(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("working");
    setError("");
    setDeck(null);
    setProgress({
      percent: 2,
      message: "Analizando archivo...",
      stageLabel: "Leyendo documento",
    });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    try {
      if (!(file instanceof File)) {
        throw new Error("Debes subir un PDF o una presentación PowerPoint (.pptx).");
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
        const errorText = await extractResponse.text();
        let responseMessage = `No se pudo leer el archivo. (${extractResponse.status})`;
        try {
          const payload = JSON.parse(errorText);
          if (payload?.error) {
            responseMessage = `Error de extracción: ${payload.error}`;
          }
        } catch {
          responseMessage = `Error de extracción: ${errorText}`;
        }
        throw new Error(responseMessage);
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
            message: "Extrayendo conceptos...",
            stageLabel: "Extrayendo conceptos",
          });
          return;
        }

        const mapped = mapExtractEvent(event);
        if (mapped) setProgress(mapped);
      });

      if (extractError) {
        throw new Error(extractError);
      }

      if (!extractedText) {
        throw new Error("No se extrajo texto del archivo.");
      }

      try {
        await set("pdfText", extractedText);
      } catch (err) {
        console.warn("No se pudo guardar el texto del PDF:", err);
      }

      setProgress({
        percent: 55,
        message: "Generando organizador y material de estudio...",
        stageLabel: "Generando con IA",
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
        message: "Guardando material de estudio...",
        stageLabel: "Guardando",
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
        message: "Material listo para estudiar.",
        stageLabel: "Completado",
      });

      setStatus("idle");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      const isTransient = /429|503|límite de solicitudes|quota exceeded|service unavailable/i.test(
        message,
      );

      setError(
        isTransient
          ? "La IA alcanzó temporalmente el límite de solicitudes. Intenta de nuevo más tarde."
          : message,
      );
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

  const steps = [
    { n: 1, label: "Archivo" },
    { n: 2, label: "Contexto académico" },
    { n: 3, label: "Configuración" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {steps.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => setStep(s.n)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              step === s.n
                ? "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]"
                : "text-muted-foreground hover:text-[#F5F7FA]"
            }`}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={handleSubmit} className="ms-panel p-5 md:p-6">
          <h3 className="text-sm font-semibold text-[#F5F7FA]">Paso 1 · Seleccionar archivo</h3>
          <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(0,255,213,0.25)] bg-[rgba(7,19,26,0.5)] px-4 text-center transition hover:border-[rgba(0,255,213,0.45)]">
            <FileUp className="mb-2 text-[#00FFD5]" size={28} />
            <span className="text-sm font-semibold text-[#F5F7FA]">
              {fileName || "Arrastra o elige un PDF o PowerPoint (.pptx)"}
            </span>
            {fileName ? (
              <span className="mt-1 text-xs text-[#00FFD5]">
                {fileName} · {formatFileSize(fileSize)}
              </span>
            ) : (
              <span className="mt-1 text-xs text-muted-foreground">Hasta {maxMb} MB</span>
            )}
            <input
              name="file"
              type="file"
              accept={STUDY_DOCUMENT_ACCEPT}
              className="sr-only"
              required
              disabled={isWorking}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                if (file.size > MAX_FILE_SIZE) {
                  setError(`El archivo supera el límite de ${maxMb} MB.`);
                  event.target.value = "";
                  setFileName("");
                  setFileSize(0);
                  setIsPptxUpload(false);
                  return;
                }

                setError("");
                setFileName(file.name);
                setFileSize(file.size);
                setIsPptxUpload(isPptxFile(file));
                if (isPptxFile(file)) {
                  setForceScanned(false);
                }
              }}
            />
          </label>

          {!isPptxUpload ? (
            <label className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={forceScanned}
                disabled={isWorking}
                onChange={(event) => setForceScanned(event.target.checked)}
                className="mt-1 size-4 accent-[#00FFD5]"
              />
              <span>PDF escaneado — usar OCR para libros y fotocopias</span>
            </label>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              PowerPoint: se leen diapositivas y notas del presentador directamente del .pptx.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!fileName || analyzing}
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[name="file"]');
                const file = input?.files?.[0];
                if (file) void analyzePdfFile(file);
              }}
            >
              {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {analyzing
                ? `Analizando… ${analyzeProgress?.percent ?? 0}%`
                : "Analizar y detectar curso"}
            </Button>
            <Button type="submit" disabled={isWorking || !academic || !fileName}>
              {isWorking ? <Loader2 className="animate-spin" size={16} /> : <WandSparkles size={16} />}
              {isWorking ? "Procesando..." : "Generar material"}
            </Button>
          </div>

          {analyzing && analyzeProgress ? (
            <div className="mt-4">
              <LoadingState
                active
                preset="pdfExtract"
                percent={analyzeProgress.percent}
                message={analyzeProgress.message}
                stageLabel={analyzeProgress.stageLabel}
                currentChunk={analyzeProgress.currentChunk}
                totalChunks={analyzeProgress.totalChunks}
              />
            </div>
          ) : null}

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

          {error ? <p className="mt-4 text-sm text-[#FF8A00]">{error}</p> : null}
        </form>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          {detection ? (
            <AiAnalysisBanner
              detection={detection}
              analysis={{
                conceptsDetected: detection.conceptsDetected,
                difficulty: detection.difficulty,
                recommendations: [
                  "Revisa la sugerencia de curso antes de generar.",
                  "Corrige manualmente si el archivo corresponde a otro ciclo.",
                ],
              }}
            />
          ) : null}
          <AcademicNavigator
            value={academic}
            onChange={handleAcademicChange}
            detection={detection}
            onApplyDetection={applyDetection}
          />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep(3)} disabled={!academic}>
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <GenerationSettings value={counts} onChange={setCounts} />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Atrás
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Ir a generar material
            </Button>
          </div>
        </div>
      ) : null}

      {deck ? (
        <>
          <div className="ms-panel p-5 md:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-semibold text-[#00FFD5]">{deck.sourceName}</p>
                <h1 className="mt-1 text-2xl font-bold text-[#F5F7FA]">{deck.title}</h1>
                {deck.academic ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {deck.academic.yearLabel} · {deck.academic.cycleLabel} · {deck.academic.courseName} ·{" "}
                    {deck.academic.weekTitle}
                  </p>
                ) : null}
                {deck.generatedWith ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[rgba(0,255,213,0.12)] bg-[rgba(0,255,213,0.06)] px-3 py-2 text-xs text-muted-foreground">
                    <Sparkles size={14} className="text-[#00FFD5]" />
                    {deck.generatedWith.label}
                    {extractionMethod === "gemini-ocr" ? " · OCR" : null}
                    {extractionMethod === "pptx" ? " · PowerPoint" : null}
                    {textTruncated ? " · Texto truncado por longitud" : null}
                  </p>
                ) : null}
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{deck.summary}</p>
              </div>
              <Button variant="secondary" onClick={saveDeck} disabled={status === "saving"}>
                {status === "saving" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
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
