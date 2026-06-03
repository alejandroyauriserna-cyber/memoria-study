import type { PostItColor } from "@/lib/cuaderno/decoration-objects";

export type PostItCategory =
  | "juridico"
  | "minimalista"
  | "pastel"
  | "vintage"
  | "universitario"
  | "productividad";

export type PostItStyle = {
  color: PostItColor;
  label: string;
  bg: string;
  border: string;
  text: string;
  shadow: string;
};

export const POSTIT_CATEGORIES: Array<{ id: PostItCategory; label: string }> = [
  { id: "juridico", label: "Jurídico" },
  { id: "minimalista", label: "Minimalista" },
  { id: "pastel", label: "Pastel" },
  { id: "vintage", label: "Vintage" },
  { id: "universitario", label: "Universitario" },
  { id: "productividad", label: "Productividad" },
];

/** Amarillo, Rosa, Celeste, Verde, Lavanda, Crema */
export const POSTIT_PREMIUM_STYLES: Record<PostItCategory, PostItStyle[]> = {
  juridico: [
    { color: "cream", label: "Crema", bg: "#faf6eb", border: "#c4a574", text: "#3d3428", shadow: "rgba(61,52,40,0.12)" },
    { color: "yellow", label: "Amarillo", bg: "#fef3c7", border: "#d97706", text: "#422006", shadow: "rgba(217,119,6,0.15)" },
    { color: "blue", label: "Celeste", bg: "#e0f2fe", border: "#0284c7", text: "#0c4a6e", shadow: "rgba(2,132,199,0.12)" },
  ],
  minimalista: [
    { color: "cream", label: "Crema", bg: "#fafaf9", border: "#d6d3d1", text: "#292524", shadow: "rgba(0,0,0,0.06)" },
    { color: "pink", label: "Rosa", bg: "#fdf2f8", border: "#f9a8d4", text: "#831843", shadow: "rgba(0,0,0,0.06)" },
    { color: "green", label: "Verde", bg: "#f0fdf4", border: "#86efac", text: "#14532d", shadow: "rgba(0,0,0,0.06)" },
  ],
  pastel: [
    { color: "pink", label: "Rosa", bg: "#fce7f3", border: "#f472b6", text: "#831843", shadow: "rgba(244,114,182,0.2)" },
    { color: "lavender", label: "Lavanda", bg: "#ede9fe", border: "#a78bfa", text: "#4c1d95", shadow: "rgba(167,139,250,0.2)" },
    { color: "blue", label: "Celeste", bg: "#dbeafe", border: "#60a5fa", text: "#1e3a8a", shadow: "rgba(96,165,250,0.2)" },
  ],
  vintage: [
    { color: "cream", label: "Crema", bg: "#f5f0e6", border: "#a68a64", text: "#44403c", shadow: "rgba(68,64,60,0.15)" },
    { color: "yellow", label: "Amarillo", bg: "#fde68a", border: "#b45309", text: "#78350f", shadow: "rgba(120,53,15,0.12)" },
    { color: "green", label: "Verde", bg: "#d9f99d", border: "#65a30d", text: "#365314", shadow: "rgba(54,83,20,0.12)" },
  ],
  universitario: [
    { color: "blue", label: "Celeste", bg: "#bfdbfe", border: "#2563eb", text: "#1e3a8a", shadow: "rgba(37,99,235,0.15)" },
    { color: "yellow", label: "Amarillo", bg: "#fef08a", border: "#ca8a04", text: "#713f12", shadow: "rgba(202,138,4,0.15)" },
    { color: "lavender", label: "Lavanda", bg: "#e9d5ff", border: "#9333ea", text: "#581c87", shadow: "rgba(147,51,234,0.12)" },
  ],
  productividad: [
    { color: "green", label: "Verde", bg: "#bbf7d0", border: "#16a34a", text: "#14532d", shadow: "rgba(22,163,74,0.15)" },
    { color: "cream", label: "Crema", bg: "#fffbeb", border: "#fbbf24", text: "#78350f", shadow: "rgba(251,191,36,0.15)" },
    { color: "pink", label: "Rosa", bg: "#fbcfe8", border: "#db2777", text: "#831843", shadow: "rgba(219,39,119,0.12)" },
  ],
};
