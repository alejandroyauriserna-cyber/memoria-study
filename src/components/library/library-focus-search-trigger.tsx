"use client";

import type { ReactNode } from "react";
import { dispatchFocusSearch } from "@/hooks/use-command-k";

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function LibraryFocusSearchTrigger({ children, className, ariaLabel }: Props) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel ?? "Enfocar búsqueda (Ctrl+K)"}
      onClick={dispatchFocusSearch}
    >
      {children}
    </button>
  );
}
