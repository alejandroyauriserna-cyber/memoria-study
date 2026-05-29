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
        "inline-flex h-11 items-center justify-center gap-2 rounded-3xl px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-foreground text-background hover:-translate-y-0.5 hover:bg-foreground/90",
        variant === "secondary" &&
          "border border-border bg-card text-foreground hover:-translate-y-0.5 hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
