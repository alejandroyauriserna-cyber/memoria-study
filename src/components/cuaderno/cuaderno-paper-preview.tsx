"use client";

import { getTemplatePreviewClass } from "@/lib/cuaderno/paper-styles";
import type { CuadernoTemplate } from "@/lib/cuaderno/templates";

export function CuadernoPaperPreview({
  template,
  selected = false,
  size = "md",
}: {
  template: CuadernoTemplate;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={`cn-paper-preview-wrap cn-paper-preview-wrap--${size}`}
      data-selected={selected}
    >
      <div className={`${getTemplatePreviewClass(template.id)} cn-paper-preview-sheet`} />
      <span className="cn-paper-preview-icon" aria-hidden>
        {template.icon}
      </span>
    </div>
  );
}
