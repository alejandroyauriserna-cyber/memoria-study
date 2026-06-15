"use client";

import { useState } from "react";
import { X, Link2 } from "lucide-react";
import "./cuaderno-new-note-dialog.css";

export function CuadernoJoinSharedDialog({
  isOpen,
  onClose,
  onJoined,
}: {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (classId: string) => void;
}) {
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;

    const extracted = trimmed.includes("/compartido/")
      ? trimmed.split("/compartido/").pop()?.split(/[?#]/)[0]
      : trimmed;

    if (!extracted) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/cuaderno/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: extracted }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "No se pudo unir.");
      onJoined(payload.classId as string);
      setToken("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al unirse.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="cn-new-note-overlay" onClick={onClose}>
      <div className="cn-new-note-dialog cn-new-note-dialog--dark" onClick={(e) => e.stopPropagation()}>
        <div className="cn-new-note-header">
          <h2>Unirse a un cuaderno</h2>
          <button className="cn-new-note-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cn-new-note-form">
          <p className="cn-join-hint">
            Pega el enlace que te compartió un compañero o el código del cuaderno grupal.
          </p>
          <div className="cn-form-group">
            <label htmlFor="join-token">
              <Link2 size={14} style={{ display: "inline", marginRight: 6 }} />
              Enlace o código
            </label>
            <input
              id="join-token"
              type="text"
              placeholder="https://.../cuaderno/compartido/abc123"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              className="cn-form-input"
            />
          </div>

          {error && <p className="cn-form-error">{error}</p>}

          <div className="cn-new-note-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="cn-btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={!token.trim() || isSubmitting} className="cn-btn-primary">
              {isSubmitting ? "Uniendo..." : "Unirme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
