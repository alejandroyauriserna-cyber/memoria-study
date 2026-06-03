import type { PngStickerItem } from "@/lib/cuaderno/sticker-png-packs";

export type JuridicoPackId =
  | "civil"
  | "penal"
  | "procesal"
  | "tributario"
  | "constitucional"
  | "laboral"
  | "empresarial";

export type JuridicoPack = {
  id: JuridicoPackId;
  label: string;
  description: string;
  stickers: PngStickerItem[];
};

const base = (packId: JuridicoPackId, items: Omit<PngStickerItem, "packId">[]): PngStickerItem[] =>
  items.map((s) => ({ ...s, packId }));

/** Packs jurídicos — PNG transparentes (Open Clipart, dominio público). */
export const JURIDICO_STICKER_PACKS: JuridicoPack[] = [
  {
    id: "civil",
    label: "Civil",
    description: "Contratos, código civil y obligaciones",
    stickers: base("civil", [
      { id: "civil-contrato", label: "Contrato", src: "https://openclipart.org/image/800px/svg_to_png/189298/contract.png", tags: ["civil", "contrato"] },
      { id: "civil-libro", label: "Código civil", src: "https://openclipart.org/image/800px/svg_to_png/304447/law-book.png", tags: ["civil", "código"] },
      { id: "civil-sello", label: "Sello notarial", src: "https://openclipart.org/image/800px/svg_to_png/262364/stamp.png", tags: ["civil", "notaría"] },
    ]),
  },
  {
    id: "penal",
    label: "Penal",
    description: "Justicia penal y procedimiento",
    stickers: base("penal", [
      { id: "penal-martillo", label: "Martillo", src: "https://openclipart.org/image/800px/svg_to_png/281927/gavel.png", tags: ["penal", "juez"] },
      { id: "penal-balanza", label: "Balanza", src: "https://openclipart.org/image/800px/svg_to_png/304448/justice-scale.png", tags: ["penal", "justicia"] },
      { id: "penal-tribunal", label: "Tribunal", src: "https://openclipart.org/image/800px/svg_to_png/304450/courthouse.png", tags: ["penal", "sala"] },
    ]),
  },
  {
    id: "procesal",
    label: "Procesal",
    description: "Expediente, plazos y actuaciones",
    stickers: base("procesal", [
      { id: "procesal-carpeta", label: "Expediente", src: "https://openclipart.org/image/800px/svg_to_png/281928/folder.png", tags: ["procesal", "expediente"] },
      { id: "procesal-pergamino", label: "Escrito", src: "https://openclipart.org/image/800px/svg_to_png/193840/scroll.png", tags: ["procesal", "demanda"] },
      { id: "procesal-insignia", label: "Insignia", src: "https://openclipart.org/image/800px/svg_to_png/193841/badge.png", tags: ["procesal", "tribunal"] },
    ]),
  },
  {
    id: "tributario",
    label: "Tributario",
    description: "Impuestos y normativa fiscal",
    stickers: base("tributario", [
      { id: "trib-documento", label: "Declaración", src: "https://openclipart.org/image/800px/svg_to_png/189298/contract.png", tags: ["tributario", "declaración"] },
      { id: "trib-balanza", label: "Equilibrio fiscal", src: "https://openclipart.org/image/800px/svg_to_png/262363/gold-scale.png", tags: ["tributario", "balanza"] },
      { id: "trib-libro", label: "Norma tributaria", src: "https://openclipart.org/image/800px/svg_to_png/304447/law-book.png", tags: ["tributario", "ley"] },
    ]),
  },
  {
    id: "constitucional",
    label: "Constitucional",
    description: "Constitución y derechos fundamentales",
    stickers: base("constitucional", [
      { id: "const-texto", label: "Constitución", src: "https://openclipart.org/image/800px/svg_to_png/304449/constitution.png", tags: ["constitucional", "carta"] },
      { id: "const-columna", label: "Columna", src: "https://openclipart.org/image/800px/svg_to_png/281929/column.png", tags: ["constitucional", "estado"] },
      { id: "const-balanza", label: "Balanza dorada", src: "https://openclipart.org/image/800px/svg_to_png/262363/gold-scale.png", tags: ["constitucional", "derechos"] },
    ]),
  },
  {
    id: "laboral",
    label: "Laboral",
    description: "Trabajo, contratos y seguridad social",
    stickers: base("laboral", [
      { id: "lab-contrato", label: "Contrato laboral", src: "https://openclipart.org/image/800px/svg_to_png/189298/contract.png", tags: ["laboral", "contrato"] },
      { id: "lab-estudio", label: "Oficina", src: "https://openclipart.org/image/800px/svg_to_png/281926/laptop.png", tags: ["laboral", "trabajo"] },
      { id: "lab-balanza", label: "Equidad", src: "https://openclipart.org/image/800px/svg_to_png/304448/justice-scale.png", tags: ["laboral", "justicia"] },
    ]),
  },
  {
    id: "empresarial",
    label: "Empresarial",
    description: "Sociedades, M&A y gobierno corporativo",
    stickers: base("empresarial", [
      { id: "emp-edificio", label: "Sede social", src: "https://openclipart.org/image/800px/svg_to_png/304450/courthouse.png", tags: ["empresarial", "sociedad"] },
      { id: "emp-carpeta", label: "Due diligence", src: "https://openclipart.org/image/800px/svg_to_png/281928/folder.png", tags: ["empresarial", "fusiones"] },
      { id: "emp-sello", label: "Acta de junta", src: "https://openclipart.org/image/800px/svg_to_png/262364/stamp.png", tags: ["empresarial", "junta"] },
    ]),
  },
];

export const ALL_JURIDICO_STICKERS = JURIDICO_STICKER_PACKS.flatMap((p) => p.stickers);
