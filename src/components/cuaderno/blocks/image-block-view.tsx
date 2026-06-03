"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useCallback, useRef } from "react";
import { BlockHandleBar } from "@/components/cuaderno/blocks/block-handle-bar";

export function ImageBlockView({ node, selected, editor, updateAttributes, getPos }: NodeViewProps) {
  const src = node.attrs.src as string;
  const align = (node.attrs.align as string) ?? "center";
  const width = (node.attrs.width as string) ?? "100%";
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null);

  const selectNode = useCallback(() => {
    const pos = typeof getPos === "function" ? getPos() : null;
    if (pos == null) return;
    const { tr } = editor.state;
    editor.view.dispatch(tr.setSelection(NodeSelection.create(editor.state.doc, pos)));
    editor.view.focus();
  }, [editor, getPos]);

  const onResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectNode();
    const wrap = (e.currentTarget as HTMLElement).closest(".cn-image-block-view");
    const startW = wrap?.getBoundingClientRect().width ?? 300;
    resizeRef.current = { startX: e.clientX, startW };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const delta = e.clientX - resizeRef.current.startX;
    const next = Math.min(900, Math.max(120, resizeRef.current.startW + delta));
    updateAttributes({ width: `${Math.round(next)}px` });
  };

  const onResizeEnd = () => {
    resizeRef.current = null;
  };

  return (
    <NodeViewWrapper
      as="div"
      className={`cn-image-block-view align-${align}${selected ? " is-selected" : ""}`}
      data-drag-handle
      onMouseDown={(e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        selectNode();
      }}
    >
      {selected ? <BlockHandleBar editor={editor} kind="image" /> : null}
      <div className="cn-image-block-frame" style={{ width }}>
        <img src={src} alt="" draggable={false} />
        {selected ? (
          <span
            className="cn-image-resize-handle"
            role="presentation"
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}
