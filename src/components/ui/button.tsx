"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  children,
  onPointerDown,
  ...props
}: PropsWithChildren<ButtonProps>) {
  function handleRipple(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--ripple-x", `${x}%`);
    event.currentTarget.style.setProperty("--ripple-y", `${y}%`);
    onPointerDown?.(event);
  }

  return (
    <button
      className={cn(
        "tron-btn-ripple relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#00FFD5] disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "tron-btn-primary",
        variant === "secondary" && "tron-btn-secondary",
        variant === "ghost" && "tron-btn-ghost",
        className,
      )}
      onPointerDown={handleRipple}
      {...props}
    >
      {children}
    </button>
  );
}
