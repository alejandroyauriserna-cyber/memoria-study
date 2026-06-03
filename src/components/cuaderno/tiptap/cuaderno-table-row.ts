import TableRow from "@tiptap/extension-table-row";

export const CuadernoTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rowHeight: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.height || null,
        renderHTML: (attrs) => {
          if (!attrs.rowHeight) return {};
          return { style: `height: ${attrs.rowHeight}` };
        },
      },
    };
  },
});
