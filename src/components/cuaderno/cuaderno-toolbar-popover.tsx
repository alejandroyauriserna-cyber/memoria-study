"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

export function CuadernoToolbarPopover({
  open,
  onClose,
  anchorRef,
  title,
  width = 240,
  children,
  searchable = false,
  searchPlaceholder = "Buscar…",
  onSearch,
  searchValue = "",
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  width?: number;
  children: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  searchValue?: string;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({
      top: r.bottom + 8,
      left: Math.max(12, Math.min(r.left, window.innerWidth - width - 12)),
    });
  }, [open, anchorRef, width]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={popRef}
          className="cn-tb-popover"
          style={{ top: pos.top, left: pos.left, width }}
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label={title}
        >
          <p className="cn-tb-popover-title">{title}</p>
          {searchable && onSearch ? (
            <div className="cn-tb-popover-search">
              <Search size={13} />
              <input
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}
          <div className="cn-tb-popover-body">{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
