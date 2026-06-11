"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { JurisprudenceRecord } from "@/types/jurisprudence";
import { JURISPRUDENCE_TIPO_LABELS } from "@/lib/jurisprudence/labels";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de revisión",
  published: "Publicado",
  rejected: "Rechazado",
};

type Props = {
  onChanged: () => void;
};

export function JurisprudenceMyContributions({ onChanged }: Props) {
  const [items, setItems] = useState<JurisprudenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/jurisprudence/contributions/mine");
      const payload = (await response.json()) as { items?: JurisprudenceRecord[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudieron cargar tus aportes.");
      setItems(payload.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al cargar aportes.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm("¿Retirar este aporte de la biblioteca?")) return;
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/jurisprudence/contributions/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo eliminar.");
      setItems((prev) => prev.filter((item) => item.id !== id));
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al eliminar.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return null;
  if (!items.length && !error) return null;

  return (
    <section className="bj-my-contributions">
      <p className="bj-my-contributions__title">Mis aportes UNT</p>
      {error ? <p className="bj-results__error">{error}</p> : null}
      <ul className="bj-my-contributions__list">
        {items.map((item) => (
          <li key={item.id} className="bj-my-contributions__item">
            <div className="bj-my-contributions__copy">
              <strong>{item.title}</strong>
              <span>
                {JURISPRUDENCE_TIPO_LABELS[item.tipo]} ·{" "}
                <em className={`bj-status is-${item.status ?? "pending"}`}>
                  {STATUS_LABELS[item.status ?? "pending"]}
                </em>
              </span>
              {item.rejectionReason ? (
                <span className="bj-my-contributions__reason">{item.rejectionReason}</span>
              ) : null}
            </div>
            <button
              type="button"
              className="bj-my-contributions__delete"
              disabled={busyId === item.id}
              onClick={() => void handleDelete(item.id)}
              aria-label="Retirar aporte"
            >
              {busyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
