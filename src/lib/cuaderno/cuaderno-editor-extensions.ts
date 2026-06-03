import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Strike from "@tiptap/extension-strike";
import CodeBlock from "@tiptap/extension-code-block";
import type { Extensions } from "@tiptap/core";
import { FontSize } from "@/components/cuaderno/tiptap/font-size";
import { StudyBlock } from "@/components/cuaderno/tiptap/study-block";
import { CuadernoImage } from "@/components/cuaderno/tiptap/cuaderno-image";

export function createCuadernoEditorExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
      strike: false,
    }),
    Underline,
    Strike,
    TextStyle,
    Color,
    FontSize,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    HorizontalRule,
    CodeBlock.configure({ HTMLAttributes: { class: "cn-code-block" } }),
    CuadernoImage.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({ placeholder }),
    StudyBlock,
  ];
}
