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
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { CuadernoCanvasEditor } from "@/components/cuaderno/cuaderno-canvas-editor";
import { COVER_GRADIENTS } from "@/lib/cuaderno/preferences";
import { getCourseVisualPrefs } from "@/lib/cuaderno/preferences";
import type {
  CuadernoAskAction,
  CuadernoClass,
  CuadernoDictionaryResponse,
} from "@/types/cuaderno";
import "./cuaderno-premium.css";

const DICTIONARY_EXAMPLES = [
  "Exhorto",
  "Acto jurídico",
  "Negocio jurídico",
  "Antijuridicidad",
  "Compensación",
];

export function CuadernoClassEditor({ initialClass }: { initialClass: CuadernoClass }) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefs = getCourseVisualPrefs(initialClass.courseId);

  const [cuadernoClass, setCuadernoClass] = useState(initialClass);
  const [notes, setNotes] = useState(initialClass.notes);
  const [title, setTitle] = useState(initialClass.title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [dictTerm, setDictTerm] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictEntry, setDictEntry] = useState<CuadernoDictionaryResponse | null>(null);

  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<"dictionary" | "ai">("dictionary");

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
      setSideTab("dictionary");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en diccionario");
    } finally {
      setDictLoading(false);
    }
  }

  async function handleAsk(
    action: CuadernoAskAction | "legislation" | "mind_map",
    selectedText?: string,
  ) {
    setAskLoading(true);
    setSideTab("ai");
    setError(null);

    let apiAction: CuadernoAskAction = "explain";
    let customPrompt: string | undefined;

    if (action === "legislation") {
      apiAction = "explain";
      customPrompt = `Busca y explica la legislación peruana relevante para: «${selectedText ?? ""}». Cita artículos si es posible.`;
    } else if (action === "mind_map") {
      apiAction = "relate";
      customPrompt = `Convierte esto en una estructura de mapa mental (título central, ramas y subramas): «${selectedText ?? ""}»`;
    } else {
      apiAction = action;
      if (selectedText) {
        customPrompt = `Sobre este fragmento de mis apuntes: «${selectedText}»`;
      }
    }

    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: apiAction, prompt: customPrompt }),
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
      setAskAnswer("Material generado. Revisa el panel de estudio.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar material");
    } finally {
      setGenLoading(null);
    }
  }

  return (
    <div className="cuaderno-premium mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/cuaderno/curso/${cuadernoClass.courseId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00FFD5]"
        >
          <ArrowLeft size={16} />
          {cuadernoClass.courseName}
        </Link>
        <span className="text-xs text-muted-foreground">
          {saveState === "saving"
            ? "Guardando…"
            : saveState === "saved"
              ? "Guardado"
              : cuadernoClass.cycleLabel}
        </span>
      </div>

      <header
        className="rounded-2xl border border-white/8 px-5 py-4"
        style={{ background: COVER_GRADIENTS[prefs.cover] }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl">{prefs.icon}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persist({ title: title.trim() })}
            className="cn-hero-title min-w-0 flex-1 border-0 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/40"
            placeholder="Título de la clase"
          />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="xl:col-span-8">
          <CuadernoCanvasEditor
            notes={notes}
            onChange={setNotes}
            onSelectionAction={(action, text) => handleAsk(action, text)}
          />
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <div className="flex gap-1 rounded-xl border border-white/8 bg-black/20 p-1">
            <button
              type="button"
              className="cn-tab flex-1"
              data-active={sideTab === "dictionary"}
              onClick={() => setSideTab("dictionary")}
            >
              Diccionario
            </button>
            <button
              type="button"
              className="cn-tab flex-1"
              data-active={sideTab === "ai"}
              onClick={() => setSideTab("ai")}
            >
              IA
            </button>
          </div>

          {sideTab === "dictionary" ? (
            <section className="rounded-2xl border border-white/8 bg-[#12181f]/80 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
                <BookOpen size={16} className="text-[#00FFD5]" />
                Diccionario Jurídico
              </h2>
              <input
                value={dictTerm}
                onChange={(e) => setDictTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupTerm(dictTerm)}
                placeholder="¿Qué significa?"
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#00FFD5]/40"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DICTIONARY_EXAMPLES.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => lookupTerm(sample)}
                    className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-muted-foreground hover:text-[#00FFD5]"
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={dictLoading}
                onClick={() => lookupTerm(dictTerm)}
                className="tron-btn-secondary mt-3 w-full rounded-xl py-2 text-xs font-semibold"
              >
                {dictLoading ? "Consultando…" : "Consultar"}
              </button>
              {dictEntry ? (
                <div className="mt-4 max-h-64 space-y-2 overflow-y-auto text-xs">
                  <p className="font-bold text-[#00FFD5]">{dictEntry.term}</p>
                  {dictEntry.sections.map((s) => (
                    <div key={s.id}>
                      <p className="font-semibold text-[#F5F7FA]/90">{s.title}</p>
                      <p className="text-muted-foreground">{s.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl border border-white/8 bg-[#12181f]/80 p-5">
              <p className="text-xs text-muted-foreground">
                Selecciona texto en la hoja o usa los botones inferiores.
              </p>
              {askLoading ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  <Loader2 size={12} className="mr-1 inline animate-spin" /> Pensando…
                </p>
              ) : null}
              {askAnswer ? (
                <div className="mt-3 max-h-72 overflow-y-auto rounded-xl bg-black/25 p-3 text-xs leading-relaxed whitespace-pre-wrap text-[#F5F7FA]/90">
                  {askAnswer}
                </div>
              ) : null}
            </section>
          )}

          <section className="rounded-2xl border border-white/8 bg-[#12181f]/80 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#00FFD5]">
              Generar desde apuntes
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <GenButton icon={Brain} label="Organizador" loading={genLoading === "organizer"} onClick={generateOrganizer} />
              <GenButton icon={Sparkles} label="Flashcards" loading={genLoading === "deck"} onClick={() => generateDeck("deck")} />
              <GenButton icon={ClipboardList} label="Examen" loading={genLoading === "exam"} onClick={() => generateDeck("exam")} />
              <GenButton icon={Wand2} label="Mapa" loading={false} onClick={generateOrganizer} />
            </div>
          </section>
        </aside>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

function GenButton({
  icon: Icon,
  label,
  loading,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-[#00FFD5]/25 bg-[#00FFD5]/8 px-3 py-2 text-[11px] font-semibold text-[#00FFD5] disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  );
}
