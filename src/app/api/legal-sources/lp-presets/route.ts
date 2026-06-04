import { NextResponse } from "next/server";
import { LP_NORMATIVE_PRESETS } from "@/lib/legal-sources/lp-presets";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ presets: LP_NORMATIVE_PRESETS });
}
