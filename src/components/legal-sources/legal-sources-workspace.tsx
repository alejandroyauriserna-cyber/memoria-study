"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";
import {
  LEGAL_SOURCE_CATEGORY_LABELS,
  LEGAL_SOURCE_CATEGORY_ORDER,
  type LegalSourceCategory,
  type LegalSourceRecord,
  type LegalSourcesSettings,
} from "@/types/legal-sources";
import {
  addCustomSource,
  loadLegalSourcesSettings,
  removeCustomSource,
  reorderSourcePriority,
  saveLegalSourcesSettings,
  updateSourceInSettings,
} from "@/lib/legal-sources/storage";

export function LegalSourcesWorkspace() {
  const [settings, setSettings] = useState<LegalSourcesSettings | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<LegalSourceCategory>("doctrina");
  const [newAuthor, setNewAuthor] = useState("");

  useEffect(() => {
    setSettings(loadLegalSourcesSettings());
  }, []);

  const grouped = useMemo(() => {
    if (!settings) return [];
    const sorted = [...settings.sources].sort((a, b) => a.priority - b.priority);
    return LEGAL_SOURCE_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      items: sorted.filter((s) => s.category === cat),
    })).filter((g) => g.items.length);
  }, [settings]);

  function persist(next: LegalSourcesSettings) {
    setSettings(next);
    saveLegalSourcesSettings(next);
  }

  function toggleSource(id: string) {
    if (!settings) return;
    const source = settings.sources.find((s) => s.id === id);
    if (!source) return;
    persist(updateSourceInSettings(settings, id, { enabled: !source.enabled }));
  }

  function toggleStrict() {
    if (!settings) return;
    persist({ ...settings, strictMode: !settings.strictMode });
  }

  function handleAdd() {
    if (!settings || !newTitle.trim()) return;
    persist(
      addCustomSource(settings, {
        title: newTitle.trim(),
        category: newCategory,
        author: newAuthor.trim() || undefined,
        enabled: true,
        priority: 1,
        kind: "upload",
        description: `Fuente personalizada: ${newTitle.trim()}`,
      }),
    );
    setNewTitle("");
    setNewAuthor("");
    setShowAdd(false);
  }

  if (!settings) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#00FFD5]" size={28} />
      </div>
    );
  }

  const enabledCount = settings.sources.filter((s) => s.enabled).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="tron-panel rounded-2xl p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">
          <Scale size={14} />
          Fuentes Jurídicas
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#F5F7FA]">Mi Biblioteca Jurídica</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Controla qué fuentes puede usar la IA. Solo las fuentes activadas se utilizarán para
          explicar, citar y enseñar durante el estudio guiado.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleStrict}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              settings.strictMode
                ? "border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] text-[#FCA5A5]"
                : "border-[rgba(0,255,213,0.15)] text-muted-foreground hover:text-[#F5F7FA]"
            }`}
          >
            <Lock size={15} />
            Solo responder con mis fuentes
          </button>
          <span className="text-xs text-muted-foreground">
            {enabledCount} fuente{enabledCount === 1 ? "" : "s"} activa{enabledCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {grouped.map(({ category, items }) => (
        <section key={category} className="tron-panel rounded-2xl p-5">
          <h2 className="text-sm font-bold text-[#F5F7FA]">
            {LEGAL_SOURCE_CATEGORY_LABELS[category]}
          </h2>
          <div className="mt-3 space-y-2">
            {items.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                onToggle={() => toggleSource(source.id)}
                onMoveUp={() => persist(reorderSourcePriority(settings, source.id, "up"))}
                onMoveDown={() => persist(reorderSourcePriority(settings, source.id, "down"))}
                onRemove={
                  source.kind !== "builtin"
                    ? () => persist(removeCustomSource(settings, source.id))
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      ))}

      <div className="tron-panel rounded-2xl p-5">
        {!showAdd ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="tron-btn-secondary inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
          >
            <Plus size={16} />
            Agregar fuente personalizada
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#F5F7FA]">Nueva fuente</p>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej. Manual de Acto Jurídico — Juan Espinoza"
              className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
            />
            <input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Autor (opcional)"
              className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as LegalSourceCategory)}
              className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
            >
              {LEGAL_SOURCE_CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {LEGAL_SOURCE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="tron-btn-primary h-10 rounded-xl px-4 text-sm font-semibold"
              >
                Guardar fuente
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="tron-btn-secondary h-10 rounded-xl px-4 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Prioridad: arriba = mayor peso cuando existan contradicciones entre fuentes.
      </p>
    </div>
  );
}

function SourceRow({
  source,
  onToggle,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  source: LegalSourceRecord;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.45)] px-3 py-2.5">
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
          source.enabled
            ? "border-[rgba(0,255,213,0.35)] bg-[rgba(0,255,213,0.12)] text-[#00FFD5]"
            : "border-[rgba(255,255,255,0.08)] text-muted-foreground"
        }`}
        aria-label={source.enabled ? "Desactivar" : "Activar"}
      >
        {source.enabled ? "✓" : ""}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F5F7FA]">{source.title}</p>
        {source.author ? (
          <p className="truncate text-[10px] text-muted-foreground">{source.author}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onMoveUp} className="rounded p-1 text-muted-foreground hover:text-white" aria-label="Subir prioridad">
          <ChevronUp size={14} />
        </button>
        <button type="button" onClick={onMoveDown} className="rounded p-1 text-muted-foreground hover:text-white" aria-label="Bajar prioridad">
          <ChevronDown size={14} />
        </button>
        {onRemove ? (
          <button type="button" onClick={onRemove} className="rounded p-1 text-red-400/70 hover:text-red-400" aria-label="Eliminar">
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
