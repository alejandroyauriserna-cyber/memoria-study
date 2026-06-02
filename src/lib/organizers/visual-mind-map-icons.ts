import {
  BookOpen,
  Building2,
  FileSignature,
  FileText,
  Gavel,
  Handshake,
  Landmark,
  Layers,
  Lightbulb,
  Scale,
  ScrollText,
  Search,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { VisualMindMapCategory } from "@/lib/organizers/visual-mind-map-types";

export type MindMapIconKey =
  | "contract"
  | "judge"
  | "civil_code"
  | "good_faith"
  | "company"
  | "person"
  | "interpretation"
  | "law"
  | "constitution"
  | "court"
  | "document"
  | "handshake"
  | "book"
  | "scale"
  | "gavel"
  | "search"
  | "building"
  | "users"
  | "mass_contract"
  | "obligation"
  | "property"
  | "nullity"
  | "commerce"
  | "family"
  | "labor"
  | "criminal"
  | "administrative"
  | "comparison"
  | "example"
  | "article";

export type ThematicIcon = {
  key: MindMapIconKey;
  emoji: string;
  lucide: LucideIcon;
  label: string;
};

const ICON_CATALOG: Record<MindMapIconKey, ThematicIcon> = {
  contract: { key: "contract", emoji: "📄", lucide: FileSignature, label: "Contrato" },
  judge: { key: "judge", emoji: "⚖️", lucide: Scale, label: "Juez" },
  civil_code: { key: "civil_code", emoji: "📚", lucide: BookOpen, label: "Código Civil" },
  good_faith: { key: "good_faith", emoji: "🤝", lucide: Handshake, label: "Buena fe" },
  company: { key: "company", emoji: "🏢", lucide: Building2, label: "Empresa" },
  person: { key: "person", emoji: "👤", lucide: User, label: "Persona" },
  interpretation: { key: "interpretation", emoji: "🔍", lucide: Search, label: "Interpretación" },
  law: { key: "law", emoji: "📜", lucide: ScrollText, label: "Ley" },
  constitution: { key: "constitution", emoji: "🏛️", lucide: Landmark, label: "Constitución" },
  court: { key: "court", emoji: "🏛️", lucide: Gavel, label: "Tribunal" },
  document: { key: "document", emoji: "📋", lucide: FileText, label: "Documento" },
  handshake: { key: "handshake", emoji: "🤝", lucide: Handshake, label: "Acuerdo" },
  book: { key: "book", emoji: "📖", lucide: BookOpen, label: "Libro jurídico" },
  scale: { key: "scale", emoji: "⚖️", lucide: Scale, label: "Justicia" },
  gavel: { key: "gavel", emoji: "🔨", lucide: Gavel, label: "Sentencia" },
  search: { key: "search", emoji: "🔍", lucide: Search, label: "Análisis" },
  building: { key: "building", emoji: "🏢", lucide: Building2, label: "Institución" },
  users: { key: "users", emoji: "👥", lucide: Users, label: "Partes" },
  mass_contract: { key: "mass_contract", emoji: "📑", lucide: Layers, label: "Contratación masiva" },
  obligation: { key: "obligation", emoji: "🔗", lucide: FileSignature, label: "Obligación" },
  property: { key: "property", emoji: "🏠", lucide: Building2, label: "Propiedad" },
  nullity: { key: "nullity", emoji: "❌", lucide: Gavel, label: "Nulidad" },
  commerce: { key: "commerce", emoji: "🛒", lucide: Building2, label: "Comercio" },
  family: { key: "family", emoji: "👨‍👩‍👧", lucide: Users, label: "Familia" },
  labor: { key: "labor", emoji: "👷", lucide: Users, label: "Laboral" },
  criminal: { key: "criminal", emoji: "🚔", lucide: Gavel, label: "Penal" },
  administrative: { key: "administrative", emoji: "🏛️", lucide: Landmark, label: "Administrativo" },
  comparison: { key: "comparison", emoji: "↔️", lucide: Layers, label: "Comparación" },
  example: { key: "example", emoji: "💡", lucide: Lightbulb, label: "Ejemplo" },
  article: { key: "article", emoji: "📜", lucide: ScrollText, label: "Artículo" },
};

const KEYWORD_RULES: Array<{ keys: string[]; icon: MindMapIconKey }> = [
  { keys: ["contrato", "contratación", "negocio jurídico", "convenio"], icon: "contract" },
  { keys: ["masa", "masivo", "adhesión"], icon: "mass_contract" },
  { keys: ["juez", "magistrado", "tribunal", "corte", "palacio de justicia"], icon: "judge" },
  { keys: ["código civil", "codigo civil", "cc peru"], icon: "civil_code" },
  { keys: ["buena fe", "honestidad", "lealtad"], icon: "good_faith" },
  { keys: ["empresa", "sociedad", "corporación"], icon: "company" },
  { keys: ["persona", "sujeto", "capacidad", "titular"], icon: "person" },
  { keys: ["interpretación", "hermenéutica", "sentido norma"], icon: "interpretation" },
  { keys: ["constitución", "constitucional"], icon: "constitution" },
  { keys: ["artículo", "articulo", "art.", "inciso"], icon: "article" },
  { keys: ["ley", "norma", "decreto", "reglamento"], icon: "law" },
  { keys: ["obligación", "obligacion", "deber", "prestación"], icon: "obligation" },
  { keys: ["propiedad", "dominio", "bien"], icon: "property" },
  { keys: ["nulidad", "anulabilidad", "inexistencia"], icon: "nullity" },
  { keys: ["comercio", "mercantil"], icon: "commerce" },
  { keys: ["familia", "matrimonio", "filación"], icon: "family" },
  { keys: ["laboral", "trabajo", "empleo"], icon: "labor" },
  { keys: ["penal", "delito", "sanción penal"], icon: "criminal" },
  { keys: ["administrativo", "estado", "función pública"], icon: "administrative" },
  { keys: ["comparación", "diferencia", "versus", " vs "], icon: "comparison" },
  { keys: ["ejemplo", "caso práctico", "supuesto"], icon: "example" },
  { keys: ["caso", "jurisprudencia", "precedente", "fallo"], icon: "gavel" },
  { keys: ["voluntad", "consentimiento", "manifestación"], icon: "handshake" },
  { keys: ["forma", "solemnidad", "instrumento"], icon: "document" },
  { keys: ["objeto", "causa", "elemento"], icon: "search" },
  { keys: ["peruano", "perú", "peru"], icon: "court" },
];

const CATEGORY_DEFAULT: Record<VisualMindMapCategory, MindMapIconKey> = {
  concept: "book",
  norm: "law",
  principle: "good_faith",
  case: "gavel",
  example: "example",
  comparison: "comparison",
  article: "article",
};

export function isValidMindMapImage(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return trimmed.startsWith("http") || trimmed.startsWith("data:image");
}

export function resolveThematicIcon(
  label: string,
  category: VisualMindMapCategory = "concept",
  iconKey?: string,
): ThematicIcon {
  if (iconKey && iconKey in ICON_CATALOG) {
    return ICON_CATALOG[iconKey as MindMapIconKey];
  }

  const normalized = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const rule of KEYWORD_RULES) {
    if (rule.keys.some((key) => normalized.includes(key))) {
      return ICON_CATALOG[rule.icon];
    }
  }

  return ICON_CATALOG[CATEGORY_DEFAULT[category] ?? "book"];
}

export function getThematicIcon(key: string): ThematicIcon {
  if (key in ICON_CATALOG) return ICON_CATALOG[key as MindMapIconKey];
  return ICON_CATALOG.book;
}

export const MIND_MAP_ICON_KEYS = Object.keys(ICON_CATALOG) as MindMapIconKey[];

export function oneLineSummary(text: string, max = 88): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  const summary = firstSentence.length <= max ? firstSentence : cleaned;
  return summary.length > max ? `${summary.slice(0, max - 1).trim()}…` : summary;
}
