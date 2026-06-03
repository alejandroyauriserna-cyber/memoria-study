import { Table } from "@tiptap/extension-table";

export const CuadernoTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (el) => {
          const w = (el as HTMLElement).style.width || el.getAttribute("data-width");
          return w || "100%";
        },
        renderHTML: (attrs) => {
          const width = (attrs.width as string) || "100%";
          return {
            "data-width": width,
            style: `width: ${width}; max-width: 100%`,
          };
        },
      },
      minHeight: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.minHeight || null,
        renderHTML: (attrs) => {
          if (!attrs.minHeight) return {};
          return { style: `min-height: ${attrs.minHeight}` };
        },
      },
      layout: {
        default: "default",
        parseHTML: (el) => el.getAttribute("data-layout") ?? "default",
        renderHTML: (attrs) => {
          const layout = (attrs.layout as string) || "default";
          return {
            "data-layout": layout,
            class: layout !== "default" ? `cn-table-layout-${layout}` : null,
          };
        },
      },
    };
  },
});
