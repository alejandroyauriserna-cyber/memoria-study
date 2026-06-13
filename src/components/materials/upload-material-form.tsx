"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, GraduationCap, Sparkles, Upload } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import type { AcademicSelection } from "@/types/academic";

type MaterialType = "apunte" | "resumen" | "pdf" | "caso" | "guia" | "otro";

type FieldErrors = {
  title?: string;
  description?: string;
  course?: string;
  file?: string;
};

const materialTypes: Array<{ value: MaterialType; label: string }> = [
  { value: "apunte", label: "Apunte" },
  { value: "resumen", label: "Resumen" },
  { value: "pdf", label: "PDF" },
  { value: "caso", label: "Caso práctico" },
  { value: "guia", label: "Guía de estudio" },
  { value: "otro", label: "Otro" },
];

export function UploadMaterialForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<MaterialType>("apunte");
  const [academic, setAcademic] = useState<AcademicSelection | null>(null);
  const [file, setFile] = useState<File | null>(null);
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
      } else if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
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

  return (
    <form onSubmit={handleSubmit} className="upload-page-workspace">
      <section className="upload-page-panel">
        <div className="upload-page-panel__head">
          <div>
            <h2>Contexto académico UNT</h2>
            <p>Ubica el material en la malla oficial antes de subirlo.</p>
          </div>
          <span className="upload-page-panel__icon" aria-hidden>
            <GraduationCap size={18} />
          </span>
        </div>

        <div className={`upload-academic-panel ${errors.course ? "rounded-xl ring-1 ring-red-400/60" : ""}`}>
          <AcademicNavigator value={academic} onChange={handleAcademicChange} />
        </div>
        {errors.course ? <p className="upload-field__error">{errors.course}</p> : null}
      </section>

      <section className="upload-page-panel">
        <div className="upload-page-panel__head">
          <div>
            <h2>Detalles del material</h2>
            <p>Título, tipo y descripción para que otros estudiantes lo encuentren.</p>
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
                onChange={(event) => setMaterialType(event.target.value as MaterialType)}
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
      </section>

      <section className="upload-page-panel">
        <div className="upload-page-panel__head">
          <div>
            <h2>Archivo PDF</h2>
            <p>Solo se aceptan documentos PDF listos para estudiar.</p>
          </div>
          <span className="upload-page-panel__icon" aria-hidden>
            <Upload size={18} />
          </span>
        </div>

        <label className={`upload-dropzone ${errors.file ? "is-error" : ""}`}>
          <Upload size={28} strokeWidth={1.5} />
          <strong>{file?.name ?? "Arrastra o selecciona tu PDF"}</strong>
          <span>{file ? "Toca para cambiar el archivo" : "Máximo un archivo · formato PDF"}</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) {
                setFile(selected);
                clearFieldError("file");
              }
            }}
          />
        </label>
        {errors.file ? <p className="upload-field__error">{errors.file}</p> : null}

        <div className="upload-submit-row">
          <button type="submit" className="upload-submit-btn" disabled={status === "uploading"}>
            <Sparkles size={16} />
            {status === "uploading" ? `Subiendo… ${uploadProgress.percent}%` : "Compartir material"}
          </button>
          {message ? (
            <p
              className={`upload-status ${status === "error" ? "is-error" : status === "saved" ? "is-success" : ""}`}
            >
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
      </section>
    </form>
  );
}
