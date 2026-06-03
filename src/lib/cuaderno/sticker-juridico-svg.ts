/** Ilustraciones SVG jurídicas locales (sin dependencias externas rotas). */

function svgUrl(body: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(body)}`;
}

const SHADOW = `<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.14"/></filter>`;

function wrap(inner: string, label: string, bg = "#f8fafc", stroke = "#475569"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${label}">
  <defs>${SHADOW}</defs>
  <rect x="4" y="4" width="88" height="88" rx="18" fill="${bg}" stroke="${stroke}" stroke-width="1.5" filter="url(#s)"/>
  ${inner}
</svg>`;
}

function textGlyph(emoji: string, label: string, bg: string, stroke: string): string {
  return svgUrl(
    wrap(
      `<text x="48" y="58" text-anchor="middle" font-size="36" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${emoji}</text>`,
      label,
      bg,
      stroke,
    ),
  );
}

/** Balanza de justicia */
export function srcBalanza(label = "Balanza"): string {
  return svgUrl(
    wrap(
      `<g fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round">
        <path d="M48 22v44"/>
        <path d="M30 30h36"/>
        <path d="M26 30c0 10 6 16 14 16s14-6 14-16"/>
        <path d="M70 30c0 10-6 16-14 16s-14-6-14-16"/>
        <path d="M38 72h20"/>
        <path d="M32 72h32" stroke-width="2.8"/>
      </g>`,
      label,
      "#fffbeb",
      "#d97706",
    ),
  );
}

function srcBook(label: string, color: string): string {
  return svgUrl(
    wrap(
      `<g fill="${color}" stroke="#1e293b" stroke-width="1.5">
        <path d="M28 26h18v52H30a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4z"/>
        <path d="M50 26h18v52H52a4 4 0 0 0-4-4V30a4 4 0 0 0 4-4z" fill="#f1f5f9"/>
        <path d="M46 26v52" stroke="#94a3b8"/>
      </g>`,
      label,
      "#f8fafc",
      "#64748b",
    ),
  );
}

function srcGavel(label: string): string {
  return svgUrl(
    wrap(
      `<g fill="#78350f" stroke="#451a03" stroke-width="1.2">
        <rect x="58" y="24" width="14" height="22" rx="3" transform="rotate(35 65 35)"/>
        <rect x="24" y="52" width="48" height="8" rx="2"/>
        <rect x="40" y="60" width="10" height="18" rx="2"/>
      </g>`,
      label,
      "#fef3c7",
      "#b45309",
    ),
  );
}

function srcBuilding(label: string): string {
  return svgUrl(
    wrap(
      `<g fill="#e2e8f0" stroke="#475569" stroke-width="1.5">
        <path d="M22 72V38l26-14 26 14v34z"/>
        <path d="M34 72V48h8v24M46 72V42h8v30M58 72V52h8v20"/>
        <path d="M18 72h60" stroke-width="2.5"/>
      </g>`,
      label,
      "#f1f5f9",
      "#64748b",
    ),
  );
}

function srcScroll(label: string): string {
  return svgUrl(
    wrap(
      `<g fill="#fef9c3" stroke="#a16207" stroke-width="1.5">
        <path d="M30 28h36c4 0 4 4 0 4H30c-4 0-4-4 0-4z"/>
        <path d="M30 36h40v36c0 4-4 4-8 4H34c-4 0-8 0-8-4V36z"/>
        <path d="M38 48h28M38 56h24M38 64h20" stroke="#ca8a04"/>
      </g>`,
      label,
      "#fffbeb",
      "#ca8a04",
    ),
  );
}

function srcFolder(label: string): string {
  return svgUrl(
    wrap(
      `<g fill="#fde68a" stroke="#b45309" stroke-width="1.5">
        <path d="M24 32h22l6 8h26a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V38a6 6 0 0 1 6-6z"/>
      </g>`,
      label,
      "#fffbeb",
      "#d97706",
    ),
  );
}

function srcStamp(label: string): string {
  return svgUrl(
    wrap(
      `<circle cx="48" cy="48" r="22" fill="none" stroke="#be123c" stroke-width="3"/>
       <circle cx="48" cy="48" r="14" fill="none" stroke="#be123c" stroke-width="2"/>
       <text x="48" y="54" text-anchor="middle" font-size="14" font-weight="700" fill="#be123c" font-family="Georgia, serif">LEY</text>`,
      label,
      "#fff1f2",
      "#f43f5e",
    ),
  );
}

function srcPen(label: string): string {
  return svgUrl(
    wrap(
      `<path d="M62 26l8 8-32 32-14 4 4-14 32-32 8-8 14-14z" fill="#1e40af" stroke="#1e3a8a" stroke-width="1.2"/>`,
      label,
      "#eff6ff",
      "#3b82f6",
    ),
  );
}

function srcShield(label: string): string {
  return svgUrl(
    wrap(
      `<path d="M48 22l22 10v18c0 16-10 26-22 30-12-4-22-14-22-30V32z" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>`,
      label,
      "#eff6ff",
      "#2563eb",
    ),
  );
}

function srcLaptop(label: string): string {
  return svgUrl(
    wrap(
      `<g fill="#334155" stroke="#0f172a" stroke-width="1.2">
        <rect x="26" y="30" width="44" height="28" rx="3" fill="#475569"/>
        <rect x="30" y="34" width="36" height="20" rx="1" fill="#94a3b8"/>
        <path d="M20 62h56l4 6H16z" fill="#64748b"/>
      </g>`,
      label,
      "#f1f5f9",
      "#475569",
    ),
  );
}

function srcHighlighter(label: string): string {
  return textGlyph("🖍️", label, "#fef9c3", "#eab308");
}

function srcPostit(label: string): string {
  return svgUrl(
    wrap(
      `<path d="M28 26h40v44H28z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
       <path d="M56 26v14h12" fill="#fde047" stroke="#ca8a04" stroke-width="1.5"/>`,
      label,
      "#fefce8",
      "#eab308",
    ),
  );
}

/** Mapa id → src para packs jurídicos */
export const JURIDICO_STICKER_SRC: Record<string, string> = {
  // Constitucional
  "const-constitucion": srcBook("Constitución", "#c4b5fd"),
  "const-tribunal": srcBuilding("Tribunal Constitucional"),
  "const-carta": srcScroll("Carta Magna"),
  "const-escudo": srcShield("Escudo nacional"),
  "const-balanza": srcBalanza("Balanza de justicia"),
  "const-derechos": textGlyph("✊", "Derechos fundamentales", "#ede9fe", "#7c3aed"),
  "const-democracia": srcBuilding("Democracia"),
  "const-ciudadania": textGlyph("🗳️", "Ciudadanía", "#ede9fe", "#7c3aed"),

  // Civil
  "civil-codigo": srcBook("Código Civil", "#7dd3fc"),
  "civil-contrato": srcScroll("Contrato"),
  "civil-firma": srcPen("Firma"),
  "civil-escritura": srcScroll("Escritura pública"),
  "civil-notaria": srcStamp("Notaría"),
  "civil-obligacion": textGlyph("📋", "Obligación", "#e0f2fe", "#0284c7"),
  "civil-propiedad": textGlyph("🏠", "Propiedad", "#e0f2fe", "#0284c7"),
  "civil-herencia": srcScroll("Herencia"),

  // Penal
  "penal-codigo": srcBook("Código Penal", "#fda4af"),
  "penal-martillo": srcGavel("Martillo judicial"),
  "penal-fiscalia": srcBuilding("Fiscalía"),
  "penal-investigacion": textGlyph("🔍", "Investigación", "#ffe4e6", "#e11d48"),
  "penal-expediente": srcFolder("Expediente penal"),
  "penal-carcel": textGlyph("🔒", "Cárcel", "#ffe4e6", "#e11d48"),
  "penal-juicio": srcBuilding("Juicio oral"),
  "penal-sentencia": srcGavel("Sentencia"),

  // Procesal
  "proc-expediente": srcFolder("Expediente judicial"),
  "proc-demanda": srcScroll("Demanda"),
  "proc-audiencia": srcBuilding("Audiencia"),
  "proc-juez": srcGavel("Juez"),
  "proc-casacion": textGlyph("⚖️", "Casación", "#ccfbf1", "#0d9488"),
  "proc-notificacion": textGlyph("📬", "Notificación", "#ccfbf1", "#0d9488"),
  "proc-resolucion": srcScroll("Resolución"),
  "proc-proceso": srcFolder("Proceso"),

  // Tributario
  "trib-sunat": srcBuilding("SUNAT"),
  "trib-tributos": textGlyph("💰", "Tributos", "#fef3c7", "#d97706"),
  "trib-declaracion": srcScroll("Declaración jurada"),
  "trib-fiscalizacion": textGlyph("🔎", "Fiscalización", "#fef3c7", "#b45309"),
  "trib-comprobante": textGlyph("🧾", "Comprobante", "#fef3c7", "#b45309"),
  "trib-impuestos": textGlyph("📊", "Impuestos", "#fef3c7", "#b45309"),
  "trib-recaudacion": textGlyph("🏦", "Recaudación", "#fef3c7", "#b45309"),
  "trib-codigo": srcBook("Código Tributario", "#fcd34d"),

  // Estudio
  "est-libros": srcBook("Libros jurídicos", "#a7f3d0"),
  "est-resaltador": srcHighlighter("Resaltador"),
  "est-postit": srcPostit("Post-it"),
  "est-laptop": srcLaptop("Laptop"),
  "est-biblioteca": srcBuilding("Biblioteca"),
  "est-apuntes": srcScroll("Apuntes"),
  "est-agenda": textGlyph("📅", "Agenda", "#d1fae5", "#059669"),
  "est-examen": textGlyph("📝", "Examen", "#d1fae5", "#059669"),
};

export function getJuridicoStickerSrc(id: string): string | undefined {
  return JURIDICO_STICKER_SRC[id];
}
