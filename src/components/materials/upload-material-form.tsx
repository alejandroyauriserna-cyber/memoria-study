"use client";

import { useCallback, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import { CycleSelector } from "@/components/auth/cycle-selector";
import type { AcademicSelection } from "@/types/academic";

type MaterialType = "apunte" | "resumen" | "pdf" | "caso" | "guia" | "otro";

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

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("uploading");
      setMessage("");

      if (!academic || !file) {
        setStatus("error");
        setMessage("Completa el ciclo, curso y selecciona un archivo PDF.");
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
          throw new Error(payload.error ?? "No se pudo subir el material.");
        }

        setStatus("saved");
        setMessage("Material subido correctamente. Ya está disponible en la biblioteca.");
        setTitle("");
        setDescription("");
        setFile(null);
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Error al subir el material.");
      }
    },
    [academic, description, file, materialType, title],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm">
      <AcademicNavigator value={academic} onChange={setAcademic} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Título del material</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título descriptivo"
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
            required
          />
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
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Describe brevemente el contenido y utilidad del archivo."
          className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-accent"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">Archivo</span>
        <div className="mt-2 flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-4 py-3 text-sm hover:border-accent">
            <Upload size={16} />
            {file?.name ?? "Selecciona un archivo compatible"}
            <input
              type="file"
              accept=".pdf,.docx,.pptx,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) {
                  setFile(selected);
                  setStatus("idle");
                  setMessage("");
                }
              }}
              required
            />
          </label>
        </div>
      </label>

      <Button type="submit" disabled={status === "uploading"}>
        {status === "uploading" ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
        {status === "uploading" ? "Subiendo..." : "Compartir material"}
      </Button>

      {message ? (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
