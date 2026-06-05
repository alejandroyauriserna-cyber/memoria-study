"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { generateGeminiText } from "@/lib/ai/gemini-text";
import {
  getPremiumFeature,
  isPremiumFeatureAvailable,
} from "@/lib/billing/premium-features";
import { PremiumGateCard } from "@/components/ui/premium-gate-card";
import { PremiumGateDismissed } from "@/components/ui/premium-gate-dismissed";

const STICKER_FEATURE = getPremiumFeature("ai-sticker-packs");

const SUGGESTIONS = [
  "Un sticker kawaii de una balanza de justicia",
  "Juez estilo anime con toga",
  "Constitución con cara feliz",
  "Mascota jurídica con libro y café",
  "Balanza dorada elegante",
];

export function CuadernoStickerDesigner({
  open,
  onClose,
  onInsert,
  initialPrompt = "",
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (src: string, label: string) => void;
  initialPrompt?: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateDismissed, setGateDismissed] = useState(false);
  const stickerProgress = useLoadingProgress(loading, "sticker");
  const stickerProAvailable = isPremiumFeatureAvailable("ai-sticker-packs");

  useEffect(() => {
    if (open && initialPrompt) setPrompt(initialPrompt);
    if (open) setGateDismissed(false);
  }, [open, initialPrompt]);

  async function generateImage(userPrompt: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cuaderno/stickers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar");
      setPreview({ src: data.imageDataUrl, label: data.label ?? userPrompt });
      setChat((c) => [
        ...c,
        { role: "user", text: userPrompt },
        { role: "assistant", text: "¡Listo! Revisa la vista previa y pulsa «Insertar en la hoja»." },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function askDesigner() {
    const text = prompt.trim();
    if (!text) return;
    setChat((c) => [...c, { role: "user", text }]);
    setPrompt("");

    let refined = "";
    try {
      refined = await generateGeminiText({
        prompt: `Eres un diseñador de stickers para apuntes de Derecho en Perú. El estudiante pide: «${text}».
Responde en 2 frases: 1) idea visual del sticker 2) prompt corto en inglés para generar imagen PNG transparente (máx 40 palabras).`,
      });
    } catch {
      refined = "";
    }

    if (refined) {
      setChat((c) => [...c, { role: "assistant", text: refined }]);
      const match = refined.match(/prompt[^:]*:\s*(.+)$/im);
      const genPrompt = match?.[1]?.trim() ?? text;
      await generateImage(genPrompt);
    } else {
      await generateImage(text);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="cn-sticker-designer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="cn-sticker-designer"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
          >
            <header className="cn-sticker-designer-head">
              <Sparkles size={18} />
              <div>
                <h2>🎨 Diseñador IA</h2>
                <p>Conversa y genera stickers jurídicos con Gemini</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>

            {!stickerProAvailable ? (
              <div className="p-4">
                {gateDismissed ? (
                  <PremiumGateDismissed
                    featureTitle={STICKER_FEATURE.title}
                    onShowAgain={() => setGateDismissed(false)}
                  />
                ) : (
                  <PremiumGateCard
                    feature={STICKER_FEATURE}
                    compact
                    onDismiss={() => setGateDismissed(true)}
                  />
                )}
              </div>
            ) : (
              <>
            <div className="cn-sticker-designer-chat">
              {chat.length === 0 ? (
                <p className="cn-sticker-designer-hint">
                  Ejemplo: «Crea un sticker de Derecho Constitucional con balanza dorada»
                </p>
              ) : (
                chat.map((m, i) => (
                  <div key={i} className={`cn-sticker-chat-bubble is-${m.role}`}>
                    {m.text}
                  </div>
                ))
              )}
            </div>

            {preview ? (
              <div className="cn-sticker-designer-preview">
                <img src={preview.src} alt="" />
                <div className="cn-sticker-designer-preview-actions">
                  <button type="button" onClick={() => generateImage(preview.label)}>
                    Otra variante
                  </button>
                  <button
                    type="button"
                    className="cn-sticker-designer-insert"
                    onClick={() => {
                      onInsert(preview.src, preview.label);
                      onClose();
                    }}
                  >
                    Insertar en la hoja
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <p className="cn-sticker-designer-error">{error}</p> : null}

            {loading ? (
              <LoadingState
                active
                preset="sticker"
                percent={stickerProgress.percent}
                message={stickerProgress.message}
                stageLabel={stickerProgress.stageLabel}
                variant="inline"
                className="mx-4 mb-2"
              />
            ) : null}

            <div className="cn-sticker-designer-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setPrompt(s)}>
                  {s}
                </button>
              ))}
            </div>

            <footer className="cn-sticker-designer-foot">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe tu sticker…"
                onKeyDown={(e) => e.key === "Enter" && !loading && void askDesigner()}
              />
              <button type="button" disabled={loading} onClick={() => void askDesigner()}>
                {loading ? `Creando… ${stickerProgress.percent}%` : (
                  <>
                    <Sparkles size={16} />
                    Crear
                  </>
                )}
              </button>
            </footer>
              </>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
