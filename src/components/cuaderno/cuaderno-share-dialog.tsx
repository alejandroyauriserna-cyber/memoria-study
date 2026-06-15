"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Users, Eye, Pencil, Share2, Link2 } from "lucide-react";
import type { CuadernoSharePermission } from "@/types/cuaderno";
import "./cuaderno-share-dialog.css";

export function CuadernoShareDialog({
  classId,
  isOpen,
  onClose,
  initialPermission = "view",
  isGroupNotebook = false,
}: {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  initialPermission?: CuadernoSharePermission;
  isGroupNotebook?: boolean;
}) {
  const [permission, setPermission] = useState<CuadernoSharePermission>(initialPermission);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [collaborators, setCollaborators] = useState<
    Array<{ userId: string; displayName: string | null; role: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const loadCollaborators = useCallback(async () => {
    const res = await fetch(`/api/cuaderno/classes/${classId}/share`);
    if (res.ok) {
      const payload = await res.json();
      setCollaborators(payload.collaborators ?? []);
    }
  }, [classId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setPermission(isGroupNotebook ? "edit" : initialPermission);
    void loadCollaborators();
  }, [isOpen, isGroupNotebook, initialPermission, loadCollaborators]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function generateLink() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cuaderno/classes/${classId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "No se pudo generar el enlace.");
      setShareUrl(payload.shareUrl as string);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al compartir.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!mounted) return null;

  const dialog = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="cn-share-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="cn-share-dialog"
            role="dialog"
            aria-labelledby="cn-share-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="cn-share-header">
              <div className="cn-share-header-icon" aria-hidden>
                <Share2 size={20} />
              </div>
              <div className="cn-share-header-text">
                <h2 id="cn-share-title">{isGroupNotebook ? "Cuaderno grupal" : "Compartir apunte"}</h2>
                <p>Invita compañeros a ver o editar esta hoja</p>
              </div>
              <button type="button" className="cn-share-close" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>

            <div className="cn-share-body">
              {!isGroupNotebook && (
                <div className="cn-share-permissions">
                  <button
                    type="button"
                    className={`cn-share-perm-card${permission === "view" ? " is-active" : ""}`}
                    onClick={() => setPermission("view")}
                  >
                    <span className="cn-share-perm-icon">
                      <Eye size={18} />
                    </span>
                    <span className="cn-share-perm-copy">
                      <strong>Solo lectura</strong>
                      <small>Pueden ver el apunte sin modificarlo</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`cn-share-perm-card${permission === "edit" ? " is-active" : ""}`}
                    onClick={() => setPermission("edit")}
                  >
                    <span className="cn-share-perm-icon">
                      <Pencil size={18} />
                    </span>
                    <span className="cn-share-perm-copy">
                      <strong>Pueden editar</strong>
                      <small>Colaboración en tiempo real secuencial</small>
                    </span>
                  </button>
                </div>
              )}

              {isGroupNotebook && (
                <div className="cn-share-group-note">
                  Los cuadernos grupales permiten edición colaborativa. Comparte el enlace con tu salón o grupo de
                  estudio.
                </div>
              )}

              <button
                type="button"
                className="cn-share-generate tron-btn-primary"
                onClick={generateLink}
                disabled={loading}
              >
                {loading ? "Generando enlace…" : shareUrl ? "Actualizar enlace" : "Generar enlace de acceso"}
              </button>

              {shareUrl && (
                <div className="cn-share-url-block">
                  <p className="cn-share-url-label">
                    <Link2 size={14} />
                    Enlace para compartir
                  </p>
                  <div className="cn-share-url-row">
                    <input readOnly value={shareUrl} className="cn-share-url-input" aria-label="Enlace compartido" />
                    <button
                      type="button"
                      onClick={copyLink}
                      className={`cn-share-copy tron-btn-secondary${copied ? " is-copied" : ""}`}
                      aria-label={copied ? "Copiado" : "Copiar enlace"}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="cn-share-error">{error}</p>}

              {collaborators.length > 0 && (
                <div className="cn-share-collaborators">
                  <p className="cn-share-collab-title">
                    <Users size={15} />
                    Colaboradores
                    <span className="cn-share-collab-count">{collaborators.length}</span>
                  </p>
                  <ul>
                    {collaborators.map((c) => (
                      <li key={c.userId}>
                        <span className="cn-share-collab-name">{c.displayName ?? "Estudiante"}</span>
                        <span className="cn-share-collab-role">{c.role === "editor" ? "Editor" : "Lector"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="cn-share-footnote">
                La edición simultánea guarda los cambios de forma secuencial. Recarga si no ves las últimas
                modificaciones.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(dialog, document.body);
}
