import type { ImageGenerationDiagnostics } from "@/lib/ai/image-generation-types";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";
import { createAdminClient } from "@/lib/supabase/admin";

const BILLABLE_PROVIDERS = new Set(["flux", "gemini", "replicate", "ideogram"]);

export type ImageGenerationCostEventInput = {
  userId?: string;
  organizerId?: string;
  formatId?: VisualAiFormatId;
  diagnostics?: ImageGenerationDiagnostics;
  source: string;
};

export type ImageGenerationCostProviderSummary = {
  provider: string;
  imageCount: number;
  estimatedCostUsd: number;
};

export type ImageGenerationCostMonthlySummary = {
  month: string;
  providers: ImageGenerationCostProviderSummary[];
  totalImages: number;
  totalCostUsd: number;
};

function monthBounds(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year!, mon! - 1, 1));
  const end = new Date(Date.UTC(year!, mon!, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

function currentMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function recordImageGenerationCostEvent(
  input: ImageGenerationCostEventInput,
): Promise<void> {
  if (!BILLABLE_PROVIDERS.has(input.source)) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("image_generation_cost_events").insert({
      user_id: input.userId ?? null,
      organizer_id: input.organizerId ?? null,
      format_id: input.formatId ?? null,
      provider: input.source,
      estimated_cost_usd: input.diagnostics?.estimatedCostUsd ?? 0,
      used_fallback: input.diagnostics?.usedFallback ?? false,
      provider_chain: input.diagnostics?.providerChain ?? [],
      failed_attempts: input.diagnostics?.attempts.length ?? 0,
      duration_ms: input.diagnostics?.durationMs ?? null,
    });

    if (error) {
      console.warn("[image-generation-cost] No se pudo registrar coste:", error.message);
    }
  } catch (caught) {
    console.warn(
      "[image-generation-cost] Registro omitido:",
      caught instanceof Error ? caught.message : String(caught),
    );
  }
}

export async function getImageGenerationCostMonthlySummary(
  month = currentMonthKey(),
): Promise<ImageGenerationCostMonthlySummary> {
  const empty: ImageGenerationCostMonthlySummary = {
    month,
    providers: [],
    totalImages: 0,
    totalCostUsd: 0,
  };

  try {
    const admin = createAdminClient();
    const { start, end } = monthBounds(month);
    const { data, error } = await admin
      .from("image_generation_cost_events")
      .select("provider, estimated_cost_usd")
      .gte("created_at", start)
      .lt("created_at", end);

    if (error) {
      console.warn("[image-generation-cost] Resumen no disponible:", error.message);
      return empty;
    }

    const byProvider = new Map<string, ImageGenerationCostProviderSummary>();

    for (const row of data ?? []) {
      const provider = String(row.provider);
      const cost = Number(row.estimated_cost_usd) || 0;
      const current = byProvider.get(provider) ?? {
        provider,
        imageCount: 0,
        estimatedCostUsd: 0,
      };
      current.imageCount += 1;
      current.estimatedCostUsd += cost;
      byProvider.set(provider, current);
    }

    const providers = [...byProvider.values()].sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd);
    const totalImages = providers.reduce((sum, p) => sum + p.imageCount, 0);
    const totalCostUsd = providers.reduce((sum, p) => sum + p.estimatedCostUsd, 0);

    return { month, providers, totalImages, totalCostUsd };
  } catch (caught) {
    console.warn(
      "[image-generation-cost] Resumen omitido:",
      caught instanceof Error ? caught.message : String(caught),
    );
    return empty;
  }
}
