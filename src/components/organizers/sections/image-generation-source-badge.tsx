import type { ImageGenerationSource } from "@/lib/ai/image-generation-types";

const SOURCE_LABELS: Record<ImageGenerationSource, string> = {
  flux: "FLUX",
  gemini: "Gemini",
  structured: "Diagrama estructurado",
  fallback: "SVG local",
};

const SOURCE_STYLES: Record<ImageGenerationSource, string> = {
  flux: "text-[#00FFD5]",
  gemini: "text-[#7DD3FC]",
  structured: "text-[#A78BFA]",
  fallback: "text-amber-400/90",
};

export function ImageGenerationSourceBadge({
  source,
  model,
  className = "",
}: {
  source: ImageGenerationSource;
  model?: string;
  className?: string;
}) {
  return (
    <p className={`text-[11px] text-[#F5F7FA]/70 ${className}`.trim()}>
      Generado con:{" "}
      <span className={`font-semibold ${SOURCE_STYLES[source]}`}>{SOURCE_LABELS[source]}</span>
      {model ? <span className="text-[10px] text-[#F5F7FA]/45"> · {model}</span> : null}
    </p>
  );
}
