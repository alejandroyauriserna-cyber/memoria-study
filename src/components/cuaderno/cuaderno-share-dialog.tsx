"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Copy, Check, Users, Eye, Pencil } from "lucide-react";
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
    if (!isOpen) return;
    setPermission(isGroupNotebook ? "edit" : initialPermission);
    void loadCollaborators();
  }, [isOpen, isGroupNotebook, initialPermission, loadCollaborators]);

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

  if (!isOpen) return null;

  return (
    <div className="cn-share-overlay" onClick={onClose}>
      <div className="cn-share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cn-share-header">
          <div>
            <h2>{isGroupNotebook ? "Cuaderno grupal" : "Compartir apunte"}</h2>
            <p>Invita compañeros a ver o editar esta hoja</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {!isGroupNotebook && (
          <div className="cn-share-permissions">
            <button
              type="button"
              className={permission === "view" ? "is-active" : ""}
              onClick={() => setPermission("view")}
            >
              <Eye size={16} />
              Solo lectura
            </button>
            <button
              type="button"
              className={permission === "edit" ? "is-active" : ""}
              onClick={() => setPermission("edit")}
            >
              <Pencil size={16} />
              Pueden editar
            </button>
          </div>
        )}

        {isGroupNotebook && (
          <p className="cn-share-group-note">
            Los cuadernos grupales permiten edición colaborativa. Comparte el enlace con tu salón o grupo de estudio.
          </p>
        )}

        <div className="cn-share-actions">
          <button type="button" className="cn-share-generate" onClick={generateLink} disabled={loading}>
            {loading ? "Generando..." : shareUrl ? "Actualizar enlace" : "Generar enlace"}
          </button>
        </div>

        {shareUrl && (
          <div className="cn-share-url-row">
            <input readOnly value={shareUrl} className="cn-share-url-input" />
            <button type="button" onClick={copyLink} className="cn-share-copy">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        )}

        {error && <p className="cn-form-error">{error}</p>}

        {collaborators.length > 0 && (
          <div className="cn-share-collaborators">
            <p className="cn-share-collab-title">
              <Users size={14} /> Colaboradores ({collaborators.length})
            </p>
            <ul>
              {collaborators.map((c) => (
                <li key={c.userId}>
                  {c.displayName ?? "Estudiante"}
                  <span>{c.role === "editor" ? "Editor" : "Lector"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="cn-share-footnote">
          La edición simultánea guarda los cambios de forma secuencial. Recarga si no ves las últimas modificaciones.
        </p>
      </div>
    </div>
  );
}
