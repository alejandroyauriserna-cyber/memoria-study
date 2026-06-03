"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Star, X } from "lucide-react";
import {
  createDecoElement,
  createPostIt,
  createStickerFromAi,
  createStickerFromCatalog,
  type DecorationObject,
  type PostItColor,
} from "@/lib/cuaderno/decoration-objects";
import {
  DECORATION_DRAG_MIME,
  encodeDecorationDrag,
} from "@/lib/cuaderno/decoration-drag";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";
import {
  STICKER_MARKETPLACE,
  getStickerById,
  type StickerCatalogItem,
} from "@/lib/cuaderno/sticker-catalog";
import {
  STICKER_PANEL_TABS,
  filterStickersForPanel,
  type StickerPanelTab,
} from "@/lib/cuaderno/sticker-panel";
import { CuadernoStickerDesigner } from "@/components/cuaderno/decoration/cuaderno-sticker-designer";

const FAV_KEY = "cuaderno-sticker-favorites";
const RECENT_KEY = "cuaderno-sticker-recents";

const POSTIT_ORDER: PostItColor[] = ["yellow", "pink", "blue", "green", "purple"];

const POSTIT_LABELS: Record<PostItColor, string> = {
  yellow: "Amarillo",
  pink: "Rosa",
  blue: "Azul",
  green: "Verde",
  purple: "Morado",
};

function loadIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids.slice(0, 24)));
}

export function CuadernoStickerPanel({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: DecorationObject) => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StickerPanelTab>("juridicos");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [designerSeed, setDesignerSeed] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    setFavorites(loadIds(FAV_KEY));
    setRecents(loadIds(RECENT_KEY));
  }, [open]);

  const results = useMemo(
    () => filterStickersForPanel(tab, query, favorites),
    [tab, query, favorites],
  );

  const addSticker = (item: StickerCatalogItem) => {
    onAdd(createStickerFromCatalog(item.id, getStickerSvgDataUrl(item), item.label));
    const next = [item.id, ...recents.filter((id) => id !== item.id)];
    setRecents(next);
    saveIds(RECENT_KEY, next);
  };

  const toggleFav = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    saveIds(FAV_KEY, next);
  };

  function openDesigner(prompt = "") {
    setDesignerSeed(prompt);
    setDesignerOpen(true);
  }

  async function quickGenerate() {
    const p =
      query.trim() ||
      "Crea un sticker kawaii de Derecho Constitucional con balanza dorada";
    setQuickLoading(true);
    try {
      const res = await fetch("/api/cuaderno/stickers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdd(createStickerFromAi(data.imageDataUrl, data.label ?? p));
      setQuery("");
    } catch {
      openDesigner(p);
    } finally {
      setQuickLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="cn-sticker-panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="cn-sticker-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              role="dialog"
              aria-label="Panel de stickers"
            >
              <header className="cn-sticker-panel-head">
                <div>
                  <span>✨ Stickers</span>
                  <p className="cn-sticker-panel-hint">Arrastra a la hoja · clic para insertar</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </header>

              <div className="cn-sticker-panel-search cn-sticker-panel-search--global">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="balanza, juez, constitución, penal…"
                  autoFocus
                />
              </div>

              <div className="cn-sticker-panel-tabs">
                {STICKER_PANEL_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-active={tab === t.id}
                    onClick={() => setTab(t.id)}
                    title={t.label}
                  >
                    <span className="cn-sticker-tab-icon">{t.icon}</span>
                    <span className="cn-sticker-tab-label">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="cn-sticker-panel-body">
                {tab === "postits" ? (
                  <div className="cn-sticker-postits">
                    <p className="cn-sticker-section-lead">
                      Elige un color y arrástralo a la hoja
                    </p>
                    <div className="cn-sticker-postit-grid">
                      {POSTIT_ORDER.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`cn-sticker-postit-btn cn-postit-${c} cn-draggable-source`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              DECORATION_DRAG_MIME,
                              encodeDecorationDrag({ type: "postit", color: c }),
                            );
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => onAdd(createPostIt(c))}
                        >
                          <span className="cn-sticker-postit-swatch" />
                          {POSTIT_LABELS[c]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : tab === "decorativos" ? (
                  <>
                    <p className="cn-sticker-section-lead">Cintas, marcos y resaltados</p>
                    <div className="cn-sticker-deco-list">
                      {(
                        [
                          ["washi", "Cinta washi"],
                          ["tape", "Cinta adhesiva"],
                          ["divider", "Separador"],
                          ["frame", "Marco"],
                          ["arrow", "Flecha"],
                          ["highlight-deco", "Resaltado"],
                        ] as const
                      ).map(([kind, label]) => (
                        <button
                          key={kind}
                          type="button"
                          className="cn-draggable-source"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              DECORATION_DRAG_MIME,
                              encodeDecorationDrag({ type: "deco", kind }),
                            );
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => onAdd(createDecoElement(kind))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {results.length > 0 ? (
                      <StickerGrid
                        title="Stickers decorativos"
                        items={results}
                        favorites={favorites}
                        onPick={addSticker}
                        onFav={toggleFav}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    {tab === "juridicos" ? (
                      <div className="cn-sticker-market cn-sticker-market--inline">
                        <p className="cn-sticker-section-lead">Marketplace jurídico</p>
                        {STICKER_MARKETPLACE.map((pack) => (
                          <article key={pack.id} className="cn-sticker-pack-card">
                            <span className="cn-sticker-pack-emoji">{pack.emoji}</span>
                            <div>
                              <strong>{pack.label}</strong>
                              <p>{pack.description}</p>
                              <span>{pack.stickerIds.length} stickers</span>
                            </div>
                            <div className="cn-sticker-pack-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  pack.stickerIds.forEach((id) => {
                                    const s = getStickerById(id);
                                    if (s) addSticker(s);
                                  });
                                }}
                              >
                                Añadir
                              </button>
                              <a
                                href={`/api/cuaderno/stickers/packs/${pack.id}`}
                                download={`${pack.id}.json`}
                                className="cn-sticker-pack-download"
                              >
                                JSON
                              </a>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    {query && results.length === 0 ? (
                      <p className="cn-sticker-empty">Sin resultados para «{query}»</p>
                    ) : null}

                    <StickerGrid
                      title={
                        tab === "favoritos"
                          ? "Tus favoritos"
                          : query
                            ? `Resultados (${results.length})`
                            : STICKER_PANEL_TABS.find((t) => t.id === tab)?.label ?? "Stickers"
                      }
                      items={results}
                      favorites={favorites}
                      onPick={addSticker}
                      onFav={toggleFav}
                    />
                  </>
                )}
              </div>

              <footer className="cn-sticker-panel-foot">
                <button
                  type="button"
                  className="cn-sticker-create-ai"
                  disabled={quickLoading}
                  onClick={() => void quickGenerate()}
                >
                  <Sparkles size={16} />
                  {quickLoading ? "Generando…" : "✨ Crear con IA"}
                </button>
                <button
                  type="button"
                  className="cn-sticker-designer-link"
                  onClick={() =>
                    openDesigner("Crea un sticker kawaii de Derecho Constitucional")
                  }
                >
                  🎨 Diseñador IA (conversación)
                </button>
              </footer>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <CuadernoStickerDesigner
        open={designerOpen}
        initialPrompt={designerSeed}
        onClose={() => {
          setDesignerOpen(false);
          setDesignerSeed("");
        }}
        onInsert={(src, label) => {
          onAdd(createStickerFromAi(src, label));
        }}
      />
    </>
  );
}

function StickerGrid({
  title,
  items,
  favorites,
  onPick,
  onFav,
}: {
  title: string;
  items: StickerCatalogItem[];
  favorites: string[];
  onPick: (item: StickerCatalogItem) => void;
  onFav: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="cn-sticker-grid-section">
      <h3>{title}</h3>
      <div className="cn-sticker-grid">
        {items.map((item) => (
          <div key={item.id} className="cn-sticker-cell">
            <button
              type="button"
              className="cn-sticker-cell-main cn-draggable-source"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  DECORATION_DRAG_MIME,
                  encodeDecorationDrag({ type: "sticker", stickerId: item.id }),
                );
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onPick(item)}
            >
              <img
                src={getStickerSvgDataUrl(item)}
                alt=""
                className="cn-sticker-cell-img"
                draggable={false}
              />
              <span>{item.label}</span>
            </button>
            <button
              type="button"
              className={`cn-sticker-fav${favorites.includes(item.id) ? " is-on" : ""}`}
              onClick={() => onFav(item.id)}
              aria-label="Favorito"
            >
              <Star size={12} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
