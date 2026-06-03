"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { BlockHandleBar } from "@/components/cuaderno/blocks/block-handle-bar";

export function ImageBlockView({ node, selected, editor, updateAttributes }: NodeViewProps) {
  const src = node.attrs.src as string;
  const align = (node.attrs.align as string) ?? "center";
  const width = (node.attrs.width as string) ?? "100%";

  return (
    <NodeViewWrapper
      as="div"
      className={`cn-image-block-view align-${align}${selected ? " is-selected" : ""}`}
      data-drag-handle
    >
      {selected ? <BlockHandleBar editor={editor} kind="image" /> : null}
      <img
        src={src}
        alt=""
        style={{ width }}
        draggable={false}
        onClick={() => updateAttributes({})}
      />
    </NodeViewWrapper>
  );
}
