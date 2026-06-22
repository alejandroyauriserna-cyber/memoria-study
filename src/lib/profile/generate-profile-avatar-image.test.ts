import { describe, expect, it } from "vitest";
import {
  buildProfileAvatarNegativePrompt,
  resolveProfileAvatarFluxPrompt,
} from "@/lib/profile/profile-avatar-prompts";
import { buildProfileAvatarFluxPrompt } from "@/lib/profile/generate-profile-avatar-image";

describe("resolveProfileAvatarFluxPrompt", () => {
  it("usa prompt inglés optimizado para la sugerencia del búho jurídico", () => {
    const prompt = resolveProfileAvatarFluxPrompt("Mascota búho jurídico con gafas redondas");

    expect(prompt).toMatch(/owl mascot/i);
    expect(prompt).toMatch(/round glasses/i);
    expect(prompt).not.toMatch(/law student character/i);
  });

  it("traduce y refuerza animales en prompts libres", () => {
    const prompt = resolveProfileAvatarFluxPrompt("pulpo con gorro");

    expect(prompt).toMatch(/octopus/i);
    expect(prompt).toMatch(/Must clearly depict octopus/i);
    expect(prompt).toMatch(/hat/i);
  });

  it("expone alias legacy buildProfileAvatarFluxPrompt", () => {
    expect(buildProfileAvatarFluxPrompt("pulpo con gorro")).toMatch(/octopus/i);
  });
});

describe("buildProfileAvatarNegativePrompt", () => {
  it("penaliza humanos cuando piden mascota animal", () => {
    const negative = buildProfileAvatarNegativePrompt("Mascota búho jurídico con gafas redondas");
    expect(negative).toMatch(/human face/i);
    expect(negative).toMatch(/wrong animal/i);
  });
});
