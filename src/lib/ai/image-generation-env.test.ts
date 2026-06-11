import { afterEach, describe, expect, it } from "vitest";
import { getImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getImageGenerationEnvStatus", () => {
  it("lee HF_TOKEN y HF_IMAGE_MODEL desde process.env", () => {
    process.env.HF_TOKEN = "hf_test_token_12345678";
    process.env.HF_IMAGE_MODEL = "black-forest-labs/FLUX.1-dev";
    process.env.GEMINI_API_KEY = "gemini-key";

    const status = getImageGenerationEnvStatus();

    expect(status.hfTokenConfigured).toBe(true);
    expect(status.hfTokenPreview).toBe("hf_t…5678");
    expect(status.hfImageModel).toBe("black-forest-labs/FLUX.1-dev");
    expect(status.hfImageModelFromEnv).toBe(true);
    expect(status.geminiImageConfigured).toBe(true);
    expect(status.providerChain).toEqual(["flux", "gemini"]);
    expect(status.providerChainFromEnv).toBe(false);
  });

  it("usa default de Flux si HF_IMAGE_MODEL no está definido", () => {
    delete process.env.HF_IMAGE_MODEL;
    delete process.env.HF_TOKEN;

    const status = getImageGenerationEnvStatus();

    expect(status.hfTokenConfigured).toBe(false);
    expect(status.hfImageModel).toBe("black-forest-labs/FLUX.1-schnell");
    expect(status.hfImageModelFromEnv).toBe(false);
  });

  it("expone la cadena de proveedores desde IMAGE_PROVIDER_CHAIN", () => {
    process.env.IMAGE_PROVIDER_CHAIN = "gemini,flux";

    const status = getImageGenerationEnvStatus();

    expect(status.providerChain).toEqual(["gemini", "flux"]);
    expect(status.providerChainFromEnv).toBe(true);
  });
});
