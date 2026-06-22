import { describe, expect, it } from "vitest";
import { buildProfileAvatarFluxPrompt } from "@/lib/profile/generate-profile-avatar-image";

describe("buildProfileAvatarFluxPrompt", () => {
  it("prioriza el prompt del usuario sin forzar anime ni retrato humano", () => {
    const prompt = buildProfileAvatarFluxPrompt("pulpo con gorro");

    expect(prompt.startsWith("pulpo con gorro")).toBe(true);
    expect(prompt).not.toMatch(/anime|law student|portrait|shoulders up|expressive eyes/i);
    expect(prompt).toMatch(/profile picture avatar/i);
  });

  it("usa fallback neutro si el prompt está vacío", () => {
    expect(buildProfileAvatarFluxPrompt("   ")).toMatch(/profile picture icon/i);
  });
});
