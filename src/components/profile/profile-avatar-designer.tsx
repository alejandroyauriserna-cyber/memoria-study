"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Trash2, Wand2, X } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

const SUGGESTIONS = [
  "Estudiante de derecho estilo anime con toga y libros",
  "Mascota búho jurídico con gafas redondas",
  "Avatar cyberpunk cyan con laptop y café",
  "Superhéroe del estudio con capa y balanza",
  "Retrato kawaii con estrella en la frente",
  "Detective legal con lupa y código civil",
];

type Props = {
  open: boolean;
  onClose: () => void;
  fullName: string;
  avatarUrl?: string | null;
  accent?: string;
  onAvatarUpdated: (avatarUrl: string | null) => void;
};

export function ProfileAvatarDesigner({
  open,
  onClose,
  fullName,
  avatarUrl,
  accent = "#00FFD5",
  onAvatarUpdated,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const progress = useLoadingProgress(loading, "sticker");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setPreviewUrl(avatarUrl ?? null);
      setError(null);
      setNotice(null);
    }
  }, [open, avatarUrl]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function generateAvatar(userPrompt: string) {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/profile/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, displayName: fullName }),
      });
      const data = (await res.json()) as {
        avatarUrl?: string;
        error?: string;
        warning?: string | null;
        source?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar el avatar.");
      if (!data.avatarUrl) throw new Error("No se recibió la imagen del avatar.");

      setPreviewUrl(data.avatarUrl);
      onAvatarUpdated(data.avatarUrl);

      if (data.warning) {
        setNotice(data.warning);
      } else if (data.source === "flux") {
        setNotice("Avatar IA generado con FLUX.");
      } else if (data.source === "fallback") {
        setNotice("Vista previa con iniciales. Configura HF_TOKEN en Vercel para ilustraciones IA.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al generar.");
    } finally {
      setLoading(false);
    }
  }

  async function removeAvatar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/avatar/generate", { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo quitar el avatar.");
      setPreviewUrl(null);
      onAvatarUpdated(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al quitar avatar.");
    } finally {
      setLoading(false);
    }
  }

  function submitPrompt() {
    const text = prompt.trim();
    if (!text || loading) return;
    void generateAvatar(text);
    setPrompt("");
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="profile-avatar-designer__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="profile-avatar-designer"
            style={{ ["--designer-accent" as string]: accent }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-avatar-designer-title"
          >
            <header className="profile-avatar-designer__head">
              <div>
                <p className="profile-avatar-designer__kicker">
                  <Sparkles size={13} />
                  Motor de imágenes IA
                </p>
                <h2 id="profile-avatar-designer-title" className="profile-avatar-designer__title">
                  Crea tu avatar
                </h2>
                <p className="profile-avatar-designer__subtitle">
                  Aparecerá en tu perfil y en el ranking. Usamos FLUX (Hugging Face) — sin Gemini de
                  pago.
                </p>
              </div>
              <button type="button" className="profile-avatar-designer__close" onClick={onClose}>
                <X size={18} />
              </button>
            </header>

            <div className="profile-avatar-designer__preview">
              <ProfileAvatar
                name={fullName}
                avatarUrl={previewUrl}
                size="lg"
                accent={accent}
                priority
              />
            </div>

            <div className="profile-avatar-designer__suggestions">
              {SUGGESTIONS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  className="profile-avatar-designer__chip"
                  disabled={loading}
                  onClick={() => {
                    setPrompt(idea);
                    void generateAvatar(idea);
                  }}
                >
                  {idea}
                </button>
              ))}
            </div>

            <div className="profile-avatar-designer__composer">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitPrompt()}
                placeholder="Ej. Avatar pixel art de estudiante con birrete"
                className="profile-avatar-designer__input"
                disabled={loading}
              />
              <button
                type="button"
                className="profile-avatar-designer__generate"
                disabled={loading || !prompt.trim()}
                onClick={submitPrompt}
              >
                <Wand2 size={16} />
                Generar
              </button>
            </div>

            {loading ? (
              <LoadingState
                active
                preset="sticker"
                percent={progress.percent}
                message={progress.message}
                stageLabel={progress.stageLabel}
                variant="inline"
                className="mt-3"
              />
            ) : null}

            {error ? <p className="profile-avatar-designer__error">{error}</p> : null}
            {notice && !error ? (
              <p className="profile-avatar-designer__notice">{notice}</p>
            ) : null}

            <div className="profile-avatar-designer__actions">
              {previewUrl ? (
                <button
                  type="button"
                  className="profile-avatar-designer__remove"
                  disabled={loading}
                  onClick={() => void removeAvatar()}
                >
                  <Trash2 size={14} />
                  Quitar avatar
                </button>
              ) : null}
              <button type="button" className="profile-avatar-designer__done" onClick={onClose}>
                Listo
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
