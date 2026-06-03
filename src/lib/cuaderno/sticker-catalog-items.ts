import type { StickerCatalogItem, StickerCategoryId } from "@/lib/cuaderno/sticker-catalog";

type Seed = {
  id: string;
  label: string;
  glyph: string;
  category: StickerCategoryId;
  tags: string[];
  packIds: string[];
};

function seed(
  id: string,
  label: string,
  glyph: string,
  category: StickerCategoryId,
  tags: string[],
  packIds: string[],
): Seed {
  return { id, label, glyph, category, tags, packIds };
}

/** Catálogo base (iconos principales) */
const CORE: Seed[] = [
  seed("balanza", "Balanza", "⚖️", "derecho", ["justicia", "ley"], ["derecho-constitucional", "derecho-civil"]),
  seed("martillo", "Martillo", "🔨", "derecho", ["juez", "sentencia"], ["derecho-procesal"]),
  seed("constitucion", "Constitución", "📜", "constitucional", ["norma", "estado"], ["derecho-constitucional"]),
  seed("libro", "Libro abierto", "📖", "estudio", ["leer", "clase"], ["productividad-uni", "derecho-civil"]),
  seed("codigo", "Código civil", "📕", "legislacion", ["codigo", "articulo"], ["derecho-civil"]),
  seed("pergamino", "Pergamino", "📃", "legislacion", ["decreto", "ley"], ["derecho-constitucional"]),
  seed("juez", "Juez", "👨‍⚖️", "derecho", ["tribunal"], ["derecho-procesal"]),
  seed("toga", "Toga", "🎓", "universidad", ["abogado", "egresado"], ["productividad-uni"]),
  seed("sello", "Sello notarial", "🔏", "derecho", ["notaria", "fe"], ["derecho-civil"]),
  seed("marcador", "Marcador", "🖍️", "apuntes", ["resaltar"], ["productividad-uni", "examenes-finales"]),
  seed("estrella", "Estrella", "⭐", "motivacion", ["importante"], ["examenes-finales", "productividad-uni"]),
  seed("check", "Check", "✅", "productividad", ["hecho", "lista"], ["productividad-uni", "examenes-finales"]),
  seed("idea", "Idea", "💡", "estudio", ["concepto", "foco"], ["productividad-uni"]),
  seed("cerebro", "IA / mente", "🧠", "ia", ["inteligencia"], ["productividad-uni"]),
  seed("cafe", "Café estudio", "☕", "productividad", ["focus"], ["productividad-uni", "examenes-finales"]),
  seed("reloj", "Fecha límite", "⏰", "productividad", ["examen", "fecha"], ["examenes-finales"]),
  seed("corazon-kawaii", "Kawaii", "💖", "kawaii", ["cute"], ["productividad-uni"]),
  seed("tribunal", "Tribunal", "🏛️", "constitucional", ["estado"], ["derecho-constitucional"]),
  seed("maletin", "Corporativo", "💼", "corporativo", ["empresa"], ["derecho-tributario"]),
  seed("alerta", "Alerta legal", "⚠️", "derecho", ["riesgo"], ["derecho-penal"]),
  seed("dinero", "Tributario", "💰", "corporativo", ["impuesto"], ["derecho-tributario"]),
  seed("mano", "Firmar", "✍️", "apuntes", ["firma"], ["derecho-civil"]),
  seed("clip", "Clip", "📎", "apuntes", ["adjunto"], ["productividad-uni"]),
  seed("fuego", "Urgente", "🔥", "motivacion", ["prioridad"], ["examenes-finales"]),
  seed("target", "Meta", "🎯", "motivacion", ["objetivo"], ["examenes-finales"]),
];

/** Expansiones por pack (cientos de stickers listos) */
const PACK_EXPANSIONS: Record<string, Array<Omit<Seed, "packIds"> & { packIds?: string[] }>> = {
  "derecho-constitucional": [
    { id: "dc-habeas", label: "Habeas corpus", glyph: "🛡️", category: "constitucional", tags: ["libertad"] },
    { id: "dc-derechos", label: "DD.HH.", glyph: "✊", category: "constitucional", tags: ["derechos"] },
    { id: "dc-estado", label: "Estado", glyph: "🏳️", category: "constitucional", tags: ["nacion"] },
    { id: "dc-poder", label: "Poderes", glyph: "🔱", category: "constitucional", tags: ["division"] },
    { id: "dc-amparo", label: "Amparo", glyph: "📑", category: "constitucional", tags: ["tutela"] },
    { id: "dc-voto", label: "Sufragio", glyph: "🗳️", category: "constitucional", tags: ["voto"] },
    { id: "dc-bandera", label: "Bandera", glyph: "🇵🇪", category: "constitucional", tags: ["peru"] },
    { id: "dc-escudo", label: "Escudo", glyph: "🦅", category: "constitucional", tags: ["simbolo"] },
    { id: "dc-art1", label: "Artículo clave", glyph: "1️⃣", category: "constitucional", tags: ["articulo"] },
    { id: "dc-norma", label: "Norma suprema", glyph: "👑", category: "constitucional", tags: ["jerarquia"] },
    { id: "dc-control", label: "Control", glyph: "🔍", category: "constitucional", tags: ["constitucionalidad"] },
    { id: "dc-libertad", label: "Libertad", glyph: "🕊️", category: "constitucional", tags: ["libertad"] },
    { id: "dc-igualdad", label: "Igualdad", glyph: "⚖️", category: "constitucional", tags: ["igualdad"] },
    { id: "dc-democracia", label: "Democracia", glyph: "🏛️", category: "constitucional", tags: ["democracia"] },
    { id: "dc-federal", label: "Descentralización", glyph: "🗺️", category: "constitucional", tags: ["region"] },
  ],
  "derecho-civil": [
    { id: "civ-contrato", label: "Contrato", glyph: "📝", category: "derecho", tags: ["obligacion"] },
    { id: "civ-bienes", label: "Bienes", glyph: "🏠", category: "derecho", tags: ["propiedad"] },
    { id: "civ-familia", label: "Familia", glyph: "👨‍👩‍👧", category: "derecho", tags: ["patria"] },
    { id: "civ-sucesion", label: "Sucesión", glyph: "📜", category: "derecho", tags: ["herencia"] },
    { id: "civ-dano", label: "Daño", glyph: "💥", category: "derecho", tags: ["responsabilidad"] },
    { id: "civ-posecion", label: "Posesión", glyph: "🔑", category: "derecho", tags: ["dominio"] },
    { id: "civ-arrend", label: "Arrendamiento", glyph: "🏢", category: "derecho", tags: ["alquiler"] },
    { id: "civ-testamento", label: "Testamento", glyph: "📋", category: "derecho", tags: ["testamento"] },
    { id: "civ-matrimonio", label: "Matrimonio", glyph: "💍", category: "derecho", tags: ["union"] },
    { id: "civ-adopcion", label: "Adopción", glyph: "🤝", category: "derecho", tags: ["adopcion"] },
    { id: "civ-prenda", label: "Prenda", glyph: "🔐", category: "derecho", tags: ["garantia"] },
    { id: "civ-compraventa", label: "Compraventa", glyph: "🛒", category: "derecho", tags: ["venta"] },
    { id: "civ-mandato", label: "Mandato", glyph: "📨", category: "derecho", tags: ["representacion"] },
    { id: "civ-donacion", label: "Donación", glyph: "🎁", category: "derecho", tags: ["donacion"] },
    { id: "civ-servidumbre", label: "Servidumbre", glyph: "🚧", category: "derecho", tags: ["predio"] },
  ],
  "derecho-penal": [
    { id: "pen-delito", label: "Delito", glyph: "🚨", category: "derecho", tags: ["tipo"] },
    { id: "pen-castigo", label: "Pena", glyph: "⛓️", category: "derecho", tags: ["sancion"] },
    { id: "pen-policial", label: "Policía", glyph: "👮", category: "derecho", tags: ["investigacion"] },
    { id: "pen-custodia", label: "Prisión", glyph: "🔒", category: "derecho", tags: ["libertad"] },
    { id: "pen-victima", label: "Víctima", glyph: "💔", category: "derecho", tags: ["ofendido"] },
    { id: "pen-imputado", label: "Imputado", glyph: "🧑‍⚖️", category: "derecho", tags: ["acusado"] },
    { id: "pen-dolo", label: "Dolo", glyph: "🎭", category: "derecho", tags: ["intencion"] },
    { id: "pen-culpa", label: "Culpa", glyph: "😓", category: "derecho", tags: ["negligencia"] },
    { id: "pen-tentativa", label: "Tentativa", glyph: "🎯", category: "derecho", tags: ["inicio"] },
    { id: "pen-concurso", label: "Concurso", glyph: "📊", category: "derecho", tags: ["pluralidad"] },
    { id: "pen-prescrip", label: "Prescripción", glyph: "⏳", category: "derecho", tags: ["tiempo"] },
    { id: "pen-extincion", label: "Extinción", glyph: "🌅", category: "derecho", tags: ["punibilidad"] },
    { id: "pen-arrep", label: "Arrepentimiento", glyph: "🙏", category: "derecho", tags: ["atenuante"] },
    { id: "pen-reincid", label: "Reincidencia", glyph: "🔁", category: "derecho", tags: ["agravante"] },
    { id: "pen-flagrancia", label: "Flagrancia", glyph: "📸", category: "derecho", tags: ["captura"] },
  ],
  "derecho-tributario": [
    { id: "tri-sunat", label: "SUNAT", glyph: "🏦", category: "corporativo", tags: ["fisco"] },
    { id: "tri-igv", label: "IGV", glyph: "🧾", category: "corporativo", tags: ["impuesto"] },
    { id: "tri-renta", label: "Renta", glyph: "📈", category: "corporativo", tags: ["ir"] },
    { id: "tri-factura", label: "Factura", glyph: "🧮", category: "corporativo", tags: ["comprobante"] },
    { id: "tri-declaracion", label: "Declaración", glyph: "📤", category: "corporativo", tags: ["dj"] },
    { id: "tri-multa", label: "Multa", glyph: "💸", category: "corporativo", tags: ["sancion"] },
    { id: "tri-fraude", label: "Fraude", glyph: "🕵️", category: "corporativo", tags: ["evasion"] },
    { id: "tri-deduccion", label: "Deducción", glyph: "➖", category: "corporativo", tags: ["gasto"] },
    { id: "tri-base", label: "Base imponible", glyph: "📐", category: "corporativo", tags: ["calculo"] },
    { id: "tri-exoneracion", label: "Exoneración", glyph: "🆓", category: "corporativo", tags: ["beneficio"] },
    { id: "tri-retencion", label: "Retención", glyph: "🔖", category: "corporativo", tags: ["retencion"] },
    { id: "tri-planilla", label: "Planilla", glyph: "👥", category: "corporativo", tags: ["trabajador"] },
  ],
  "derecho-procesal": [
    { id: "proc-demanda", label: "Demanda", glyph: "📬", category: "procesal", tags: ["inicio"] },
    { id: "proc-contest", label: "Contestación", glyph: "📥", category: "procesal", tags: ["defensa"] },
    { id: "proc-audiencia", label: "Audiencia", glyph: "🎙️", category: "procesal", tags: ["oral"] },
    { id: "proc-prueba", label: "Prueba", glyph: "🔬", category: "procesal", tags: ["medio"] },
    { id: "proc-testigo", label: "Testigo", glyph: "🗣️", category: "procesal", tags: ["declaracion"] },
    { id: "proc-perito", label: "Perito", glyph: "👨‍🔬", category: "procesal", tags: ["informe"] },
    { id: "proc-notific", label: "Notificación", glyph: "📮", category: "procesal", tags: ["acto"] },
    { id: "proc-apelacion", label: "Apelación", glyph: "⬆️", category: "procesal", tags: ["recurso"] },
    { id: "proc-casacion", label: "Casación", glyph: "🏔️", category: "procesal", tags: ["suprema"] },
    { id: "proc-ejecucion", label: "Ejecución", glyph: "⚙️", category: "procesal", tags: ["cumplimiento"] },
    { id: "proc-medida", label: "Medida cautelar", glyph: "🛑", category: "procesal", tags: ["urgente"] },
    { id: "proc-conciliacion", label: "Conciliación", glyph: "🤲", category: "procesal", tags: ["acuerdo"] },
    { id: "proc-arbitraje", label: "Arbitraje", glyph: "⚡", category: "procesal", tags: ["alterno"] },
    { id: "proc-expediente", label: "Expediente", glyph: "📁", category: "procesal", tags: ["folio"] },
    { id: "proc-plazo", label: "Plazo procesal", glyph: "📆", category: "procesal", tags: ["dias"] },
  ],
  "examenes-finales": [
    { id: "exam-cram", label: "Modo cram", glyph: "📚", category: "motivacion", tags: ["noche"] },
    { id: "exam-100", label: "Nota 20", glyph: "💯", category: "motivacion", tags: ["excelente"] },
    { id: "exam-aprobado", label: "Aprobado", glyph: "🎉", category: "motivacion", tags: ["logro"] },
    { id: "exam-resumen", label: "Resumen", glyph: "📋", category: "estudio", tags: ["sintesis"] },
    { id: "exam-flash", label: "Flashcards", glyph: "🃏", category: "estudio", tags: ["memoria"] },
    { id: "exam-pomodoro", label: "Pomodoro", glyph: "🍅", category: "productividad", tags: ["tiempo"] },
    { id: "exam-silencio", label: "Focus", glyph: "🤫", category: "productividad", tags: ["concentracion"] },
    { id: "exam-playlist", label: "Playlist", glyph: "🎧", category: "productividad", tags: ["musica"] },
    { id: "exam-energia", label: "Energía", glyph: "⚡", category: "motivacion", tags: ["animo"] },
    { id: "exam-respira", label: "Respira", glyph: "🌬️", category: "motivacion", tags: ["calma"] },
    { id: "exam-pregunta", label: "Pregunta examen", glyph: "❓", category: "estudio", tags: ["oral"] },
    { id: "exam-respuesta", label: "Respuesta modelo", glyph: "💬", category: "estudio", tags: ["teoria"] },
    { id: "exam-esquema", label: "Esquema", glyph: "🗂️", category: "apuntes", tags: ["mapa"] },
    { id: "exam-cita", label: "Cita doctrinal", glyph: "💭", category: "apuntes", tags: ["autor"] },
    { id: "exam-juris", label: "Jurisprudencia", glyph: "📰", category: "legislacion", tags: ["fallo"] },
  ],
  "productividad-uni": [
    { id: "uni-unt", label: "UNT", glyph: "🏫", category: "universidad", tags: ["trujillo"] },
    { id: "uni-ciclo", label: "Ciclo", glyph: "🔢", category: "universidad", tags: ["semestre"] },
    { id: "uni-curso", label: "Curso", glyph: "📘", category: "universidad", tags: ["materia"] },
    { id: "uni-profesor", label: "Profesor", glyph: "👨‍🏫", category: "universidad", tags: ["clase"] },
    { id: "uni-grupo", label: "Grupo estudio", glyph: "👥", category: "universidad", tags: ["equipo"] },
    { id: "uni-biblioteca", label: "Biblioteca", glyph: "📚", category: "estudio", tags: ["silencio"] },
    { id: "uni-laptop", label: "Laptop", glyph: "💻", category: "estudio", tags: ["digital"] },
    { id: "uni-tablet", label: "Tablet", glyph: "📱", category: "estudio", tags: ["goodnotes"] },
    { id: "uni-sticky", label: "Notas", glyph: "🗒️", category: "apuntes", tags: ["postit"] },
    { id: "uni-highlighter", label: "Resaltador", glyph: "🖊️", category: "apuntes", tags: ["color"] },
    { id: "uni-regla", label: "Regla", glyph: "📏", category: "apuntes", tags: ["linea"] },
    { id: "uni-calculadora", label: "Calculadora", glyph: "🔢", category: "estudio", tags: ["numeros"] },
    { id: "uni-mapa", label: "Mapa mental", glyph: "🕸️", category: "estudio", tags: ["visual"] },
    { id: "uni-podcast", label: "Podcast", glyph: "🎙️", category: "estudio", tags: ["audio"] },
    { id: "uni-ia-chat", label: "Chat IA", glyph: "🤖", category: "ia", tags: ["gemini"] },
    { id: "uni-gemini", label: "Gemini", glyph: "✨", category: "ia", tags: ["asistente"] },
    { id: "uni-scan", label: "Escanear", glyph: "📷", category: "apuntes", tags: ["pdf"] },
    { id: "uni-nube", label: "Nube", glyph: "☁️", category: "ia", tags: ["sync"] },
    { id: "uni-pin", label: "Fijar", glyph: "📌", category: "apuntes", tags: ["importante"] },
    { id: "uni-link", label: "Enlace", glyph: "🔗", category: "apuntes", tags: ["referencia"] },
    { id: "uni-kawaii-1", label: "Mascota 1", glyph: "🐱", category: "kawaii", tags: ["cute"] },
    { id: "uni-kawaii-2", label: "Mascota 2", glyph: "🐰", category: "kawaii", tags: ["cute"] },
    { id: "uni-kawaii-3", label: "Mascota 3", glyph: "🦊", category: "kawaii", tags: ["cute"] },
    { id: "uni-corazon", label: "Me encanta", glyph: "❤️", category: "kawaii", tags: ["fav"] },
    { id: "uni-rainbow", label: "Arcoíris", glyph: "🌈", category: "kawaii", tags: ["color"] },
  ],
};

function flattenCatalog(): StickerCatalogItem[] {
  const byId = new Map<string, StickerCatalogItem>();

  for (const s of CORE) {
    byId.set(s.id, { ...s });
  }

  for (const [packId, items] of Object.entries(PACK_EXPANSIONS)) {
    for (const item of items) {
      const existing = byId.get(item.id);
      const packIds = existing
        ? [...new Set([...existing.packIds, packId])]
        : [packId, ...(item.packIds ?? [])];
      byId.set(item.id, {
        id: item.id,
        label: item.label,
        glyph: item.glyph,
        category: item.category,
        tags: item.tags,
        packIds,
      });
    }
  }

  return Array.from(byId.values());
}

export const STICKER_CATALOG_ITEMS: StickerCatalogItem[] = flattenCatalog();
