import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";

export type CuadernoBlockKind = "studyBlock" | "image" | "table" | "codeBlock" | "horizontalRule" | null;

export type SelectedBlockInfo = {
  kind: CuadernoBlockKind;
  pos: number;
  nodeSize: number;
  attrs: Record<string, unknown>;
};

export function getSelectedBlock(editor: Editor): SelectedBlockInfo | null {
  const { selection } = editor.state;

  if (selection instanceof NodeSelection) {
    const node = selection.node;
    const name = node.type.name;
    if (
      name === "studyBlock" ||
      name === "image" ||
      name === "table" ||
      name === "codeBlock" ||
      name === "horizontalRule"
    ) {
      const kind = name as CuadernoBlockKind;
      return {
        kind,
        pos: selection.from,
        nodeSize: node.nodeSize,
        attrs: { ...node.attrs },
      };
    }
  }

  const { $from } = selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    const name = node.type.name;
    if (name === "studyBlock" || name === "image" || name === "table") {
      const pos = $from.before(depth);
      return {
        kind: name as CuadernoBlockKind,
        pos,
        nodeSize: node.nodeSize,
        attrs: { ...node.attrs },
      };
    }
  }

  if (editor.isActive("table")) {
    return { kind: "table", pos: selection.from, nodeSize: 0, attrs: {} };
  }

  return null;
}

export function selectBlockAt(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return false;
  const tr = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos));
  editor.view.dispatch(tr);
  return true;
}

export function deleteSelectedBlock(editor: Editor): boolean {
  const block = getSelectedBlock(editor);
  if (!block) return false;
  if (block.kind === "table") {
    return editor.chain().focus().deleteTable().run();
  }
  if (block.pos >= 0 && block.nodeSize > 0) {
    return editor.chain().focus().deleteRange({ from: block.pos, to: block.pos + block.nodeSize }).run();
  }
  return editor.chain().focus().deleteSelection().run();
}

export function duplicateSelectedBlock(editor: Editor): boolean {
  const block = getSelectedBlock(editor);
  if (!block || block.nodeSize <= 0) return false;
  const slice = editor.state.doc.slice(block.pos, block.pos + block.nodeSize);
  return editor.chain().focus().insertContentAt(block.pos + block.nodeSize, slice.content.toJSON()).run();
}

export function moveSelectedBlock(editor: Editor, direction: "up" | "down"): boolean {
  const block = getSelectedBlock(editor);
  if (!block || block.nodeSize <= 0) return false;
  const { pos, nodeSize } = block;
  if (direction === "up") {
    if (pos === 0) return false;
    const before = editor.state.doc.resolve(pos).nodeBefore;
    if (!before) return false;
    const targetPos = pos - before.nodeSize;
    const slice = editor.state.doc.slice(pos, pos + nodeSize);
    return editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + nodeSize })
      .insertContentAt(targetPos, slice.content.toJSON())
      .run();
  }
  const afterPos = pos + nodeSize;
  if (afterPos >= editor.state.doc.content.size) return false;
  const after = editor.state.doc.resolve(afterPos).nodeAfter;
  if (!after) return false;
  const slice = editor.state.doc.slice(pos, pos + nodeSize);
  const insertAt = afterPos + after.nodeSize - nodeSize;
  return editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + nodeSize })
    .insertContentAt(insertAt, slice.content.toJSON())
    .run();
}

export function convertStudyBlockVariant(editor: Editor, variant: string, label: string): boolean {
  const block = getSelectedBlock(editor);
  if (!block || block.kind !== "studyBlock") return false;
  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const node = tr.doc.nodeAt(block.pos);
      if (!node || node.type.name !== "studyBlock") return false;
      tr.setNodeMarkup(block.pos, undefined, { ...node.attrs, variant, label });
      return true;
    })
    .run();
}
