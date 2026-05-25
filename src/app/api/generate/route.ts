import { NextResponse } from "next/server";
import { generateStudyDeck } from "@/lib/ai/generate-study-deck";
import { extractPdfText } from "@/lib/pdf/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const audience = formData.get("audience");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
    }

    const text = await extractPdfText(file);
    const deck = await generateStudyDeck({
      sourceName: file.name,
      text,
      audience: typeof audience === "string" ? audience : undefined,
    });

    return NextResponse.json({ deck });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Unable to generate study material." },
      { status: 500 },
    );
  }
}
