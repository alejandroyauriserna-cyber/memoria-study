"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Globe, Image, Search, Sparkles, Star, Trash2, X } from "lucide-react";
import {
  createStickerFromAi,
  createStickerFromLibrary,
  createStickerFromSrc,
  type DecorationObject,
} from "@/lib/cuaderno/decoration-objects";
import { endDecorationDrag, writeDecorationDragData } from "@/lib/cuaderno/decoration-drag";
import {
  JURIDICO_PACK_FILTERS,
  STICKER_PANEL_TABS,
  filterJuridicoStickers,
  type StickerPanelTab,
} from "@/lib/cuaderno/sticker-panel";
import type { JuridicoPackId } from "@/lib/cuaderno/sticker-juridico-packs";
import type { PngStickerItem } from "@/lib/cuaderno/sticker-png-packs";
import { CuadernoStickerDesigner } from "@/components/cuaderno/decoration/cuaderno-sticker-designer";
import { CuadernoStickerImportPanel } from "@/components/cuaderno/decoration/cuaderno-sticker-import-modal";
import type { UserStickerRecord } from "@/types/cuaderno-stickers";

const CATALOG_FAV_KEY = "cuaderno-catalog-favorites";

function loadCatalogFavs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CATALOG_FAV_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

async function toggleUserFavorite(stickerId: string, on: boolean) {
  const method = on ? "POST" : "DELETE";
  const url = on
    ? "/api/cuaderno/stickers/favorites"
    : `/api/cuaderno/stickers/favorites?stickerId=${encodeURIComponent(stickerId)}`;
  await fetch(url, {
    method,
    headers: on ? { "Content-Type": "application/json" } : undefined,
    body: on ? JSON.stringify({ stickerId }) : undefined,
  });
}

function setupDragGhost(e: React.DragEvent, img: HTMLImageElement | null) {
  e.dataTransfer.effectAllowed = "copy";
  if (!img?.complete) return;
  const ghost = document.createElement("div");
  ghost.className = "cn-sticker-drag-ghost";
  const clone = img.cloneNode(true) as HTMLImageElement;
  clone.width = 64;
  clone.height = 64;
  ghost.appendChild(clone);
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 32, 32);
  window.setTimeout(() => ghost.remove(), 0);
}

export function CuadernoStickerPanel({
  open,
  onClose,
  onPlaceItem,
  initialTab,
}: {
  open: boolean;
  onClose: () => void;
  onPlaceItem: (item: DecorationObject) => void;
  initialTab?: StickerPanelTab | "stickers" | "images" | "importar";
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StickerPanelTab>("biblioteca");
  const [packFilter, setPackFilter] = useState<JuridicoPackId | "all">("all");
  const [catalogFavs, setCatalogFavs] = useState<string[]>([]);
  const [myStickers, setMyStickers] = useState<UserStickerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [designerSeed, setDesignerSeed] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, onClose]);

  useEffect(() => {
    setCatalogFavs(loadCatalogFavs());
  }, [open]);

  useEffect(() => {
    if (!open || !initialTab) return;
    if (initialTab === "stickers" || initialTab === "images") setTab("biblioteca");
    else if (initialTab === "importar") setTab("importar");
    else setTab(initialTab);
  }, [open, initialTab]);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const q =
        tab === "favoritos"
          ? "?favorites=1"
          : query
            ? `?q=${encodeURIComponent(query)}`
            : "";
      const res = await fetch(`/api/cuaderno/stickers/library${q}`);
      const data = await res.json();
      if (res.ok) setMyStickers(data.stickers ?? []);
    } catch {
      setMyStickers([]);
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    if (!open) return;
    if (tab === "mis-stickers" || tab === "favoritos") void loadLibrary();
  }, [open, tab, loadLibrary]);

  const juridicoItems = useMemo(
    () => filterJuridicoStickers(packFilter, query),
    [packFilter, query],
  );

  const catalogFavItems = useMemo(() => {
    const set = new Set(catalogFavs);
    return juridicoItems.filter((s) => set.has(`png:${s.id}`));
  }, [catalogFavs, juridicoItems]);

  const addPng = (item: PngStickerItem) => {
    onPlaceItem(
      createStickerFromSrc(item.src, item.label, {
        stickerId: `png:${item.id}`,
        aspectRatio: 1,
      }),
    );
  };

  const addUser = (s: UserStickerRecord) => {
    onPlaceItem(createStickerFromLibrary(s.id, s.imageUrl, s.name));
  };

  const toggleCatalogFav = (id: string) => {
    const key = `png:${id}`;
    const next = catalogFavs.includes(key)
      ? catalogFavs.filter((f) => f !== key)
      : [...catalogFavs, key];
    setCatalogFavs(next);
    localStorage.setItem(CATALOG_FAV_KEY, JSON.stringify(next.slice(0, 80)));
  };

  const toggleUserFav = async (s: UserStickerRecord) => {
    const next = !s.isFavorite;
    await toggleUserFavorite(s.id, next);
    setMyStickers((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, isFavorite: next } : x)),
    );
  };

  const deleteUserSticker = async (s: UserStickerRecord) => {
    if (!confirm(`¿Eliminar «${s.name}» de Mis stickers?`)) return;
    try {
      const res = await fetch(
        `/api/cuaderno/stickers/library?id=${encodeURIComponent(s.id)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo eliminar");
      setMyStickers((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  async function quickAi() {
    const p = query.trim() || "Sticker jurídico PNG transparente estilo GoodNotes, balanza dorada";
    setAiLoading(true);
    try {
      const res = await fetch("/api/cuaderno/stickers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onPlaceItem(createStickerFromAi(data.imageDataUrl, data.label ?? p));
    } catch {
      setDesignerSeed(p);
      setDesignerOpen(true);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="cn-sticker-panel-backdrop cn-glass-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden
            />
            <motion.aside
              ref={panelRef}
              className="cn-sticker-panel cn-sticker-panel--glass"
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              role="dialog"
              aria-label="Stickers"
            >
              <header className="cn-sticker-panel-head">
                <div>
                  <span className="cn-sticker-panel-title">Stickers</span>
                  <p className="cn-sticker-panel-hint">Clic o arrastra a la hoja · Ctrl+V imagen Pinterest</p>
                </div>
                <button type="button" className="cn-glass-icon-btn" onClick={onClose} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </header>

              <div className="cn-sticker-panel-search">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar… civil, penal, flores, balanza"
                />
              </div>

              <nav className="cn-sticker-panel-tabs cn-sticker-panel-tabs--glass">
                {STICKER_PANEL_TABS.map((t) => {
                  const Icon =
                    t.id === "biblioteca"
                      ? BookOpen
                      : t.id === "favoritos"
                        ? Star
                        : t.id === "mis-stickers"
                          ? Image
                          : t.id === "importar"
                            ? Globe
                            : Sparkles;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      data-active={tab === t.id}
                      onClick={() => setTab(t.id)}
                    >
                      <Icon size={14} />
                      {t.label}
                    </button>
                  );
                })}
              </nav>

              <div className="cn-sticker-panel-body">
                {tab === "biblioteca" ? (
                  <>
                    <div className="cn-sticker-pack-filters">
                      {JURIDICO_PACK_FILTERS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={packFilter === p.id ? "is-on" : ""}
                          onClick={() => setPackFilter(p.id)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <PngGrid
                      items={juridicoItems}
                      catalogFavs={catalogFavs}
                      onPick={addPng}
                      onCatalogFav={toggleCatalogFav}
                    />
                  </>
                ) : null}

                {tab === "favoritos" ? (
                  <>
                    {catalogFavItems.length > 0 ? (
                      <PngGrid
                        title="Biblioteca jurídica"
                        items={catalogFavItems}
                        catalogFavs={catalogFavs}
                        onPick={addPng}
                        onCatalogFav={toggleCatalogFav}
                      />
                    ) : null}
                    <UserGrid
                      title="Mis stickers favoritos"
                      items={myStickers.filter((s) => s.isFavorite)}
                      loading={loading}
                      onPick={addUser}
                      onToggleFav={toggleUserFav}
                      onDelete={deleteUserSticker}
                    />
                  </>
                ) : null}

                {tab === "mis-stickers" ? (
                  <UserGrid
                    title="Mis stickers"
                    items={myStickers}
                    loading={loading}
                    onPick={addUser}
                    onToggleFav={toggleUserFav}
                    onDelete={deleteUserSticker}
                    emptyHint="Importa desde Pinterest o guarda stickers con IA."
                  />
                ) : null}

                {tab === "importar" ? (
                  <CuadernoStickerImportPanel
                    onSaved={(s) => {
                      setMyStickers((prev) => [s, ...prev]);
                      addUser(s);
                    }}
                  />
                ) : null}

                {tab === "ia" ? (
                  <div className="cn-sticker-ia-tab">
                    <p className="cn-sticker-section-lead">
                      Describe el sticker (PNG transparente). Ej: libros vintage, flores beige, código civil.
                    </p>
                    <button
                      type="button"
                      className="cn-sticker-create-ai"
                      disabled={aiLoading}
                      onClick={() => void quickAi()}
                    >
                      <Sparkles size={16} />
                      {aiLoading ? "Generando…" : "Generar con IA"}
                    </button>
                    <button
                      type="button"
                      className="cn-sticker-designer-link"
                      onClick={() => {
                        setDesignerSeed(query || "Sticker académico");
                        setDesignerOpen(true);
                      }}
                    >
                      Diseñador conversacional
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <CuadernoStickerDesigner
        open={designerOpen}
        initialPrompt={designerSeed}
        onClose={() => setDesignerOpen(false)}
        onInsert={(src, lbl) => onPlaceItem(createStickerFromAi(src, lbl))}
      />
    </>
  );
}

function PngGrid({
  title,
  items,
  catalogFavs,
  onPick,
  onCatalogFav,
}: {
  title?: string;
  items: PngStickerItem[];
  catalogFavs: string[];
  onPick: (item: PngStickerItem) => void;
  onCatalogFav: (id: string) => void;
}) {
  if (!items.length) return <p className="cn-sticker-empty">Sin resultados.</p>;
  return (
    <section className="cn-sticker-grid-section">
      {title ? <h3>{title}</h3> : null}
      <div className="cn-sticker-grid cn-sticker-grid--png">
        {items.map((item) => {
          const favId = `png:${item.id}`;
          return (
            <div key={item.id} className="cn-sticker-cell">
              <div
                role="button"
                tabIndex={0}
                className="cn-sticker-cell-main cn-draggable-source"
                draggable
                onDragStart={(e) => {
                  writeDecorationDragData(e.dataTransfer, {
                    type: "sticker-src",
                    src: item.src,
                    label: item.label,
                    stickerId: favId,
                  });
                  setupDragGhost(e, e.currentTarget.querySelector("img"));
                }}
                onDragEnd={() => endDecorationDrag()}
                onClick={() => onPick(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick(item);
                  }
                }}
              >
                <img src={item.src} alt={item.label} loading="lazy" decoding="async" draggable={false} />
                <span>{item.label}</span>
              </div>
              <button
                type="button"
                className={`cn-sticker-fav${catalogFavs.includes(favId) ? " is-on" : ""}`}
                onClick={() => onCatalogFav(item.id)}
                aria-label="Favorito catálogo"
              >
                <Star size={12} fill={catalogFavs.includes(favId) ? "currentColor" : "none"} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UserGrid({
  title,
  items,
  loading,
  onPick,
  onToggleFav,
  onDelete,
  emptyHint,
}: {
  title: string;
  items: UserStickerRecord[];
  loading: boolean;
  onPick: (s: UserStickerRecord) => void;
  onToggleFav: (s: UserStickerRecord) => void;
  onDelete?: (s: UserStickerRecord) => void;
  emptyHint?: string;
}) {
  if (loading) return <p className="cn-sticker-empty">Cargando…</p>;
  if (!items.length) return <p className="cn-sticker-empty">{emptyHint ?? "Vacío."}</p>;
  return (
    <section className="cn-sticker-grid-section">
      <h3>{title}</h3>
      <div className="cn-sticker-grid cn-sticker-grid--png">
        {items.map((s) => (
          <div key={s.id} className="cn-sticker-cell">
            <div
              role="button"
              tabIndex={0}
              className="cn-sticker-cell-main cn-draggable-source"
              draggable
              onDragStart={(e) => {
                writeDecorationDragData(e.dataTransfer, {
                  type: "user-sticker",
                  userStickerId: s.id,
                  label: s.name,
                  imageUrl: s.imageUrl,
                });
                setupDragGhost(e, e.currentTarget.querySelector("img"));
              }}
              onDragEnd={() => endDecorationDrag()}
              onClick={() => onPick(s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(s);
                }
              }}
            >
              <img src={s.imageUrl} alt={s.name} loading="lazy" decoding="async" draggable={false} />
              <span>{s.name}</span>
            </div>
            <button
              type="button"
              className={`cn-sticker-fav${s.isFavorite ? " is-on" : ""}`}
              onClick={() => void onToggleFav(s)}
              aria-label={s.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Star size={12} fill={s.isFavorite ? "currentColor" : "none"} />
            </button>
            {onDelete ? (
              <button
                type="button"
                className="cn-sticker-delete"
                onClick={() => void onDelete(s)}
                aria-label={`Eliminar ${s.name}`}
              >
                <Trash2 size={12} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
