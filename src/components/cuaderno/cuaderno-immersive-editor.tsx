"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, Star } from "lucide-react";
import { CuadernoCanvasEditor } from "@/components/cuaderno/cuaderno-canvas-editor";
import { CuadernoAiSidebar } from "@/components/cuaderno/cuaderno-ai-sidebar";
import {
  saveExamItemAsync,
  saveSummaryItemAsync,
  toggleFavoriteClassAsync,
} from "@/lib/cuaderno/smart-collections";
import { useCuadernoSyncContextOptional } from "@/components/cuaderno/cuaderno-sync-context";
import { isCachedFavorite } from "@/lib/cuaderno/collections-client";
import type { CuadernoAskAction, CuadernoClass, CuadernoDictionaryResponse } from "@/types/cuaderno";
import "./cuaderno-premium.css";

export function CuadernoImmersiveEditor({ initialClass }: { initialClass: CuadernoClass }) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cuadernoClass, setCuadernoClass] = useState(initialClass);
  const [notes, setNotes] = useState(initialClass.notes);
  const [title, setTitle] = useState(initialClass.title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [favorite, setFavorite] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [dictTerm, setDictTerm] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictEntry, setDictEntry] = useState<CuadernoDictionaryResponse | null>(null);

  const [customPrompt, setCustomPrompt] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = useCuadernoSyncContextOptional();

  useEffect(() => {
    setFavorite(sync?.isFavorite(cuadernoClass.id) ?? isCachedFavorite(cuadernoClass.id));
  }, [cuadernoClass.id, sync]);

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
    setAiOpen(true);
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

  async function handleAsk(
    action: CuadernoAskAction | "legislation" | "mind_map",
    promptText?: string,
    saveAs?: "summary" | "exam",
  ) {
    setAskLoading(true);
    setAiOpen(true);
    setError(null);

    let apiAction: CuadernoAskAction = "explain";
    let custom = promptText;

    if (action === "legislation") {
      apiAction = "explain";
      custom = `Busca legislación peruana relevante: «${promptText ?? ""}»`;
    } else if (action === "mind_map") {
      apiAction = "relate";
      custom = `Estructura de mapa mental: «${promptText ?? ""}»`;
    } else if (promptText) {
      apiAction = action === "summarize" ? "summarize" : action === "exam_questions" ? "exam_questions" : action;
      custom = promptText;
    }

    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: apiAction, prompt: custom }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error IA");
      const answer = payload.answer as string;
      setAskAnswer(answer);

      if (saveAs === "summary" || apiAction === "summarize") {
        void saveSummaryItemAsync({
          classId: cuadernoClass.id,
          courseName: cuadernoClass.courseName,
          classTitle: cuadernoClass.title,
          title: `Resumen · ${cuadernoClass.title}`,
          content: answer,
        });
      }
      if (saveAs === "exam" || apiAction === "exam_questions") {
        void saveExamItemAsync({
          classId: cuadernoClass.id,
          courseName: cuadernoClass.courseName,
          classTitle: cuadernoClass.title,
          title: `Preguntas · ${cuadernoClass.title}`,
          content: answer,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error IA");
    } finally {
      setAskLoading(false);
    }
  }

  async function generateOrganizer() {
    setGenLoading("organizer");
    try {
      const response = await fetch(
        `/api/cuaderno/classes/${cuadernoClass.id}/generate-organizer`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error");
      router.push(payload.redirectUrl ?? "/organizers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setGenLoading(null);
    }
  }

  async function generateDeck() {
    setGenLoading("deck");
    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/generate-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "deck" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error");
      const saveRes = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: { ...payload.deck, academic: payload.academic } }),
      });
      const saved = await saveRes.json();
      if (saveRes.ok && saved.deck?.id) router.push(`/decks/${saved.deck.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setGenLoading(null);
    }
  }

  return (
    <div className={`cn-immersive-root ${aiOpen ? "cn-immersive-root--ai-open" : ""}`}>
      <header className="cn-immersive-toolbar">
        <Link
          href={`/cuaderno/curso/${cuadernoClass.courseId}`}
          className="cn-immersive-back"
          aria-label="Volver al curso"
        >
          <ArrowLeft size={18} />
        </Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => persist({ title: title.trim() })}
          className="cn-immersive-title"
          aria-label="Título de la clase"
        />
        <span className="cn-immersive-status">
          {saveState === "saving" ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Guardando
            </>
          ) : saveState === "saved" ? (
            "Guardado"
          ) : (
            cuadernoClass.courseName
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            void toggleFavoriteClassAsync(cuadernoClass.id).then((next) => {
              setFavorite(next);
              void sync?.refresh();
            });
          }}
          className={`cn-immersive-icon-btn ${favorite ? "is-active" : ""}`}
          title="Favoritos"
        >
          <Star size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={() => setAiOpen((v) => !v)}
          className={`cn-immersive-ai-toggle ${aiOpen ? "is-open" : ""}`}
        >
          <Sparkles size={16} />
          IA Jurídica
        </button>
      </header>

      <main className="cn-immersive-main">
        <CuadernoCanvasEditor
          immersive
          notes={notes}
          onChange={setNotes}
          onSelectionAction={(action, text) => {
            setAiOpen(true);
            if (action === "summarize") {
              void handleAsk("summarize", `Resume: «${text}»`, "summary");
            } else if (action === "exam_questions") {
              void handleAsk("exam_questions", `Preguntas sobre: «${text}»`, "exam");
            } else {
              void handleAsk(action, `Sobre: «${text}»`);
            }
          }}
        />
      </main>

      <CuadernoAiSidebar
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        dictTerm={dictTerm}
        onDictTermChange={setDictTerm}
        dictLoading={dictLoading}
        dictEntry={dictEntry}
        onLookup={lookupTerm}
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
        onAskCustom={() => {
          const p = customPrompt.trim();
          if (!p) return;
          const saveAs = /resum/i.test(p) ? "summary" : /pregunta|examen|simulacro/i.test(p) ? "exam" : undefined;
          void handleAsk("explain", p, saveAs);
        }}
        onQuickPrompt={(p) => {
          const saveAs = /resum/i.test(p) ? "summary" : /pregunta|examen/i.test(p) ? "exam" : undefined;
          void handleAsk("explain", p, saveAs);
        }}
        askLoading={askLoading}
        askAnswer={askAnswer}
        onGenerateOrganizer={generateOrganizer}
        onGenerateDeck={generateDeck}
        onGenerateExam={() => handleAsk("exam_questions", "Genera un simulacro de examen con mis apuntes", "exam")}
        genLoading={genLoading}
      />

      {error ? <p className="cn-immersive-error">{error}</p> : null}
    </div>
  );
}
