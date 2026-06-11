import { afterEach, describe, expect, it } from "vitest";
import { resolveImageProviderChain } from "@/lib/ai/image-providers/resolve-chain";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("resolveImageProviderChain", () => {
  it("usa flux,gemini por defecto", () => {
    delete process.env.IMAGE_PROVIDER_CHAIN;

    const { chain, fromEnv, chainKey } = resolveImageProviderChain();

    expect(chain).toEqual(["flux", "gemini"]);
    expect(fromEnv).toBe(false);
    expect(chainKey).toBe("default");
  });

  it("lee IMAGE_PROVIDER_CHAIN desde env", () => {
    process.env.IMAGE_PROVIDER_CHAIN = "flux,gemini";

    const { chain, fromEnv } = resolveImageProviderChain();

    expect(chain).toEqual(["flux", "gemini"]);
    expect(fromEnv).toBe(true);
  });

  it("prioriza cadena específica de infografía", () => {
    process.env.IMAGE_PROVIDER_CHAIN = "flux,gemini";
    process.env.IMAGE_PROVIDER_CHAIN_INFOGRAPHIC = "gemini,flux";

    const { chain, fromEnv, chainKey } = resolveImageProviderChain("infographic");

    expect(chain).toEqual(["gemini", "flux"]);
    expect(fromEnv).toBe(true);
    expect(chainKey).toBe("infographic");
  });

  it("usa env de poster para academicPoster", () => {
    process.env.IMAGE_PROVIDER_CHAIN_POSTER = "gemini";

    const { chain, chainKey } = resolveImageProviderChain("academicPoster");

    expect(chain).toEqual(["gemini"]);
    expect(chainKey).toBe("poster");
  });

  it("omite proveedores no registrados (replicate, ideogram)", () => {
    process.env.IMAGE_PROVIDER_CHAIN = "replicate,flux,ideogram,gemini";

    const { chain } = resolveImageProviderChain();

    expect(chain).toEqual(["flux", "gemini"]);
  });

  it("vuelve al default si la cadena queda vacía", () => {
    process.env.IMAGE_PROVIDER_CHAIN = "replicate,ideogram,invalid";

    const { chain, fromEnv } = resolveImageProviderChain();

    expect(chain).toEqual(["flux", "gemini"]);
    expect(fromEnv).toBe(false);
  });
});
