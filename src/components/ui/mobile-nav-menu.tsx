"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { JurisprudenceAdminNavLink } from "@/components/jurisprudence/jurisprudence-admin-nav-link";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/library", label: "Materiales" },
  { href: "/biblioteca-juridica", label: "Jurisprudencia" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/organizers", label: "Organizadores" },
  { href: "/cuaderno", label: "Cuaderno IA" },
  { href: "/fuentes-juridicas", label: "Fuentes" },
] as const;

function navIsActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="shell-mobile-nav md:hidden">
      <button
        type="button"
        className="shell-mobile-nav__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar menú" : "Abrir menú de navegación"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
        <span className="sr-only">Menú</span>
      </button>

      {open ? (
        <button
          type="button"
          className="shell-mobile-nav__backdrop"
          aria-label="Cerrar menú"
          onClick={close}
        />
      ) : null}

      <nav
        id={panelId}
        className={`shell-mobile-nav__panel${open ? " is-open" : ""}`}
        aria-label="Navegación móvil"
        hidden={!open}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-active={navIsActive(pathname, item.href) ? "true" : undefined}
            className="tron-nav-link shell-mobile-nav__link"
            onClick={close}
          >
            {item.label}
          </Link>
        ))}
        <JurisprudenceAdminNavLink />
      </nav>
    </div>
  );
}
