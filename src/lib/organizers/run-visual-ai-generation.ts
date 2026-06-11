import { extractInfographicTopics } from "@/lib/ai/build-academic-infographic-prompt";
import { buildVisualAiPrompt } from "@/lib/ai/build-visual-ai-prompt";
import { recordImageGenerationCostEvent } from "@/lib/ai/image-generation-cost-store";
import { buildImageGenerationUserMessage } from "@/lib/ai/image-generation-user-messages";
import type { ImageGenerationDiagnostics } from "@/lib/ai/image-generation-types";
import {
  extensionForVisualAiMime,
  generateVisualAiImage,
} from "@/lib/ai/generate-visual-ai-image";
import { mergeVisualAiOutput } from "@/lib/organizers/visual-ai-cache";
import { renderStructuredVisualAiBuffer } from "@/lib/organizers/visual-ai-diagram/render-structured-visual-ai";
import { isVisualAiFormatId } from "@/lib/organizers/visual-ai-formats";
import { isStructuredVisualAiFormat } from "@/lib/organizers/visual-ai-render-mode";
import type { VisualAiFormatId, VisualAiOutput } from "@/lib/organizers/visual-ai-types";
import { parseOrganizerContent, type OrganizerContent } from "@/lib/organizers/parse-content";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "shared-materials";

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const bucketInfo = await admin.storage.getBucket(BUCKET);
  if (!bucketInfo.data) {
    await admin.storage.createBucket(BUCKET, { public: true });
  }
}

export async function runVisualAiGeneration(input: {
  organizerId: string;
  formatId: VisualAiFormatId;
  rawContent: unknown;
  userId?: string;
}): Promise<{
  output: VisualAiOutput;
  diagnostics?: ImageGenerationDiagnostics;
  mergedContent: OrganizerContent;
  warning?: string;
  userNotice?: string;
  usedFallback: boolean;
}> {
  const content = parseOrganizerContent(input.rawContent);
  const { centralTopic, subtopics } = extractInfographicTopics(content);

  let buffer: Buffer;
  let mimeType: string;
  let source: VisualAiOutput["source"];
  let warning: string | undefined;
  let model: string | undefined;
  let diagnostics: ImageGenerationDiagnostics | undefined;
  let prompt: string;

  if (isStructuredVisualAiFormat(input.formatId)) {
    const rendered = renderStructuredVisualAiBuffer(input.formatId, content);
    buffer = rendered.buffer;
    mimeType = "image/svg+xml";
    source = "structured";
    model = "MemoriaStudy Diagram Engine";
    prompt = rendered.description;
  } else {
    const built = buildVisualAiPrompt(input.formatId, content);
    const generated = await generateVisualAiImage(
      input.formatId,
      built.prompt,
      built.centralTopic,
      built.subtopics,
      built.aspectRatio,
    );
    buffer = generated.buffer;
    mimeType = generated.mimeType;
    source = generated.source;
    warning = generated.warning;
    model = generated.model;
    diagnostics = generated.diagnostics;
    prompt = built.prompt;
  }

  const admin = createAdminClient();
  await ensureBucket(admin);

  const ext = extensionForVisualAiMime(mimeType);
  const storagePath = `organizer-visual-ai/${input.organizerId}/${input.formatId}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    throw new Error("No se pudo guardar la imagen visual.");
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

  const output: VisualAiOutput = {
    formatId: input.formatId,
    centralTopic,
    subtopics,
    imageUrl: urlData.publicUrl,
    prompt,
    generatedAt: new Date().toISOString(),
    source,
    warning,
    model,
  };

  const mergedContent = mergeVisualAiOutput(content, output);

  const userNotice =
    buildImageGenerationUserMessage({
      diagnostics,
      source,
      warning,
    }) ?? undefined;

  output.warning = userNotice ?? warning;

  void recordImageGenerationCostEvent({
    userId: input.userId,
    organizerId: input.organizerId,
    formatId: input.formatId,
    diagnostics,
    source,
  });

  return {
    output,
    diagnostics: diagnostics ?? undefined,
    mergedContent,
    warning: output.warning,
    userNotice,
    usedFallback: source === "fallback",
  };
}

export function parseVisualAiFormatFromBody(body: unknown): VisualAiFormatId | null {
  if (!body || typeof body !== "object") return null;
  const format = (body as { format?: unknown }).format;
  return isVisualAiFormatId(format) ? format : null;
}
