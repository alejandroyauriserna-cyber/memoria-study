export type CuadernoPageSizeMode = "a4" | "letter" | "free" | "infinite";

export const DEFAULT_PAGE_SIZE_MODE: CuadernoPageSizeMode = "free";

export const PAGE_SIZE_OPTIONS: Array<{
  id: CuadernoPageSizeMode;
  label: string;
  description: string;
}> = [
  { id: "a4", label: "A4", description: "Proporción ISO 210×297" },
  { id: "letter", label: "Carta", description: "US Letter 8.5×11" },
  { id: "free", label: "Libre", description: "Casi todo el ancho útil" },
  { id: "infinite", label: "Infinita", description: "Lienzo sin límite vertical" },
];

/** Ancho objetivo del shell (fracción del viewport del editor). */
export function targetShellWidthFraction(mode: CuadernoPageSizeMode): number {
  switch (mode) {
    case "infinite":
      return 0.95;
    case "free":
      return 0.92;
    case "letter":
      return 0.9;
    case "a4":
      return 0.88;
    default:
      return 0.92;
  }
}
