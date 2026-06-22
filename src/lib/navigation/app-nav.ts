export type AppNavItem = {
  href: string;
  label: string;
};

/** Links always visible in the desktop header bar. */
export const APP_NAV_PRIMARY: AppNavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/guia", label: "Guía" },
  { href: "/library", label: "Materiales" },
  { href: "/organizers", label: "Organizadores" },
  { href: "/cuaderno", label: "Cuaderno IA" },
];

/** Links grouped under the «Más» menu on desktop. */
export const APP_NAV_SECONDARY: AppNavItem[] = [
  { href: "/biblioteca-juridica", label: "Jurisprudencia" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/fuentes-juridicas", label: "Fuentes" },
];

export const APP_NAV_ALL: AppNavItem[] = [...APP_NAV_PRIMARY, ...APP_NAV_SECONDARY];

export function navIsActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navSectionIsActive(pathname: string, items: AppNavItem[]): boolean {
  return items.some((item) => navIsActive(pathname, item.href));
}
