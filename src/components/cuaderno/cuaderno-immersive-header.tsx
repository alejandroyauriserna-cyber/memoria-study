"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  LayoutGrid,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelRight,
  Share2,
  Settings2,
  Star,
} from "lucide-react";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { CuadernoFloatingMenu, FloatingMenuItem } from "@/components/cuaderno/cuaderno-floating-menu";
import { PAGE_SIZE_OPTIONS, type CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import { saveLayoutMode, type CuadernoLayoutMode } from "@/lib/cuaderno/editor-preferences";

const VIEW_OPTIONS: Array<{ id: CuadernoLayoutMode; label: string; icon: typeof Maximize2 }> = [
  { id: "compact", label: "Compacto", icon: Minimize2 },
  { id: "standard", label: "Estándar", icon: LayoutGrid },
  { id: "fullscreen", label: "Pantalla completa", icon: Maximize2 },
];

export function CuadernoImmersiveHeader({
  courseId,
  courseName,
  saveState,
  favorite,
  favoritePulse,
  aiOpen,
  studyMode,
  onToggleFavorite,
  onToggleAi,
  onToggleStudy,
  onGenerateExam,
  layoutMode,
  onLayoutChange,
  pageSizeMode,
  onPageSizeChange,
  onOpenFormatPanel,
  onOpenPageSettings,
  onOpenStickers,
  stickersOpen = false,
  compact = false,
  canShare = false,
  onOpenShare,
  readOnly = false,
}: {
  courseId: string;
  courseName: string;
  saveState: "idle" | "saving" | "saved";
  favorite: boolean;
  favoritePulse?: boolean;
  aiOpen: boolean;
  studyMode?: boolean;
  onToggleFavorite: () => void;
  onToggleAi: () => void;
  onToggleStudy?: () => void;
  onGenerateExam?: () => void;
  layoutMode: CuadernoLayoutMode;
  onLayoutChange: (mode: CuadernoLayoutMode) => void;
  pageSizeMode: CuadernoPageSizeMode;
  onPageSizeChange: (mode: CuadernoPageSizeMode) => void;
  onOpenFormatPanel: () => void;
  onOpenPageSettings: () => void;
  onOpenStickers: () => void;
  stickersOpen?: boolean;
  compact?: boolean;
  canShare?: boolean;
  onOpenShare?: () => void;
  readOnly?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetMenuOpen, setSheetMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLButtonElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);
  const saveProgress = useLoadingProgress(saveState === "saving", "save");

  const statusLabel =
    saveState === "saving"
      ? `Guardando ${saveProgress.percent}%`
      : saveState === "saved"
        ? "Guardado"
        : "Listo";

  return (
    <header
      className={`cn-immersive-header cn-immersive-header--studio cn-immersive-header--clean${compact ? " cn-immersive-header--compact" : ""}${studyMode ? " cn-immersive-header--study" : ""}`}
    >
      <Link
        href={`/cuaderno/curso/${courseId}`}
        className="cn-immersive-header-icon"
        aria-label="Volver al curso"
      >
        <ArrowLeft size={17} />
      </Link>

      <div className="cn-immersive-header-title-block">
        <p className="cn-immersive-header-brand">MemoriaStudy</p>
        <h1 className="cn-immersive-header-course">{courseName}</h1>
        <span className="cn-immersive-header-status cn-immersive-header-status--dot">
          <span aria-hidden>●</span> {statusLabel}
        </span>
      </div>

      <div className="cn-immersive-header-divider" aria-hidden />

      <div className="cn-immersive-header-primary">
        <button
          type="button"
          className={`cn-immersive-header-cta${studyMode ? " is-active" : ""}`}
          onClick={onToggleStudy}
        >
          Estudiar
        </button>
        <button
          type="button"
          className={`cn-immersive-header-cta cn-immersive-header-cta--ai${aiOpen ? " is-active" : ""}`}
          onClick={onToggleAi}
        >
          Preguntar IA
        </button>
        <button type="button" className="cn-immersive-header-cta" onClick={onGenerateExam}>
          Examen
        </button>
      </div>

      <div className="cn-immersive-header-actions cn-immersive-header-actions--overflow">
        <button
          type="button"
          className={`cn-immersive-header-stickers${stickersOpen ? " is-open" : ""}`}
          onClick={onOpenStickers}
          title="Stickers, post-its y decoración"
        >
          <span aria-hidden>✨</span>
        </button>
        <button
          type="button"
          className={`cn-immersive-header-icon${favorite ? " is-active" : ""}`}
          onClick={onToggleFavorite}
          title="Favoritos"
          style={favoritePulse ? { transform: "scale(1.12)" } : undefined}
        >
          <Star size={17} fill={favorite ? "currentColor" : "none"} />
        </button>

        {canShare && onOpenShare ? (
          <button
            type="button"
            className="cn-immersive-header-icon"
            onClick={onOpenShare}
            title="Compartir apunte"
          >
            <Share2 size={17} />
          </button>
        ) : null}

        {readOnly ? <span className="cn-immersive-header-readonly">Solo lectura</span> : null}

        {!compact ? (
          <>
            <button
              ref={sheetRef}
              type="button"
              className="cn-immersive-header-icon"
              title="Formato de hoja"
              onClick={() => {
                setSheetMenuOpen((v) => !v);
                setViewMenuOpen(false);
                setMenuOpen(false);
              }}
            >
              <FileText size={16} />
            </button>
            <CuadernoFloatingMenu
              open={sheetMenuOpen}
              onClose={() => setSheetMenuOpen(false)}
              anchorRef={sheetRef}
              align="end"
              width={220}
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <FloatingMenuItem
                  key={s.id}
                  active={pageSizeMode === s.id}
                  onClick={() => {
                    onPageSizeChange(s.id);
                    setSheetMenuOpen(false);
                  }}
                >
                  {s.label}
                  <span className="cn-menu-item-desc">{s.description}</span>
                </FloatingMenuItem>
              ))}
            </CuadernoFloatingMenu>

            <button
              ref={viewRef}
              type="button"
              className="cn-immersive-header-icon"
              title="Vista"
              onClick={() => {
                setViewMenuOpen((v) => !v);
                setSheetMenuOpen(false);
                setMenuOpen(false);
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <CuadernoFloatingMenu
              open={viewMenuOpen}
              onClose={() => setViewMenuOpen(false)}
              anchorRef={viewRef}
              align="end"
              width={200}
            >
              {VIEW_OPTIONS.map((v) => {
                const Icon = v.icon;
                return (
                  <FloatingMenuItem
                    key={v.id}
                    active={layoutMode === v.id}
                    onClick={() => {
                      onLayoutChange(v.id);
                      saveLayoutMode(v.id);
                      setViewMenuOpen(false);
                    }}
                  >
                    <Icon size={14} className="inline mr-2 opacity-70" />
                    {v.label}
                  </FloatingMenuItem>
                );
              })}
            </CuadernoFloatingMenu>
          </>
        ) : null}

        <button
          ref={menuRef}
          type="button"
          className="cn-immersive-header-icon"
          aria-label="Menú"
          onClick={() => {
            setMenuOpen((v) => !v);
            setSheetMenuOpen(false);
            setViewMenuOpen(false);
          }}
        >
          <MoreHorizontal size={18} />
        </button>
        <CuadernoFloatingMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuRef}
          align="end"
          width={240}
        >
          {compact ? (
            <>
              <p className="cn-floating-menu-heading">Formato de hoja</p>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <FloatingMenuItem
                  key={s.id}
                  active={pageSizeMode === s.id}
                  onClick={() => {
                    onPageSizeChange(s.id);
                    setMenuOpen(false);
                  }}
                >
                  {s.label}
                </FloatingMenuItem>
              ))}
              <p className="cn-floating-menu-heading">Vista</p>
              {VIEW_OPTIONS.map((v) => (
                <FloatingMenuItem
                  key={v.id}
                  active={layoutMode === v.id}
                  onClick={() => {
                    onLayoutChange(v.id);
                    saveLayoutMode(v.id);
                    setMenuOpen(false);
                  }}
                >
                  {v.label}
                </FloatingMenuItem>
              ))}
            </>
          ) : null}
          <FloatingMenuItem
            onClick={() => {
              onOpenStickers();
              setMenuOpen(false);
            }}
          >
            <span className="inline mr-2">✨</span>
            Stickers y post-its
          </FloatingMenuItem>
          <FloatingMenuItem
            onClick={() => {
              onOpenFormatPanel();
              setMenuOpen(false);
            }}
          >
            <PanelRight size={14} className="inline mr-2 opacity-70" />
            Panel de formato
          </FloatingMenuItem>
          <FloatingMenuItem
            onClick={() => {
              onOpenPageSettings();
              setMenuOpen(false);
            }}
          >
            <Settings2 size={14} className="inline mr-2 opacity-70" />
            Configuración de página
          </FloatingMenuItem>
        </CuadernoFloatingMenu>
      </div>
    </header>
  );
}
