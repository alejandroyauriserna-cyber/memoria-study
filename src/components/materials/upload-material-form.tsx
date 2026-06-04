"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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

      if (!academic) {
        setErrors({ course: "Debes seleccionar un curso." });
        setStatus("error");
        setMessage("Corrige los campos marcados.");
        return;
      }

      if (!file) {
        setErrors({ file: "Debes seleccionar un archivo PDF." });
        setStatus("error");
        setMessage("Corrige los campos marcados.");
        return;
      }

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
            setMessage(payload.error ?? "Corrige los campos marcados.");
            return;
          }

          throw new Error(payload.error ?? "Ocurrió un error al subir el material. Inténtalo nuevamente.");
        }

        setStatus("saved");
        setMessage("Material subido correctamente. Ya está disponible en la biblioteca.");
        setTitle("");
        setDescription("");
        setFile(null);
        setErrors({});
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al subir el material. Inténtalo nuevamente.",
        );
      }
    },
    [academic, description, file, materialType, title],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className={errors.course ? "rounded-lg border border-red-500" : ""}>
        <AcademicNavigator
          value={academic}
          onChange={(value) => {
            setAcademic(value);
            clearFieldError("course");
          }}
        />
      </div>
      {errors.course ? <p className="mt-2 text-sm text-red-500">{errors.course}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Título del material</span>
          <input
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearFieldError("title");
            }}
            placeholder="Título descriptivo"
            className={`mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none ${
              errors.title ? "border-red-500 focus:border-red-500" : "border-border bg-background focus:border-accent"
            }`}
          />
          {errors.title ? <p className="mt-2 text-sm text-red-500">{errors.title}</p> : null}
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Tipo de material</span>
          <select
            value={materialType}
            onChange={(event) => setMaterialType(event.target.value as MaterialType)}
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {materialTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">Descripción</span>
        <textarea
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            clearFieldError("description");
          }}
          rows={4}
          placeholder="Describe brevemente el contenido y utilidad del archivo."
          className={`mt-2 w-full rounded-xl border px-3 py-3 text-sm outline-none ${
            errors.description ? "border-red-500 focus:border-red-500" : "border-border bg-background focus:border-accent"
          }`}
          required
        />
        {errors.description ? <p className="mt-2 text-sm text-red-500">{errors.description}</p> : null}
      </label>

      <label className="block">
        <span className="text-sm font-semibold">Archivo</span>
        <div className="mt-2 flex items-center gap-3">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm hover:border-accent ${
              errors.file ? "border-red-500 bg-red-50" : "border-border bg-muted"
            }`}
          >
            <Upload size={16} />
            {file?.name ?? "Selecciona un archivo PDF"}
            <input
              type="file"
              accept=".pdf"
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
        </div>
      </label>

      <Button type="submit" disabled={status === "uploading"}>
        <Upload size={16} />
        {status === "uploading" ? `Subiendo… ${uploadProgress.percent}%` : "Compartir material"}
      </Button>

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

      {message ? (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
