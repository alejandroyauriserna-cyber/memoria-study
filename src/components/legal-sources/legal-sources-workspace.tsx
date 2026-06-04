"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileUp,
  Link2,
  Lock,
  Plus,
  Scale,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import {
  LEGAL_SOURCE_CATEGORY_LABELS,
  LEGAL_SOURCE_CATEGORY_ORDER,
  type LegalSourceCategory,
  type LegalSourceRecord,
  type LegalSourcesSettings,
} from "@/types/legal-sources";
import { LEGAL_SOURCE_TYPE_HINTS } from "@/lib/legal-sources/defaults";
import {
  addCustomSource,
  fetchLegalSourcesSettings,
  getEnabledSources,
  removeCustomSource,
  reorderSourcePriority,
  saveLegalSourcesSettings,
  syncLegalSourcesSettings,
  updateSourceInSettings,
} from "@/lib/legal-sources/storage";

type MaterialOption = { id: string; title: string; courseName?: string };

export function LegalSourcesWorkspace() {
  const [settings, setSettings] = useState<LegalSourcesSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "upload" | "link">("upload");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<LegalSourceCategory>("doctrina");
  const [newAuthor, setNewAuthor] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [materialQuery, setMaterialQuery] = useState("");
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pageLoadProgress = useLoadingProgress(loading, "profile");
  const uploadProgress = useLoadingProgress(uploading, "legalSources");

  useEffect(() => {
    fetchLegalSourcesSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    if (!settings) return [];
    const sorted = [...settings.sources].sort((a, b) => a.priority - b.priority);
    return LEGAL_SOURCE_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      hints: LEGAL_SOURCE_TYPE_HINTS[cat] ?? [],
      items: sorted.filter((s) => s.category === cat),
    })).filter((g) => g.items.length);
  }, [settings]);

  const enabledSources = useMemo(
    () => (settings ? getEnabledSources(settings) : []),
    [settings],
  );

  const persist = useCallback((next: LegalSourcesSettings) => {
    setSettings(next);
    saveLegalSourcesSettings(next);
    void syncLegalSourcesSettings(next);
  }, []);

  function toggleSource(id: string) {
    if (!settings) return;
    const source = settings.sources.find((s) => s.id === id);
    if (!source) return;
    persist(updateSourceInSettings(settings, id, { enabled: !source.enabled }));
  }

  function toggleStrictNormative() {
    if (!settings) return;
    persist({ ...settings, strictNormativeMode: !settings.strictNormativeMode });
  }

  function toggleStrict() {
    if (!settings) return;
    persist({ ...settings, strictMode: !settings.strictMode });
  }

  function handleAddManual() {
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
    resetAddForm();
  }

  async function handleUpload() {
    if (!settings || !uploadFile || !newTitle.trim()) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", newTitle.trim());
      formData.append("category", newCategory);
      if (newAuthor.trim()) formData.append("author", newAuthor.trim());

      const res = await fetch("/api/legal-sources/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { source?: LegalSourceRecord; error?: string };

      if (!res.ok || !data.source) {
        throw new Error(data.error ?? "No se pudo subir la fuente.");
      }

      persist(addCustomSource(settings, { ...data.source, enabled: true, priority: 1 }));
      resetAddForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al subir PDF.");
    } finally {
      setUploading(false);
    }
  }

  async function searchMaterials(query: string) {
    setMaterialQuery(query);
    if (query.trim().length < 2) {
      setMaterialOptions([]);
      return;
    }

    try {
      const res = await fetch(`/api/materials/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = (await res.json()) as { materials?: Array<{ id: string; title: string; courseName?: string }> };
      setMaterialOptions(
        (data.materials ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          courseName: m.courseName,
        })),
      );
    } catch {
      setMaterialOptions([]);
    }
  }

  async function handleLinkMaterial() {
    if (!settings || !selectedMaterialId) return;
    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/legal-sources/link-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: selectedMaterialId, category: newCategory }),
      });
      const data = (await res.json()) as { source?: LegalSourceRecord; error?: string };

      if (!res.ok || !data.source) {
        throw new Error(data.error ?? "No se pudo vincular el material.");
      }

      persist(addCustomSource(settings, { ...data.source, enabled: true, priority: 1 }));
      resetAddForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al vincular material.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(source: LegalSourceRecord) {
    if (!settings || source.kind === "builtin") return;

    if (source.kind === "upload" || source.kind === "material") {
      try {
        await fetch(`/api/legal-sources/${source.id}`, { method: "DELETE" });
      } catch {
        // continuar eliminando del estado local
      }
    }

    persist(removeCustomSource(settings, source.id));
  }

  function resetAddForm() {
    setNewTitle("");
    setNewAuthor("");
    setUploadFile(null);
    setMaterialQuery("");
    setMaterialOptions([]);
    setSelectedMaterialId("");
    setShowAdd(false);
    setError(null);
  }

  if (loading || !settings) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <LoadingState
          active
          preset="profile"
          percent={pageLoadProgress.percent}
          message={pageLoadProgress.message}
          stageLabel={pageLoadProgress.stageLabel}
        />
      </div>
    );
  }

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
          <button
            type="button"
            onClick={toggleStrictNormative}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              settings.strictNormativeMode
                ? "border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.1)] text-[#86EFAC]"
                : "border-[rgba(0,255,213,0.15)] text-muted-foreground hover:text-[#F5F7FA]"
            }`}
          >
            <Scale size={15} />
            Solo mostrar artículos verificados
          </button>
          <span className="text-xs text-muted-foreground">
            {enabledSources.length} fuente{enabledSources.length === 1 ? "" : "s"} activa
            {enabledSources.length === 1 ? "" : "s"}
          </span>
        </div>

        {settings.strictNormativeMode ? (
          <p className="mt-3 rounded-xl border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.06)] px-3 py-2 text-xs text-[#86EFAC]">
            Modo normativo estricto: solo se muestran artículos verificados en la base jurídica
            indexada. Si no hay certeza, no se citará ningún número de artículo.
          </p>
        ) : null}
        {settings.strictMode ? (
          <p className="mt-3 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.06)] px-3 py-2 text-xs text-[#FCA5A5]">
            Modo estricto: si la respuesta no está en tus fuentes autorizadas ni en el PDF en
            estudio, la IA responderá: &quot;No encontré esta información dentro de las fuentes
            autorizadas por el usuario.&quot;
          </p>
        ) : null}
      </div>

      {enabledSources.length ? (
        <section className="tron-panel rounded-2xl p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <BookOpen size={16} className="text-[#86EFAC]" />
            Fuentes activadas (orden de prioridad)
          </p>
          <ol className="mt-3 space-y-1.5">
            {enabledSources.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-[rgba(134,239,172,0.15)] bg-[rgba(134,239,172,0.06)] px-3 py-2 text-sm text-[#F5F7FA]"
              >
                <span className="mr-2 text-xs font-bold text-[#86EFAC]">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                {s.extractedText ? (
                  <span className="shrink-0 text-[10px] text-[#86EFAC]">PDF indexado</span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {grouped.map(({ category, hints, items }) => (
        <section key={category} className="tron-panel rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-bold text-[#F5F7FA]">
              {LEGAL_SOURCE_CATEGORY_LABELS[category]}
            </h2>
            <p className="max-w-md text-[10px] text-muted-foreground">
              {hints.join(" · ")}
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {items.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                onToggle={() => toggleSource(source.id)}
                onMoveUp={() => persist(reorderSourcePriority(settings, source.id, "up"))}
                onMoveDown={() => persist(reorderSourcePriority(settings, source.id, "down"))}
                onRemove={
                  source.kind !== "builtin" ? () => void handleRemove(source) : undefined
                }
              />
            ))}
          </div>
        </section>
      ))}

      <div className="tron-panel rounded-2xl p-5">
        {!showAdd ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAddMode("upload");
                setShowAdd(true);
              }}
              className="tron-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Upload size={16} />
              Subir PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMode("link");
                setShowAdd(true);
              }}
              className="tron-btn-secondary inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Link2 size={16} />
              Vincular material
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMode("manual");
                setShowAdd(true);
              }}
              className="tron-btn-secondary inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Plus size={16} />
              Solo metadatos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["upload", "link", "manual"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAddMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    addMode === mode
                      ? "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]"
                      : "text-muted-foreground"
                  }`}
                >
                  {mode === "upload" ? "Subir PDF" : mode === "link" ? "Vincular" : "Metadatos"}
                </button>
              ))}
            </div>

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

            {addMode === "upload" ? (
              <>
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
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[rgba(0,255,213,0.2)] bg-[rgba(0,0,0,0.2)] px-4 py-6 text-sm text-muted-foreground hover:border-[rgba(0,255,213,0.35)]">
                  <FileUp size={24} className="text-[#00FFD5]" />
                  {uploadFile ? uploadFile.name : "Seleccionar PDF jurídico"}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </>
            ) : null}

            {addMode === "link" ? (
              <>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={materialQuery}
                    onChange={(e) => void searchMaterials(e.target.value)}
                    placeholder="Buscar material en la biblioteca..."
                    className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] pl-9 pr-3 text-sm"
                  />
                </div>
                {materialOptions.length ? (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[rgba(0,255,213,0.1)] p-2">
                    {materialOptions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMaterialId(m.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                          selectedMaterialId === m.id
                            ? "bg-[rgba(0,255,213,0.12)] text-[#00FFD5]"
                            : "text-[#F5F7FA]/80 hover:bg-[rgba(255,255,255,0.04)]"
                        }`}
                      >
                        <span className="font-medium">{m.title}</span>
                        {m.courseName ? (
                          <span className="ml-1 text-muted-foreground">— {m.courseName}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            {addMode === "manual" ? (
              <>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título de la fuente"
                  className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
                />
                <input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Autor (opcional)"
                  className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
                />
              </>
            ) : null}

            {error ? <p className="text-xs text-red-400">{error}</p> : null}

            {uploading ? (
              <LoadingState
                active
                preset="legalSources"
                percent={uploadProgress.percent}
                message={uploadProgress.message}
                stageLabel={uploadProgress.stageLabel}
              />
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  if (addMode === "upload") void handleUpload();
                  else if (addMode === "link") void handleLinkMaterial();
                  else handleAddManual();
                }}
                className="tron-btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
              >
                {uploading ? `Guardando… ${uploadProgress.percent}%` : "Guardar fuente"}
              </button>
              <button
                type="button"
                onClick={resetAddForm}
                className="tron-btn-secondary h-10 rounded-xl px-4 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Prioridad: arriba = mayor peso cuando existan contradicciones entre fuentes. Las citaciones
        automáticas aparecen en el tutor jurídico durante el estudio guiado.
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
        <div className="flex flex-wrap items-center gap-2">
          {source.author ? (
            <p className="truncate text-[10px] text-muted-foreground">{source.author}</p>
          ) : null}
          {source.extractedText ? (
            <span className="text-[10px] text-[#86EFAC]">Texto indexado</span>
          ) : null}
          {source.kind === "material" ? (
            <span className="text-[10px] text-[#00BFFF]">Biblioteca</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          className="rounded p-1 text-muted-foreground hover:text-white"
          aria-label="Subir prioridad"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          className="rounded p-1 text-muted-foreground hover:text-white"
          aria-label="Bajar prioridad"
        >
          <ChevronDown size={14} />
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-red-400/70 hover:text-red-400"
            aria-label="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
