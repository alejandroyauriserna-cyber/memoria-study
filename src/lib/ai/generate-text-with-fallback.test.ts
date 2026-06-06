import { describe, expect, it } from "vitest";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";

describe("generateTextWithFallback", () => {
  it("reports missing providers when no API keys are configured", async () => {
    await expect(
      generateTextWithFallback({ prompt: "Hola", json: false }),
    ).rejects.toThrow(/No hay proveedores de IA configurados/);
  });
});
