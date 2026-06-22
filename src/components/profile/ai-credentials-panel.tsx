"use client";

import { useState } from "react";
import { KeyRound, Link2, Trash2 } from "lucide-react";

type Props = {
  geminiConnected: boolean;
  hfConnected: boolean;
  onUpdated: () => void;
};

export function AiCredentialsPanel({ geminiConnected, hfConnected, onUpdated }: Props) {
  const [geminiKey, setGeminiKey] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [loading, setLoading] = useState<"gemini" | "hf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function connect(provider: "gemini" | "hf") {
    setLoading(provider);
    setError(null);
    setNotice(null);
    try {
      const apiKey = provider === "gemini" ? geminiKey.trim() : hfToken.trim();
      const res = await fetch("/api/profile/ai-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo conectar.");

      if (provider === "gemini") setGeminiKey("");
      else setHfToken("");

      setNotice(
        provider === "gemini"
          ? "Gemini conectado. +45 min bonus si el reto está activo."
          : "Hugging Face conectado. +30 min bonus si el reto está activo.",
      );
      onUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al conectar.");
    } finally {
      setLoading(null);
    }
  }

  async function disconnect(provider: "gemini" | "hf") {
    setLoading(provider);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/profile/ai-credentials?provider=${provider}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo quitar.");
      setNotice("Clave eliminada.");
      onUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al quitar.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="ai-credentials-panel">
      <p className="ai-credentials-panel__title">
        <Link2 size={14} />
        Activar mi motor IA
      </p>

      <div className="ai-credentials-panel__card">
        <div className="ai-credentials-panel__head">
          <KeyRound size={16} />
          <div>
            <p className="ai-credentials-panel__label">Gemini (Google AI Studio)</p>
            <p className="ai-credentials-panel__hint">
              Mazos, tutor y texto.{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Crear API key gratis →
              </a>
            </p>
          </div>
          {geminiConnected ? (
            <button
              type="button"
              className="ai-credentials-panel__remove"
              disabled={loading === "gemini"}
              onClick={() => void disconnect("gemini")}
            >
              <Trash2 size={14} />
              Quitar
            </button>
          ) : null}
        </div>
        {!geminiConnected ? (
          <div className="ai-credentials-panel__row">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Pega tu API key de Gemini"
              className="ai-credentials-panel__input"
              disabled={loading === "gemini"}
            />
            <button
              type="button"
              className="ai-credentials-panel__connect"
              disabled={loading === "gemini" || geminiKey.trim().length < 20}
              onClick={() => void connect("gemini")}
            >
              Conectar
            </button>
          </div>
        ) : (
          <p className="ai-credentials-panel__connected">✓ Gemini conectado</p>
        )}
      </div>

      <div className="ai-credentials-panel__card">
        <div className="ai-credentials-panel__head">
          <KeyRound size={16} />
          <div>
            <p className="ai-credentials-panel__label">Hugging Face (FLUX)</p>
            <p className="ai-credentials-panel__hint">
              Avatares e imágenes.{" "}
              <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">
                Crear token con Inference Providers →
              </a>
            </p>
          </div>
          {hfConnected ? (
            <button
              type="button"
              className="ai-credentials-panel__remove"
              disabled={loading === "hf"}
              onClick={() => void disconnect("hf")}
            >
              <Trash2 size={14} />
              Quitar
            </button>
          ) : null}
        </div>
        {!hfConnected ? (
          <div className="ai-credentials-panel__row">
            <input
              type="password"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="hf_..."
              className="ai-credentials-panel__input"
              disabled={loading === "hf"}
            />
            <button
              type="button"
              className="ai-credentials-panel__connect"
              disabled={loading === "hf" || !hfToken.trim().startsWith("hf_")}
              onClick={() => void connect("hf")}
            >
              Conectar
            </button>
          </div>
        ) : (
          <p className="ai-credentials-panel__connected">✓ Hugging Face conectado</p>
        )}
      </div>

      {error ? <p className="ai-credentials-panel__error">{error}</p> : null}
      {notice ? <p className="ai-credentials-panel__notice">{notice}</p> : null}
    </div>
  );
}
