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
  STICKER_CATEGORIES,
  STICKER_MARKETPLACE,
  getStickerById,
  searchStickers,
  type StickerCatalogItem,
  type StickerCategoryId,
} from "@/lib/cuaderno/sticker-catalog";
import { CuadernoStickerDesigner } from "@/components/cuaderno/decoration/cuaderno-sticker-designer";

const FAV_KEY = "cuaderno-sticker-favorites";
const RECENT_KEY = "cuaderno-sticker-recents";

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
  const [category, setCategory] = useState<StickerCategoryId | "all">("all");
  const [tab, setTab] = useState<"stickers" | "postits" | "deco" | "market">("stickers");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    setFavorites(loadIds(FAV_KEY));
    setRecents(loadIds(RECENT_KEY));
  }, [open]);

  const results = useMemo(
    () => searchStickers(query, category === "all" ? undefined : category),
    [query, category],
  );

  const addSticker = (item: StickerCatalogItem) => {
    const dec = createStickerFromCatalog(item.id, undefined, item.label);
    onAdd(dec);
    const next = [item.id, ...recents.filter((id) => id !== item.id)];
    setRecents(next);
    saveIds(RECENT_KEY, next);
  };

  const toggleFav = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    saveIds(FAV_KEY, next);
  };

  async function quickGenerate() {
    const p = quickPrompt.trim();
    if (!p) return;
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
      setQuickPrompt("");
    } catch {
      /* panel shows via designer */
      setDesignerOpen(true);
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
            >
              <header className="cn-sticker-panel-head">
                <span>✨ Stickers</span>
                <button type="button" onClick={onClose} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </header>

              <div className="cn-sticker-panel-tabs">
                {(["stickers", "postits", "deco", "market"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-active={tab === t}
                    onClick={() => setTab(t)}
                  >
                    {t === "stickers" ? "Biblioteca" : t === "postits" ? "Post-its" : t === "deco" ? "Decorar" : "Packs"}
                  </button>
                ))}
              </div>

              {tab === "stickers" ? (
                <>
                  <div className="cn-sticker-panel-search">
                    <Search size={14} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar sticker…"
                    />
                  </div>
                  <div className="cn-sticker-panel-filters">
                    <button
                      type="button"
                      data-active={category === "all"}
                      onClick={() => setCategory("all")}
                    >
                      Todos
                    </button>
                    {STICKER_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        data-active={category === c.id}
                        onClick={() => setCategory(c.id)}
                      >
                        {c.icon}
                      </button>
                    ))}
                  </div>

                  {favorites.length > 0 ? (
                    <StickerGrid
                      title="Favoritos"
                      items={favorites.map((id) => getStickerById(id)).filter((s): s is StickerCatalogItem => !!s)}
                      favorites={favorites}
                      onPick={addSticker}
                      onFav={toggleFav}
                    />
                  ) : null}

                  {recents.length > 0 ? (
                    <StickerGrid
                      title="Recientes"
                      items={recents.map((id) => getStickerById(id)).filter((s): s is StickerCatalogItem => !!s)}
                      favorites={favorites}
                      onPick={addSticker}
                      onFav={toggleFav}
                    />
                  ) : null}

                  <StickerGrid
                    title="Biblioteca jurídica"
                    items={results}
                    favorites={favorites}
                    onPick={addSticker}
                    onFav={toggleFav}
                  />
                </>
              ) : null}

              {tab === "postits" ? (
                <div className="cn-sticker-postits">
                  <p>Arrastra un color a la hoja (se inserta al centro)</p>
                  <div className="cn-sticker-postit-grid">
                    {(["yellow", "green", "blue", "pink", "purple"] as PostItColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`cn-sticker-postit-btn cn-postit-${c}`}
                        onClick={() => onAdd(createPostIt(c))}
                      >
                        📝 {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "deco" ? (
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
                      onClick={() => onAdd(createDecoElement(kind))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}

              {tab === "market" ? (
                <div className="cn-sticker-market">
                  {STICKER_MARKETPLACE.map((pack) => (
                    <article key={pack.id} className="cn-sticker-pack-card">
                      <span className="cn-sticker-pack-emoji">{pack.emoji}</span>
                      <div>
                        <strong>{pack.label}</strong>
                        <p>{pack.description}</p>
                        <span>{pack.stickerIds.length} stickers</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          pack.stickerIds.forEach((id) => {
                            const s = getStickerById(id);
                            if (s) addSticker(s);
                          });
                        }}
                      >
                        Añadir pack
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}

              <footer className="cn-sticker-panel-foot">
                <div className="cn-sticker-quick-ai">
                  <input
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    placeholder="✨ Crear sticker IA…"
                  />
                  <button type="button" disabled={quickLoading} onClick={() => void quickGenerate()}>
                    {quickLoading ? "…" : "Ir"}
                  </button>
                </div>
                <button type="button" className="cn-sticker-designer-btn" onClick={() => setDesignerOpen(true)}>
                  <Sparkles size={14} /> 🎨 Diseñador IA
                </button>
              </footer>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <CuadernoStickerDesigner
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
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
            <button type="button" className="cn-sticker-cell-main" onClick={() => onPick(item)}>
              <span className="cn-sticker-cell-glyph">{item.glyph}</span>
              <span>{item.label}</span>
            </button>
            <button
              type="button"
              className={`cn-sticker-fav${favorites.includes(item.id) ? " is-on" : ""}`}
              onClick={() => onFav(item.id)}
            >
              <Star size={12} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
