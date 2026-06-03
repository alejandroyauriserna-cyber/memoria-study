"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ClipboardList,
  Loader2,
  MessageSquare,
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type {
  CuadernoAskAction,
  CuadernoClass,
  CuadernoDictionaryResponse,
} from "@/types/cuaderno";

const ASK_ACTIONS: Array<{ id: CuadernoAskAction; label: string }> = [
  { id: "explain", label: "Explícame esto" },
  { id: "summarize", label: "Resúmelo" },
  { id: "examples", label: "Dame ejemplos" },
  { id: "relate", label: "Relaciónalo con otros temas" },
  { id: "exam_questions", label: "Preguntas de examen" },
  { id: "flashcards", label: "Crea flashcards" },
  { id: "key_concepts", label: "Conceptos importantes" },
];

const DICTIONARY_EXAMPLES = [
  "Acto Jurídico",
  "Buena Fe",
  "Interpretación",
  "Casación",
  "Negocio Jurídico",
  "Nulidad",
];

export function CuadernoClassEditor({ initialClass }: { initialClass: CuadernoClass }) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cuadernoClass, setCuadernoClass] = useState(initialClass);
  const [notes, setNotes] = useState(initialClass.notes);
  const [title, setTitle] = useState(initialClass.title);
  const [topic, setTopic] = useState(initialClass.topic ?? "");
  const [classDate, setClassDate] = useState(initialClass.classDate ?? "");
  const [concepts, setConcepts] = useState(initialClass.extractedConcepts);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [dictTerm, setDictTerm] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictEntry, setDictEntry] = useState<CuadernoDictionaryResponse | null>(null);

  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);

  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaveState("saving");
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error al guardar");
      setCuadernoClass(payload.cuadernoClass as CuadernoClass);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    },
    [cuadernoClass.id],
  );

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (notes === cuadernoClass.notes) return;
      persist({ notes }).catch((e) => setError(e instanceof Error ? e.message : "Error al guardar"));
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [notes, cuadernoClass.notes, persist]);

  async function saveMetadata() {
    try {
      await persist({
        title: title.trim(),
        topic: topic.trim() || null,
        classDate: classDate || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function lookupTerm(term: string) {
    const query = term.trim();
    if (!query) return;
    setDictTerm(query);
    setDictLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/dictionary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: query }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error en diccionario");
      setDictEntry(payload.entry as CuadernoDictionaryResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en diccionario");
    } finally {
      setDictLoading(false);
    }
  }

  async function handleAsk(action: CuadernoAskAction) {
    setAskLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error al consultar IA");
      setAskAnswer(payload.answer as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al consultar IA");
    } finally {
      setAskLoading(false);
    }
  }

  async function extractConcepts() {
    setGenLoading("concepts");
    setError(null);
    try {
      const response = await fetch(
        `/api/cuaderno/classes/${cuadernoClass.id}/extract-concepts`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error al extraer");
      setConcepts(payload.concepts as string[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al extraer conceptos");
    } finally {
      setGenLoading(null);
    }
  }

  async function generateOrganizer() {
    setGenLoading("organizer");
    setError(null);
    try {
      const response = await fetch(
        `/api/cuaderno/classes/${cuadernoClass.id}/generate-organizer`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error al generar");
      router.push(payload.redirectUrl ?? "/organizers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar organizador");
      setGenLoading(null);
    }
  }

  async function generateDeck(mode: "deck" | "exam") {
    setGenLoading(mode);
    setError(null);
    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/generate-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error al generar");

      const saveRes = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: { ...payload.deck, academic: payload.academic } }),
      });
      const saved = await saveRes.json();
      if (saveRes.ok && saved.deck?.id) {
        router.push(`/decks/${saved.deck.id}`);
        return;
      }
      setAskAnswer(
        "Material generado. Guarda el deck desde el panel de estudio si no se redirigió automáticamente.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar material");
    } finally {
      setGenLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/cuaderno"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00FFD5]"
        >
          <ArrowLeft size={16} />
          Volver al cuaderno
        </Link>
        <span className="text-xs text-muted-foreground">
          {saveState === "saving"
            ? "Guardando…"
            : saveState === "saved"
              ? "Guardado automáticamente"
              : `${cuadernoClass.courseName} · ${cuadernoClass.cycleLabel}`}
        </span>
      </div>

      <header className="ms-panel p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-1">
            <span className="text-xs text-muted-foreground">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveMetadata}
              className="ms-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="text-xs text-muted-foreground">Tema</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onBlur={saveMetadata}
              className="ms-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="text-xs text-muted-foreground">Fecha</span>
            <input
              type="date"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
              onBlur={saveMetadata}
              className="ms-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Curso: {cuadernoClass.courseName}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="ms-panel space-y-4 p-5 lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#00FFD5]">Apuntes</h2>
            <button
              type="button"
              onClick={extractConcepts}
              disabled={genLoading === "concepts" || !notes.trim()}
              className="text-xs font-medium text-[#00FFD5] hover:underline disabled:opacity-50"
            >
              {genLoading === "concepts" ? "Detectando…" : "Detectar conceptos"}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="El profesor explicó que la interpretación busca determinar el verdadero sentido del negocio jurídico…"
            rows={16}
            className="ms-input w-full resize-y rounded-xl px-4 py-3 text-sm leading-relaxed"
          />

          {concepts.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conceptos clave
              </p>
              <div className="flex flex-wrap gap-2">
                {concepts.map((concept) => (
                  <button
                    key={concept}
                    type="button"
                    onClick={() => lookupTerm(concept)}
                    className="rounded-full border border-[#00FFD5]/25 bg-[#00FFD5]/10 px-3 py-1 text-xs font-medium text-[#00FFD5] transition hover:bg-[#00FFD5]/20"
                  >
                    {concept}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4 lg:col-span-2">
          <section className="ms-panel space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
              <BookOpen size={16} className="text-[#00FFD5]" />
              Diccionario Jurídico IA
            </h2>
            <input
              value={dictTerm}
              onChange={(e) => setDictTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupTerm(dictTerm)}
              placeholder="¿Qué término deseas consultar?"
              className="ms-input w-full rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {DICTIONARY_EXAMPLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => lookupTerm(sample)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-muted-foreground hover:border-[#00FFD5]/30 hover:text-[#00FFD5]"
                >
                  {sample}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={dictLoading || !dictTerm.trim()}
              onClick={() => lookupTerm(dictTerm)}
              className="tron-btn-secondary w-full rounded-xl py-2 text-xs font-semibold disabled:opacity-50"
            >
              {dictLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Consultando…
                </span>
              ) : (
                "Consultar"
              )}
            </button>

            {dictEntry ? (
              <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-xl border border-white/8 bg-black/20 p-3">
                <p className="text-sm font-bold text-[#00FFD5]">{dictEntry.term}</p>
                {dictEntry.sections.map((section) => (
                  <div key={section.id}>
                    <p className="text-[11px] font-semibold text-[#F5F7FA]/80">{section.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="ms-panel space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
              <MessageSquare size={16} className="text-[#00FFD5]" />
              Preguntar a la IA
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {ASK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={askLoading}
                  onClick={() => handleAsk(action.id)}
                  className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-[#F5F7FA]/80 hover:border-[#00FFD5]/30 hover:text-[#00FFD5] disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
            {askLoading ? (
              <p className="text-xs text-muted-foreground">
                <Loader2 size={12} className="mr-1 inline animate-spin" /> Pensando…
              </p>
            ) : null}
            {askAnswer ? (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/8 bg-black/20 p-3 text-xs leading-relaxed text-[#F5F7FA]/85 whitespace-pre-wrap">
                {askAnswer}
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <section className="ms-panel p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#00FFD5]">
          Generar material desde apuntes
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Sin necesidad de PDF — usa tus apuntes como fuente.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <GenButton
            icon={Brain}
            label="Organizador IA"
            loading={genLoading === "organizer"}
            onClick={generateOrganizer}
          />
          <GenButton
            icon={Sparkles}
            label="Flashcards"
            loading={genLoading === "deck"}
            onClick={() => generateDeck("deck")}
          />
          <GenButton
            icon={ClipboardList}
            label="Examen"
            loading={genLoading === "exam"}
            onClick={() => generateDeck("exam")}
          />
          <GenButton
            icon={Wand2}
            label="Mapa mental"
            loading={genLoading === "organizer"}
            onClick={generateOrganizer}
            hint="Crea organizador primero"
          />
          <Link
            href="/organizers"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground hover:border-[#00FFD5]/30 hover:text-[#00FFD5]"
          >
            Prompt visual Gemini
          </Link>
        </div>
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

function GenButton({
  icon: Icon,
  label,
  loading,
  onClick,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  loading: boolean;
  onClick: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      title={hint}
      className="inline-flex items-center gap-2 rounded-xl border border-[#00FFD5]/25 bg-[#00FFD5]/8 px-4 py-2.5 text-xs font-semibold text-[#00FFD5] transition hover:bg-[#00FFD5]/15 disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  );
}
