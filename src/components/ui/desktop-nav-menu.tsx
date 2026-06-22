"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { JurisprudenceAdminNavLink } from "@/components/jurisprudence/jurisprudence-admin-nav-link";
import {
  APP_NAV_PRIMARY,
  APP_NAV_SECONDARY,
  navIsActive,
  navSectionIsActive,
} from "@/lib/navigation/app-nav";

export function DesktopNavMenu() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const moreActive =
    navSectionIsActive(pathname, APP_NAV_SECONDARY) || pathname.startsWith("/admin/biblioteca-juridica");

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <nav className="shell-desktop-nav hidden min-w-0 flex-1 items-center justify-center lg:flex" aria-label="Navegación principal">
      {APP_NAV_PRIMARY.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          data-active={navIsActive(pathname, item.href) ? "true" : undefined}
          className="tron-nav-link shell-desktop-nav__link"
        >
          {item.label}
        </Link>
      ))}

      <div ref={menuRef} className="shell-desktop-nav__more">
        <button
          type="button"
          className="tron-nav-link shell-desktop-nav__link shell-desktop-nav__more-trigger"
          data-active={moreActive ? "true" : undefined}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-controls={panelId}
          onClick={() => setMoreOpen((value) => !value)}
        >
          Más
          <ChevronDown size={14} aria-hidden className={`shell-desktop-nav__chevron${moreOpen ? " is-open" : ""}`} />
        </button>

        {moreOpen ? (
          <div id={panelId} className="shell-desktop-nav__dropdown" role="menu">
            {APP_NAV_SECONDARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                data-active={navIsActive(pathname, item.href) ? "true" : undefined}
                className="tron-nav-link shell-desktop-nav__dropdown-link"
                onClick={() => setMoreOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <JurisprudenceAdminNavLink className="shell-desktop-nav__dropdown-link" />
          </div>
        ) : null}
      </div>
    </nav>
  );
}
