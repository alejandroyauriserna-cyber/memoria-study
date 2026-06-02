"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { get } from "idb-keyval";

export function AcademicTutorChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askPdf(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const pdfText = await get("pdfText");
      if (!pdfText) {
        setError("Primero genera un mazo desde un PDF para activar el tutor.");
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText, question }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo consultar el PDF.");
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar el PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ms-panel p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[rgba(0,255,213,0.12)] text-[#00FFD5]">
          <Bot size={22} />
        </div>
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
            <Sparkles size={14} />
            Tutor jurídico
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#F5F7FA]">Pregunta sobre tu PDF</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Respuestas con contexto del documento y enfoque académico para Derecho UNT.
          </p>
        </div>
      </div>

      <form onSubmit={askPdf} className="mt-6 space-y-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="¿Cuál es la diferencia entre normas sancionadoras y dispositivas?"
          className="ms-input resize-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="tron-btn-primary inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {loading ? "Generando respuesta..." : "Enviar pregunta"}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-2"
          >
            <div className="h-3 w-3/4 animate-pulse rounded bg-[rgba(0,255,213,0.12)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[rgba(0,255,213,0.08)]" />
          </motion.div>
        ) : null}

        {error ? (
          <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-sm text-[#FF8A00]">
            {error}
          </motion.p>
        ) : null}

        {answer ? (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">Respuesta</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#F5F7FA]">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
