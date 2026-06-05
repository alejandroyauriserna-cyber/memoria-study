import { NextResponse } from "next/server";
import { generateGeminiImage, quotaHint } from "@/lib/ai/gemini-image-generation";
import { requirePremiumFeature } from "@/lib/billing/require-premium-api";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const premiumBlock = requirePremiumFeature("ai-sticker-packs");
    if (premiumBlock) return premiumBlock;

    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (prompt.length < 3) {
      return NextResponse.json({ error: "Describe el sticker que quieres crear." }, { status: 400 });
    }

    const fullPrompt = `Create ONE cute academic sticker illustration for a law student's digital notebook.
Style: clean, friendly, slightly kawaii, professional study aesthetic.
Subject: ${prompt}
Requirements: single centered subject, soft outlines, vibrant but not neon, transparent background (no solid backdrop), PNG-ready, no text, no watermark, no collage.`;

    const gemini = await generateGeminiImage(fullPrompt, { aspectRatio: "1:1" });
    if (!gemini.ok) {
      return NextResponse.json(
        {
          error: quotaHint(gemini.lastError) ?? gemini.lastError,
        },
        { status: 503 },
      );
    }

    const base64 = gemini.result.buffer.toString("base64");
    const mime = gemini.result.mimeType || "image/png";
    const imageDataUrl = `data:${mime};base64,${base64}`;

    return NextResponse.json({
      imageDataUrl,
      label: prompt.slice(0, 48),
      source: gemini.result.source,
      model: gemini.result.model,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al generar sticker" },
      { status: 500 },
    );
  }
}
