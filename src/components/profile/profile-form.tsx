"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CycleSelector } from "@/components/auth/cycle-selector";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

type CurrentCycle = {
  cycleNumber: number;
  cycleLabel: string;
};

type Props = {
  fullName?: string | null;
  currentCycle?: CurrentCycle | null;
  compact?: boolean;
};

export function ProfileForm({ fullName = "", currentCycle = null, compact = false }: Props) {
  const [name, setName] = useState(fullName ?? "");
  const [cycle, setCycle] = useState<CurrentCycle>(
    currentCycle ?? {
      cycleNumber: UNT_DERECHO.years[0].cycles[0].number,
      cycleLabel: UNT_DERECHO.years[0].cycles[0].label,
    },
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          currentCycle: cycle,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar el perfil.");
      }

      setStatus("saved");
      setMessage("Guardado.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Error al guardar.");
    }
  }

  const inputClass = compact ? "profile-input mt-2 h-10" : "mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "space-y-4"
          : "space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm"
      }
    >
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        <label className="block">
          <span className={`font-semibold ${compact ? "text-xs text-muted-foreground" : "text-sm"}`}>
            Nombre
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tu nombre"
            className={inputClass}
            required
          />
        </label>

        <div>
          <CycleSelector value={cycle} onChange={setCycle} />
        </div>
      </div>

      <Button type="submit" disabled={status === "saving" || !name.trim()} className={compact ? "h-9 px-4 text-xs" : undefined}>
        {status === "saving" ? "Guardando..." : "Guardar"}
      </Button>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>{message}</p>
      ) : null}
    </form>
  );
}
