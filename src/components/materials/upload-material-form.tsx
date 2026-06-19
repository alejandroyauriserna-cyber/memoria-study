"use client";

import { useCallback, useRef, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, GraduationCap, Loader2, Sparkles, Upload } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import type { MaterialUploadType } from "@/lib/materials/extract-material-metadata";
import type { AcademicSelection } from "@/types/academic";
import type { CourseDetectionResult } from "@/types/course-detection";

type FieldErrors = {
  title?: string;
  description?: string;
  course?: string;
  file?: string;
};

const materialTypes: Array<{ value: MaterialUploadType; label: string }> = [
  { value: "apunte", label: "Apunte" },
  { value: "resumen", label: "Resumen" },
  { value: "pdf", label: "PDF" },
  { value: "caso", label: "Caso práctico" },
  { value: "guia", label: "Guía de estudio" },
  { value: "otro", label: "Otro" },
];

function isPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
}

export function UploadMaterialForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<MaterialUploadType>("apunte");
  const [academic, setAcademic] = useState<AcademicSelection | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [detection, setDetection] = useState<CourseDetectionResult | null>(null);
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  const [analyzeHint, setAnalyzeHint] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const uploadProgress = useLoadingProgress(status === "uploading", "upload");

  const clearFieldError = useCallback((field: keyof FieldErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  }, []);

  const handleAcademicChange = useCallback(
    (selection: AcademicSelection) => {
      setAcademic(selection);
      clearFieldError("course");
    },
    [clearFieldError],
  );

  const analyzeFile = useCallback(async (selected: File) => {
    setAnalyzing(true);
    setAnalyzed(false);
    setDetection(null);
    setOverallConfidence(null);
    setAnalyzeHint("Leyendo PDF…");
    setMessage("");
    setStatus("idle");

    try {
      const formData = new FormData();
      formData.set("file", selected);

      setAnalyzeHint("La IA está detectando curso, título y descripción…");

      const response = await fetch("/api/materials/analyze-upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo analizar el PDF.");
      }

      const suggested = payload.suggested as {
        title: string;
        description: string;
        materialType: MaterialUploadType;
        academic: AcademicSelection | null;
        detection: CourseDetectionResult | null;
      };

      setTitle(suggested.title);
      setDescription(suggested.description);
      setMaterialType(suggested.materialType);
      if (suggested.academic) setAcademic(suggested.academic);
      setDetection(suggested.detection);
      setOverallConfidence(payload.overallConfidence as number);
      setAnalyzed(true);
      setAnalyzeHint(
        payload.needsReview
          ? "Revisa curso y descripción antes de publicar."
          : "Metadatos listos. Puedes editar cualquier campo y compartir.",
      );
    } catch (caught) {
      setAnalyzed(false);
      setAnalyzeHint("");
      setMessage(caught instanceof Error ? caught.message : "Error al analizar el PDF.");
      setStatus("error");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const acceptPdfFile = useCallback(
    (selected: File | null | undefined) => {
      if (!selected) return;
      if (!isPdfFile(selected)) {
        setErrors((current) => ({
          ...current,
          file: "Debes seleccionar un archivo PDF.",
        }));
        setStatus("error");
        setMessage("Solo se admiten archivos PDF.");
        return;
      }

      setFile(selected);
      clearFieldError("file");
      setStatus("idle");
      setMessage("");
      void analyzeFile(selected);
    },
    [analyzeFile, clearFieldError],
  );

  const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const dropped = event.dataTransfer.files?.[0];
      acceptPdfFile(dropped);
    },
    [acceptPdfFile],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const fieldErrors: FieldErrors = {};

      if (title.trim().length < 3) {
        fieldErrors.title = "El título debe tener al menos 3 caracteres.";
      }

      if (description.trim().length < 10) {
        fieldErrors.description = "La descripción debe tener al menos 10 caracteres.";
      }

      if (!academic) {
        fieldErrors.course = "Debes seleccionar un curso.";
      }

      if (!file) {
        fieldErrors.file = "Debes seleccionar un archivo PDF.";
      } else if (!isPdfFile(file)) {
        fieldErrors.file = "Debes seleccionar un archivo PDF.";
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        setStatus("error");
        setMessage("Corrige los campos marcados.");
        return;
      }

      setStatus("uploading");
      setErrors({});
      setMessage("");

      if (!academic || !file) return;

      try {
        const formData = new FormData();
        formData.set("title", title.trim());
        formData.set("description", description.trim());
        formData.set("materialType", materialType);
        formData.set("courseId", academic.courseId);
        formData.set("courseName", academic.courseName);
        formData.set("cycleNumber", String(academic.cycleNumber));
        formData.set("cycleLabel", academic.cycleLabel);
        formData.set("file", file);

        const response = await fetch("/api/materials", {
          method: "POST",
          body: formData,
        });

        const payload = await response.json();

        if (!response.ok) {
          if (payload?.fieldErrors) {
            setErrors(payload.fieldErrors);
            setStatus("error");
            if (payload?.duplicate?.id) {
              setMessage(
                `${payload.error ?? "Este material ya existe en la biblioteca."} Puedes verlo en /materials/${payload.duplicate.id}.`,
              );
            } else {
              setMessage(payload.error ?? "Corrige los campos marcados.");
            }
            return;
          }

          throw new Error(payload.error ?? "Ocurrió un error al subir el material. Inténtalo nuevamente.");
        }

        const uploadedTitle = title.trim();
        const params = new URLSearchParams({ shared: "1" });
        if (uploadedTitle) params.set("title", uploadedTitle);
        router.push(`/library?${params.toString()}`);
        return;
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al subir el material. Inténtalo nuevamente.",
        );
      }
    },
    [academic, description, file, materialType, title, router],
  );

  const formDisabled = analyzing || !file;

  return (
    <form onSubmit={handleSubmit} className="upload-page-workspace">
      <section className="upload-page-panel">
        <div className="upload-page-panel__head">
          <div>
            <h2>Archivo PDF</h2>
            <p>Arrastra tu PDF al recuadro o selecciónalo. La IA completará título, curso y descripción.</p>
          </div>
          <span className="upload-page-panel__icon" aria-hidden>
            <Upload size={18} />
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(event) => acceptPdfFile(event.target.files?.[0])}
        />

        <div
          role="button"
          tabIndex={0}
          className={`upload-dropzone${errors.file ? " is-error" : ""}${isDragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <Upload size={28} strokeWidth={1.5} />
          <strong>{file?.name ?? (isDragging ? "Suelta el PDF aquí" : "Arrastra o selecciona tu PDF")}</strong>
          <span>{file ? "Toca o arrastra otro archivo para cambiar" : "Máximo un archivo · formato PDF"}</span>
        </div>
        {errors.file ? <p className="upload-field__error">{errors.file}</p> : null}

        {analyzing ? (
          <div className="upload-analyze-status" role="status">
            <Loader2 size={18} className="animate-spin" />
            <div>
              <p className="upload-analyze-status__title">Analizando material</p>
              <p className="upload-analyze-status__hint">{analyzeHint}</p>
            </div>
          </div>
        ) : null}

        {!analyzing && analyzed && overallConfidence !== null ? (
          <div
            className={`upload-ai-summary ${overallConfidence >= 0.75 ? "is-high" : overallConfidence >= 0.55 ? "is-mid" : "is-low"}`}
          >
            <Sparkles size={16} />
            <div>
              <p className="upload-ai-summary__title">
                IA detectó el material · confianza {Math.round(overallConfidence * 100)}%
              </p>
              <p className="upload-ai-summary__hint">
                {analyzeHint}
                {detection?.courseName ? ` · Curso sugerido: ${detection.courseName}` : ""}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <fieldset className="upload-page-panel" disabled={formDisabled}>
        <legend className="sr-only">Detalles del material</legend>
        <div className="upload-page-panel__head">
          <div>
            <h2>Detalles del material</h2>
            <p>Revisa lo que detectó la IA o edita antes de publicar.</p>
          </div>
          <span className="upload-page-panel__icon" aria-hidden>
            <FileText size={18} />
          </span>
        </div>

        <div className="upload-page-grid upload-page-grid--2">
          <div className="upload-field">
            <label>
              <span>Título del material</span>
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearFieldError("title");
                }}
                placeholder="Ej. Apuntes — Interpretación jurídica S1"
                className={errors.title ? "is-error" : ""}
              />
            </label>
            {errors.title ? <p className="upload-field__error">{errors.title}</p> : null}
          </div>

          <div className="upload-field">
            <label>
              <span>Tipo de material</span>
              <select
                value={materialType}
                onChange={(event) => setMaterialType(event.target.value as MaterialUploadType)}
              >
                {materialTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="upload-field mt-4">
          <label>
            <span>Descripción</span>
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError("description");
              }}
              rows={4}
              placeholder="Describe brevemente el contenido, temas que cubre y para qué sirve en el curso."
              className={errors.description ? "is-error" : ""}
            />
          </label>
          {errors.description ? <p className="upload-field__error">{errors.description}</p> : null}
        </div>
      </fieldset>

      <fieldset className="upload-page-panel" disabled={formDisabled}>
        <legend className="sr-only">Contexto académico UNT</legend>
        <div className="upload-page-panel__head">
          <div>
            <h2>Contexto académico UNT</h2>
            <p>Confirma ciclo y curso en la malla oficial.</p>
          </div>
          <span className="upload-page-panel__icon" aria-hidden>
            <GraduationCap size={18} />
          </span>
        </div>

        <div className={`upload-academic-panel ${errors.course ? "rounded-xl ring-1 ring-red-400/60" : ""}`}>
          <AcademicNavigator value={academic} onChange={handleAcademicChange} />
        </div>
        {errors.course ? <p className="upload-field__error">{errors.course}</p> : null}
      </fieldset>

      {!file ? (
        <p className="upload-page-hint">Primero sube un PDF arriba para activar el formulario.</p>
      ) : null}

      <div className="upload-submit-row">
        <button
          type="submit"
          className="upload-submit-btn"
          disabled={status === "uploading" || analyzing || !file}
        >
          <Sparkles size={16} />
          {status === "uploading" ? `Subiendo… ${uploadProgress.percent}%` : "Compartir material"}
        </button>
        {message ? (
          <p className={`upload-status ${status === "error" ? "is-error" : status === "saved" ? "is-success" : ""}`}>
            {message}
          </p>
        ) : null}
      </div>

      {status === "uploading" ? (
        <LoadingState
          active
          preset="upload"
          percent={uploadProgress.percent}
          message={uploadProgress.message}
          stageLabel={uploadProgress.stageLabel}
          className="mt-3"
        />
      ) : null}
    </form>
  );
}
