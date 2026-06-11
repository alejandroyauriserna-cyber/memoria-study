import { NextResponse } from "next/server";
import { getImageGenerationCostMonthlySummary } from "@/lib/ai/image-generation-cost-store";

export const runtime = "nodejs";

/** Solo desarrollo: resumen mensual de costes estimados por proveedor. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "No disponible." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? undefined;
  const summary = await getImageGenerationCostMonthlySummary(month ?? undefined);

  return NextResponse.json(summary);
}
