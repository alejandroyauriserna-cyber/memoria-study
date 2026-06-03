import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { StudyBlockView } from "@/components/cuaderno/blocks/study-block-view";

export type StudyBlockVariant =
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

export const StudyBlock = Node.create({
  name: "studyBlock",

  group: "block",

  content: "block+",

  defining: true,

  addNodeView() {
    return ReactNodeViewRenderer(StudyBlockView);
  },

  addAttributes() {
    return {
      variant: {
        default: "caso",
        parseHTML: (el) => el.getAttribute("data-variant") ?? "caso",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
      label: {
        default: "Bloque de estudio",
        parseHTML: (el) => el.getAttribute("data-label") ?? "Bloque",
        renderHTML: (attrs) => ({ "data-label": attrs.label }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-study-block]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const variant = node.attrs.variant as StudyBlockVariant;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-study-block": "",
        "data-variant": variant,
        class: `cn-study-block cn-study-block--${variant}`,
      }),
      ["div", { class: "cn-study-block-label", contenteditable: "false" }, node.attrs.label],
      ["div", { class: "cn-study-block-body" }, 0],
    ];
  },
});
