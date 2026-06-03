"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { BlockHandleBar } from "@/components/cuaderno/blocks/block-handle-bar";

export function StudyBlockView({ node, selected, editor }: NodeViewProps) {
  const variant = node.attrs.variant as string;
  const label = node.attrs.label as string;

  return (
    <NodeViewWrapper
      as="div"
      className={`cn-study-block cn-study-block--${variant} cn-study-block-view${selected ? " is-selected" : ""}`}
      data-study-block=""
      data-variant={variant}
    >
      {selected ? <BlockHandleBar editor={editor} kind="studyBlock" /> : null}
      <div className="cn-study-block-label" contentEditable={false}>
        {label}
      </div>
      <NodeViewContent as="div" className="cn-study-block-body" />
    </NodeViewWrapper>
  );
}
