import { NextResponse } from "next/server";
import { getPackExport, STICKER_MARKETPLACE } from "@/lib/cuaderno/sticker-catalog";

export async function GET(
  _request: Request,
  context: { params: Promise<{ packId: string }> },
) {
  const { packId } = await context.params;
  const data = getPackExport(packId);
  if (!data) {
    return NextResponse.json(
      { error: "Pack no encontrado", available: STICKER_MARKETPLACE.map((p) => p.id) },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      pack: data.pack,
      count: data.count,
      stickers: data.stickers,
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${packId}-stickers.json"`,
      },
    },
  );
}
