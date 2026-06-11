import { NextResponse } from "next/server";
import { getImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";

export const runtime = "nodejs";

/** Solo desarrollo: verifica lectura de HF_TOKEN y HF_IMAGE_MODEL sin exponer secretos. */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "No disponible." }, { status: 404 });
  }

  const status = getImageGenerationEnvStatus();

  return NextResponse.json({
    ...status,
    nodeEnv: process.env.NODE_ENV,
    rawHfImageModelSet: Boolean(process.env.HF_IMAGE_MODEL?.trim()),
    rawHfTokenSet: Boolean(process.env.HF_TOKEN?.trim()),
  });
}
