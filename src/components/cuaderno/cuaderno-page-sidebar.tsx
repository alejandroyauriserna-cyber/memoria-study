"use client";

import { Copy, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { CuadernoPage } from "@/lib/cuaderno/cuaderno-pages";
import { CuadernoPaperPreview } from "@/components/cuaderno/cuaderno-paper-preview";
import { getTemplate } from "@/lib/cuaderno/templates";

export function CuadernoPageSidebar({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onMove,
  onCoverClick,
}: {
  pages: CuadernoPage[];
  activePageId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onCoverClick?: (id: string) => void;
}) {
  return (
    <aside className="cn-page-sidebar" aria-label="Páginas del cuaderno">
      <div className="cn-page-sidebar-head">
        <span>Páginas</span>
        <button type="button" className="cn-page-sidebar-add" onClick={onAdd} title="Nueva página">
          <Plus size={16} />
        </button>
      </div>
      <ul className="cn-page-sidebar-list">
        {pages.map((page, index) => {
          const template = getTemplate(page.templateId);
          const active = page.id === activePageId;
          return (
            <li key={page.id} className={active ? "is-active" : ""}>
              <button
                type="button"
                className="cn-page-thumb"
                onClick={() => onSelect(page.id)}
                title={page.title}
              >
                <div className="cn-page-thumb-preview">
                  <CuadernoPaperPreview template={template} size="sm" selected={active} />
                </div>
                <span className="cn-page-thumb-cover" onClick={(e) => {
                  e.stopPropagation();
                  onCoverClick?.(page.id);
                }}>
                  {page.cover?.emoji ?? page.cover?.icon ?? template.icon}
                </span>
                <span className="cn-page-thumb-title">{page.title}</span>
              </button>
              <div className="cn-page-thumb-actions">
                <button type="button" title="Subir" onClick={() => onMove(page.id, "up")} disabled={index === 0}>
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  title="Bajar"
                  onClick={() => onMove(page.id, "down")}
                  disabled={index === pages.length - 1}
                >
                  <ChevronDown size={12} />
                </button>
                <button type="button" title="Duplicar" onClick={() => onDuplicate(page.id)}>
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => onRemove(page.id)}
                  disabled={pages.length <= 1}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
