"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileUp,
  Globe,
  Link2,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
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
import { getJurisprudenceTemplate } from "@/lib/legal-sources/jurisprudence-templates";
import { JurisprudenceSourcesSection } from "@/components/legal-sources/jurisprudence-sources-section";
import { LegalSourcesWizard } from "@/components/legal-sources/legal-sources-wizard";
import {
  isAllowedWebUrlForCategory,
  sanitizeWebUrlList,
  validateWebUrlList,
} from "@/lib/legal-sources/allowed-url-domains";
import { usesStudyCategory, DEFAULT_STUDY_CATEGORIES } from "@/lib/legal-sources/study-categories";
import {
  applyLpSyncToSettings,
  resolvePresetSyncUrls,
  restoreBuiltinAfterLpRemove,
  setPresetSyncUrls,
  sanitizeLpUrlList,
  validateLpUrlList,
} from "@/lib/legal-sources/lp-url-overrides";
import { LP_NORMATIVE_PRESETS } from "@/lib/legal-sources/lp-presets";
import { LpUrlEditor } from "@/components/legal-sources/lp-url-editor";
import {
  addCustomSource,
  fetchLegalSourcesSettings,
  getEnabledSources,
  getManageableSources,
  removeCustomSource,
  reorderSourcePriority,
  saveLegalSourcesSettings,
  syncLegalSourcesSettings,
  updateSourceInSettings,
  upsertCustomSource,
  upsertWebSource,
} from "@/lib/legal-sources/storage";

type MaterialOption = { id: string; title: string; courseName?: string };

export function LegalSourcesWorkspace() {
  const [settings, setSettings] = useState<LegalSourcesSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "upload" | "link" | "web">("upload");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<LegalSourceCategory>("doctrina");
  const [newAuthor, setNewAuthor] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [materialQuery, setMaterialQuery] = useState("");
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncingPresetId, setSyncingPresetId] = useState<string | null>(null);
  const [activeJurisTemplateId, setActiveJurisTemplateId] = useState<string | null>(null);
  const [jurisTemplateUrls, setJurisTemplateUrls] = useState<Record<string, string[]>>({});
  const [syncingWebTemplateId, setSyncingWebTemplateId] = useState<string | null>(null);
  const [genericWebUrls, setGenericWebUrls] = useState<string[]>([""]);
  const [showReconfigureWizard, setShowReconfigureWizard] = useState(false);
  const pageLoadProgress = useLoadingProgress(loading, "profile");
  const uploadProgress = useLoadingProgress(
    uploading || Boolean(syncingPresetId) || Boolean(syncingWebTemplateId),
    "legalSources",
  );

  useEffect(() => {
    if (!settings) return;
    const fromSources: Record<string, string[]> = {};
    for (const source of settings.sources) {
      if (!source.webTemplateId) continue;
      if (source.syncUrls?.length) fromSources[source.webTemplateId] = source.syncUrls;
      else if (source.sourceUrl) fromSources[source.webTemplateId] = [source.sourceUrl];
    }
    setJurisTemplateUrls((prev) => ({ ...prev, ...fromSources }));
  }, [settings]);

  useEffect(() => {
    fetchLegalSourcesSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const jurisprudenceSources = useMemo(() => {
    if (!settings) return [];
    return [...settings.sources]
      .filter((s) => s.category === "jurisprudencia")
      .sort((a, b) => a.priority - b.priority);
  }, [settings]);

  const enabledSources = useMemo(
    () => (settings ? getEnabledSources(settings) : []),
    [settings],
  );

  const manageableSources = useMemo(
    () => (settings ? getManageableSources(settings) : []),
    [settings],
  );

  const syncedPresets = useMemo(() => {
    if (!settings) return new Map<string, LegalSourceRecord>();
    const map = new Map<string, LegalSourceRecord>();
    for (const source of settings.sources) {
      if (source.kind === "url" && source.lpPresetId) {
        map.set(source.lpPresetId, source);
      }
    }
    return map;
  }, [settings]);

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

  async function handleSyncPreset(presetId: string, urlsOverride?: string[]) {
    if (!settings) return;
    const preset = LP_NORMATIVE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const sourceUrls = sanitizeLpUrlList(
      urlsOverride?.length
        ? urlsOverride
        : resolvePresetSyncUrls(settings, presetId, preset.url),
    );

    const validationError = validateLpUrlList(sourceUrls);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSyncingPresetId(presetId);
    setError(null);

    try {
      const res = await fetch("/api/legal-sources/sync-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId, sourceUrls }),
      });
      const data = (await res.json()) as {
        source?: LegalSourceRecord;
        error?: string;
        articleCount?: number;
        sourceUrls?: string[];
      };

      if (!res.ok || !data.source) {
        throw new Error(data.error ?? "No se pudo sincronizar la fuente web.");
      }

      const syncedUrls = sanitizeLpUrlList(data.sourceUrls ?? sourceUrls);
      persist(
        applyLpSyncToSettings(settings, data.source, presetId, syncedUrls),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al sincronizar desde LP.");
    } finally {
      setSyncingPresetId(null);
    }
  }

  function updatePresetUrls(presetId: string, catalogUrl: string, urls: string[]) {
    if (!settings) return;
    persist(setPresetSyncUrls(settings, presetId, urls.length ? urls : [catalogUrl]));
  }

  function updateJurisTemplateUrls(templateId: string, urls: string[]) {
    setJurisTemplateUrls((prev) => ({ ...prev, [templateId]: urls }));
  }

  async function handleSyncWebDocument(templateId: string, urlsOverride?: string[]) {
    if (!settings) return;
    const template = getJurisprudenceTemplate(templateId);
    const urls = sanitizeWebUrlList(
      urlsOverride?.length
        ? urlsOverride
        : jurisTemplateUrls[templateId]?.length
          ? jurisTemplateUrls[templateId]!
          : template?.exampleUrl
            ? [template.exampleUrl]
            : [],
    );

    const validationError = validateWebUrlList(urls, "jurisprudencia");
    if (validationError) {
      setError(validationError);
      return;
    }

    setSyncingWebTemplateId(templateId);
    setError(null);

    try {
      const res = await fetch("/api/legal-sources/sync-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webTemplateId: templateId,
          sourceUrls: urls,
          category: "jurisprudencia",
          title: template?.title,
          author: template?.author,
        }),
      });
      const data = (await res.json()) as {
        source?: LegalSourceRecord;
        error?: string;
        sourceUrls?: string[];
      };

      if (!res.ok || !data.source) {
        throw new Error(data.error ?? "No se pudo sincronizar la URL.");
      }

      const syncedUrls = sanitizeWebUrlList(data.sourceUrls ?? urls);
      setJurisTemplateUrls((prev) => ({ ...prev, [templateId]: syncedUrls }));
      persist(
        upsertWebSource(settings, {
          ...data.source,
          enabled: true,
          priority: 2,
          webTemplateId: templateId,
          syncUrls: syncedUrls,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al sincronizar URL.");
    } finally {
      setSyncingWebTemplateId(null);
    }
  }

  async function handleSyncGenericWeb() {
    if (!settings || !newTitle.trim()) return;
    if (newCategory !== "doctrina" && newCategory !== "jurisprudencia") {
      setError("Solo doctrina o jurisprudencia admiten sincronización web.");
      return;
    }
    const category = newCategory;
    const urls = sanitizeWebUrlList(genericWebUrls);
    const validationError = validateWebUrlList(urls, category);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/legal-sources/sync-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrls: urls,
          category,
          title: newTitle.trim(),
          author: newAuthor.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { source?: LegalSourceRecord; error?: string };

      if (!res.ok || !data.source) {
        throw new Error(data.error ?? "No se pudo sincronizar la URL.");
      }

      persist(
        upsertWebSource(settings, {
          ...data.source,
          enabled: true,
          priority: 1,
          title: newTitle.trim(),
        }),
      );
      resetAddForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al sincronizar URL.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(source: LegalSourceRecord) {
    if (!settings || source.kind === "builtin") return;

    if (source.kind === "upload" || source.kind === "material" || source.kind === "url") {
      try {
        await fetch(`/api/legal-sources/${source.id}`, { method: "DELETE" });
      } catch {
        // continuar eliminando del estado local
      }
    }

    persist(restoreBuiltinAfterLpRemove(removeCustomSource(settings, source.id), source));
  }

  function openQuickJurisUpload(templateId: string) {
    const template = getJurisprudenceTemplate(templateId);
    if (!template) return;
    setActiveJurisTemplateId(templateId);
    setNewCategory("jurisprudencia");
    setNewTitle("");
    setNewAuthor(template.author ?? "");
    setUploadFile(null);
    setAddMode("upload");
    setShowAdd(true);
    setError(null);
  }

  function renderSourceRow(source: LegalSourceRecord) {
    if (!settings) return null;
    const preset = source.lpPresetId
      ? LP_NORMATIVE_PRESETS.find((p) => p.id === source.lpPresetId)
      : undefined;
    const sourceUrls =
      source.kind === "url" && source.lpPresetId && preset
        ? resolvePresetSyncUrls(settings, source.lpPresetId, preset.url)
        : sanitizeLpUrlList(source.syncUrls ?? (source.sourceUrl ? [source.sourceUrl] : []));

    return (
      <SourceRow
        key={source.id}
        source={source}
        syncUrls={sourceUrls.length ? sourceUrls : undefined}
        catalogUrl={preset?.url}
        hideUrlEditor={Boolean(source.lpPresetId)}
        onToggle={() => toggleSource(source.id)}
        onMoveUp={() => persist(reorderSourcePriority(settings, source.id, "up"))}
        onMoveDown={() => persist(reorderSourcePriority(settings, source.id, "down"))}
        onUrlsChange={
          source.kind === "url" && source.lpPresetId && preset
            ? (urls) => updatePresetUrls(source.lpPresetId!, preset.url, urls)
            : undefined
        }
        onResync={
          source.kind === "url" && source.lpPresetId
            ? (urls) => void handleSyncPreset(source.lpPresetId!, urls)
            : undefined
        }
        resyncing={syncingPresetId === source.lpPresetId}
        onRemove={source.kind !== "builtin" ? () => void handleRemove(source) : undefined}
      />
    );
  }

  function resetAddForm() {
    setNewTitle("");
    setNewAuthor("");
    setUploadFile(null);
    setMaterialQuery("");
    setMaterialOptions([]);
    setSelectedMaterialId("");
    setActiveJurisTemplateId(null);
    setGenericWebUrls([""]);
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

  if (!settings.wizardCompleted || showReconfigureWizard) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-6">
        <LegalSourcesWizard
          settings={settings}
          onComplete={(next) => {
            persist(next);
            setShowReconfigureWizard(false);
          }}
          onDismiss={() => {
            if (settings.wizardCompleted) {
              setShowReconfigureWizard(false);
              return;
            }
            persist({
              ...settings,
              wizardCompleted: true,
              studyCategories: settings.studyCategories?.length
                ? settings.studyCategories
                : DEFAULT_STUDY_CATEGORIES,
            });
          }}
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
          Controla qué fuentes puede usar la IA. La normativa verificable proviene únicamente de
          LP Derecho que sincronices tú (con URL y fecha). No usamos códigos integrados estáticos.
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
          <button
            type="button"
            onClick={() => setShowReconfigureWizard(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,255,213,0.15)] px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-[#F5F7FA]"
          >
            <Sparkles size={13} className="text-[#00FFD5]" />
            Reconfigurar tipos de fuente
          </button>
        </div>

        {settings.strictNormativeMode ? (
          <p className="mt-3 rounded-xl border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.06)] px-3 py-2 text-xs text-[#86EFAC]">
            Modo normativo estricto: solo se muestran artículos presentes en tus fuentes LP
            sincronizadas. Sin sync activo, el tutor no citará números de artículo.
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

      {manageableSources.length ? (
        <section className="tron-panel rounded-2xl p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
            <BookOpen size={16} className="text-[#86EFAC]" />
            Activar fuentes para el tutor
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {enabledSources.length} de {manageableSources.length} activa
            {enabledSources.length === 1 ? "" : "s"}. Los cambios se sincronizan con el estudio
            guiado.
          </p>
          <div className="mt-3 space-y-2">
            {manageableSources.map((source) => renderSourceRow(source))}
          </div>
        </section>
      ) : null}

      {usesStudyCategory(settings, "normativa") ? (
      <section className="tron-panel rounded-2xl p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
          <Globe size={16} className="text-[#00BFFF]" />
          Normativa — sincronizar desde web (LP Derecho)
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Descarga normativa desde LP Pasión por el Derecho. Es la única fuente normativa
          verificable de la app: tú eliges la URL, revisas el enlace y queda registrada la fecha de
          sync. Puedes agregar varias URLs si LP divide un código en partes.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {LP_NORMATIVE_PRESETS.map((preset) => {
            const synced = syncedPresets.get(preset.id);
            const busy = syncingPresetId === preset.id;
            const presetUrls = resolvePresetSyncUrls(settings, preset.id, preset.url);

            return (
              <div
                key={preset.id}
                className="flex flex-col gap-2 rounded-xl border border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)] p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#F5F7FA]">{preset.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{preset.normShort}</span>
                    <span className="rounded bg-[rgba(0,191,255,0.15)] px-1.5 py-0.5 text-[9px] font-semibold text-[#00BFFF]">
                      LP Derecho
                    </span>
                    {synced ? (
                      <span
                        className={`text-[10px] ${synced.enabled ? "text-[#86EFAC]" : "text-muted-foreground"}`}
                      >
                        {synced.enabled ? "· Activa en tutor" : "· Desactivada — actívala arriba"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <LpUrlEditor
                  urls={presetUrls}
                  catalogUrl={preset.url}
                  disabled={syncingPresetId === preset.id}
                  onChange={(urls) => updatePresetUrls(preset.id, preset.url, urls)}
                />
                {synced ? (
                  <p className="text-[10px] text-[#86EFAC]">
                    {synced.articleCount ?? "?"} artículos ·{" "}
                    {synced.syncUrls && synced.syncUrls.length > 1
                      ? `${synced.syncUrls.length} URLs · `
                      : ""}
                    {synced.lastSyncedAt
                      ? new Date(synced.lastSyncedAt).toLocaleDateString("es-PE")
                      : "sincronizado"}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Aún no sincronizado</p>
                )}
                <button
                  type="button"
                  disabled={syncingPresetId === preset.id}
                  onClick={() => void handleSyncPreset(preset.id, presetUrls)}
                  className="tron-btn-secondary inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Sincronizando… {uploadProgress.percent}%
                    </>
                  ) : synced ? (
                    <>
                      <RefreshCw size={13} />
                      Re-sincronizar
                    </>
                  ) : (
                    <>
                      <Globe size={13} />
                      Sincronizar
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
      </section>
      ) : null}

      {usesStudyCategory(settings, "jurisprudencia") ? (
      <JurisprudenceSourcesSection
        sources={jurisprudenceSources}
        templateUrls={jurisTemplateUrls}
        syncingWebTemplateId={syncingWebTemplateId}
        onQuickUpload={openQuickJurisUpload}
        onTemplateUrlsChange={updateJurisTemplateUrls}
        onSyncWebUrl={(templateId, urls) => void handleSyncWebDocument(templateId, urls)}
      />
      ) : null}

      <div className="tron-panel rounded-2xl p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Agregar otra fuente
        </p>
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
                setAddMode("web");
                setNewCategory("doctrina");
                setShowAdd(true);
              }}
              className="tron-btn-secondary inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Globe size={16} />
              Sincronizar URL
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
              {(["upload", "link", "web", "manual"] as const).map((mode) => (
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
                  {mode === "upload"
                    ? "Subir PDF"
                    : mode === "link"
                      ? "Vincular"
                      : mode === "web"
                        ? "URL web"
                        : "Metadatos"}
                </button>
              ))}
            </div>

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as LegalSourceCategory)}
              className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
            >
              {LEGAL_SOURCE_CATEGORY_ORDER.filter((cat) => usesStudyCategory(settings, cat)).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {LEGAL_SOURCE_CATEGORY_LABELS[cat]}
                  </option>
                ),
              )}
            </select>

            {addMode === "upload" ? (
              <>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    activeJurisTemplateId
                      ? (getJurisprudenceTemplate(activeJurisTemplateId)?.placeholder ??
                        "Título del PDF de jurisprudencia")
                      : newCategory === "jurisprudencia"
                        ? "Ej. Compendio de casaciones civiles — 2024"
                        : "Ej. Manual de Acto Jurídico — Juan Espinoza"
                  }
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

            {addMode === "web" ? (
              <>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    newCategory === "doctrina"
                      ? "Ej. Artículo — Revista de Derecho Civil"
                      : "Ej. Sentencia TC — expediente 1234"
                  }
                  className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
                />
                <input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Autor u órgano (opcional)"
                  className="h-10 w-full rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm"
                />
                <LpUrlEditor
                  urls={genericWebUrls}
                  disabled={uploading}
                  validateUrl={(url) =>
                    isAllowedWebUrlForCategory(
                      url,
                      newCategory === "doctrina" ? "doctrina" : "jurisprudencia",
                    )
                  }
                  urlLabel="URLs a sincronizar (LP · TC · PJ · SUNAT · SPIJ)"
                  invalidHint="Solo dominios jurídicos permitidos"
                  allowedHostsHint="LP · TC · PJ · SUNAT · SPIJ"
                  onChange={setGenericWebUrls}
                />
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
                  else if (addMode === "web") void handleSyncGenericWeb();
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
  syncUrls,
  catalogUrl,
  hideUrlEditor,
  onToggle,
  onMoveUp,
  onMoveDown,
  onUrlsChange,
  onResync,
  resyncing,
  onRemove,
}: {
  source: LegalSourceRecord;
  syncUrls?: string[];
  catalogUrl?: string;
  hideUrlEditor?: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUrlsChange?: (urls: string[]) => void;
  onResync?: (urls: string[]) => void;
  resyncing?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
        source.enabled
          ? "border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.45)]"
          : "border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] opacity-70"
      }`}
    >
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
          {source.kind === "url" ? (
            <span className="text-[10px] text-[#00BFFF]">
              LP Derecho{source.articleCount ? ` · ${source.articleCount} arts.` : ""}
            </span>
          ) : null}
          {source.kind === "material" ? (
            <span className="text-[10px] text-[#00BFFF]">Biblioteca</span>
          ) : null}
        </div>
        {source.kind === "url" && syncUrls?.length && onUrlsChange && !hideUrlEditor ? (
          <LpUrlEditor
            urls={syncUrls}
            catalogUrl={catalogUrl}
            compact
            disabled={resyncing}
            onChange={onUrlsChange}
          />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {onResync && syncUrls?.length ? (
          <button
            type="button"
            onClick={() => onResync(syncUrls)}
            disabled={resyncing}
            className="rounded p-1 text-[#00BFFF]/80 hover:text-[#00BFFF] disabled:opacity-50"
            aria-label="Re-sincronizar"
          >
            <RefreshCw size={14} className={resyncing ? "animate-spin" : ""} />
          </button>
        ) : null}
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
