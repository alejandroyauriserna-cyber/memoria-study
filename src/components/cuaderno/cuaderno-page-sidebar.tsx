"use client";

import { useRef, useState } from "react";
import { Copy, Plus, Trash2, Star, MoreHorizontal } from "lucide-react";
import type { CuadernoPage } from "@/lib/cuaderno/cuaderno-pages";
import { CuadernoPaperPreview } from "@/components/cuaderno/cuaderno-paper-preview";
import { getTemplate } from "@/lib/cuaderno/templates";
import { stripHtml, isHtmlBody } from "@/lib/cuaderno/rich-text";
import { CuadernoFloatingMenu, FloatingMenuItem } from "@/components/cuaderno/cuaderno-floating-menu";

function pagePreviewSnippet(body: string): string {
  const text = isHtmlBody(body) ? stripHtml(body) : body;
  const line = text.split("\n").find((l) => l.trim().length > 8);
  return line?.slice(0, 42) ?? "Hoja vacía";
}

export function CuadernoPageSidebar({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onMove,
  onRename,
  onToggleFavorite,
  onOpenSettings,
  onChangeTemplate,
}: {
  pages: CuadernoPage[];
  activePageId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onRename: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenSettings: (id: string) => void;
  onChangeTemplate: (id: string) => void;
}) {
  const [menuPageId, setMenuPageId] = useState<string | null>(null);

  return (
    <aside className="cn-page-sidebar" aria-label="Páginas del cuaderno">
      <div className="cn-page-sidebar-head">
        <span>Páginas</span>
        <button type="button" className="cn-page-sidebar-add" onClick={onAdd} title="Nueva página — elegir plantilla">
          <Plus size={16} />
        </button>
      </div>
      <ul className="cn-page-sidebar-list">
        {pages.map((page, index) => {
          const template = getTemplate(page.templateId);
          const active = page.id === activePageId;
          const snippet = pagePreviewSnippet(page.body);

          return (
            <li key={page.id} className={active ? "is-active" : ""} data-favorite={page.favorite}>
              <div className="cn-page-thumb-card">
                <button type="button" className="cn-page-thumb-preview-btn" onClick={() => onSelect(page.id)}>
                  <div className="cn-page-thumb-preview">
                    <CuadernoPaperPreview template={template} size="sm" selected={active} />
                  </div>
                  <span className="cn-page-thumb-snippet">{snippet}</span>
                </button>

                <div className="cn-page-thumb-meta">
                  <span className="cn-page-thumb-badge" title={template.label}>
                    {template.icon}
                  </span>
                  <input
                    className="cn-page-thumb-title-input"
                    value={page.title}
                    onChange={(e) => onRename(page.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Nombre de página"
                  />
                  <button
                    type="button"
                    className={`cn-page-thumb-star${page.favorite ? " is-on" : ""}`}
                    onClick={() => onToggleFavorite(page.id)}
                    title="Favorita"
                  >
                    <Star size={12} fill={page.favorite ? "currentColor" : "none"} />
                  </button>
                  <PageRowContextMenu
                    open={menuPageId === page.id}
                    onToggle={() => setMenuPageId(menuPageId === page.id ? null : page.id)}
                    onClose={() => setMenuPageId(null)}
                  >
                    <FloatingMenuItem onClick={() => { onOpenSettings(page.id); setMenuPageId(null); }}>
                      ⚙ Configuración
                    </FloatingMenuItem>
                    <FloatingMenuItem onClick={() => { onChangeTemplate(page.id); setMenuPageId(null); }}>
                      📄 Cambiar plantilla
                    </FloatingMenuItem>
                    <FloatingMenuItem onClick={() => { onDuplicate(page.id); setMenuPageId(null); }}>
                      Duplicar
                    </FloatingMenuItem>
                    {index > 0 ? (
                      <FloatingMenuItem onClick={() => { onMove(page.id, "up"); setMenuPageId(null); }}>
                        Mover arriba
                      </FloatingMenuItem>
                    ) : null}
                    {index < pages.length - 1 ? (
                      <FloatingMenuItem onClick={() => { onMove(page.id, "down"); setMenuPageId(null); }}>
                        Mover abajo
                      </FloatingMenuItem>
                    ) : null}
                    <FloatingMenuItem
                      danger
                      onClick={() => {
                        onRemove(page.id);
                        setMenuPageId(null);
                      }}
                    >
                      Eliminar página
                    </FloatingMenuItem>
                  </PageRowContextMenu>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function PageRowContextMenu({
  open,
  onToggle,
  onClose,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={ref}
        type="button"
        className="cn-page-thumb-menu"
        onClick={onToggle}
        aria-label="Más opciones"
      >
        <MoreHorizontal size={14} />
      </button>
      <CuadernoFloatingMenu open={open} onClose={onClose} anchorRef={ref} align="end" width={200}>
        {children}
      </CuadernoFloatingMenu>
    </>
  );
}
