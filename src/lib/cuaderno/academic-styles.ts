import type { Editor } from "@tiptap/react";

export type AcademicStyleId =
  | "title"
  | "subtitle"
  | "heading"
  | "body"
  | "important"
  | "jurisprudence"
  | "legal-article"
  | "doctrine"
  | "summary"
  | "conclusion";

export const ACADEMIC_STYLES: Array<{
  id: AcademicStyleId;
  label: string;
  icon: string;
}> = [
  { id: "title", label: "Título principal", icon: "H1" },
  { id: "subtitle", label: "Subtítulo", icon: "H2" },
  { id: "heading", label: "Encabezado", icon: "H3" },
  { id: "body", label: "Texto normal", icon: "¶" },
  { id: "important", label: "Nota importante", icon: "!" },
  { id: "jurisprudence", label: "Jurisprudencia", icon: "⚖" },
  { id: "legal-article", label: "Artículo legal", icon: "§" },
  { id: "doctrine", label: "Doctrina", icon: "📖" },
  { id: "summary", label: "Resumen", icon: "∑" },
  { id: "conclusion", label: "Conclusión", icon: "→" },
];

export type StudyBlockId =
  | "caso"
  | "jurisprudencia"
  | "articulo"
  | "doctrina"
  | "interpretacion"
  | "dictamen"
  | "pregunta"
  | "flashcard"
  | "resumen-ia"
  | "mapa"
  | "comparativo"
  | "audio";

/** Bloques del menú jurídico en la toolbar superior */
export const LEGAL_TOOLBAR_BLOCKS: Array<{ id: StudyBlockId; label: string; icon: string }> = [
  { id: "caso", label: "Caso práctico", icon: "📁" },
  { id: "jurisprudencia", label: "Jurisprudencia", icon: "⚖" },
  { id: "articulo", label: "Artículo legal", icon: "§" },
  { id: "doctrina", label: "Comentario doctrinal", icon: "📖" },
  { id: "interpretacion", label: "Interpretación normativa", icon: "⚖" },
  { id: "dictamen", label: "Dictamen", icon: "📋" },
  { id: "comparativo", label: "Cuadro comparativo", icon: "▦" },
];

export const STUDY_BLOCKS: Array<{ id: StudyBlockId; label: string; icon: string }> = [
  { id: "caso", label: "Caso práctico", icon: "📁" },
  { id: "jurisprudencia", label: "Jurisprudencia", icon: "⚖" },
  { id: "articulo", label: "Artículo legal", icon: "§" },
  { id: "doctrina", label: "Comentario doctrinal", icon: "📖" },
  { id: "pregunta", label: "Pregunta de examen", icon: "?" },
  { id: "flashcard", label: "Flashcard", icon: "🃏" },
  { id: "resumen-ia", label: "Resumen IA", icon: "✦" },
  { id: "mapa", label: "Mapa mental", icon: "◎" },
  { id: "comparativo", label: "Cuadro comparativo", icon: "▦" },
];

const BLOCK_LABELS: Record<StudyBlockId, string> = {
  caso: "Caso práctico",
  jurisprudencia: "Jurisprudencia",
  articulo: "Artículo legal",
  doctrina: "Comentario doctrinal",
  interpretacion: "Interpretación normativa",
  dictamen: "Dictamen",
  pregunta: "Pregunta de examen",
  flashcard: "Flashcard",
  "resumen-ia": "Resumen IA",
  mapa: "Mapa mental",
  comparativo: "Cuadro comparativo",
  audio: "Nota de audio",
};

export function applyAcademicStyle(editor: Editor, styleId: AcademicStyleId) {
  const chain = editor.chain().focus();
  switch (styleId) {
    case "title":
      chain.setHeading({ level: 1 }).run();
      break;
    case "subtitle":
      chain.setHeading({ level: 2 }).run();
      break;
    case "heading":
      chain.setHeading({ level: 3 }).run();
      break;
    case "body":
      chain.setParagraph().run();
      break;
    case "important":
      chain.setHighlight({ color: "#fef08a" }).run();
      break;
    case "jurisprudence":
      insertStudyBlock(editor, "jurisprudencia");
      break;
    case "legal-article":
      insertStudyBlock(editor, "articulo");
      break;
    case "doctrine":
      insertStudyBlock(editor, "doctrina");
      break;
    case "summary":
      insertStudyBlock(editor, "resumen-ia");
      break;
    case "conclusion":
      chain.setBlockquote().run();
      break;
    default:
      break;
  }
}

export function insertStudyBlock(editor: Editor, blockId: StudyBlockId) {
  const label = BLOCK_LABELS[blockId];
  editor
    .chain()
    .focus()
    .insertContent({
      type: "studyBlock",
      attrs: { variant: blockId, label },
      content: [{ type: "paragraph" }],
    })
    .run();
}
