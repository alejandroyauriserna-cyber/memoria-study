import type { PngStickerItem } from "@/lib/cuaderno/sticker-png-packs";
import { getJuridicoStickerSrc } from "@/lib/cuaderno/sticker-juridico-svg";

export type JuridicoPackId =
  | "constitucional"
  | "civil"
  | "penal"
  | "procesal"
  | "tributario"
  | "estudio";

export type JuridicoPack = {
  id: JuridicoPackId;
  label: string;
  description: string;
  stickers: PngStickerItem[];
};

function item(
  packId: JuridicoPackId,
  id: string,
  label: string,
  tags: string[],
): PngStickerItem {
  const src = getJuridicoStickerSrc(id);
  if (!src) throw new Error(`Missing juridico sticker src: ${id}`);
  return { id, label, packId, src, tags };
}

/** Packs jurídicos — ilustraciones SVG locales (Derecho UNT). */
export const JURIDICO_STICKER_PACKS: JuridicoPack[] = [
  {
    id: "constitucional",
    label: "Constitucional",
    description: "Constitución, TC, derechos y ciudadanía",
    stickers: [
      item("constitucional", "const-constitucion", "Constitución", ["constitucional", "carta", "norma"]),
      item("constitucional", "const-tribunal", "Tribunal Constitucional", ["tc", "tribunal", "control"]),
      item("constitucional", "const-carta", "Carta Magna", ["carta", "magna", "pergamino"]),
      item("constitucional", "const-escudo", "Escudo nacional", ["escudo", "peru", "estado"]),
      item("constitucional", "const-balanza", "Balanza de justicia", ["balanza", "justicia", "equidad"]),
      item("constitucional", "const-derechos", "Derechos fundamentales", ["derechos", "fundamentales", "ddhh"]),
      item("constitucional", "const-democracia", "Democracia", ["democracia", "estado", "poder"]),
      item("constitucional", "const-ciudadania", "Ciudadanía", ["ciudadania", "voto", "sufragio"]),
    ],
  },
  {
    id: "civil",
    label: "Civil",
    description: "Código civil, contratos y obligaciones",
    stickers: [
      item("civil", "civil-codigo", "Código Civil", ["civil", "codigo", "libro"]),
      item("civil", "civil-contrato", "Contrato", ["contrato", "obligacion", "acuerdo"]),
      item("civil", "civil-firma", "Firma", ["firma", "autografa", "consentimiento"]),
      item("civil", "civil-escritura", "Escritura pública", ["escritura", "notaria", "publica"]),
      item("civil", "civil-notaria", "Notaría", ["notaria", "sello", "fe"]),
      item("civil", "civil-obligacion", "Obligación", ["obligacion", "deudor", "acreedor"]),
      item("civil", "civil-propiedad", "Propiedad", ["propiedad", "bienes", "reales"]),
      item("civil", "civil-herencia", "Herencia", ["herencia", "sucesion", "testamento"]),
    ],
  },
  {
    id: "penal",
    label: "Penal",
    description: "Código penal, fiscalía y proceso",
    stickers: [
      item("penal", "penal-codigo", "Código Penal", ["penal", "codigo", "delito"]),
      item("penal", "penal-martillo", "Martillo judicial", ["martillo", "juez", "sentencia"]),
      item("penal", "penal-fiscalia", "Fiscalía", ["fiscalia", "ministerio", "publico"]),
      item("penal", "penal-investigacion", "Investigación", ["investigacion", "policial", "diligencia"]),
      item("penal", "penal-expediente", "Expediente penal", ["expediente", "carpeta", "penal"]),
      item("penal", "penal-carcel", "Cárcel", ["carcel", "prision", "pena"]),
      item("penal", "penal-juicio", "Juicio oral", ["juicio", "oral", "sala"]),
      item("penal", "penal-sentencia", "Sentencia", ["sentencia", "fallo", "resolucion"]),
    ],
  },
  {
    id: "procesal",
    label: "Procesal",
    description: "Expediente, demanda y actuaciones",
    stickers: [
      item("procesal", "proc-expediente", "Expediente judicial", ["expediente", "proceso", "carpeta"]),
      item("procesal", "proc-demanda", "Demanda", ["demanda", "escrito", "inicio"]),
      item("procesal", "proc-audiencia", "Audiencia", ["audiencia", "sala", "tribunal"]),
      item("procesal", "proc-juez", "Juez", ["juez", "magistrado", "poder"]),
      item("procesal", "proc-casacion", "Casación", ["casacion", "recurso", "suprema"]),
      item("procesal", "proc-notificacion", "Notificación", ["notificacion", "cedula", "plazo"]),
      item("procesal", "proc-resolucion", "Resolución", ["resolucion", "auto", "proveido"]),
      item("procesal", "proc-proceso", "Proceso", ["proceso", "etapa", "tramite"]),
    ],
  },
  {
    id: "tributario",
    label: "Tributario",
    description: "SUNAT, impuestos y fiscalización",
    stickers: [
      item("tributario", "trib-sunat", "SUNAT", ["sunat", "fisco", "tributario"]),
      item("tributario", "trib-tributos", "Tributos", ["tributos", "impuesto", "contribucion"]),
      item("tributario", "trib-declaracion", "Declaración jurada", ["declaracion", "jurada", "dj"]),
      item("tributario", "trib-fiscalizacion", "Fiscalización", ["fiscalizacion", "control", "auditoria"]),
      item("tributario", "trib-comprobante", "Comprobante", ["comprobante", "factura", "boleta"]),
      item("tributario", "trib-impuestos", "Impuestos", ["impuestos", "igv", "renta"]),
      item("tributario", "trib-recaudacion", "Recaudación", ["recaudacion", "cobranza", "coactiva"]),
      item("tributario", "trib-codigo", "Código Tributario", ["codigo", "tributario", "ley"]),
    ],
  },
  {
    id: "estudio",
    label: "Estudio",
    description: "Apuntes, biblioteca y examen",
    stickers: [
      item("estudio", "est-libros", "Libros jurídicos", ["libros", "juridicos", "codigo"]),
      item("estudio", "est-resaltador", "Resaltador", ["resaltador", "marcador", "apunte"]),
      item("estudio", "est-postit", "Post-it", ["postit", "nota", "recordatorio"]),
      item("estudio", "est-laptop", "Laptop", ["laptop", "digital", "clase"]),
      item("estudio", "est-biblioteca", "Biblioteca", ["biblioteca", "estudio", "facultad"]),
      item("estudio", "est-apuntes", "Apuntes", ["apuntes", "resumen", "clase"]),
      item("estudio", "est-agenda", "Agenda", ["agenda", "plazo", "fecha"]),
      item("estudio", "est-examen", "Examen", ["examen", "evaluacion", "final"]),
    ],
  },
];

export const ALL_JURIDICO_STICKERS = JURIDICO_STICKER_PACKS.flatMap((p) => p.stickers);

export function getJuridicoStickerById(id: string): PngStickerItem | undefined {
  return ALL_JURIDICO_STICKERS.find((s) => s.id === id);
}
