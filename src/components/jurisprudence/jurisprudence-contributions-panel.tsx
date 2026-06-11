"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Loader2, PlusCircle, Send, Trash2, XCircle } from "lucide-react";
import type { JurisprudenceRecord } from "@/types/jurisprudence";
import { JURISPRUDENCE_TIPO_LABELS } from "@/lib/jurisprudence/labels";

type ContributionStatus = "pending" | "published" | "rejected";

type Props = {
  onChanged: () => void;
  onContribute?: () => void;
};

function ContributionStepper({ status }: { status: ContributionStatus }) {
  const steps = [
    { id: "sent", label: "Enviado", done: true },
    {
      id: "review",
      label: "En revisión",
      done: status !== "pending",
      active: status === "pending",
    },
    {
      id: "result",
      label: status === "rejected" ? "Rechazado" : "Publicado",
      done: status === "published" || status === "rejected",
      active: status === "published" || status === "rejected",
      rejected: status === "rejected",
    },
  ];

  return (
    <ol className="bj-contribution-stepper" aria-label="Estado del aporte">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className={[
            step.done ? "is-done" : "",
            step.active ? "is-active" : "",
            step.rejected ? "is-rejected" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="bj-contribution-stepper__dot" aria-hidden>
            {step.rejected && step.active ? (
              <XCircle size={12} />
            ) : step.done && step.id === "result" && !step.rejected ? (
              <Check size={12} />
            ) : step.active ? (
              <Clock size={12} />
            ) : step.done ? (
              <Check size={12} />
            ) : (
              <Send size={10} />
            )}
          </span>
          <span className="bj-contribution-stepper__label">{step.label}</span>
          {index < steps.length - 1 ? (
            <span className="bj-contribution-stepper__line" aria-hidden />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function JurisprudenceMyContributions({ onChanged, onContribute }: Props) {
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

  return (
    <section className="bj-my-contributions">
      <p className="bj-my-contributions__title">Mis aportes UNT</p>
      {error ? <p className="bj-results__error">{error}</p> : null}

      {!items.length && !error ? (
        <div className="bj-my-contributions__empty">
          <p>Aún no has aportado sentencias a la biblioteca.</p>
          {onContribute ? (
            <button type="button" className="bj-my-contributions__cta" onClick={onContribute}>
              <PlusCircle size={16} />
              Aportar mi primera sentencia
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="bj-my-contributions__list">
          {items.map((item) => {
            const status = (item.status ?? "pending") as ContributionStatus;
            return (
              <li key={item.id} className="bj-my-contributions__item">
                <div className="bj-my-contributions__copy">
                  <strong>{item.title}</strong>
                  <span>{JURISPRUDENCE_TIPO_LABELS[item.tipo]}</span>
                  <ContributionStepper status={status} />
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
                  {busyId === item.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
