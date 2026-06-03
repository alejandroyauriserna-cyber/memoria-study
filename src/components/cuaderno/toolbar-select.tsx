"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CuadernoFloatingMenu, FloatingMenuItem } from "@/components/cuaderno/cuaderno-floating-menu";

export function ToolbarSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string;
  value: T | "";
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`cn-tb-menu-trigger-v2${compact ? " cn-tb-menu-trigger-v2--compact" : ""}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{selected?.label ?? label}</span>
        <ChevronDown size={12} className={open ? "is-open" : ""} />
      </button>
      <CuadernoFloatingMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={compact ? 160 : 200}
      >
        {options.map((o) => (
          <FloatingMenuItem
            key={o.value}
            active={value === o.value}
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
          >
            {o.label}
          </FloatingMenuItem>
        ))}
      </CuadernoFloatingMenu>
    </>
  );
}
