import { NextResponse } from "next/server";
import {
  getPremiumFeature,
  isPremiumFeatureAvailable,
  type PremiumFeatureId,
} from "@/lib/billing/premium-features";

export function requirePremiumFeature(featureId: PremiumFeatureId) {
  if (isPremiumFeatureAvailable(featureId)) {
    return null;
  }

  const feature = getPremiumFeature(featureId);
  return NextResponse.json(
    {
      error: `${feature.title} estará disponible en la versión pagada de MemoriaStudy.`,
      code: "PREMIUM_REQUIRED",
      featureId,
    },
    { status: 402 },
  );
}
