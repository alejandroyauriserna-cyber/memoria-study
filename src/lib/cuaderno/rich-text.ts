/** Utilidades HTML ↔ almacenamiento en `notes` (sin cambiar esquema). */

export function isHtmlBody(body: string): boolean {
  const t = body.trim();
  return t.startsWith("<") && (t.includes("</") || t.endsWith("/>"));
}

/** Convierte apuntes legacy (texto/markdown ligero) a HTML para Tiptap. */
export function bodyToEditorHtml(body: string): string {
  if (!body.trim()) return "<p></p>";
  if (isHtmlBody(body)) return body;

  const lines = body.split("\n");
  const parts: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      parts.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      parts.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(`<li><p>${escapeHtml(trimmed.slice(2))}</p></li>`);
      continue;
    }
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
    parts.push(`<p>${escapeHtml(line)}</p>`);
  }
  if (inList) parts.push("</ul>");
  return parts.join("") || "<p></p>";
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function wordCountFromNotes(notes: string): number {
  const body = notes.replace(/^<!--[\s\S]*?-->\n?/, "");
  const text = isHtmlBody(body) ? stripHtml(body) : body;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
