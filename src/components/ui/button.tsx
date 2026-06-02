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
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#00FFD5] disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "tron-btn-primary",
        variant === "secondary" && "tron-btn-secondary",
        variant === "ghost" && "tron-btn-ghost",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
