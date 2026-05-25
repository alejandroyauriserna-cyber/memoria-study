"use client";

import { FileUp, Loader2, Save, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeckPreview } from "@/components/study/deck-preview";
import type { StudyDeck } from "@/types/study";

type Status = "idle" | "generating" | "saving" | "error" | "saved";

export function UploadGenerator() {
  const [deck, setDeck] = useState<StudyDeck | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function generate(formData: FormData) {
    setStatus("generating");
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el deck.");
      }

      setDeck(payload.deck);

      localStorage.setItem(
        "pdfText",
        payload.pdfText,
      );

      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Algo salio mal.");
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
        body: JSON.stringify({ deck: { ...deck, isPublic: true } }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar el deck.");
      }

      setDeck({ ...payload.deck, generatedWith: deck.generatedWith });
      setStatus("saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Algo salio mal.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-5">
      <form
        action={generate}
        className="rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <span className="text-sm font-semibold">PDF de estudio</span>
            <label className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted px-4 text-center hover:border-accent">
              <FileUp className="mb-2 text-accent" size={22} />
              <span className="text-sm font-semibold">
                {fileName || "Elegir archivo PDF"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                PDF con texto seleccionable, hasta 12 MB
              </span>
              <input
                name="file"
                type="file"
                accept="application/pdf"
                className="sr-only"
                required
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>
          <label className="lg:w-60">
            <span className="text-sm font-semibold">Audiencia</span>
            <input
              name="audience"
              defaultValue="estudiantes universitarios"
              className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <Button className="lg:w-48" disabled={status === "generating"}>
            {status === "generating" ? <Loader2 className="animate-spin" size={16} /> : <WandSparkles size={16} />}
            {status === "generating" ? "Generando..." : "Generar"}
          </Button>
        </div>
        {error ? <p className="mt-4 text-sm font-medium text-red-500">{error}</p> : null}
      </form>

      {deck ? (
        <>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold text-accent">{deck.sourceName}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">{deck.title}</h1>
                {deck.generatedWith ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                    <Sparkles size={14} className="text-accent" />
                    Motor: {deck.generatedWith.label}. {deck.generatedWith.note}
                  </p>
                ) : null}
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {deck.summary}
                </p>
              </div>
              <Button variant="secondary" onClick={saveDeck} disabled={status === "saving"}>
                {status === "saving" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {status === "saved" ? "Guardado" : "Guardar deck publico"}
              </Button>
            </div>
          </div>
          <DeckPreview deck={deck} />
        </>
      ) : null}
    </div>
  );
}
